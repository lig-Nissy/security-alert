export type CdnInfo = {
    packageName: string | null;
    version: string | null;
    isPinned: boolean;
};

const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;
const MAJOR_REGEX = /^\d+(?:\.\d+)?$/;
const RANGE_TOKENS = ["latest", "next", "beta", "alpha", "rc", "canary"];

function tokenLooksUnpinned(token: string): boolean {
    if (token.startsWith("^") || token.startsWith("~")) return true;
    if (RANGE_TOKENS.includes(token.toLowerCase())) return true;
    if (MAJOR_REGEX.test(token)) return true;
    return false;
}

function tokenLooksPinned(token: string): boolean {
    return SEMVER_REGEX.test(token);
}

export function parseCdnUrl(url: string): CdnInfo {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return { packageName: null, version: null, isPinned: false };
    }

    const host = parsed.host.toLowerCase();
    const segments = parsed.pathname.split("/").filter(Boolean);

    if (host === "unpkg.com" || host === "cdn.jsdelivr.net" || host === "esm.sh") {
        if (host === "cdn.jsdelivr.net" && segments[0] === "npm") {
            segments.shift();
        }
        if (segments.length === 0) {
            return { packageName: null, version: null, isPinned: false };
        }
        let packageName = segments[0];
        if (packageName.startsWith("@") && segments.length >= 2) {
            packageName = `${segments[0]}/${segments[1]}`;
        }
        const atIndex = packageName.lastIndexOf("@");
        let version: string | null = null;
        if (atIndex > 0) {
            version = packageName.slice(atIndex + 1);
            packageName = packageName.slice(0, atIndex);
        }
        if (!version) {
            return { packageName, version: null, isPinned: false };
        }
        return {
            packageName,
            version,
            isPinned: tokenLooksPinned(version) && !tokenLooksUnpinned(version),
        };
    }

    if (host === "cdnjs.cloudflare.com") {
        const ajaxIdx = segments.indexOf("ajax");
        if (ajaxIdx >= 0 && segments.length >= ajaxIdx + 4) {
            const packageName = segments[ajaxIdx + 2];
            const version = segments[ajaxIdx + 3];
            return {
                packageName,
                version,
                isPinned: tokenLooksPinned(version),
            };
        }
    }

    const versionInPath = segments.find((seg) => tokenLooksPinned(seg));
    if (versionInPath) {
        return { packageName: null, version: versionInPath, isPinned: true };
    }
    const looseVersion = segments.find((seg) => tokenLooksUnpinned(seg));
    if (looseVersion) {
        return { packageName: null, version: looseVersion, isPinned: false };
    }

    return { packageName: null, version: null, isPinned: false };
}
