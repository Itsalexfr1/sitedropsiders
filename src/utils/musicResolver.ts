/**
 * Service de résolution automatique d'extraits musicaux
 * Permet de convertir automatiquement un lien Spotify, Beatport, Soundcloud, Apple Music,
 * Deezer, YouTube ou une recherche Titre + Artiste en un extrait audio officiel (AAC/M4A/MP3),
 * avec récupération de la pochette officielle Ultra-HD (1400x1400 / 1000x1000) et des métadonnées.
 * Intègre nativement l'API Beatport v4 (extraits de 120s / 2 minutes centrés sur le drop)
 * pour permettre un export de 30 secondes complètes en plein milieu du morceau sans aucune boucle.
 */

export interface ResolvedMusicData {
    audioUrl: string;
    coverUrl?: string;
    title?: string;
    artist?: string;
    album?: string;
    platform: 'spotify' | 'beatport' | 'soundcloud' | 'applemusic' | 'deezer' | 'youtube' | 'direct' | 'search';
    duration?: number;
}

// Cache du token public Beatport v4 (Embed Player API - 100% CORS ouvert)
let cachedBeatportToken: string | null = null;
let beatportTokenExpiry = 0;

export async function getBeatportToken(): Promise<string | null> {
    if (cachedBeatportToken && Date.now() < beatportTokenExpiry) {
        return cachedBeatportToken;
    }
    try {
        const res = await fetch("https://account.beatport.com/o/token/", {
            method: "POST",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: "2tiTbKxmQFwnbFjMONU4k7njMRZmV3ZMwRBndiZs",
                client_secret: "RDUJyAk4zFEGtQ8rsTmylDSfxmALRNBn3D1BsRr7MKi3oa1TL9Mq9QxqUPK7loiumXolEWbJcWa4IGAhtwnTz1cSXClGJ1tkkNCNWwRwjxIKTZJKOJxbwaNt0Rm3WG0v",
                grant_type: "client_credentials"
            })
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.access_token) {
            cachedBeatportToken = data.access_token;
            beatportTokenExpiry = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
            return cachedBeatportToken;
        }
    } catch (e) {
        console.warn("Échec token Beatport :", e);
    }
    return null;
}

/**
 * Nettoie un titre pour la recherche (supprime mentions vidéo, remaster, visualizer)
 */
function cleanQuery(str: string): string {
    return str
        .replace(/\((?:official\s*(?:video|audio|music\s*video|visualizer)|4k|hd|remaster(?:ed)?|extended\s*mix|out\s*now)[^)]*\)/gi, '')
        .replace(/\[(?:official\s*(?:video|audio|music\s*video|visualizer)|4k|hd|remaster(?:ed)?|extended\s*mix)[^\]]*\]/gi, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Recherche un extrait musical sur l'API publique de Beatport (Catalog v4)
 * Renvoie un extrait de 120 secondes (2 minutes) centré sur le break & drop avec pochette HD 1400x1400
 */
export async function searchBeatportSnippet(query: string, platform: ResolvedMusicData['platform'] = 'beatport'): Promise<ResolvedMusicData | null> {
    const cleaned = cleanQuery(query);
    if (!cleaned) return null;

    try {
        const token = await getBeatportToken();
        if (!token) return null;

        const res = await fetch(`https://api.beatport.com/v4/catalog/search/?q=${encodeURIComponent(cleaned)}&type=tracks&per_page=3`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.tracks || data.tracks.length === 0) return null;

        const track = data.tracks.find((t: any) => !!t.sample_url) || data.tracks[0];
        if (!track || !track.sample_url) return null;

        const rawImg = track.release?.image?.uri || '';
        const coverUrl = rawImg
            ? rawImg.replace('{w}x{h}', '1400x1400').replace(/500x500/i, '1400x1400')
            : undefined;

        const artists = track.artists?.map((a: any) => a.name).join(', ') || '';
        const mixSuffix = track.mix_name && !track.name?.toLowerCase().includes(track.mix_name.toLowerCase())
            ? ` (${track.mix_name})`
            : '';
        const title = (track.name || '') + mixSuffix;
        const label = track.release?.label?.name || track.release?.name;

        return {
            audioUrl: track.sample_url,
            coverUrl,
            title,
            artist: artists,
            album: label,
            platform,
            duration: 120
        };
    } catch (err) {
        console.warn("Échec recherche Beatport snippet :", err);
        return null;
    }
}

/**
 * Récupère un morceau Beatport par son ID direct avec son extrait 120s et sa pochette HD
 */
export async function getBeatportTrackById(trackId: string): Promise<ResolvedMusicData | null> {
    try {
        const token = await getBeatportToken();
        if (!token) return null;

        const res = await fetch(`https://api.beatport.com/v4/catalog/tracks/${trackId}/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        });
        if (!res.ok) return null;
        const track = await res.json();
        if (!track || !track.sample_url) return null;

        const rawImg = track.release?.image?.uri || '';
        const coverUrl = rawImg
            ? rawImg.replace('{w}x{h}', '1400x1400').replace(/500x500/i, '1400x1400')
            : undefined;

        const artists = track.artists?.map((a: any) => a.name).join(', ') || '';
        const mixSuffix = track.mix_name && !track.name?.toLowerCase().includes(track.mix_name.toLowerCase())
            ? ` (${track.mix_name})`
            : '';
        const title = (track.name || '') + mixSuffix;
        const label = track.release?.label?.name || track.release?.name;

        return {
            audioUrl: track.sample_url,
            coverUrl,
            title,
            artist: artists,
            album: label,
            platform: 'beatport',
            duration: 120
        };
    } catch (err) {
        console.warn("Échec lookup Beatport track :", err);
        return null;
    }
}

/**
 * Récupère le premier morceau d'une release Beatport
 */
export async function getBeatportReleaseFirstTrack(releaseId: string): Promise<ResolvedMusicData | null> {
    try {
        const token = await getBeatportToken();
        if (!token) return null;

        const res = await fetch(`https://api.beatport.com/v4/catalog/releases/${releaseId}/tracks/?per_page=1`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        });
        if (!res.ok) return null;
        const data = await res.json();
        const track = data.results?.[0];
        if (!track || !track.sample_url) return null;

        const rawImg = track.release?.image?.uri || '';
        const coverUrl = rawImg
            ? rawImg.replace('{w}x{h}', '1400x1400').replace(/500x500/i, '1400x1400')
            : undefined;

        const artists = track.artists?.map((a: any) => a.name).join(', ') || '';
        const mixSuffix = track.mix_name && !track.name?.toLowerCase().includes(track.mix_name.toLowerCase())
            ? ` (${track.mix_name})`
            : '';
        const title = (track.name || '') + mixSuffix;
        const label = track.release?.label?.name || track.release?.name;

        return {
            audioUrl: track.sample_url,
            coverUrl,
            title,
            artist: artists,
            album: label,
            platform: 'beatport',
            duration: 120
        };
    } catch (err) {
        console.warn("Échec lookup Beatport release :", err);
        return null;
    }
}

/**
 * Recherche un extrait musical 30s sur l'API publique et CORS d'Apple iTunes (fallback)
 */
export async function searchItunesSnippet(query: string, platform: ResolvedMusicData['platform'] = 'search'): Promise<ResolvedMusicData | null> {
    const cleaned = cleanQuery(query);
    if (!cleaned) return null;

    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleaned)}&entity=song&limit=5`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) return null;

        const data = await res.json();
        if (!data.results || data.results.length === 0) return null;

        const track = data.results.find((t: any) => !!t.previewUrl) || data.results[0];
        if (!track || !track.previewUrl) return null;

        const coverUrl = track.artworkUrl100
            ? track.artworkUrl100.replace(/100x100bb\.(jpg|png)/i, '1000x1000bb.jpg')
            : undefined;

        return {
            audioUrl: track.previewUrl,
            coverUrl,
            title: track.trackName,
            artist: track.artistName,
            album: track.collectionName,
            platform,
            duration: 30
        };
    } catch (err) {
        console.warn("Échec de recherche iTunes snippet :", err);
        return null;
    }
}

/**
 * Résout automatiquement un lien de streaming ou fichier audio en extrait audio exploitable
 */
export async function resolveMusicSnippet(
    input: string,
    fallback?: { title?: string; artist?: string }
): Promise<ResolvedMusicData | null> {
    const trimmed = input.trim();
    if (!trimmed) {
        if (fallback?.title || fallback?.artist) {
            const query = [fallback.artist, fallback.title].filter(Boolean).join(' ');
            const bpRes = await searchBeatportSnippet(query, 'beatport');
            if (bpRes) return bpRes;
            return searchItunesSnippet(query, 'search');
        }
        return null;
    }

    // 1. Déjà un fichier audio direct (MP3, WAV, M4A, AAC, Blob)
    if (
        trimmed.startsWith('blob:') ||
        /\.(mp3|wav|m4a|aac|ogg)(\?.*)?$/i.test(trimmed)
    ) {
        return {
            audioUrl: trimmed,
            platform: 'direct'
        };
    }

    // 1b. Déjà une URL d'image directe (JPG, PNG, WEBP, GIF)
    if (
        trimmed.startsWith('data:image/') ||
        /\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(trimmed)
    ) {
        return {
            audioUrl: '',
            coverUrl: trimmed,
            platform: 'direct'
        };
    }

    // 2. Lien Beatport (ex: https://www.beatport.com/track/frequency/18659837 ou https://www.beatport.com/release/.../4462615)
    if (trimmed.includes('beatport.com')) {
        try {
            // A. Track direct par ID
            const trackIdMatch = trimmed.match(/beatport\.com\/(?:[a-z]{2}\/)?track\/(?:[^/]+\/)?(\d+)/i);
            if (trackIdMatch && trackIdMatch[1]) {
                const bpTrack = await getBeatportTrackById(trackIdMatch[1]);
                if (bpTrack) return bpTrack;
            }

            // B. Release direct par ID
            const releaseIdMatch = trimmed.match(/beatport\.com\/(?:[a-z]{2}\/)?release\/(?:[^/]+\/)?(\d+)/i);
            if (releaseIdMatch && releaseIdMatch[1]) {
                const bpRelease = await getBeatportReleaseFirstTrack(releaseIdMatch[1]);
                if (bpRelease) return bpRelease;
            }

            // C. Recherche par slug
            const slugMatch = trimmed.match(/beatport\.com\/(?:[a-z]{2}\/)?(?:track|release)\/([^/?#]+)/i);
            if (slugMatch && slugMatch[1]) {
                const slugWords = slugMatch[1].replace(/[-_]+/g, ' ');
                const query = [fallback?.artist, slugWords].filter(Boolean).join(' ');
                const bpSearch = await searchBeatportSnippet(query, 'beatport');
                if (bpSearch) return bpSearch;
            }
        } catch (e) {
            console.warn("Erreur résolution Beatport :", e);
        }
    }

    // 3. Lien Spotify (ex: https://open.spotify.com/track/... ou /album/...)
    if (trimmed.includes('spotify.com/track/') || trimmed.includes('open.spotify.com/')) {
        try {
            const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(trimmed)}`;
            const res = await fetch(oembedUrl);
            if (res.ok) {
                const oembed = await res.json();
                const songTitle = oembed.title || '';

                // A. Essayer Beatport en priorité pour obtenir l'extrait long de 120s centré sur le drop !
                if (songTitle) {
                    const bpResult = await searchBeatportSnippet(songTitle, 'beatport');
                    if (bpResult) {
                        if (!bpResult.coverUrl && oembed.thumbnail_url) {
                            bpResult.coverUrl = oembed.thumbnail_url;
                        }
                        return bpResult;
                    }
                }

                // B. Fallback iTunes (30s)
                const result = await searchItunesSnippet(songTitle, 'spotify');
                if (result) {
                    if (!result.coverUrl && oembed.thumbnail_url) {
                        result.coverUrl = oembed.thumbnail_url;
                    }
                    return result;
                }

                // C. Si pas d'audio preview, on renvoie quand même la cover Spotify et le titre
                if (oembed.thumbnail_url || songTitle) {
                    return {
                        audioUrl: '',
                        coverUrl: oembed.thumbnail_url,
                        title: songTitle,
                        platform: 'spotify'
                    };
                }
            }
        } catch (e) {
            console.warn("Erreur résolution Spotify oEmbed :", e);
        }
    }

    // 4. Lien Apple Music (ex: https://music.apple.com/...)
    if (trimmed.includes('music.apple.com') || trimmed.includes('itunes.apple.com')) {
        try {
            const trackIdMatch = trimmed.match(/[?&]i=(\d+)/i) || trimmed.match(/\/id(\d+)/i) || trimmed.match(/\/album\/[^/]+\/(\d+)/i);
            if (trackIdMatch && trackIdMatch[1]) {
                const lookupUrl = `https://itunes.apple.com/lookup?id=${trackIdMatch[1]}`;
                const res = await fetch(lookupUrl);
                if (res.ok) {
                    const data = await res.json();
                    if (data.results && data.results[0] && data.results[0].previewUrl) {
                        const track = data.results[0];
                        // Tente Beatport d'abord pour avoir le 120s si possible
                        const query = `${track.artistName} ${track.trackName}`;
                        const bpRes = await searchBeatportSnippet(query, 'beatport');
                        if (bpRes) return bpRes;

                        return {
                            audioUrl: track.previewUrl,
                            coverUrl: track.artworkUrl100?.replace(/100x100bb\.(jpg|png)/i, '1000x1000bb.jpg'),
                            title: track.trackName,
                            artist: track.artistName,
                            album: track.collectionName,
                            platform: 'applemusic',
                            duration: 30
                        };
                    }
                }
            }
            const slugMatch = trimmed.match(/(?:album|song)\/([^/?#]+)/i);
            if (slugMatch) {
                const q = slugMatch[1].replace(/[-_]+/g, ' ');
                const bpRes = await searchBeatportSnippet(q, 'beatport');
                if (bpRes) return bpRes;
                const result = await searchItunesSnippet(q, 'applemusic');
                if (result) return result;
            }
        } catch (e) {
            console.warn("Erreur résolution Apple Music :", e);
        }
    }

    // 5. Lien Soundcloud (ex: https://soundcloud.com/...)
    if (trimmed.includes('soundcloud.com/')) {
        try {
            let scTitle = '';
            let scThumbnail = '';
            try {
                const scRes = await fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`);
                if (scRes.ok) {
                    const scData = await scRes.json();
                    scTitle = scData.title || '';
                    scThumbnail = scData.thumbnail_url || '';
                }
            } catch (_) {}

            const match = trimmed.match(/soundcloud\.com\/([^/?#]+)\/([^/?#]+)/i);
            const artistSlug = match ? match[1].replace(/[-_]+/g, ' ') : '';
            const trackSlug = match ? match[2].replace(/[-_]+/g, ' ') : '';
            const query = scTitle || `${artistSlug} ${trackSlug}`;

            // Beatport en priorité
            const bpRes = await searchBeatportSnippet(query, 'beatport');
            if (bpRes) {
                if (!bpRes.coverUrl && scThumbnail) bpRes.coverUrl = scThumbnail;
                return bpRes;
            }

            const result = await searchItunesSnippet(query, 'soundcloud');
            if (result) {
                if (!result.coverUrl && scThumbnail) result.coverUrl = scThumbnail;
                return result;
            }
            if (scThumbnail || scTitle) {
                return {
                    audioUrl: '',
                    coverUrl: scThumbnail,
                    title: scTitle || trackSlug,
                    artist: artistSlug,
                    platform: 'soundcloud'
                };
            }
        } catch (e) {
            console.warn("Erreur résolution Soundcloud :", e);
        }
    }

    // 6. Lien Deezer (ex: https://www.deezer.com/track/4301739632)
    if (trimmed.includes('deezer.com/')) {
        try {
            const match = trimmed.match(/track\/(\d+)/i);
            if (match && match[1]) {
                try {
                    const dzRes = await fetch(`https://api.deezer.com/track/${match[1]}`);
                    if (dzRes.ok) {
                        const dzData = await dzRes.json();
                        const query = `${dzData.artist?.name || ''} ${dzData.title || ''}`;
                        const bpRes = await searchBeatportSnippet(query, 'beatport');
                        if (bpRes) return bpRes;

                        if (dzData.preview) {
                            return {
                                audioUrl: dzData.preview,
                                coverUrl: dzData.album?.cover_xl || dzData.album?.cover_big,
                                title: dzData.title,
                                artist: dzData.artist?.name,
                                album: dzData.album?.title,
                                platform: 'deezer',
                                duration: 30
                            };
                        } else if (dzData.title) {
                            const result = await searchItunesSnippet(query, 'deezer');
                            if (result) return result;
                        }
                    }
                } catch (_) {}
            }
        } catch (e) {
            console.warn("Erreur résolution Deezer :", e);
        }
    }

    // 7. Lien YouTube (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...)
    if (trimmed.includes('youtube.com/watch') || trimmed.includes('youtu.be/')) {
        try {
            const ytOembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`;
            const res = await fetch(ytOembed);
            if (res.ok) {
                const data = await res.json();
                if (data.title) {
                    const cleanedTitle = cleanQuery(data.title);
                    const bpRes = await searchBeatportSnippet(cleanedTitle, 'beatport');
                    if (bpRes) return bpRes;

                    const result = await searchItunesSnippet(cleanedTitle, 'youtube');
                    if (result) return result;
                    return {
                        audioUrl: '',
                        coverUrl: data.thumbnail_url,
                        title: cleanedTitle,
                        platform: 'youtube'
                    };
                }
            }
        } catch (e) {
            console.warn("Erreur résolution YouTube :", e);
        }
    }

    // 8. Recherche directe de la chaîne saisie (Titre, Artiste...)
    const fallbackTerm = [trimmed, fallback?.artist, fallback?.title].filter(Boolean).join(' ');
    // Essayer Beatport en priorité !
    const bpResult = await searchBeatportSnippet(fallbackTerm, 'beatport');
    if (bpResult) return bpResult;

    // Fallback iTunes
    const searchResult = await searchItunesSnippet(fallbackTerm, 'search');
    if (searchResult) return searchResult;

    return null;
}
