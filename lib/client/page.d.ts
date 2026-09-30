import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { Action, SkillRow } from '../protocol.js';
import type { State } from './model.js';
export interface PageInjected {
    useManager: <T>(selector: (state: State) => T) => T;
    refresh: (cwd?: string, preset?: string) => Promise<void>;
    mutate: (action: Action, rows: SkillRow[]) => Promise<void>;
}
type Props = PropsRuntime<'main'> & PageInjected;
export declare function SkillIcon({ size }: {
    size?: number;
}): import("react/jsx-runtime").JSX.Element;
export declare function SkillsPage({ useManager, useWorkspaces, refresh, mutate }: Props): import("react/jsx-runtime").JSX.Element;
export {};
