import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface TradeNotificationBadgeProps {
    onClick: () => void;
}

export function TradeNotificationBadge({ onClick }: TradeNotificationBadgeProps) {
    const { trades, isLoggedIn } = useUser();

    if (!isLoggedIn) return null;

    const pendingCount = trades.received.filter((t: any) => t.status === 'pending').length;

    return (
        <button
            onClick={onClick}
            className="relative p-2.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-white hover:text-neon-cyan transition-all flex items-center justify-center group"
            title="Échanges de cartes"
        >
            <ArrowLeftRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
            
            {pendingCount > 0 && (
                <>
                    {/* Ring glow animation */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-cyan rounded-full animate-ping opacity-75" />
                    {/* Real badge count */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-cyan text-black rounded-full flex items-center justify-center text-[9px] font-black leading-none shadow-[0_0_10px_rgba(34,211,238,0.6)]">
                        {pendingCount}
                    </span>
                </>
            )}
        </button>
    );
}
