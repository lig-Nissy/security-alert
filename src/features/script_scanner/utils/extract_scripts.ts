import type { ScriptSource } from "@/features/script_scanner/types/script_source";

const SCRIPT_TAG_REGEX = /<script\b([^>]*)>/gi;
const ATTR_REGEX = /(\w[\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
const DYNAMIC_IMPORT_REGEX = /\bimport\s*\(\s*["'`](https?:\/\/[^"'`]+)["'`]\s*\)/gi;

function getAttr(attrString: string, name: string): string | null {
    ATTR_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null = ATTR_REGEX.exec(attrString);
    while (match !== null) {
        const [, key, dq, sq, bare] = match;
        if (key.toLowerCase() === name.toLowerCase()) {
            return dq ?? sq ?? bare ?? "";
        }
        match = ATTR_REGEX.exec(attrString);
    }
    return null;
}

function lineNumberAt(text: string, index: number): number {
    return text.slice(0, index).split("\n").length;
}

function safeHost(url: string): string | null {
    try {
        return new URL(url).host;
    } catch {
        return null;
    }
}

export function extractScripts(input: string): ScriptSource[] {
    const results: ScriptSource[] = [];

    SCRIPT_TAG_REGEX.lastIndex = 0;
    let tagMatch: RegExpExecArray | null = SCRIPT_TAG_REGEX.exec(input);
    while (tagMatch !== null) {
        const [raw, attrs] = tagMatch;
        const src = getAttr(attrs, "src");
        if (src && /^https?:\/\//i.test(src)) {
            const host = safeHost(src);
            if (host) {
                results.push({
                    url: src,
                    host,
                    integrity: getAttr(attrs, "integrity"),
                    crossorigin: getAttr(attrs, "crossorigin"),
                    raw,
                    lineNumber: lineNumberAt(input, tagMatch.index),
                });
            }
        }
        tagMatch = SCRIPT_TAG_REGEX.exec(input);
    }

    DYNAMIC_IMPORT_REGEX.lastIndex = 0;
    let importMatch: RegExpExecArray | null = DYNAMIC_IMPORT_REGEX.exec(input);
    while (importMatch !== null) {
        const [raw, url] = importMatch;
        const host = safeHost(url);
        if (host) {
            results.push({
                url,
                host,
                integrity: null,
                crossorigin: null,
                raw,
                lineNumber: lineNumberAt(input, importMatch.index),
            });
        }
        importMatch = DYNAMIC_IMPORT_REGEX.exec(input);
    }

    return results;
}
