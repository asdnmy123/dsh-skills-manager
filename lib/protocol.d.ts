export declare const CHANNEL = "/api";
export declare const ENDPOINT = "dsh-skills-manager";
export declare const PANEL_ID = "dsh-skills-manager";
export interface SkillRow {
    id: string;
    name: string;
    description: string;
    source: string;
    provider: string;
    path?: string;
    enabled: boolean;
    invocation: {
        modelInvocable: boolean;
        userInvocable: boolean;
    };
    revision?: string;
    manageable: boolean;
    reason?: string;
}
export interface Catalog {
    skills: SkillRow[];
    complete: boolean;
    preset?: string;
    presets?: {
        id: string;
        name?: string;
        broken?: string;
    }[];
}
export type Action = 'enable' | 'disable' | 'delete';
export interface Target {
    id: string;
    revision: string;
}
export interface MutationRequest {
    cwd?: string;
    preset?: string;
    action: Action;
    targets: Target[];
}
export interface MutationResult {
    results: {
        id: string;
        name: string;
        ok: boolean;
        message?: string;
        trashPath?: string;
    }[];
}
export declare class ManagerError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
