import { findCompromisedDomain } from "@/features/script_scanner/data/compromised_domains";
import { isTrustedCdn } from "@/features/script_scanner/data/trusted_cdns";
import type { Finding } from "@/features/script_scanner/types/finding";
import type { ScanResult } from "@/features/script_scanner/types/finding";
import type { ScriptSource } from "@/features/script_scanner/types/script_source";
import { extractScripts } from "@/features/script_scanner/utils/extract_scripts";
import { parseCdnUrl } from "@/features/script_scanner/utils/parse_cdn_url";

function checkCompromisedDomain(script: ScriptSource): Finding | null {
    const entry = findCompromisedDomain(script.host);
    if (!entry) return null;
    return {
        category: "compromised_domain",
        severity: "critical",
        title: `侵害履歴のあるドメインを参照しています: ${script.host}`,
        description: entry.description,
        recommendation:
            "このスクリプトの読み込みを直ちに停止し、信頼できる別CDN（cdnjs等）または自前ホスティングに切り替えてください。",
        source: { url: script.url, lineNumber: script.lineNumber },
        reference: entry.reference,
    };
}

function checkMissingSri(script: ScriptSource): Finding | null {
    if (script.integrity && script.integrity.trim() !== "") return null;
    return {
        category: "missing_sri",
        severity: "high",
        title: "SRI (Subresource Integrity) が設定されていません",
        description:
            "integrity 属性が無いため、CDN側でファイルが差し替えられても検知できません。サプライチェーン攻撃の主要な侵入経路です。",
        recommendation:
            '<script> タグに integrity="sha384-..." と crossorigin="anonymous" を付与してください。https://www.srihash.org/ でハッシュを生成できます。',
        source: { url: script.url, lineNumber: script.lineNumber },
        reference: {
            label: "MDN: Subresource Integrity",
            url: "https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity",
        },
    };
}

function checkUnpinnedVersion(script: ScriptSource): Finding | null {
    const info = parseCdnUrl(script.url);
    if (info.version === null) return null;
    if (info.isPinned) return null;
    return {
        category: "unpinned_version",
        severity: "medium",
        title: `バージョンが固定されていません: ${info.packageName ?? script.host} @ ${info.version}`,
        description:
            "メジャー/マイナー指定や 'latest' は、CDN側でファイルが差し替えられた瞬間に意図しないコードを読み込みます。",
        recommendation: `完全なバージョン番号（例: 1.2.3）を指定してください。`,
        source: { url: script.url, lineNumber: script.lineNumber },
    };
}

function checkUntrustedCdn(script: ScriptSource): Finding | null {
    if (isTrustedCdn(script.host)) return null;
    if (findCompromisedDomain(script.host)) return null;
    return {
        category: "untrusted_cdn",
        severity: "medium",
        title: `主要CDN以外からスクリプトを読み込んでいます: ${script.host}`,
        description:
            "このホストは既知の主要CDNリストに含まれていません。運営元・サポート体制を確認してください。",
        recommendation:
            "可能であれば cdnjs.cloudflare.com / cdn.jsdelivr.net / unpkg.com などのよく審査された配信元、または自前ホスティングに切り替えてください。",
        source: { url: script.url, lineNumber: script.lineNumber },
    };
}

export function scanScripts(input: string): ScanResult {
    const scripts = extractScripts(input);
    const findings: Finding[] = [];

    for (const script of scripts) {
        const checks = [
            checkCompromisedDomain(script),
            checkMissingSri(script),
            checkUnpinnedVersion(script),
            checkUntrustedCdn(script),
        ];
        for (const finding of checks) {
            if (finding) findings.push(finding);
        }
    }

    return {
        scriptsFound: scripts.length,
        findings,
        scannedAt: new Date().toISOString(),
    };
}
