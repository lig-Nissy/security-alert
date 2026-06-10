export type ScriptSource = {
    url: string;
    host: string;
    integrity: string | null;
    crossorigin: string | null;
    raw: string;
    lineNumber: number;
};
