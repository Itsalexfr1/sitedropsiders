import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AgendaForm } from '../components/admin/AgendaForm';
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '../utils/auth';

export function AgendaCreate() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const isEditing = !!id;
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(isEditing);

    useEffect(() => {
        if (isEditing && id) {
            const fetchItem = async () => {
                try {
                    const response = await fetch('/api/agenda', { headers: getAuthHeaders(null) });
                    if (response.ok) {
                        const allEvents = await response.json();
                        const item = allEvents.find((e: any) => String(e.id) === String(id));
                        if (item) {
                            setEditingItem(item);
                        }
                    }
                } catch (e: any) {
                    console.error("Failed to fetch agenda item for edit", e);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchItem();
        }
    }, [isEditing, id]);

    const handleSuccess = () => {
        navigate('/admin/manage?tab=Agenda');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-white">
                    <div className="w-12 h-12 border-4 border-neon-red/20 border-t-neon-red rounded-full animate-spin" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg py-32">
            <div className="max-w-full mx-auto px-4 md:px-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => navigate('/admin/manage?tab=Agenda')}
                            className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white group"
                            title="Retour"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                Studio <span className="text-neon-yellow">Agenda</span>
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm md:text-base">{isEditing ? 'Modifier l\'Événement' : 'Ajouter à l\'Agenda'}</p>
                        </div>
                    </div>
                </div>

                <AgendaForm 
                    editingItem={editingItem} 
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    );
}

export default AgendaCreate;
