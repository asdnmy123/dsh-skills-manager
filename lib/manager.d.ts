import type { SkillRegistry, SkillViewOptions } from '@deepseek-ai/dsh-skill';
import { type Catalog, type MutationRequest, type MutationResult } from './protocol.js';
export interface Config {
    /** Must match skill-filesystem's roots when that provider uses custom locations. */
    dshHome?: string;
    agentsHome?: string;
    customSkillDirs?: string[];
    filesystemProviders?: string[];
}
/** Public preset registry contract; acquiring a lease neither creates an Agent nor selects a preset. */
export interface PresetAccess {
    readonly defaultId: string;
    list(): Promise<NonNullable<Catalog['presets']>>;
    acquireScope(id?: string): Promise<{
        key: NonNullable<SkillViewOptions['scope']>;
        [Symbol.asyncDispose](): Promise<void>;
    }>;
}
export declare class SkillsManager {
    private readonly skills;
    private readonly invalidate;
    private readonly config;
    private readonly presets;
    private queue;
    private active;
    constructor(skills: Pick<SkillRegistry, 'snapshot'>, invalidate: () => void, config?: Config, presets?: () => PresetAccess | undefined);
    dispose(): Promise<unknown>;
    private assertActive;
    private roots;
    private file;
    private inPreset;
    list(cwd?: string, signal?: AbortSignal, preset?: string): Promise<Catalog>;
    mutate(request: MutationRequest, signal?: AbortSignal): Promise<MutationResult>;
    private runMutation;
    private write;
    private trash;
}
