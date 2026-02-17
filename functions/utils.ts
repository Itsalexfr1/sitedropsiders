
export const CORSH = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
};

export function jsonResponse(data: any, status = 200, headers: any = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...CORSH,
            'Content-Type': 'application/json',
            ...headers
        }
    });
}

export async function hashPassword(password: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function utf8_to_b64(str: string) {
    return btoa(unescape(encodeURIComponent(str)));
}

export function b64_to_utf8(str: string) {
    return decodeURIComponent(escape(atob(str)));
}
