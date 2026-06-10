export async function apiClient(path: string, init?: RequestInit) {
    const res = await fetch(path, init);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
}
