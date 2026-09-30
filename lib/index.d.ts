import type { Context } from '@deepseek-ai/cordis';
import { type Config } from './manager.js';
import { type MutationRequest } from './protocol.js';
export type { Config } from './manager.js';
export declare const inject: string[];
export declare const name = "dsh-skills-manager";
export declare function parseMutation(value: unknown): MutationRequest;
/** Register an authenticated logical API, shared by Electron IPC and browser carriers. */
export declare function apply(ctx: Context, config?: Config): void;
