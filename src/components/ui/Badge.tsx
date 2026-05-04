import React from 'react';

export const Badge = ({ children, color = "red" }: { children: React.ReactNode, color?: string }) => (
    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
        color === 'red' ? 'bg-neon-red/20 text-neon-red' : 'bg-white/10 text-white'
    }`}>
        {children}
    </span>
);
