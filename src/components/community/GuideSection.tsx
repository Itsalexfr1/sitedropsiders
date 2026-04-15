import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, CheckCircle2, Send, Info, User, Search, Zap, Music2, Cpu, Headphones, Settings, Layout, Layers, Radio, Sliders, Play, Disc, Activity, Volume2, Eye, Sparkles } from 'lucide-react';

import { WikiDropsiders } from './WikiDropsiders';
import { WikiVenues } from './WikiVenues';

interface Review {
    id: string;
    festival: string;
    ratings: {
        organization: number;
        sound: number;
        food: number;
    };
    comment: string;
    tips: string;
    author: string;
    timestamp: string;
}

export function GuideSection() {
    const [activeTab, setActiveTab] = useState<'reviews' | 'submit' | 'encyclopedia' | 'wiki' | 'clubs' | 'festivals'>('reviews');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        festival: '',
        ratings: {
            organization: 5,
            sound: 5,
            food: 5
        },
        comment: '',
        tips: '',
        author: ''
    });

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/avis/active');
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (e) {
            console.error('Error fetching reviews:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('loading');
        try {
            const res = await fetch('/api/avis/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setSubmitStatus('success');
                setFormData({
                    festival: '',
                    ratings: { organization: 5, sound: 5, food: 5 },
                    comment: '',
                    tips: '',
                    author: ''
                });
                setTimeout(() => setSubmitStatus('idle'), 3000);
            } else {
                setSubmitStatus('error');
            }
        } catch (e) {
            setSubmitStatus('error');
        }
    };

    const encyclopedia = [
        {
            letter: 'A', terms: [
                { name: 'Acid', description: 'Genre caractérisé par le son "liquide" de la Roland TB-303.', image: '/images/encyclopedia/acid.png', icon: <Zap className="w-5 h-5" /> },
                { name: 'After', description: 'Fête qui se prolonge après la fermeture des clubs.', icon: <Sparkles className="w-5 h-5" /> },
                { name: 'Ambient', description: 'Musique atmosphérique centrée sur les textures sonores.', icon: <Layers className="w-5 h-5" /> },
                { name: 'Analogique', description: 'Machines utilisant des circuits électriques réels (oppose au numérique).', icon: <Cpu className="w-5 h-5" /> },
                { name: 'Anthem', description: 'Le morceau emblématique d\'un festival que tout le monde chante.', icon: <Music2 className="w-5 h-5" /> },
                { name: 'Arpégiateur', description: 'Outil jouant les notes d\'un accord de manière séquentielle.', icon: <Activity className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'B', terms: [
                { name: 'B2B (Back-to-Back)', description: 'Deux DJs mixant ensemble sur le même setup.', icon: <User className="w-5 h-5" /> },
                { name: 'Backstage', description: 'Coulisses réservées aux artistes et au staff.', icon: <Settings className="w-5 h-5" /> },
                { name: 'Bassline', description: 'La ligne de basse qui donne le groove au morceau.', icon: <Radio className="w-5 h-5" /> },
                { name: 'BPM', description: 'Battements Par Minute. Mesure de la vitesse de la musique.', icon: <Activity className="w-5 h-5" /> },
                { name: 'Break', description: 'Moment où le rythme s\'arrête pour créer une tension.', icon: <Zap className="w-5 h-5" /> },
                { name: 'Build-up', description: 'La montée en pression juste avant le drop.', icon: <Zap className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'C', terms: [
                { name: 'Cashless', description: 'Système de paiement sans contact via puce.', icon: <Zap className="w-5 h-5" /> },
                { name: 'Chill-out', description: 'Espace de repos avec musique calme en festival.', icon: <Info className="w-5 h-5" /> },
                { name: 'Combo XLR/Jack', description: 'Prise hybride acceptant les deux formats de câbles.', icon: <Settings className="w-5 h-5" /> },
                { name: 'Compressor', description: 'Outil réduisant l\'écart entre les sons forts et faibles.', icon: <Sliders className="w-5 h-5" /> },
                { name: 'Controller', description: 'Matériel MIDI pilotant un logiciel de mixage.', icon: <Layout className="w-5 h-5" /> },
                { name: 'Crossfader', description: 'Curseur horizontal pour passer d\'une piste à l\'autre.', icon: <Sliders className="w-5 h-5" /> },
                { name: 'Cue', description: 'Point de repère fixé par le DJ pour lancer un morceau.', icon: <Play className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'D', terms: [
                { name: 'DAW (MAO)', description: 'Logiciel de création musicale (ex: Ableton, FL Studio).', icon: <Cpu className="w-5 h-5" /> },
                { name: 'Delay', description: 'Effet d\'écho qui répète le signal sonore.', icon: <Layers className="w-5 h-5" /> },
                { name: 'Digging', description: 'L\'art de chiner des morceaux rares ou exclusifs.', icon: <Disc className="w-5 h-5" /> },
                { name: 'DMX', description: 'Protocole universel pour piloter les jeux de lumière.', icon: <Zap className="w-5 h-5" /> },
                { name: 'Drop', description: 'Le climax où le rythme et la basse reviennent en force.', image: '/images/encyclopedia/festival.png', icon: <Zap className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'E', terms: [
                { name: 'Early Bird', description: 'Billets à tarif réduit vendus très tôt.', icon: <Send className="w-5 h-5" /> },
                { name: 'EDM', description: 'Courant commercial de l\'électro (Electronic Dance Music).', icon: <Music2 className="w-5 h-5" /> },
                { name: 'EQ (Égaliseur)', description: 'Réglage des fréquences (Basses, Médiums, Aigus).', icon: <Sliders className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'F', terms: [
                { name: 'Fader', description: 'Curseur vertical servant à régler le volume.', icon: <Sliders className="w-5 h-5" /> },
                { name: 'Filter (Filtre)', description: 'Outil pour couper les fréquences (Low Pass / High Pass).', icon: <Settings className="w-5 h-5" /> },
                { name: 'Flanger', description: 'Effet de modulation créant un son tourbillonnant.', icon: <Layers className="w-5 h-5" /> },
                { name: 'FOH (Front of House)', description: 'Régie technique située face à la scène.', icon: <Layout className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'G', terms: [
                { name: 'Gain (Trim)', description: 'Réglage du volume d\'entrée du signal.', icon: <Sliders className="w-5 h-5" /> },
                { name: 'Ghost Producer', description: 'Producteur de l\'ombre composant pour un autre.', icon: <User className="w-5 h-5" /> },
                { name: 'Glitch', description: 'Esthétique basée sur des bruits d\'erreurs numériques.', icon: <Cpu className="w-5 h-5" /> },
                { name: 'Green Room', description: 'Salon privé pour les artistes en festival.', icon: <User className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'H', terms: [
                { name: 'Hardstyle', description: 'Genre rapide (150 BPM+) aux kicks saturés.', icon: <Zap className="w-5 h-5" /> },
                { name: 'Headliner', description: 'La tête d\'affiche d\'un événement.', icon: <User className="w-5 h-5" /> },
                { name: 'Hi-Hats', description: 'Cymbales charleston qui marquent le contre-temps.', icon: <Settings className="w-5 h-5" /> },
                { name: 'House', description: 'Genre pilier 4/4 né à Chicago (Warehouse).', icon: <Music2 className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'I', terms: [
                { name: 'ID', description: 'Morceau non identifié ou gardé secret par le DJ.', icon: <Info className="w-5 h-5" /> },
                { name: 'In-Ear Monitors (IEM)', description: 'Écouteurs de retour précis pour les artistes.', icon: <Headphones className="w-5 h-5" /> },
                { name: 'Infrabasses (Sub)', description: 'Fréquences très graves ressenties physiquement.', icon: <Volume2 className="w-5 h-5" /> },
                { name: 'Interface Audio', description: 'Carte son externe pour la production.', icon: <Cpu className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'J', terms: [
                { name: 'Jack', description: 'Connecteur standard (6,35mm pour instruments / 3,5mm casque).', icon: <Settings className="w-5 h-5" /> },
                { name: 'Jog Wheel', description: 'Plateau de platine DJ simulant le toucher vinyle.', icon: <Disc className="w-5 h-5" /> },
                { name: 'Jungle', description: 'Style rapide basé sur des cassures de batterie (breaks).', icon: <Music2 className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'K', terms: [
                { name: 'Kick', description: 'Le coup de grosse caisse, le cœur du rythme.', icon: <Zap className="w-5 h-5" /> },
                { name: 'Kits', description: 'Ensembles de sons de percussions pour produire.', icon: <Layers className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'L', terms: [
                { name: 'Latence', description: 'Délai entre une action et la sortie du son.', icon: <Activity className="w-5 h-5" /> },
                { name: 'LFO', description: 'Oscillateur lent modulant un paramètre sonore.', icon: <Activity className="w-5 h-5" /> },
                { name: 'Line-up', description: 'Liste des artistes programmés à une soirée.', icon: <User className="w-5 h-5" /> },
                { name: 'Live Act', description: 'Performance utilisant des machines en direct.', icon: <Cpu className="w-5 h-5" /> },
                { name: 'Loop', description: 'Boucle sonore répétée à l\'infini.', icon: <Play className="w-5 h-5" /> },
                { name: 'Lyre', description: 'Projecteur robotisé motorisé.', icon: <Zap className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'M', terms: [
                { name: 'Mainstage', description: 'La scène principale d\'un festival.', icon: <Layout className="w-5 h-5" /> },
                { name: 'Mashup', description: 'Mélange sauvage de deux morceaux différents.', icon: <Music2 className="w-5 h-5" /> },
                { name: 'Mastering', description: 'Étape finale pour optimiser le volume et le rendu sonore.', icon: <Sliders className="w-5 h-5" /> },
                { name: 'MIDI', description: 'Langage de communication entre instruments numériques.', icon: <Cpu className="w-5 h-5" /> },
                { name: 'Monitoring', description: 'Enceintes de haute précision pour le studio.', icon: <Volume2 className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'N', terms: [
                { name: 'Noise', description: 'Bruit blanc utilisé pour les montées ou effets.', icon: <Zap className="w-5 h-5" /> },
                { name: 'Nu-Disco', description: 'Version moderne et électronique du Disco.', icon: <Music2 className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'O', terms: [
                { name: 'Open Air', description: 'Événement ou scène en extérieur.', icon: <Layout className="w-5 h-5" /> },
                { name: 'Oscillator', description: 'Source sonore de base d\'un synthétiseur.', icon: <Cpu className="w-5 h-5" /> },
                { name: 'Overdrive', description: 'Saturation pour donner du grain au son.', icon: <Zap className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'P', terms: [
                { name: 'PA System', description: 'Le système de sonorisation de forte puissance.', icon: <Volume2 className="w-5 h-5" /> },
                { name: 'Pad', description: 'Touche sensible ou son de nappe atmosphérique.', icon: <Layers className="w-5 h-5" /> },
                { name: 'Phantom Power (48V)', description: 'Alimentation électrique pour micros via XLR.', icon: <Settings className="w-5 h-5" /> },
                { name: 'Phasing', description: 'Effet de balayage par déphasage d\'ondes.', icon: <Layers className="w-5 h-5" /> },
                { name: 'Pitch', description: 'Réglage de la vitesse et de la tonalité.', icon: <Sliders className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'Q', terms: [
                { name: 'Quantize', description: 'Recalage automatique des notes sur le rythme.', icon: <Settings className="w-5 h-5" /> },
                { name: 'Queuing', description: 'Action de préparer le morceau suivant au casque.', icon: <Headphones className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'R', terms: [
                { name: 'RCA (Cinch)', description: 'Prises rouges/blanches standard (platines, hi-fi).', icon: <Settings className="w-5 h-5" /> },
                { name: 'Release', description: 'Temps d\'extinction d\'un son.', icon: <Activity className="w-5 h-5" /> },
                { name: 'Remix', description: 'Réinterprétation d\'un titre par un autre artiste.', icon: <Music2 className="w-5 h-5" /> },
                { name: 'Reverb', description: 'Effet simulant l\'acoustique d\'une pièce.', icon: <Layers className="w-5 h-5" /> },
                { name: 'RFID', description: 'Puce intégrée aux bracelets pour l\'accès et le paiement.', icon: <Zap className="w-5 h-5" /> },
                { name: 'Rider', description: 'Liste des exigences techniques et logistiques d\'un artiste.', icon: <Layout className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'S', terms: [
                { name: 'Sample', description: 'Échantillon sonore récupéré d\'un autre média.', icon: <Disc className="w-5 h-5" /> },
                { name: 'Sidechain', description: 'Effet de "pompage" du volume déclenché par le kick.', icon: <Activity className="w-5 h-5" /> },
                { name: 'Speakon', description: 'Connecteur pro verrouillable pour enceintes passives.', icon: <Settings className="w-5 h-5" /> },
                { name: 'Stroboscope', description: 'Flashs lumineux rapides.', icon: <Zap className="w-5 h-5" /> },
                { name: 'Sync', description: 'Fonction alignant les tempos automatiquement.', icon: <Activity className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'T', terms: [
                { name: 'Techno', description: 'Style répétitif et industriel né à Détroit.', icon: <Music2 className="w-5 h-5" /> },
                { name: 'Timetable', description: 'Planning horaire de passage des artistes.', icon: <Info className="w-5 h-5" /> },
                { name: 'Trance', description: 'Style mélodique, planant et hypnotique.', icon: <Music2 className="w-5 h-5" /> },
                { name: 'Turntablism', description: 'Art de manipuler les vinyles (scratch).', icon: <Disc className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'U', terms: [
                { name: 'Underground', description: 'Scène alternative loin des circuits commerciaux.', icon: <Info className="w-5 h-5" /> },
                { name: 'Up-tempo', description: 'Morceau dont la vitesse est supérieure à la moyenne.', icon: <Zap className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'V', terms: [
                { name: 'VCO / VCF', description: 'Oscillateur et Filtre analogiques.', icon: <Cpu className="w-5 h-5" /> },
                { name: 'Vibe', description: 'L\'énergie ou l\'ambiance d\'un lieu.', icon: <Zap className="w-5 h-5" /> },
                { name: 'Vinyl', description: 'Support disque analogique traditionnel.', image: '/images/encyclopedia/vinyl.png', icon: <Disc className="w-5 h-5" /> },
                { name: 'Visuals (Vjing)', description: 'Art vidéo diffusé sur les écrans géants.', icon: <Eye className="w-5 h-5" /> },
                { name: 'VST', description: 'Instrument ou effet virtuel logiciel.', icon: <Cpu className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'W', terms: [
                { name: 'Warm-up', description: 'Set de début de soirée pour chauffer le public.', icon: <Settings className="w-5 h-5" /> },
                { name: 'White Label', description: 'Vinyle sans étiquette (test ou exclusivité).', icon: <Disc className="w-5 h-5" /> },
                { name: 'Wobble', description: 'Variation cyclique de la basse (caractéristique Dubstep).', icon: <Activity className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'X', terms: [
                { name: 'XLR', description: 'Prise pro symétrique (anti-parasites).', icon: <Settings className="w-5 h-5" /> },
                { name: 'X-fader', description: 'Abréviation de Crossfader.', icon: <Sliders className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'Y', terms: [
                { name: 'Y-Cable', description: 'Câble de dédoublement de signal.', icon: <Settings className="w-5 h-5" /> }
            ]
        },
        {
            letter: 'Z', terms: [
                { name: 'Zero Crossing', description: 'Point idéal de coupe d\'un échantillon sans parasite.', icon: <Activity className="w-5 h-5" /> },
                { name: 'Zone', description: 'État de concentration maximale du DJ ou du public.', icon: <Sparkles className="w-5 h-5" /> }
            ]
        }
    ];

    const filteredEncyclopedia = encyclopedia.map(cat => ({
        ...cat,
        terms: cat.terms.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(cat => cat.terms.length > 0);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-center gap-4 flex-wrap">
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 ${activeTab === 'reviews' ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    CONSEILS FESTIVALS
                </button>
                <button
                    onClick={() => setActiveTab('encyclopedia')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 ${activeTab === 'encyclopedia' ? 'bg-[#FF0000] text-white shadow-lg shadow-red-500/10' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    ENCYCLOPÉDIE (A-Z)
                </button>
                <button
                    onClick={() => setActiveTab('wiki')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 ${activeTab === 'wiki' ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    DJS
                </button>
                <button
                    onClick={() => setActiveTab('clubs')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 ${activeTab === 'clubs' ? 'bg-neon-red text-white shadow-lg shadow-red-500/10' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    🏛️ CLUBS
                </button>
                <button
                    onClick={() => setActiveTab('festivals')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 ${activeTab === 'festivals' ? 'bg-neon-red text-white shadow-lg shadow-red-500/10' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    🎪 FESTIVALS
                </button>
                <button
                    onClick={() => setActiveTab('submit')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 ${activeTab === 'submit' ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                >
                    PARTAGER UN CONSEIL
                </button>
            </div>

            {activeTab === 'reviews' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {reviews.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">Aucun avis pour le moment.</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-neon-red/50 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-neon-red transition-colors">
                                            {review.festival}
                                        </h3>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <User className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{review.author}</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-bold uppercase">
                                        {new Date(review.timestamp).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {review.tips && (
                                        <div className="p-6 bg-neon-cyan/5 border border-neon-cyan/10 rounded-2xl relative group-hover:bg-neon-cyan/10 transition-colors">
                                            <div className="absolute -top-3 left-4 px-3 py-1 bg-neon-cyan text-black text-[9px] font-black uppercase tracking-widest rounded-full">
                                                TIP DU FESTIVALIER
                                            </div>
                                            <p className="text-white font-medium leading-relaxed italic">
                                                "{review.tips}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2 group/author">
                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover/author:border-neon-red/50 transition-colors">
                                            <User className="w-3 h-3 text-gray-400 group-hover/author:text-white" />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{review.author}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-all">
                                        {review.comment && <MessageSquare className="w-3.5 h-3.5 text-gray-400" />}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            ) : activeTab === 'encyclopedia' ? (
                <div className="space-y-12">
                    <div className="max-w-2xl mx-auto relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-neon-red transition-colors" />
                        <input
                            type="text"
                            placeholder="RECHERCHER UN TERME (EX: DROP, ACID, HOUSE...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-full py-5 pl-16 pr-8 text-white font-bold uppercase placeholder-white/20 focus:outline-none focus:border-neon-red focus:bg-white/5 transition-all shadow-2xl"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                        {filteredEncyclopedia.map((cat) => (
                            <div key={cat.letter} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-4xl font-display font-black text-neon-red/20 italic">{cat.letter}</h2>
                                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {cat.terms.map((term) => (
                                        <motion.div
                                            key={term.name}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-white/10 transition-all group overflow-hidden relative"
                                        >
                                            <div className="flex items-start gap-4 relative z-10">
                                                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 group-hover:text-neon-red transition-colors">
                                                    {term.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 group-hover:text-neon-red transition-colors">{term.name}</h3>
                                                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-tighter group-hover:text-gray-300 transition-colors">
                                                        {term.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {term.image && (
                                                <div className="mt-4 rounded-xl overflow-hidden border border-white/5 bg-black/40 h-32 relative">
                                                    <img
                                                        src={term.image}
                                                        alt={term.name}
                                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-40"></div>
                                                </div>
                                            )}

                                            <div className="absolute -right-2 -bottom-2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                                {term.icon && <div className="scale-[3]">{term.icon}</div>}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : activeTab === 'wiki' ? (
                <div className="w-full">
                    <WikiDropsiders />
                </div>
            ) : activeTab === 'clubs' ? (
                <div className="w-full">
                    <WikiVenues initialMode="clubs" />
                </div>
            ) : activeTab === 'festivals' ? (
                <div className="w-full">
                    <WikiVenues initialMode="festivals" />
                </div>
            ) : (
                <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8">
                    <h2 className="text-2xl font-black text-white italic uppercase mb-6 flex items-center gap-3">
                        <Plus className="w-6 h-6 text-neon-red" />
                        Ajouter un retour festivalier
                    </h2>

                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Festival</label>
                            <input
                                type="text"
                                required
                                value={formData.festival}
                                onChange={e => setFormData({ ...formData, festival: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                placeholder="Nom du festival"
                            />
                        </div>

                        <div className="p-6 bg-neon-cyan/5 border border-neon-cyan/10 rounded-2xl flex items-center gap-4">
                            <Info className="w-8 h-8 text-neon-cyan" />
                            <div>
                                <p className="text-[11px] font-black text-white uppercase italic tracking-widest">Guide du festivalier</p>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Partagez vos astuces sur le logement, le transport, la nourriture ou le matos à emporter !</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Contexte (Optionnel)</label>
                            <input
                                type="text"
                                value={formData.comment}
                                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                placeholder="Ex: Pour le camping, Près de la mainstage..."
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-neon-cyan uppercase mb-2 flex items-center gap-2">
                                <Info className="w-3 h-3" /> Vos conseils (Où dormir, quoi ramener...)
                            </label>
                            <textarea
                                value={formData.tips}
                                onChange={e => setFormData({ ...formData, tips: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-neon-cyan transition-all h-24 resize-none"
                                placeholder="Avez-vous des tips pour les autres festivaliers ?"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Votre Pseudo</label>
                            <input
                                type="text"
                                required
                                value={formData.author}
                                onChange={e => setFormData({ ...formData, author: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-red transition-all"
                                placeholder="Alex"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitStatus === 'loading'}
                            className="w-full py-4 bg-neon-red text-white font-black rounded-xl hover:shadow-[0_0_30px_rgba(255,17,17,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {submitStatus === 'loading' ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : submitStatus === 'success' ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    AVIS ENVOYÉ !
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    PARTAGER MON EXPÉRIENCE
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
