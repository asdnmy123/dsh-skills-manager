import { CHANNEL, ENDPOINT } from '../protocol.js';
/** Stable snapshot source projected into the main slot by its injection factory. */
export class ManagerModel {
    rpc;
    state = { catalog: { skills: [], complete: false }, status: 'loading', cwd: '', busy: false, failures: [] };
    listeners = new Set();
    lifetime = new AbortController();
    read;
    generation = 0;
    constructor(rpc) {
        this.rpc = rpc;
    }
    source = { getSnapshot: () => this.state, subscribe: (listener) => {
            this.listeners.add(listener);
            return () => { this.listeners.delete(listener); };
        } };
    publish(update) {
        if (this.lifetime.signal.aborted)
            return;
        this.state = { ...this.state, ...update };
        for (const listener of this.listeners)
            listener();
    }
    async refresh(cwd = this.state.cwd, preset = this.state.preset) {
        if (this.state.busy || this.lifetime.signal.aborted)
            return;
        this.read?.abort();
        const read = this.read = new AbortController();
        const generation = ++this.generation;
        this.publish({ cwd, preset, status: 'loading', error: undefined, ...(cwd !== this.state.cwd || preset !== this.state.preset ? { catalog: { skills: [], complete: false, presets: this.state.catalog.presets }, notice: undefined, failures: [] } : {}) });
        try {
            const response = await this.rpc.call(CHANNEL, `${ENDPOINT}/list`, { cwd, preset }, AbortSignal.any([read.signal, this.lifetime.signal]));
            if (generation !== this.generation || read.signal.aborted)
                return;
            if (!response.ok)
                throw new Error(response.error.message);
            const catalog = response.value;
            this.publish({ status: 'ready', catalog, preset: catalog.preset ?? preset });
        }
        catch (error) {
            if (!read.signal.aborted && generation === this.generation)
                this.publish({ status: 'error', error: error instanceof Error ? error.message : '无法连接技能管理服务' });
        }
    }
    async mutate(action, rows) {
        if (this.state.busy || this.state.status !== 'ready' || !this.state.catalog.complete || !rows.length || this.lifetime.signal.aborted)
            return;
        this.read?.abort();
        ++this.generation;
        this.publish({ busy: true, error: undefined, notice: undefined, failures: [] });
        try {
            const response = await this.rpc.call(CHANNEL, `${ENDPOINT}/mutate`, { cwd: this.state.cwd, preset: this.state.preset, action, targets: rows.map(row => ({ id: row.id, revision: row.revision })) }, this.lifetime.signal);
            if (!response.ok)
                throw new Error(response.error.message);
            const result = response.value;
            const successes = result.results.filter(row => row.ok).length;
            const failures = result.results.filter(row => !row.ok).map(row => `${row.name}：${row.message}`);
            this.publish({ notice: successes ? `${action === 'enable' ? '已启用' : action === 'disable' ? '已关闭' : '已移入回收目录'} ${successes} 项技能` : undefined, failures });
        }
        catch (error) {
            this.publish({ failures: [error instanceof Error ? error.message : '操作失败'] });
        }
        finally {
            this.publish({ busy: false });
            await this.refresh();
        }
    }
    dispose() { this.lifetime.abort(); this.read?.abort(); this.listeners.clear(); }
}
