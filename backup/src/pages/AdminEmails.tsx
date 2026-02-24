import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function AdminEmails() {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-dark-bg flex flex-col items-center justify-center">
            <h1 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter mb-6">
                Messagerie Désactivée
            </h1>
            <p className="text-gray-400 mb-8 max-w-md text-center">
                La fonctionnalité de messagerie a été désactivée. Vos emails LWS ne sont plus interceptés par le site et sont de nouveau gérés directement sur vos clients mails classiques.
            </p>
            <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
            >
                <ArrowLeft className="w-5 h-5" />
                Retour au tableau de bord
            </button>
        </div>
    );
}
