export interface YouTubeSearchResult {
    id: string;
    youtubeId: string;
    title: string;
    duration: number; // in seconds
    durationText?: string;
    thumbnail: string;
    channel?: string;
}

export async function searchYouTubeVideos(query: string): Promise<YouTubeSearchResult[]> {
    const q = query.trim();
    if (!q) return [];

    // 1. Try our Dropsiders backend endpoint
    try {
        const res = await fetch(`/api/youtube/search-media?q=${encodeURIComponent(q)}`);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                return data.map((item: any) => ({
                    id: item.id || item.youtubeId,
                    youtubeId: item.youtubeId || item.id,
                    title: item.title,
                    duration: item.duration || 300,
                    durationText: item.durationText,
                    thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.youtubeId || item.id}/hqdefault.jpg`,
                    channel: item.channel
                }));
            }
        }
    } catch (e) {
        console.warn('Backend YouTube search failed, attempting public fallback...', e);
    }

    // 2. Fallback: Public Invidious instance
    const instances = [
        'https://inv.tux.pizza',
        'https://vid.puffyan.us',
        'https://invidious.nerdvpn.de'
    ];

    for (const inst of instances) {
        try {
            const invRes = await fetch(`${inst}/api/v1/search?q=${encodeURIComponent(q)}&type=video`, {
                headers: { 'Accept': 'application/json' }
            });
            if (invRes.ok) {
                const invData = await invRes.json();
                if (Array.isArray(invData) && invData.length > 0) {
                    return invData.slice(0, 20).map((v: any) => ({
                        id: v.videoId,
                        youtubeId: v.videoId,
                        title: v.title,
                        duration: v.lengthSeconds || 300,
                        durationText: formatSecs(v.lengthSeconds || 0),
                        thumbnail: v.videoThumbnails?.find((t: any) => t.quality === 'high')?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                        channel: v.author
                    }));
                }
            }
        } catch {
            // try next instance
        }
    }

    return [];
}

function formatSecs(s: number): string {
    if (!s || s <= 0) return '00:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
