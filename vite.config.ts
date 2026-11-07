import nodeFs from 'node:fs'
// @ts-ignore
import gracefulFs from 'graceful-fs'
gracefulFs.gracefulify(nodeFs)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'android-chrome-512x512.png'],
      manifest: {
        name: 'DROPSIDERS',
        short_name: 'Dropsiders',
        description: 'L\'actu de tous les festivals',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 8000000,
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/dropsiders\.fr\/uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'r2-images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    {
      name: 'media-proxy-dev',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/beatport/top-genre')) {
            try {
              const reqUrl = new URL(req.url, 'http://localhost:5173');
              const rawGenre = (reqUrl.searchParams.get('genre') || '').toLowerCase().trim();
              const normalized = rawGenre.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
              
              const BEATPORT_GENRES_MAP: Record<string, { id: number; slug: string; name: string }> = {
                'indie dance': { id: 37, slug: 'indie-dance', name: 'Indie Dance' },
                'house': { id: 5, slug: 'house', name: 'House' },
                'tech house': { id: 11, slug: 'tech-house', name: 'Tech House' },
                'deep house': { id: 12, slug: 'deep-house', name: 'Deep House' },
                'afro house': { id: 89, slug: 'afro-house', name: 'Afro House' },
                'melodic house techno': { id: 90, slug: 'melodic-house-techno', name: 'Melodic House & Techno' },
                'melodic techno': { id: 90, slug: 'melodic-house-techno', name: 'Melodic House & Techno' },
                'melodic house': { id: 90, slug: 'melodic-house-techno', name: 'Melodic House & Techno' },
                'hard techno': { id: 2, slug: 'hard-techno', name: 'Hard Techno' },
                'techno': { id: 6, slug: 'techno-peak-time-driving', name: 'Techno (Peak Time / Driving)' },
                'peak time techno': { id: 6, slug: 'techno-peak-time-driving', name: 'Techno (Peak Time / Driving)' },
                'raw techno': { id: 92, slug: 'techno-raw-deep-hypnotic', name: 'Techno (Raw / Deep / Hypnotic)' },
                'progressive house': { id: 15, slug: 'progressive-house', name: 'Progressive House' },
                'prog house': { id: 15, slug: 'progressive-house', name: 'Progressive House' },
                'trance': { id: 7, slug: 'trance-main-floor', name: 'Trance (Main Floor)' },
                'psy trance': { id: 13, slug: 'psy-trance', name: 'Psy-Trance' },
                'drum bass': { id: 1, slug: 'drum-bass', name: 'Drum & Bass' },
                'drum and bass': { id: 1, slug: 'drum-bass', name: 'Drum & Bass' },
                'dnb': { id: 1, slug: 'drum-bass', name: 'Drum & Bass' },
                'minimal deep tech': { id: 14, slug: 'minimal-deep-tech', name: 'Minimal / Deep Tech' },
                'minimal': { id: 14, slug: 'minimal-deep-tech', name: 'Minimal / Deep Tech' },
                'nu disco': { id: 50, slug: 'nu-disco-disco', name: 'Nu Disco / Disco' },
                'disco': { id: 50, slug: 'nu-disco-disco', name: 'Nu Disco / Disco' },
                'bass house': { id: 91, slug: 'bass-house', name: 'Bass House' },
                'mainstage': { id: 96, slug: 'mainstage', name: 'Mainstage' },
                'edm': { id: 96, slug: 'mainstage', name: 'Mainstage' },
                'uk garage': { id: 86, slug: 'uk-garage-bassline', name: 'UK Garage / Bassline' },
                'bassline': { id: 86, slug: 'uk-garage-bassline', name: 'UK Garage / Bassline' },
                'amapiano': { id: 98, slug: 'amapiano', name: 'Amapiano' },
                'hardstyle': { id: 8, slug: 'hard-dance-hardcore-neo-rave', name: 'Hard Dance / Hardcore / Neo Rave' },
                'hard dance': { id: 8, slug: 'hard-dance-hardcore-neo-rave', name: 'Hard Dance / Hardcore / Neo Rave' },
                'electro': { id: 94, slug: 'electro-classic-detroit-modern', name: 'Electro' },
                'dubstep': { id: 18, slug: 'dubstep', name: 'Dubstep' },
                'funky house': { id: 81, slug: 'funky-house', name: 'Funky House' },
                'jackin house': { id: 97, slug: 'jackin-house', name: 'Jackin House' }
              };

              const genreMeta = BEATPORT_GENRES_MAP[normalized] ||
                Object.entries(BEATPORT_GENRES_MAP).find(([k]) => normalized.includes(k) || k.includes(normalized))?.[1] ||
                { id: 5, slug: 'house', name: 'House' };

              const bpUrl = `https://www.beatport.com/genre/${genreMeta.slug}/${genreMeta.id}/top-100`;
              
              const { execSync } = await import('node:child_process');
              const html = execSync(`curl.exe -s -L "${bpUrl}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"`, { maxBuffer: 10 * 1024 * 1024 }).toString();

              const startTag = '<script id="__NEXT_DATA__" type="application/json">';
              const start = html.indexOf(startTag);
              if (start !== -1) {
                const end = html.indexOf('</script>', start);
                const nextData = JSON.parse(html.slice(start + startTag.length, end));
                const queries = nextData.props?.pageProps?.dehydratedState?.queries || [];
                for (const q of queries) {
                  const results = q.state?.data?.results;
                  if (Array.isArray(results) && results.length >= 10) {
                    const top10 = results.slice(0, 10).map((t: any, idx: number) => {
                      const rawImg = t.release?.image?.uri || t.image?.uri || '';
                      const cUrl = rawImg ? rawImg.replace('{w}x{h}', '1400x1400').replace(/500x500/i, '1400x1400') : '';
                      return {
                        rank: idx + 1,
                        title: t.mix_name && t.mix_name !== 'Original Mix' ? `${t.name} (${t.mix_name})` : (t.name || ''),
                        artist: Array.isArray(t.artists) ? t.artists.map((a: any) => a.name).join(', ') : (t.artist || ''),
                        cover: cUrl,
                        audioUrl: t.sample_url || '',
                        sourceUrl: t.sample_url || '',
                        genre: t.genre?.name || genreMeta.name
                      };
                    });
                    res.writeHead(200, {
                      'Access-Control-Allow-Origin': '*',
                      'Content-Type': 'application/json'
                    });
                    res.end(JSON.stringify({ success: true, source: 'beatport-top-100', tracks: top10 }));
                    return;
                  }
                }
              }
            } catch (e: any) {
              console.warn('Vite dev top-genre error:', e.message);
            }
          }

          if (req.url && req.url.startsWith('/api/beatport/top-artist')) {
            try {
              const reqUrl = new URL(req.url, 'http://localhost:5173');
              const artistQuery = (reqUrl.searchParams.get('artist') || '').trim();
              if (artistQuery) {
                // Get token
                let token = '';
                try {
                  const tokenRes = await fetch("https://account.beatport.com/o/token/", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                      client_id: "2tiTbKxmQFwnbFjMONU4k7njMRZmV3ZMwRBndiZs",
                      client_secret: "RDUJyAk4zFEGtQ8rsTmylDSfxmALRNBn3D1BsRr7MKi3oa1TL9Mq9QxqUPK7loiumXolEWbJcWa4IGAhtwnTz1cSXClGJ1tkkNCNWwRwjxIKTZJKOJxbwaNt0Rm3WG0v",
                      grant_type: "client_credentials"
                    })
                  });
                  if (tokenRes.ok) {
                    const tData: any = await tokenRes.json();
                    token = tData.access_token || '';
                  }
                } catch (_) {}

                if (token) {
                  const searchRes = await fetch(`https://api.beatport.com/v4/catalog/search/?q=${encodeURIComponent(artistQuery)}&type=artists&per_page=10`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (searchRes.ok) {
                    const sData: any = await searchRes.json();
                    const artists = sData.artists || sData.results || [];
                    if (artists.length > 0) {
                      const cleanInput = artistQuery.toLowerCase();
                      const matched = artists.find((a: any) => (a.name || '').toLowerCase() === cleanInput) ||
                                      artists.find((a: any) => (a.name || '').toLowerCase().includes(cleanInput) || cleanInput.includes((a.name || '').toLowerCase())) ||
                                      artists[0];
                      if (matched && matched.slug && matched.id) {
                        const bpUrl = `https://www.beatport.com/artist/${matched.slug}/${matched.id}`;
                        const { execSync } = await import('node:child_process');
                        const html = execSync(`curl.exe -s -L "${bpUrl}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"`).toString();
                        const startTag = '<script id="__NEXT_DATA__" type="application/json">';
                        const start = html.indexOf(startTag);
                        if (start !== -1) {
                          const end = html.indexOf('</script>', start);
                          const nextData = JSON.parse(html.slice(start + startTag.length, end));
                          const queries = nextData.props?.pageProps?.dehydratedState?.queries || [];
                          for (const q of queries) {
                            const keyStr = JSON.stringify(q.queryKey || []);
                            if (keyStr.includes('top-10-tracks') || keyStr.includes('top-tracks')) {
                              const results = q.state?.data?.results;
                              if (Array.isArray(results) && results.length >= 5) {
                                const top10 = results.slice(0, 10).map((t: any, idx: number) => {
                                  const rawImg = t.release?.image?.uri || t.image?.uri || '';
                                  const cUrl = rawImg ? rawImg.replace('{w}x{h}', '1400x1400').replace(/500x500/i, '1400x1400') : '';
                                  return {
                                    rank: idx + 1,
                                    title: t.mix_name && t.mix_name !== 'Original Mix' ? `${t.name} (${t.mix_name})` : (t.name || ''),
                                    artist: Array.isArray(t.artists) ? t.artists.map((a: any) => a.name).join(', ') : (t.artist || matched.name),
                                    cover: cUrl,
                                    audioUrl: t.sample_url || '',
                                    sourceUrl: t.sample_url || '',
                                    genre: t.genre?.name || ''
                                  };
                                });
                                res.writeHead(200, {
                                  'Access-Control-Allow-Origin': '*',
                                  'Content-Type': 'application/json'
                                });
                                res.end(JSON.stringify({ success: true, source: 'beatport-artist-top-10', tracks: top10, artist: matched.name }));
                                return;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (e: any) {
              console.warn('Vite dev top-artist error:', e.message);
            }
          }

          if (req.url && (req.url.startsWith('/api/proxy-media') || req.url.startsWith('/api/proxy-image'))) {
            try {
              const reqUrl = new URL(req.url, 'http://localhost:5173');
              const target = reqUrl.searchParams.get('url');
              if (!target) {
                res.statusCode = 400;
                res.end('Missing url parameter');
                return;
              }
              const upstream = await fetch(target, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                  'Referer': target
                }
              });
              res.writeHead(upstream.status, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Content-Type': upstream.headers.get('content-type') || (req.url.startsWith('/api/proxy-image') ? 'image/jpeg' : 'application/octet-stream'),
                'Cache-Control': 'public, max-age=86400',
              });
              const arrayBuf = await upstream.arrayBuffer();
              res.end(Buffer.from(arrayBuf));
            } catch (err: any) {
              res.statusCode = 502;
              res.end(`Media proxy error: ${err.message}`);
            }
            return;
          }
          next();
        });
      }
    }
  ],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  server: {
    watch: {
      ignored: ['**/src/data/**']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      maxParallelFileOps: 20,
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) return 'lib-jspdf';
            if (id.includes('html2canvas')) return 'lib-canvas';
            if (id.includes('html2pdf.js')) return 'lib-html2pdf';
            if (id.includes('@uiw/react-md-editor')) return 'lib-editor';
            if (id.includes('framer-motion')) return 'lib-framer';
            if (id.includes('lucide-react')) return 'lib-lucide';
            if (id.includes('react-social-media-embed')) return 'lib-social-embeds';
            if (id.includes('react-simple-maps') || id.includes('d3-')) return 'lib-maps';
            return 'vendor';
          }
          
          // Isolate large JSON data files individually
          if (id.includes('src/data/') && id.endsWith('.json')) {
            const fileName = id.split('/').pop()?.replace('.json', '') || 'data';
            return `data-${fileName}`;
          }
          
          if (id.includes('src/pages/NewsCreate.tsx')) return 'p-admin-news-create';
          if (id.includes('src/pages/AdminFactures.tsx')) return 'p-admin-billing';
          if (id.includes('src/components/SocialSuite.tsx')) return 'c-social-suite';
          if (id.includes('src/components/InvoiceGenerator.tsx')) return 'c-invoice';
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
