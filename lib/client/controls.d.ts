interface Option {
    value: string;
    label: string;
    disabled?: boolean;
}
export declare function Select({ label, value, options, disabled, onChange }: {
    label: string;
    value: string;
    options: Option[];
    disabled?: boolean;
    onChange: (value: string) => void;
}): import("react/jsx-runtime").JSX.Element;
export declare function Toast({ messages, error }: {
    messages: string[];
    error?: boolean;
}): import("react/jsx-runtime").JSX.Element | null;
export {};
