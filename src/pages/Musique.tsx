import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Disc, ExternalLink, ListMusic, TrendingUp, Zap, Play, Pause, X, ChevronRight, Share2, Heart } from 'lucide-react';
import { EqualizerLoader } from '../components/ui/EqualizerLoader';
import { GlitchTransition } from '../components/ui/GlitchTransition';

interface Track {
    id: string;
    rank: number;
    title: string;
    artist: string;
    label: string;
    url: string;
    preview?: string;
    duration?: string;
    embedUrl?: string;
    tracks?: { title: string; artist: string; time?: string }[];
}

interface TracklistContent {
    id: string;
    title: string;
    artist: string;
    tracks: { title: string; artist: string; time?: string }[];
    embedUrl?: string;
}



export function Musique() {
    const [activeTab, setActiveTab] = useState('beatport');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedTracklist, setSelectedTracklist] = useState<TracklistContent | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, [activeTab]);

    useEffect(() => {
        if (selectedTrack && !selectedTrack.embedUrl) {
            setIsPlaying(true);
            if (audioRef.current) {
                audioRef.current.src = selectedTrack.preview || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
                audioRef.current.play().catch(e => console.log("Audio play blocked by browser", e));
            }
        }
    }, [selectedTrack]);

    useEffect(() => {
        if (audioRef.current && !selectedTrack?.embedUrl) {
            if (isPlaying) audioRef.current.play().catch(() => { });
            else audioRef.current.pause();
        }
    }, [isPlaying, selectedTrack]);

    const platforms = [
        { id: 'beatport', name: 'Beatport Top 10', icon: Music, color: '#39ff14' },
        { id: 'traxsource', name: 'Traxsource Top 10', icon: Disc, color: '#ffaa00' },
        { id: 'hardstyle', name: 'Hardstyle.com Top 10', icon: Zap, color: '#ff4b00' },
        { id: 'juno', name: 'Juno Download Top 10', icon: ListMusic, color: '#00f0ff' },
        { id: '1001tracklists', name: 'Most Viewed Tracklists', icon: TrendingUp, color: '#ff0033' },
    ];

    const getMockData = (platform: string): Track[] => {
        // Premium high-energy tech-house / techno preview fallback
        const hardstylePreview = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3';
        const samplePreview = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

        if (platform === 'beatport') {
            return [
                { id: '23308330', rank: 1, title: 'neck (Extended Mix)', artist: 'Mau P', label: 'Black Book Records', url: 'https://www.beatport.com/fr/track/neck/23308330', embedUrl: 'https://embed.beatport.com/?id=23308330&type=track' },
                { id: '23451068', rank: 2, title: 'Make My Day (Original Mix)', artist: 'ESSE (US)', label: 'ESSEntial.', url: 'https://www.beatport.com/fr/track/make-my-day/23451068', embedUrl: 'https://embed.beatport.com/?id=23451068&type=track' },
                { id: '23904036', rank: 3, title: 'Loco Loco (Extended Mix)', artist: 'Reinier Zonneveld, GORDO (US)', label: "SPINNIN' RECORDS", url: 'https://www.beatport.com/fr/track/loco-loco/23904036', embedUrl: 'https://embed.beatport.com/?id=23904036&type=track' },
                { id: '23443670', rank: 4, title: 'Good Time (Extended Mix)', artist: 'Trace (UZ)', label: '8Bit', url: 'https://www.beatport.com/fr/track/good-time/23443670', embedUrl: 'https://embed.beatport.com/?id=23443670&type=track' },
                { id: '23451235', rank: 5, title: 'Out of My Mind (Extended Mix)', artist: 'Joshwa', label: 'Hellbent Records', url: 'https://www.beatport.com/fr/track/out-of-my-mind/23451235', embedUrl: 'https://embed.beatport.com/?id=23451235&type=track' },
                { id: '23965405', rank: 6, title: 'Just Like That (Original Mix)', artist: 'SOSA (UK)', label: 'You&Me Records', url: 'https://www.beatport.com/fr/track/just-like-that/23965405', embedUrl: 'https://embed.beatport.com/?id=23965405&type=track' },
                { id: '23996197', rank: 7, title: 'Swagger (Extended)', artist: 'HILLS (US), WELKER (BR)', label: 'Higher Ground', url: 'https://www.beatport.com/fr/track/swagger/23996197', embedUrl: 'https://embed.beatport.com/?id=23996197&type=track' },
                { id: '22357262', rank: 8, title: 'Jamaican (Bam Bam) (Extended Mix)', artist: 'Hugel, SOLTO (FR)', label: 'MoBlack Records', url: 'https://www.beatport.com/fr/track/jamaican-bam-bam/22357262', embedUrl: 'https://embed.beatport.com/?id=22357262&type=track' },
                { id: '23648337', rank: 9, title: 'Vision Blurred (Extended Mix)', artist: 'Kaskade, CID, Anabel Englund', label: 'Experts Only', url: 'https://www.beatport.com/fr/track/vision-blurred/23648337', embedUrl: 'https://embed.beatport.com/?id=23648337&type=track' },
                { id: '24441099', rank: 10, title: 'Lifting (Extended)', artist: 'Riordan, Silva Bumpa', label: 'Room Two Recordings', url: 'https://www.beatport.com/fr/track/lifting/24441099', embedUrl: 'https://embed.beatport.com/?id=24441099&type=track' },
            ];
        }
        if (platform === 'traxsource') {
            return [
                { id: 'ts-14359025', rank: 1, title: 'Take Me Up (ft. Donna Blakely)', artist: 'Ralphi Rosario, Bob Sinclar', label: 'Altra Moda Music', url: 'https://traxsource.com/track/14359025/take-me-up-ft-donna-blakely', embedUrl: 'https://embed.traxsource.com/player/track/14359025?autoplay=1&play=1' },
                { id: 'ts-14384124', rank: 2, title: 'I Love U (Afro Mix)', artist: 'Stacy Kidd', label: 'House 4 Life', url: 'https://traxsource.com/track/14384124/i-love-u-afro-mix', embedUrl: 'https://embed.traxsource.com/player/track/14384124?autoplay=1&play=1' },
                { id: 'ts-14283333', rank: 3, title: 'Carry Us Away (Extended Mix)', artist: 'DJ Fudge', label: "Fool's Paradise", url: 'https://traxsource.com/track/14283333/carry-us-away-extended-mix', embedUrl: 'https://embed.traxsource.com/player/track/14283333?autoplay=1&play=1' },
                { id: 'ts-14403274', rank: 4, title: 'Charleen (Main Mix)', artist: 'Deon Cole, Stacy Kidd', label: 'House 4 Life', url: 'https://traxsource.com/track/14403274/charleen-main-mix', embedUrl: 'https://embed.traxsource.com/player/track/14403274?autoplay=1&play=1' },
                { id: 'ts-14324830', rank: 5, title: 'Stand Up (Extended)', artist: 'Da Lukas, Stella Brown', label: 'Groove Culture', url: 'https://traxsource.com/track/14324830/stand-up-extended', embedUrl: 'https://embed.traxsource.com/player/track/14324830?autoplay=1&play=1' },
                { id: 'ts-14330028', rank: 6, title: '"U" (Klassik Jazz Mix)', artist: "K' Alexi Shelby", label: 'Klassik Blueprint Muzik Digital', url: 'https://traxsource.com/track/14330028/u-klassik-jazz-mix', embedUrl: 'https://embed.traxsource.com/player/track/14330028?autoplay=1&play=1' },
                { id: 'ts-14235719', rank: 7, title: 'Luv Musica (Luca Guerrieri Remix)', artist: 'Ridney, Luca Guerrieri', label: 'Paharas Musica', url: 'https://traxsource.com/track/14235719/luv-musica-luca-guerrieri-remix', embedUrl: 'https://embed.traxsource.com/player/track/14235719?autoplay=1&play=1' },
                { id: 'ts-14384931', rank: 8, title: 'Good Stuff (Extended Mix)', artist: 'Definite Grooves', label: 'Nervous', url: 'https://traxsource.com/track/14384931/good-stuff-extended-mix', embedUrl: 'https://embed.traxsource.com/player/track/14384931?autoplay=1&play=1' },
                { id: 'ts-14334069', rank: 9, title: 'Better Days (Extended Mix)', artist: 'Jimi Polo, Michael Gray', label: 'Toolroom', url: 'https://traxsource.com/track/14334069/better-days-extended-mix', embedUrl: 'https://embed.traxsource.com/player/track/14334069?autoplay=1&play=1' },
                { id: 'ts-14410945', rank: 10, title: 'My Mistake', artist: 'DJ Spen, Thommy Davis', label: 'Quantize Recordings', url: 'https://traxsource.com/track/14410945/my-mistake-spen-and-thommys-chi-philly-dub', embedUrl: 'https://embed.traxsource.com/player/track/14410945?autoplay=1&play=1' },
            ];
        }
        if (platform === 'hardstyle') {
            return [
                { id: 'hs-1', rank: 1, title: 'Accelerate It (Extended Mix)', artist: 'MT & Complex', label: 'Gearbox Overdrive', url: 'https://www.hardstyle.com/tracks/mt-and-complex-accelerate-it-extended-mix', preview: hardstylePreview },
                { id: 'hs-2', rank: 2, title: 'King Of The Jungle (Extended Mix)', artist: 'Satirized & Manifest Destiny', label: 'Barbaric Records', url: 'https://www.hardstyle.com/tracks/satirized-and-manifest-destiny-king-of-the-jungle-extended-mix', preview: hardstylePreview },
                { id: 'hs-3', rank: 3, title: 'Koffiepauze', artist: 'Missy & Damaxy', label: 'Annihilation Records', url: 'https://www.hardstyle.com/tracks/missy-and-damaxy-koffiepauze', preview: hardstylePreview },
                { id: 'hs-4', rank: 4, title: 'Bang To The Bricks', artist: 'DMRC', label: 'Annihilation Records', url: 'https://www.hardstyle.com/tracks/dmrc-bang-to-the-bricks', preview: hardstylePreview },
                { id: 'hs-5', rank: 5, title: 'Max Ammo (Extended Mix)', artist: 'Roosterz & Kili', label: 'Snakepit Music', url: 'https://www.hardstyle.com/tracks/roosterz-and-kili-max-ammo-extended-mix', preview: hardstylePreview },
                { id: 'hs-6', rank: 6, title: 'Speaker Attack (Original Mix)', artist: 'Catscan', label: 'Masters of Hardcore', url: 'https://www.hardstyle.com/tracks/catscan-speaker-attack-original-mix', preview: hardstylePreview },
                { id: 'hs-7', rank: 7, title: 'The Hunt', artist: 'S-Kill', label: 'Partyraiser Recordings', url: 'https://www.hardstyle.com/tracks/s-kill-the-hunt', preview: hardstylePreview },
                { id: 'hs-8', rank: 8, title: 'Death By Gabber', artist: 'Neox', label: 'NeoX Music Records', url: 'https://www.hardstyle.com/tracks/neox-death-by-gabber', preview: hardstylePreview },
                { id: 'hs-9', rank: 9, title: 'Self-Destroyed', artist: 'Mad Dog', label: 'Masters of Hardcore', url: 'https://www.hardstyle.com/tracks/mad-dog-self-destroyed', preview: hardstylePreview },
                { id: 'hs-10', rank: 10, title: 'Sins', artist: 'Unproven', label: 'Barbaric Records', url: 'https://www.hardstyle.com/tracks/unproven-sins', preview: hardstylePreview },
            ];
        }
        if (platform === 'juno') {
            return [
                { id: 'jn-7425809-02', rank: 1, title: 'Bombaclart (Furniss remix)', artist: 'Furniss / Majistrate', label: 'Low Down Deep Recordings', url: 'https://www.junodownload.com/products/bombaclart-furniss-remix/7425809-02/?track_number=1', embedUrl: 'https://www.junodownload.com/player-embed/7425809-02.m3u/?autoplay=1' },
                { id: 'jn-7463901-02', rank: 2, title: 'Mandem', artist: 'Jhitzu', label: 'Sweet Tooth Recordings', url: 'https://www.junodownload.com/products/mandem-tied-up/7463901-02/?track_number=1', embedUrl: 'https://www.junodownload.com/player-embed/7463901-02.m3u/?autoplay=1' },
                { id: 'jn-7440888-02', rank: 3, title: 'Axiom', artist: 'Simula / Kasra', label: 'Critical Music', url: 'https://www.junodownload.com/products/axiom-intuition/7440888-02/?track_number=1', embedUrl: 'https://www.junodownload.com/player-embed/7440888-02.m3u/?autoplay=1' },
                { id: 'jn-7472783-02', rank: 4, title: 'Crocodiles', artist: 'Benny L', label: 'Audioporn', url: 'https://www.junodownload.com/products/crocodiles/7472783-02/?track_number=1', embedUrl: 'https://www.junodownload.com/player-embed/7472783-02.m3u/?autoplay=1' },
                { id: 'jn-7443508-02', rank: 5, title: 'Get Em Heartbroke (Audit remix)', artist: 'PA', label: 'Dub Damage Recordings UK', url: 'https://www.junodownload.com/products/get-em-heartbroke-audit-remix/7443508-02/?track_number=1', embedUrl: 'https://www.junodownload.com/player-embed/7443508-02.m3u/?autoplay=1' },
                { id: 'jn-7441844-02', rank: 6, title: 'Chase The Lights', artist: 'Kings Of The Rollers ft Marns', label: 'Souped Up', url: 'https://www.junodownload.com/products/chase-the-lights/7441844-02/?track_number=1', embedUrl: 'https://www.junodownload.com/player-embed/7441844-02.m3u/?autoplay=1' },
                { id: 'jn-7361340-02', rank: 7, title: 'Everyday Junglist (VIP DUB)', artist: 'Marvellous Cain & Bizzy B', label: 'RIQYARDROCK', url: 'https://www.junodownload.com/products/hard-shellerz-album/7361340-02/?track_number=6', embedUrl: 'https://www.junodownload.com/player-embed/7361340-02.m3u/?autoplay=1' },
                { id: 'jn-7479307-02', rank: 8, title: 'LEGENDARY (Sub Zero & Burntboi edit)', artist: 'Sigma, Dynamite MC', label: 'Day Ones', url: 'https://www.junodownload.com/products/day-one-explicit-edits/7479307-02/?track_number=10', embedUrl: 'https://www.junodownload.com/player-embed/7479307-02.m3u/?autoplay=1' },
                { id: 'jn-7415007-02', rank: 9, title: 'Ramp', artist: 'Counter Culture', label: 'Symmetry Recordings', url: 'https://www.junodownload.com/products/parallel-vol-1/7415007-02/?track_number=1', embedUrl: 'https://www.junodownload.com/player-embed/7415007-02.m3u/?autoplay=1' },
                { id: 'jn-7437401-02', rank: 10, title: 'Heli Dubz', artist: 'Clipz', label: 'Philly Blunt', url: 'https://www.junodownload.com/products/2hi-heli-dubz/7437401-02/?track_number=2', embedUrl: 'https://www.junodownload.com/player-embed/7437401-02.m3u/?autoplay=1' },
            ];
        }
        if (platform === '1001tracklists') {
            return [
                {
                    id: '1001-trending-1', rank: 1, title: 'ARMIN VAN BUUREN @ AREA ONE, ASOT FESTIVAL', artist: 'ARMIN VAN BUUREN', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/armin-van-buuren-area-one-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    embedUrl: 'https://www.youtube.com/embed/5m3O73_zR_0',
                    tracks: [
                        { title: 'Always You (ASOT 2026 Elevation Anthem)', artist: 'Armin van Buuren', time: '00:00' },
                        { title: 'Mouth Go LaLa', artist: 'Armin van Buuren & Maddix', time: '04:30' },
                        { title: 'Don\'t Be Afraid', artist: 'Moonman & Ferry Corsten & Joris Voorn', time: '08:15' },
                        { title: 'Destiny', artist: 'Layton Giordani ft. Camden Cox', time: '12:45' },
                        { title: 'Computers Take Over The World', artist: 'Armin van Buuren', time: '16:10' },
                        { title: 'High On Emotion', artist: 'Maddix', time: '19:45' },
                        { title: 'Dopamine Machine', artist: 'Armin van Buuren & Lilly Palmer', time: '23:20' },
                        { title: 'Exploration of Space (Remix)', artist: 'Cosmic Gate', time: '28:15' },
                        { title: 'Blah Blah Blah', artist: 'Armin van Buuren', time: '32:40' }
                    ]
                },
                {
                    id: '1001-trending-2', rank: 2, title: 'FRED AGAIN.. & THOMAS BANGALTER @ USB002', artist: 'FRED AGAIN.., THOMAS BANGALTER', label: 'ALEXANDRA PALACE', url: 'https://www.1001tracklists.com/tracklist/1ybr6v2k/fred-again-thomas-bangalter-usb002-alexandra-palace-london-united-kingdom-2026-02-27.html',
                    embedUrl: 'https://www.youtube.com/embed/YF0RmSy8FmY',
                    tracks: [
                        { title: 'Turn On The Lights again..', artist: 'Fred again..', time: '00:00' },
                        { title: 'Music Sounds Better With You', artist: 'Stardust', time: '05:12' },
                        { title: 'Adored (Thomas Bangalter Remix)', artist: 'Fred again..', time: '09:45' },
                        { title: 'Human After All', artist: 'Daft Punk (2026 Edit)', time: '14:30' },
                        { title: 'Rumble', artist: 'Skrillex, Fred again.. & Flowdan', time: '18:15' },
                        { title: 'Strong', artist: 'Fred again.. & Romy', time: '22:40' },
                        { title: 'Delilah (pull me out of this)', artist: 'Fred again..', time: '26:50' },
                        { title: 'Leavemealone', artist: 'Fred again.. & Baby Keem', time: '31:15' }
                    ]
                },
                {
                    id: '1001-trending-3', rank: 3, title: 'ARMIN VAN BUUREN & OLIVER HELDENS & MADDIX @ AREA ONE', artist: 'ARMIN VAN BUUREN, OLIVER HELDENS, MADDIX', label: 'ASOT FESTIVAL', url: 'https://www.1001tracklists.com/tracklist/1z6k8vj1/armin-van-buuren-oliver-heldens-maddix-area-one-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    embedUrl: 'https://www.youtube.com/embed/5m3O73_zR_0',
                    tracks: [
                        { title: 'High On Emotion', artist: 'Maddix', time: '00:00' },
                        { title: 'Bucovina', artist: 'Oliver Heldens', time: '04:20' },
                        { title: 'Dopamine Machine', artist: 'Armin van Buuren & Lilly Palmer', time: '08:40' },
                        { title: 'Transmission', artist: 'Maddix & Olly James & Hannah Laing', time: '13:10' },
                        { title: 'Mouth Go LaLa', artist: 'Armin van Buuren & Maddix', time: '17:45' },
                        { title: 'Universal Nation (ID Remix)', artist: 'Push', time: '22:30' },
                        { title: 'Silence (ID Remix)', artist: 'Delerium ft. Sarah McLachlan', time: '28:15' },
                        { title: 'Rescue Me (Technikal Remix)', artist: 'Sam & Deano & Ben Stevens', time: '34:00' },
                        { title: 'It\'s That Time', artist: 'Marlon Hoffstadt', time: '40:15' },
                        { title: 'Elevation Anthem', artist: 'Armin van Buuren', time: '45:30' }
                    ]
                },
                {
                    id: '1001-trending-4', rank: 4, title: 'ARMIN VAN BUUREN @ 25 YEARS CELEBRATION SET', artist: 'ARMIN VAN BUUREN', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/armin-van-buuren-25-years-celebration-set-area-one-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-27.html',
                    tracks: [
                        { title: 'Communication (Classic Mix)', artist: 'Armin van Buuren', time: '00:00' },
                        { title: 'Shivers', artist: 'Armin van Buuren', time: '06:15' },
                        { title: 'Great Spirit', artist: 'Armin van Buuren vs. Vini Vici', time: '12:30' }
                    ]
                },
                {
                    id: '1001-trending-5', rank: 5, title: 'MEDUZA & DREYA V - AETERNA RADIO 011', artist: 'MEDUZA', label: 'AETERNA', url: 'https://www.1001tracklists.com/tracklist/1l5u2v8k/meduza-dreya-v-aeterna-radio-011-2026-03-01.html',
                    embedUrl: 'https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=%2Fmeduzamusic%2Faeterna-radio-011%2F',
                    tracks: [
                        { title: 'Addicted To Bass (Dom Dolla Remix)', artist: 'Puretone', time: '00:00' },
                        { title: 'Never Alone', artist: 'Odd Mob ft. Lizzy Land', time: '05:45' }
                    ]
                },
                {
                    id: '1001-trending-6', rank: 6, title: 'TIËSTO - PRISMATIC 009', artist: 'TIËSTO', label: 'MUSICAL FREEDOM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/tiesto-prismatic-009-2026-02-28.html',
                    tracks: [
                        { title: 'Beautiful Places', artist: 'Tiësto & Brieanna Grace', time: '00:00' },
                        { title: 'BOOM', artist: 'Tiësto', time: '04:12' }
                    ]
                },
                {
                    id: '1001-trending-7', rank: 7, title: 'RICHARD DURAND @ AREA TWO, ASOT FESTIVAL', artist: 'RICHARD DURAND', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/richard-durand-area-two-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    tracks: [
                        { title: 'Always You (Richard Durand Remix)', artist: 'Armin van Buuren', time: '00:00' }
                    ]
                },
                {
                    id: '1001-trending-8', rank: 8, title: 'COSMIC GATE @ AREA TWO, ASOT FESTIVAL', artist: 'COSMIC GATE', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/cosmic-gate-area-two-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    tracks: [
                        { title: 'Exploration of Space (2026 Edit)', artist: 'Cosmic Gate', time: '00:00' }
                    ]
                },
                {
                    id: '1001-trending-9', rank: 9, title: 'NIFRA @ AREA ONE, ASOT FESTIVAL', artist: 'NIFRA', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/nifra-area-one-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    tracks: [
                        { title: 'Resistance', artist: 'Nifra', time: '00:00' }
                    ]
                },
                {
                    id: '1001-trending-10', rank: 10, title: 'ANDREW RAYEL PRES. EXTASIA @ AREA TWO, ASOT FESTIVAL', artist: 'ANDREW RAYEL', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/andrew-rayel-pres.-extasia-area-two-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    tracks: [
                        { title: 'Extasia (Official Anthem)', artist: 'Andrew Rayel', time: '00:00' }
                    ]
                }
            ];
        }

        return Array.from({ length: 10 }, (_, i) => ({
            id: `${platform}-${i}`,
            rank: i + 1,
            title: `Track #${i + 1}`,
            artist: `Producer ${i + 1}`,
            label: `Record Label`,
            url: '#',
            preview: samplePreview
        }));
    };

    const handleTrackClick = (track: Track) => {
        if (activeTab === '1001tracklists') {
            setSelectedTracklist({
                id: track.id,
                title: track.title,
                artist: track.artist || 'Various Artists',
                embedUrl: track.embedUrl,
                tracks: track.tracks || [
                    { title: 'Opening Track', artist: track.artist, time: '00:00' },
                    { title: 'Electronic Anthem', artist: 'Dropsiders Favorite', time: '10:15' }
                ]
            });
            setSelectedTrack(null);
        } else {
            if (selectedTrack?.id === track.id) {
                if (isPlaying) {
                    setIsPlaying(false);
                    if (!track.embedUrl) audioRef.current?.pause();
                } else {
                    setIsPlaying(true);
                    if (!track.embedUrl) audioRef.current?.play();
                }
            } else {
                setSelectedTrack(track);
                setIsPlaying(true);
            }
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 md:px-12 xl:px-16 2xl:px-24 bg-[#050505]">
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-12 relative"
            >
                <GlitchTransition trigger={activeTab} />

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-6">
                        <EqualizerLoader count={8} className="scale-75 opacity-50" />
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">
                        TRACKS <span className="text-neon-red">STUDIO</span>
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-xs md:text-sm font-black uppercase tracking-[0.3em]">
                        LES CHARTS LES PLUS INFLUENTS DE LA PLANÈTE
                    </p>
                </div>

                {/* Platform Selector */}
                <div className="flex flex-wrap justify-center gap-3">
                    {platforms.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setActiveTab(p.id)}
                            data-cursor-color={p.color}
                            className={`group relative flex items-center gap-3 px-8 py-5 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${activeTab === p.id
                                ? 'bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.2)]'
                                : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            {activeTab === p.id && (
                                <motion.div
                                    layoutId="music-tab-glow"
                                    className="absolute inset-0 opacity-20"
                                    style={{ backgroundColor: p.color }}
                                />
                            )}
                            <p.icon className={`w-5 h-5 relative z-10 ${activeTab === p.id ? 'animate-pulse' : ''}`} />
                            <span className="font-black text-[10px] uppercase tracking-widest relative z-10">{p.name}</span>
                        </button>
                    ))}
                </div>

                {/* Content List */}
                <div className="relative min-h-[600px]">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                            >
                                <EqualizerLoader count={12} />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-cyan animate-pulse">
                                    SYNCHRONISATION...
                                </span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid lg:grid-cols-1 gap-3"
                            >
                                {getMockData(activeTab).map((track, i) => (
                                    <motion.div
                                        key={track.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group flex flex-col gap-0 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                                    >
                                        <div
                                            className="flex flex-row items-center cursor-pointer group/track"
                                            onClick={() => handleTrackClick(track)}
                                        >
                                            <div className="flex items-center gap-6 p-6 flex-1">
                                                <div
                                                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-black transition-all duration-300 relative ${selectedTrack?.id === track.id
                                                        ? 'bg-neon-red text-white'
                                                        : 'bg-white/5 text-gray-500 group-hover/track:bg-neon-red/20 group-hover/track:text-neon-red'
                                                        }`}
                                                >
                                                    <span>{track.rank}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-black text-white uppercase italic tracking-tight truncate group-hover/track:text-neon-red transition-colors flex items-center gap-3">
                                                        {track.title}
                                                        {activeTab !== '1001tracklists' && (
                                                            <div className={`flex items-center gap-1 ${selectedTrack?.id === track.id ? 'visible' : 'invisible group-hover/track:visible'}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${selectedTrack?.id === track.id && isPlaying ? 'bg-neon-green ml-1 animate-pulse' : 'bg-neon-red'}`} />
                                                                <span className={`text-[9px] font-black tracking-[0.2em] ${selectedTrack?.id === track.id && isPlaying ? 'text-neon-green' : 'text-neon-red'}`}>
                                                                    {selectedTrack?.id === track.id && isPlaying ? 'PLAYING' : 'LISTEN'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">
                                                            {track.artist}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                            {track.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                <a
                                                    href={track.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-neon-red hover:border-neon-red hover:text-white transition-all group/btn"
                                                >
                                                    <ExternalLink className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                </a>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {selectedTrack?.id === track.id && activeTab !== '1001tracklists' && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-6 pb-6 overflow-hidden"
                                                >
                                                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-xl">
                                                        {track.embedUrl ? (
                                                            <iframe
                                                                key={track.id}
                                                                src={track.embedUrl}
                                                                className="w-full h-[162px] border-none overflow-hidden"
                                                                scrolling="no"
                                                                allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            />
                                                        ) : (
                                                            <div className="p-8 md:p-12 space-y-8 bg-gradient-to-br from-black/90 via-black/60 to-black/90 relative overflow-hidden group/premium-player">
                                                                {/* Animated background glow */}
                                                                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-red/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover/premium-player:bg-neon-red/20 transition-all duration-1000" />

                                                                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                                                                    {/* Play/Pause Main Control */}
                                                                    <div className="relative">
                                                                        <div className={`absolute inset-0 bg-neon-red/20 blur-2xl rounded-full transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
                                                                        <button
                                                                            onClick={() => {
                                                                                if (isPlaying) {
                                                                                    audioRef.current?.pause();
                                                                                    setIsPlaying(false);
                                                                                } else {
                                                                                    audioRef.current?.play();
                                                                                    setIsPlaying(true);
                                                                                }
                                                                            }}
                                                                            className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-neon-red hover:border-neon-red hover:scale-110 transition-all duration-500 group/play-btn shadow-[0_0_50px_rgba(0,0,0,0.5)] active:scale-95"
                                                                        >
                                                                            {isPlaying ? (
                                                                                <Pause className="w-10 h-10 text-white fill-white" />
                                                                            ) : (
                                                                                <Play className="w-10 h-10 text-white ml-1 fill-white" />
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    <div className="flex-1 w-full space-y-6">
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <span className="px-2 py-0.5 bg-neon-red/10 border border-neon-red/20 rounded text-[9px] font-black text-neon-red tracking-widest uppercase">Premium Player</span>
                                                                                <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase opacity-50">• High Quality Previews</span>
                                                                            </div>
                                                                            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-1 leading-none">{track.title}</h4>
                                                                            <p className="text-neon-cyan font-black text-xs uppercase tracking-[0.3em]">{track.artist}</p>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-neon-green animate-pulse' : 'bg-gray-600'}`} />
                                                                                    <span className="text-[9px] font-black text-gray-500 tracking-[0.2em] uppercase">
                                                                                        {isPlaying ? 'Streaming Live' : 'Paused'}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-[10px] font-black text-neon-red tracking-widest">HQ 320KBPS</span>
                                                                            </div>

                                                                            {/* Visualizer Mock */}
                                                                            <div className="h-12 flex items-end gap-1 px-2">
                                                                                {Array.from({ length: 40 }).map((_, i) => (
                                                                                    <motion.div
                                                                                        key={i}
                                                                                        className="flex-1 bg-gradient-to-t from-neon-red/40 to-neon-red rounded-t-sm"
                                                                                        animate={{
                                                                                            height: isPlaying ? [
                                                                                                Math.random() * 100 + "%",
                                                                                                Math.random() * 100 + "%",
                                                                                                Math.random() * 100 + "%"
                                                                                            ] : "10%"
                                                                                        }}
                                                                                        transition={{
                                                                                            duration: 0.5,
                                                                                            repeat: Infinity,
                                                                                            delay: i * 0.02,
                                                                                            ease: "easeInOut"
                                                                                        }}
                                                                                    />
                                                                                ))}
                                                                            </div>

                                                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                                                <motion.div
                                                                                    className="h-full bg-gradient-to-r from-neon-red to-neon-cyan shadow-[0_0_15px_rgba(255,18,65,0.6)]"
                                                                                    initial={{ width: "0%" }}
                                                                                    animate={{ width: isPlaying ? "100%" : "0%" }}
                                                                                    transition={{ duration: 30, ease: "linear" }}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-4 pt-2">
                                                                            <a
                                                                                href={track.url}
                                                                                target="_blank"
                                                                                className="px-8 py-3.5 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-neon-red hover:text-white transition-all duration-300 shadow-xl flex items-center gap-3 active:scale-95"
                                                                            >
                                                                                Buy Full Track <ExternalLink className="w-3.5 h-3.5" />
                                                                            </a>
                                                                            <button className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                                                                <Heart className="w-4 h-4 text-white" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Tracking Footer */}
                <div className="pt-12 border-t border-white/5 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6">
                        {platforms.map(p => (
                            <div key={p.id} className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-30 hover:opacity-100">
                                <p.icon className="w-4 h-4" />
                                <span className="text-[8px] font-black uppercase tracking-widest">{p.id}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">
                        DATA UPDATE EVERY 24H • DROPSIDERS NETWORK 2026
                    </p>
                </div>
            </motion.div>



            {/* Tracklist Stylish Pop-up */}
            <AnimatePresence>
                {selectedTracklist && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTracklist(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,1)]"
                        >
                            {/* Header Image/Background */}
                            <div className="h-48 bg-gradient-to-br from-neon-red/20 to-neon-cyan/20 relative p-12 flex flex-col justify-end">
                                <button
                                    onClick={() => setSelectedTracklist(null)}
                                    className="absolute top-8 right-8 p-3 bg-black/40 hover:bg-black/60 rounded-full transition-colors text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-neon-red rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg">
                                            Tracklist
                                        </div>
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Verified Source</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black italic text-white uppercase italic tracking-tighter leading-none">
                                        {selectedTracklist.title}
                                    </h2>
                                </div>
                            </div>

                            {/* Tracks Area */}
                            <div className="p-8 md:p-12 h-[450px] overflow-y-auto custom-scrollbar">
                                {selectedTracklist.embedUrl && (
                                    <div className="mb-8 rounded-3xl overflow-hidden border border-white/10 bg-black">
                                        <iframe width="100%" height="120" src={selectedTracklist.embedUrl} frameBorder="0"></iframe>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {selectedTracklist.tracks.map((t, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + idx * 0.05 }}
                                            className="flex items-center gap-6 group/item"
                                        >
                                            <span className="text-xs font-black text-white/10 w-8">{idx + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-sm font-black text-white uppercase tracking-wider group-hover/item:text-neon-cyan transition-colors">
                                                    {t.title}
                                                </h5>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                    {t.artist}
                                                </p>
                                            </div>
                                            {t.time && <span className="text-[10px] font-bold text-white/20 whitespace-nowrap">{t.time}</span>}
                                            <button className="p-2 text-white/5 group-hover/item:text-white transition-colors">
                                                <Play className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase transition-all">
                                        <Heart className="w-3 h-3" /> Like
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase transition-all">
                                        <Share2 className="w-3 h-3" /> Share
                                    </button>
                                </div>
                                <a
                                    href="https://www.1001tracklists.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-neon-red text-[10px] font-black uppercase tracking-widest hover:underline"
                                >
                                    Full Set Info <ChevronRight className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Musique;

