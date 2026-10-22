import React from 'react';
import { DropsidersLiveChat } from '../components/chat/DropsidersLiveChat';

export const LiveChatPopoutPage: React.FC = () => {
    return (
        <div className="w-screen h-screen bg-[#0b0c10] overflow-hidden">
            <DropsidersLiveChat isPopout={true} />
        </div>
    );
};
