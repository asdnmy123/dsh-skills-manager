import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, readFile, rm, access, mkdir, writeFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, isAbsolute } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
const repository = 'https://github.com/asdnmy123/dsh-skills-manager'
const lifecycle = ['prepare', 'preprepare', 'postprepare', 'preinstall', 'install', 'postinstall', 'prepack', 'postpack']

test('GitHub install instructions match the release and require no package build hooks', async () => {
  const readme = await readFile(new URL('README.md', root), 'utf8')
  assert.ok(readme.includes(`dsh plugin --profile desktop add github:asdnmy123/${manifest.name}#v${manifest.version}`))
  assert.equal(manifest.repository.url, `git+${repository}.git`)
  assert.equal(manifest.homepage, `${repository}#readme`)
  assert.equal(manifest.bugs.url, `${repository}/issues`)
  for (const hook of lifecycle) assert.equal(manifest.scripts[hook], undefined, `Unexpected install/pack hook: ${hook}`)
  assert.equal(manifest.private, true, 'GitHub release does not authorize npm publication')
  for (const file of [manifest.main, manifest.types, manifest.exports['./client'].default, manifest.exports['./client'].types, manifest.dsh.bundle.patch]) await access(new URL(file, root))
  for (const match of readme.matchAll(/\]\(([^)]+)\)/g)) {
    const path = match[1]
    if (/^(?:https?:|#)/.test(path)) continue
    await access(new URL(path.split('#')[0], root))
  }
})

test('distribution check rejects stale or missing output and accepts an identical rebuild', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-skills-dist-'))
  t.after(async () => {
    const rel = relative(tmpdir(), dir)
    assert.ok(!isAbsolute(rel) && rel.startsWith('dsh-skills-dist-') && !rel.includes('..'))
    await rm(dir, { recursive: true, force: true })
  })
  await mkdir(join(dir, 'lib'))
  await writeFile(join(dir, 'package.json'), JSON.stringify({ private: true, type: 'module', scripts: { build: 'node build.mjs' } }))
  await writeFile(join(dir, 'build.mjs'), "import { writeFile } from 'node:fs/promises'; await writeFile('lib/index.js', 'export const ready = true\\n')")
  await writeFile(join(dir, 'check-dist.mjs'), await readFile(new URL('scripts/check-dist.mjs', root)))
  await writeFile(join(dir, 'lib/index.js'), 'outdated')
  const check = () => promisify(execFile)(process.execPath, ['check-dist.mjs'], { cwd: dir })
  await assert.rejects(check(), error => /构建产物过期或缺失/.test(error.stderr))
  assert.equal(await readFile(join(dir, 'lib/index.js'), 'utf8'), 'export const ready = true\n')
  assert.match((await check()).stdout, /构建产物一致：1 个文件/)
  await unlink(join(dir, 'lib/index.js'))
  await assert.rejects(check(), error => /构建产物过期或缺失/.test(error.stderr))
})

test('packed release contains ready-to-load runtime and documentation without source, tools or local data', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-skills-release-'))
  t.after(async () => {
    const rel = relative(tmpdir(), dir)
    assert.ok(!isAbsolute(rel) && rel.startsWith('dsh-skills-release-') && !rel.includes('..'))
    await rm(dir, { recursive: true, force: true })
  })
  assert.ok(process.env.npm_execpath, 'Run release tests through npm test')
  for (const hook of lifecycle) assert.equal(manifest.scripts[hook], undefined)
  const { stdout } = await promisify(execFile)(process.execPath, [process.env.npm_execpath, 'pack', '--json', '--pack-destination', dir], { cwd: new URL('.', root), maxBuffer: 1024 * 1024 })
  const [pack] = JSON.parse(stdout)
  assert.equal(pack.filename, `${manifest.name}-${manifest.version}.tgz`)
  const paths = new Set(pack.files.map(file => file.path))
  for (const path of ['package.json', 'README.md', 'CHANGELOG.md', 'cordis.patch.yml', 'lib/index.js', 'lib/index.d.ts', 'lib/client.js', 'lib/client/index.d.ts', 'docs/advanced.md', 'docs/images/skills-light.png']) assert.ok(paths.has(path), `Missing packaged file: ${path}`)
  for (const path of paths) assert.ok(path.startsWith('lib/') || path.startsWith('docs/images/') || ['package.json', 'README.md', 'CHANGELOG.md', 'cordis.patch.yml', 'docs/advanced.md', 'docs/development.md'].includes(path), `Unexpected packaged file: ${path}`)
  assert.ok(![...paths].some(path => /(?:^|\/)(?:src|tests|scripts|node_modules|artifacts|\.git)(?:\/|$)/.test(path)))
})
