import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Music, Zap, Star, Headphones } from 'lucide-react';

export function DjNameGenerator() {
    const [name, setName] = useState('');
    const [style, setStyle] = useState('TECHNO');
    const [generatedName, setGeneratedName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const prefixes = {
        TECHNO: ['KOLOSS', 'XENON', 'ZERO', 'VOID', 'CYBER', 'DARK', 'NEON', 'SIGNAL', 'PULSE', 'CORE'],
        HOUSE: ['GROOVE', 'SOUL', 'FUNK', 'DISCO', 'FLOW', 'VIBE', 'MINT', 'CLUB', 'VELVET', 'SILK'],
        HARD: ['STORM', 'BLAST', 'DRUM', 'RAVE', 'HARD', 'TITAN', 'ACID', 'BRUTAL', 'SONIC', 'FORCE'],
        CHILL: ['LUNA', 'ZEN', 'CALM', 'ECHO', 'MIST', 'DREAM', 'AURA', 'SOFT', 'CLOUDY', 'WAVE']
    };

    const suffixes = {
        TECHNO: ['MODUL', 'SYSTEM', 'CODE', 'NODE', 'PATH', 'MATRIX', 'DRIVER', 'WAVE', 'LOGIC', 'UNIT'],
        HOUSE: ['MASTERS', 'SELECTA', 'PROJECT', 'SOUND', 'STYLE', 'BEAT', 'GROOVE', 'PARTY', 'LEVEL', 'BUMP'],
        HARD: ['KICK', 'BOOM', 'PUNCH', 'SHOCK', 'REBEL', 'CORE', 'DAZE', 'FURY', 'LIMIT', 'NOISE'],
        CHILL: ['SPACE', 'SOUL', 'MOON', 'SPIRIT', 'WIND', 'BLUE', 'DEEP', 'LIGHT', 'BREEZE', 'TIDE']
    };

    const generateName = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const pref = prefixes[style as keyof typeof prefixes];
            const suff = suffixes[style as keyof typeof suffixes];

            const randomPref = pref[Math.floor(Math.random() * pref.length)];
            const randomSuff = suff[Math.floor(Math.random() * suff.length)];

            // Different patterns
            const patterns = [
                `${randomPref} ${name.toUpperCase()}`,
                `${name.toUpperCase()} ${randomSuff}`,
                `${randomPref}${randomSuff}`,
                `DJ ${name.toUpperCase()}`,
                `${randomPref} ${randomSuff}`,
                `${name.toUpperCase()} ${randomSuff}`.split('').reverse().join('').slice(0, 5).toUpperCase() // Abstract
            ];

            // If name is short, append it
            let final = patterns[Math.floor(Math.random() * patterns.length)];
            if (name && patterns.indexOf(final) > 3) final = `${randomPref} ${name.toUpperCase()}`;

            setGeneratedName(final);
            setIsGenerating(false);
        }, 800);
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Music className="w-32 h-32 text-white rotate-12" />
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                <div>
                    <h3 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-neon-cyan" />
                        Générateur de Nom DJ
                    </h3>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Trouve ton identité pour ton prochain set</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                    <Headphones className="w-4 h-4 text-white/40" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Digital Persona v1.0</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Ton Prénom / Surnom</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="EX: ALEX..."
                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-black uppercase tracking-widest focus:outline-none focus:border-neon-cyan transition-all"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Style Musical</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['TECHNO', 'HOUSE', 'HARD', 'CHILL'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStyle(s)}
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${style === s ? 'bg-neon-cyan text-black border-neon-cyan shadow-lg shadow-neon-cyan/20' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={generateName}
                        disabled={isGenerating}
                        className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-neon-cyan hover:text-white transition-all shadow-xl flex items-center justify-center gap-4 relative overflow-hidden group"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            {isGenerating ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Zap className="w-4 h-4 fill-current" />
                            )}
                            GÉNÉRER MON NOM
                        </span>
                        <div className="absolute inset-0 bg-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <AnimatePresence mode="wait">
                        {generatedName ? (
                            <motion.div
                                key={generatedName}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                className="relative z-10 w-full"
                            >
                                <div className="bg-black/60 border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl backdrop-blur-xl group/card overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-neon-cyan animate-pulse shadow-[0_0_20px_#00E5FF]" />

                                    <Star className="w-8 h-8 text-neon-cyan/40 mx-auto mb-6 animate-spin-slow" />
                                    <h4 className="text-4xl md:text-5xl font-display font-black text-white italic uppercase tracking-tighter mb-4 leading-tight">
                                        {generatedName}
                                    </h4>

                                    <div className="flex items-center justify-center gap-4 mt-6">
                                        <div className="h-[1px] w-8 bg-white/20" />
                                        <span className="text-[8px] font-black text-neon-cyan uppercase tracking-[0.5em] animate-pulse">
                                            {style} ARTIST
                                        </span>
                                        <div className="h-[1px] w-8 bg-white/20" />
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="text-center space-y-4 opacity-20">
                                <Headphones className="w-16 h-16 text-white mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">En attente d'entrée...</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-4 justify-center md:justify-start">
                {['#NewIdentity', '#DJGenerator', '#Dropsiders', '#TechnoLife'].map(tag => (
                    <span key={tag} className="text-[8px] font-black text-white/20 uppercase tracking-widest">{tag}</span>
                ))}
            </div>
        </div>
    );
}
