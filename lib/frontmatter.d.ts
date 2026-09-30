type Flag = boolean | string | null;
interface SavedPolicy {
    version: 1;
    model: Flag;
    user: Flag;
}
/** Only the YAML header is serialized. The closing delimiter and body remain byte-for-byte intact. */
export declare function readHeader(raw: string): {
    doc: import("yaml").Document.Parsed<import("yaml").Scalar.Parsed, true> | import("yaml").Document.Parsed<import("yaml").YAMLSeq.Parsed<import("yaml").ParsedNode>, true> | import("yaml").Document.Parsed<import("yaml").YAMLMap.Parsed<import("yaml").ParsedNode, import("yaml").ParsedNode | null>, true> | import("yaml").Document.Parsed<import("yaml").Alias.Parsed, true>;
    saved: SavedPolicy | undefined;
    prefix: string;
    suffix: string;
};
export declare function setEnabled(raw: string, enabled: boolean): string;
export {};
