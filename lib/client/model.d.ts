import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client';
import { type Action, type Catalog, type SkillRow } from '../protocol.js';
export interface State {
    catalog: Catalog;
    status: 'loading' | 'ready' | 'error';
    cwd: string;
    preset?: string;
    busy: boolean;
    error?: string;
    notice?: string;
    failures: string[];
}
/** Stable snapshot source projected into the main slot by its injection factory. */
export declare class ManagerModel {
    private readonly rpc;
    private state;
    private listeners;
    private lifetime;
    private read?;
    private generation;
    constructor(rpc: ClientConnectionRpc);
    readonly source: {
        getSnapshot: () => State;
        subscribe: (listener: () => void) => () => void;
    };
    private publish;
    refresh(cwd?: string, preset?: string | undefined): Promise<void>;
    mutate(action: Action, rows: SkillRow[]): Promise<void>;
    dispose(): void;
}
