
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

/**
 * Update a GitHub file with retry logic for concurrent edits (SHA mismatch).
 * 
 * @param env The environment object containing GitHub credentials
 * @param path The path to the file in the repo (src/data/...)
 * @param updateFn A function that receives the current content (parsed JSON) and returns the modified content
 * @param message The commit message
 * @param retries Number of retries (default 3)
 */
export async function updateGitHubFile(env: any, path: string, updateFn: (content: any) => any, message: string, retries = 3) {
    const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
    const REPO = env.GITHUB_REPO || 'sitedropsiders';
    const TOKEN = env.GITHUB_TOKEN;

    if (!TOKEN) throw new Error('GITHUB_TOKEN is missing');

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
    let lastError;

    for (let i = 0; i < retries; i++) {
        try {
            // GET current file
            const getRes = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'User-Agent': 'Cloudflare-Worker',
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            let fileData: any;

            if (!getRes.ok) {
                if (getRes.status === 404) {
                    // File doesn't exist yet, start with empty content
                    fileData = { content: '', sha: null };
                } else {
                    throw new Error(`Failed to fetch file: ${getRes.statusText}`);
                }
            } else {
                fileData = await getRes.json();
            }

            let content = '[]';
            if (fileData.content) {
                content = b64_to_utf8(fileData.content.replace(/\n/g, ''));
            } else if (fileData.download_url) {
                const rawRes = await fetch(fileData.download_url, {
                    headers: {
                        'Authorization': `Bearer ${TOKEN}`,
                        'User-Agent': 'Cloudflare-Worker'
                    }
                });
                if (rawRes.ok) {
                    content = await rawRes.text();
                }
            }

            let jsonContent;
            try {
                jsonContent = content && content.trim() ? JSON.parse(content) : [];
            } catch (e) {
                console.error("JSON Parse Error:", e);
                jsonContent = [];
            }

            // Apply update function
            const newContent = updateFn(jsonContent);
            const contentBase64 = utf8_to_b64(JSON.stringify(newContent, null, 2));

            // PUT update
            const putRes = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'User-Agent': 'Cloudflare-Worker',
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    content: contentBase64,
                    sha: fileData.sha // sha is null for new files
                })
            });

            if (putRes.ok) {
                return await putRes.json();
            } else if (putRes.status === 409) {
                // Conflict, retry
                console.log(`Conflict (409) on attempt ${i + 1}, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1))); // Exponential backoff
                continue;
            } else {
                const errText = await putRes.text();
                throw new Error(`GitHub API Error: ${putRes.status} - ${errText}`);
            }

        } catch (err) {
            lastError = err;
            console.error(`Attempt ${i + 1} failed:`, err);
            // If it's not a fetch/json error (e.g. auth), maybe break? 
            // For now, retry all errors to be safe.
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    throw lastError || new Error('Max retries reached');
}
