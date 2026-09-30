import { createHash, randomUUID } from 'node:crypto';
import { access, lstat, mkdir, open, readFile, realpath, rename, unlink, chmod } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { readHeader, setEnabled } from './frontmatter.js';
import { ManagerError } from './protocol.js';
const MAX_FILE_BYTES = 1024 * 1024;
const digest = (value) => createHash('sha256').update(value).digest('hex');
const identity = (skill) => digest(JSON.stringify([skill.provider, skill.source, skill.path, skill.name]));
const inside = (parent, child) => {
    const rel = relative(parent, child);
    return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
};
const expand = (path) => resolve(path.replace(/^~(?=$|[\\/])/, homedir()));
async function projectRoot(cwd) {
    let current = resolve(cwd);
    while (true) {
        try {
            await access(join(current, '.git'));
            return current;
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                throw error;
        }
        const parent = dirname(current);
        if (parent === current)
            return resolve(cwd);
        current = parent;
    }
}
export class SkillsManager {
    skills;
    invalidate;
    config;
    presets;
    queue = Promise.resolve();
    active = true;
    constructor(skills, invalidate, config = {}, presets = () => undefined) {
        this.skills = skills;
        this.invalidate = invalidate;
        this.config = config;
        this.presets = presets;
    }
    dispose() { this.active = false; return this.queue; }
    assertActive(signal) {
        signal?.throwIfAborted();
        if (!this.active)
            throw new ManagerError('UNAVAILABLE', '插件正在卸载，请稍后重试');
    }
    async roots(source, cwd) {
        switch (source) {
            case 'user-dsh': return [join(expand(this.config.dshHome ?? (process.env.DSH_HOME?.trim() || join(homedir(), '.dsh'))), 'skills')];
            case 'user-agents': return [join(expand(this.config.agentsHome ?? (process.env.DSH_AGENTS_HOME?.trim() || join(homedir(), '.agents'))), 'skills')];
            case 'project-dsh':
            case 'project-agents':
                return cwd ? [join(await projectRoot(cwd), source === 'project-dsh' ? '.dsh/skills' : '.agents/skills')] : [];
            case 'custom': return (this.config.customSkillDirs ?? []).map(expand);
            default: return [];
        }
    }
    async file(skill, cwd) {
        if (!(this.config.filesystemProviders ?? ['filesystem']).includes(skill.provider) || !skill.path || !isAbsolute(skill.path)) {
            throw new ManagerError('READ_ONLY', '此提供方不支持本地管理');
        }
        const path = resolve(skill.path);
        const roots = await this.roots(skill.source, cwd);
        const root = roots.find(candidate => {
            const parts = relative(candidate, path).split(sep);
            return inside(candidate, path) && (parts.length === 1 && parts[0].endsWith('.md') || parts.length === 2 && parts[1] === 'SKILL.md' && parts[0] !== '.system');
        });
        if (!root)
            throw new ManagerError('READ_ONLY', '该来源为只读，或目录未配置为可管理目录');
        let current = root;
        // Reject links/junctions at the root and each skill path component.
        for (const part of ['', ...relative(root, path).split(sep)]) {
            if (part)
                current = join(current, part);
            if ((await lstat(current)).isSymbolicLink())
                throw new ManagerError('READ_ONLY', '链接技能只读，请管理其原始文件');
        }
        if (!inside(await realpath(root), await realpath(path)))
            throw new ManagerError('READ_ONLY', '技能文件不在原始目录内');
        const stat = await lstat(path);
        if (!stat.isFile() || stat.nlink !== 1 || stat.size > MAX_FILE_BYTES)
            throw new ManagerError('READ_ONLY', '技能文件过大、不是普通文件或含有硬链接');
        const raw = await readFile(path, 'utf8');
        if (Buffer.byteLength(raw) > MAX_FILE_BYTES)
            throw new ManagerError('READ_ONLY', '技能文件超过大小限制');
        const { doc } = readHeader(raw);
        if (doc.get('name') !== skill.name)
            throw new ManagerError('STALE', '技能名称已改变，请刷新');
        return { path, root, target: relative(root, path).split(sep).length === 2 ? dirname(path) : path, raw, revision: digest(raw), mode: stat.mode };
    }
    async inPreset(preset, run) {
        const presets = this.presets();
        const id = preset ?? presets?.defaultId ?? '';
        if (!id)
            return run(undefined, '', presets);
        if (!presets)
            throw new ManagerError('UNAVAILABLE', '技能配置范围暂不可用，请刷新');
        const lease = await presets.acquireScope(id);
        try {
            return await run(lease.key, id, presets);
        }
        finally {
            await lease[Symbol.asyncDispose]();
        }
    }
    async list(cwd, signal, preset) {
        return this.inPreset(preset, async (scope, id, presets) => {
            this.assertActive(signal);
            this.invalidate();
            const snapshot = await this.skills.snapshot({ cwd, signal, scope });
            const rows = await Promise.all(snapshot.skills.map(async (skill) => {
                const row = { id: identity(skill), name: skill.name, description: skill.description, source: skill.source, provider: skill.provider,
                    path: skill.path, enabled: skill.invocation.modelInvocable || skill.invocation.userInvocable, invocation: skill.invocation, manageable: false };
                try {
                    const file = await this.file(skill, cwd);
                    row.revision = file.revision;
                    row.manageable = true;
                }
                catch (error) {
                    row.reason = error instanceof ManagerError ? error.message : '无法安全读写此技能文件';
                }
                return row;
            }));
            this.assertActive(signal);
            return { skills: rows, complete: snapshot.complete, preset: id, presets: await presets?.list() };
        });
    }
    mutate(request, signal) {
        const run = this.queue.then(() => this.runMutation(request, signal));
        this.queue = run.catch(() => undefined);
        return run;
    }
    async runMutation(request, signal) {
        return this.inPreset(request.preset, async (scope) => {
            this.assertActive(signal);
            this.invalidate();
            const snapshot = await this.skills.snapshot({ cwd: request.cwd, signal, scope });
            if (!snapshot.complete)
                throw new ManagerError('INCOMPLETE', '技能目录尚未完整加载，请刷新后重试');
            const results = [];
            for (const target of request.targets) {
                this.assertActive(signal);
                const skill = snapshot.skills.find(row => identity(row) === target.id);
                try {
                    if (!skill)
                        throw new ManagerError('STALE', '技能已移除或被同名技能替换，请刷新');
                    const file = await this.file(skill, request.cwd);
                    if (file.revision !== target.revision)
                        throw new ManagerError('STALE', '技能已被修改，请刷新后重试');
                    const lockPath = `${file.path}.dsh-skills-manager.lock`;
                    const lock = await open(lockPath, 'wx').catch(error => {
                        if (error.code === 'EEXIST')
                            throw new ManagerError('BUSY', '此技能正在被另一个管理操作修改');
                        throw error;
                    });
                    // The exclusive file's existence is the lock. Closing its handle lets Windows move a bundle directory.
                    await lock.close();
                    let trashPath;
                    try {
                        // Recheck the identity, links and contents after obtaining the per-file lock.
                        const fresh = await this.file(skill, request.cwd);
                        if (fresh.revision !== file.revision)
                            throw new ManagerError('STALE', '技能已被修改，请刷新后重试');
                        this.assertActive(signal);
                        if (request.action === 'delete') {
                            trashPath = await this.trash(file);
                        }
                        else {
                            const next = setEnabled(file.raw, request.action === 'enable');
                            if (next !== file.raw)
                                await this.write(file, next, skill, request.cwd, signal);
                        }
                    }
                    finally {
                        // The lock moves with directory bundles when the bundle is deleted.
                        const movedLock = trashPath && file.target !== file.path ? join(trashPath, basename(lockPath)) : lockPath;
                        await unlink(movedLock).catch(error => { if (error.code !== 'ENOENT')
                            throw error; });
                        this.invalidate();
                    }
                    results.push({ id: target.id, name: skill.name, ok: true, trashPath });
                }
                catch (error) {
                    results.push({ id: target.id, name: skill?.name ?? '未知技能', ok: false, message: error instanceof Error ? error.message : String(error) });
                }
            }
            return { results };
        });
    }
    async write(file, raw, skill, cwd, signal) {
        const temp = `${file.path}.${randomUUID()}.tmp`;
        try {
            const handle = await open(temp, 'wx', file.mode);
            try {
                await handle.writeFile(raw, 'utf8');
                await handle.sync();
            }
            finally {
                await handle.close();
            }
            await chmod(temp, file.mode);
            const fresh = await this.file(skill, cwd);
            if (fresh.revision !== file.revision)
                throw new ManagerError('STALE', '技能已被修改，请刷新后重试');
            this.assertActive(signal);
            await rename(temp, file.path);
        }
        finally {
            await unlink(temp).catch(error => { if (error.code !== 'ENOENT')
                throw error; });
        }
    }
    async trash(file) {
        if (!inside(file.root, file.target))
            throw new ManagerError('READ_ONLY', '删除目标超出技能目录');
        const trashRoot = join(file.root, '.dsh-skills-manager-trash');
        await mkdir(trashRoot, { recursive: true });
        if ((await lstat(trashRoot)).isSymbolicLink() || !inside(await realpath(file.root), await realpath(trashRoot))) {
            throw new ManagerError('READ_ONLY', '回收目录不能是链接');
        }
        const receiptDir = join(trashRoot, randomUUID());
        await mkdir(receiptDir);
        const target = join(receiptDir, basename(file.target));
        if (!inside(trashRoot, target))
            throw new ManagerError('READ_ONLY', '无效的回收目标');
        // Persist the recovery receipt before moving; an unsuccessful move leaves only a harmless receipt.
        const receipt = await open(join(receiptDir, 'receipt.json'), 'wx');
        try {
            await receipt.writeFile(JSON.stringify({ originalPath: file.target, deletedAt: new Date().toISOString(), revision: file.revision }, null, 2));
            await receipt.sync();
        }
        finally {
            await receipt.close();
        }
        await rename(file.target, target);
        return target;
    }
}
