import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, MapPin, Plus, Clock, Users, Star, Filter } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const MOCK_EVENTS = [
    { id: '1', title: 'SECRET RAVE - WAREHOUSE', date: 'SAM 15 MAR', time: '23:00 - 07:00', location: 'LYON - SECRET', genre: 'Industrial Techno', price: '15€', community: true },
    { id: '2', title: 'OPEN AIR - PARC DES BOIS', date: 'DIM 16 MAR', time: '14:00 - 22:00', location: 'NANTES', genre: 'House / Tech House', price: 'GRATUIT', community: true }
];

export function CollaborativeCalendar() {
    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <h2 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter">Agenda Communautaire</h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Signale une soirée locale non répertoriée</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                        <Filter className="w-4 h-4" /> FILTRER
                    </button>
                    <button className="flex-1 md:flex-none px-6 py-4 bg-neon-cyan text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all shadow-[0_10px_30px_rgba(0,229,255,0.2)]">
                        <Plus className="w-4 h-4" /> AJOUTER UN EVENT
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MOCK_EVENTS.map((event, idx) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 group hover:bg-white/[0.08] transition-all relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                            <CalendarIcon className="w-32 h-32 text-white" />
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col">
                                <span className="text-neon-cyan text-[10px] font-black uppercase tracking-[0.2em] mb-1">{event.date}</span>
                                <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">{event.time}</span>
                            </div>
                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-white/40 uppercase tracking-widest">
                                {event.price}
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <h3 className="text-2xl font-display font-black text-white italic uppercase tracking-tight group-hover:text-neon-cyan transition-colors">{event.title}</h3>

                            <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    <MapPin className="w-3 h-3 text-neon-cyan" /> {event.location}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    <Star className="w-3 h-3 text-neon-cyan" /> {event.genre}
                                </div>
                            </div>

                            <div className="pt-6 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-gray-800" />
                                        ))}
                                    </div>
                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">+12 PARTICIPANTS</span>
                                </div>
                                <button className="px-6 py-2 bg-white text-black rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-neon-cyan transition-all">
                                    JE PARTICIPE
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
