/**
 * Service de résolution automatique d'extraits musicaux
 * Permet de convertir automatiquement un lien Spotify, Beatport, Soundcloud, Apple Music,
 * Deezer, YouTube ou une recherche Titre + Artiste en un extrait audio officiel de 30 secondes (AAC/M4A/MP3),
 * avec récupération de la pochette officielle 1000x1000 et des métadonnées.
 */

export interface ResolvedMusicData {
    audioUrl: string;
    coverUrl?: string;
    title?: string;
    artist?: string;
    album?: string;
    platform: 'spotify' | 'beatport' | 'soundcloud' | 'applemusic' | 'deezer' | 'youtube' | 'direct' | 'search';
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
 * Recherche un extrait musical 30s sur l'API publique et CORS d'Apple iTunes
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

        // Trouve le premier résultat avec previewUrl valide
        const track = data.results.find((t: any) => !!t.previewUrl) || data.results[0];
        if (!track || !track.previewUrl) return null;

        // Upgrade de l'artwork vers une pochette haute résolution 1000x1000
        const coverUrl = track.artworkUrl100
            ? track.artworkUrl100.replace(/100x100bb\.(jpg|png)/i, '1000x1000bb.jpg')
            : undefined;

        return {
            audioUrl: track.previewUrl,
            coverUrl,
            title: track.trackName,
            artist: track.artistName,
            album: track.collectionName,
            platform
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

    // 2. Lien Spotify (ex: https://open.spotify.com/track/... ou /album/...)
    if (trimmed.includes('spotify.com/track/') || trimmed.includes('open.spotify.com/')) {
        try {
            const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(trimmed)}`;
            const res = await fetch(oembedUrl);
            if (res.ok) {
                const oembed = await res.json();
                const songTitle = oembed.title || '';
                const result = await searchItunesSnippet(songTitle, 'spotify');
                if (result) {
                    if (!result.coverUrl && oembed.thumbnail_url) {
                        result.coverUrl = oembed.thumbnail_url;
                    }
                    return result;
                }
                // Si iTunes n'a pas l'audio preview, on renvoie quand même la cover HD Spotify et le titre !
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

    // 3. Lien Apple Music (ex: https://music.apple.com/...)
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
                        return {
                            audioUrl: track.previewUrl,
                            coverUrl: track.artworkUrl100?.replace(/100x100bb\.(jpg|png)/i, '1000x1000bb.jpg'),
                            title: track.trackName,
                            artist: track.artistName,
                            album: track.collectionName,
                            platform: 'applemusic'
                        };
                    }
                }
            }
            // Fallback par slug
            const slugMatch = trimmed.match(/(?:album|song)\/([^/?#]+)/i);
            if (slugMatch) {
                const result = await searchItunesSnippet(slugMatch[1].replace(/[-_]+/g, ' '), 'applemusic');
                if (result) return result;
            }
        } catch (e) {
            console.warn("Erreur résolution Apple Music :", e);
        }
    }

    // 4. Lien Beatport (ex: https://www.beatport.com/track/frequency/18659837)
    if (trimmed.includes('beatport.com/track/')) {
        try {
            const match = trimmed.match(/beatport\.com\/track\/([^/?#]+)/i);
            if (match && match[1]) {
                const slugWords = match[1].replace(/[-_]+/g, ' ');
                const query = [fallback?.artist, slugWords].filter(Boolean).join(' ');
                const result = await searchItunesSnippet(query, 'beatport');
                if (result) return result;
            }
        } catch (e) {
            console.warn("Erreur résolution Beatport :", e);
        }
    }

    // 5. Lien Soundcloud (ex: https://soundcloud.com/dimension_uk/eli-brown-dimension-frequency)
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
                        if (dzData.preview) {
                            return {
                                audioUrl: dzData.preview,
                                coverUrl: dzData.album?.cover_xl || dzData.album?.cover_big,
                                title: dzData.title,
                                artist: dzData.artist?.name,
                                album: dzData.album?.title,
                                platform: 'deezer'
                            };
                        } else if (dzData.title) {
                            const query = `${dzData.artist?.name || ''} ${dzData.title}`;
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
                    const result = await searchItunesSnippet(data.title, 'youtube');
                    if (result) return result;
                    return {
                        audioUrl: '',
                        coverUrl: data.thumbnail_url,
                        title: cleanQuery(data.title),
                        platform: 'youtube'
                    };
                }
            }
        } catch (e) {
            console.warn("Erreur résolution YouTube :", e);
        }
    }

    // 8. Smartlink générique ou recherche directe de la chaîne saisie
    const fallbackTerm = [trimmed, fallback?.artist, fallback?.title].filter(Boolean).join(' ');
    const searchResult = await searchItunesSnippet(fallbackTerm, 'search');
    if (searchResult) return searchResult;

    return null;
}
