import { motion } from 'framer-motion';
import { MessageSquare, Play, Plus, Clock, User, Music, Youtube, Share2 } from 'lucide-react';

const MOCK_REQUESTS = [
    { id: '1', author: 'LUCAS_TML', date: '2h', preview: 'https://i1.sndcdn.com/artworks-mXzR1Nf8x8z2-0-t500x500.jpg', title: 'DROP INCROYABLE @ TOMORROWLAND W1', desc: 'Joué par Anyma, drop très mélodique avec une voix féminine.', solved: false, replies: 3 },
    { id: '2', author: 'TECHNO_LOVER', date: '5h', preview: 'https://i1.sndcdn.com/artworks-9WzR1Nf8x8z2-0-t500x500.jpg', title: 'ID ? @ AMNESIA IBIZA', desc: 'Un morceau techno très sombre qui ressemble à du Charlotte de Witte.', solved: true, result: 'KNTXT - OVERDRIVE', replies: 12 }
];

export function TrackIdForum() {
    return (
        <div className="space-y-12">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter">Track ID Request</h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">C'est quoi ce son ? La communauté t'aide à trouver</p>
                </div>
                <button className="px-6 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-neon-red hover:text-white transition-all">
                    <Plus className="w-4 h-4" /> DEMANDER UN ID
                </button>
            </div>

            <div className="space-y-4">
                {MOCK_REQUESTS.map((req, idx) => (
                    <motion.div
                        key={req.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 group hover:bg-white/[0.08] transition-all relative overflow-hidden"
                    >
                        {req.solved && (
                            <div className="absolute top-0 right-0 px-6 py-2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                                TROUVÉ !
                            </div>
                        )}

                        <div className="w-full md:w-32 aspect-square rounded-2xl overflow-hidden border border-white/10 shrink-0 relative group/preview">
                            <img src={req.preview} className="w-full h-full object-cover group-hover/preview:scale-110 transition-transform duration-700" alt="" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity">
                                <Play className="w-8 h-8 text-white fill-current" />
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-3 h-3" /> {req.author}
                                </span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> {req.date} AGO
                                </span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" /> {req.replies} RÉPONSES
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xl font-display font-black text-white italic uppercase tracking-tight group-hover:text-neon-red transition-colors">{req.title}</h3>
                                <p className="text-gray-400 text-xs leading-relaxed mt-2">{req.desc}</p>
                            </div>

                            {req.solved && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-500 text-black rounded-xl flex items-center justify-center">
                                            <Music className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-black text-emerald-500 uppercase">Track Identifiée</div>
                                            <div className="text-[10px] font-black text-white uppercase">{req.result}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all"><Youtube className="w-4 h-4 text-white" /></button>
                                        <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-white"><Share2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center">
                            <button className="w-full md:w-auto px-8 py-3 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                                {req.solved ? 'VOIR LE TOPIC' : 'AIDER À TROUVER'}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
