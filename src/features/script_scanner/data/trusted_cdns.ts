export const TRUSTED_CDN_HOSTS: readonly string[] = [
    "cdnjs.cloudflare.com",
    "cdn.jsdelivr.net",
    "unpkg.com",
    "esm.sh",
    "ga.jspm.io",
    "code.jquery.com",
    "ajax.googleapis.com",
    "ajax.aspnetcdn.com",
    "maxcdn.bootstrapcdn.com",
    "stackpath.bootstrapcdn.com",
    "use.fontawesome.com",
    "kit.fontawesome.com",
];

export function isTrustedCdn(host: string): boolean {
    const lower = host.toLowerCase();
    return TRUSTED_CDN_HOSTS.some((trusted) => lower === trusted || lower.endsWith(`.${trusted}`));
}
