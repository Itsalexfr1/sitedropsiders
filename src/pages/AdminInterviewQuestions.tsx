import { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Save, ArrowLeft, Languages, MessageSquare, 
    GripVertical, Edit2, Check, X, Search, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthHeaders, apiFetch } from '../utils/auth';
import { ConfirmModal } from '../components/ui/ConfirmModal';

interface QuestionsData {
    fr: string[];
    en: string[];
}

export function AdminInterviewQuestions() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<QuestionsData>({ fr: [], en: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeLang, setActiveLang] = useState<'fr' | 'en'>('fr');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [newQuestion, setNewQuestion] = useState('');

    // Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

    // Toast State
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    };

    const currentUser = localStorage.getItem('admin_user');
    const storedPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    const isAuthorized = storedPermissions.includes('all') || storedPermissions.includes('news');

    useEffect(() => {
        if (!isAuthorized) {
            navigate('/admin');
            return;
        }

        const fetchQuestions = async () => {
            try {
                const res = await apiFetch('/api/interview-questions', { headers: getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    setQuestions(data);
                } else {
                    // Fallback to local import if API fails (it might not be implemented yet in worker)
                    console.warn('Failed to fetch questions from API, using empty state');
                }
            } catch (e) {
                console.error('Error fetching questions:', e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuestions();
    }, [isAuthorized, navigate]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await apiFetch('/api/interview-questions/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(questions)
            });

            if (res.ok) {
                showNotification('Questions enregistrées avec succès !', 'success');
            } else {
                showNotification('Erreur lors de l\'enregistrement', 'error');
            }
        } catch (e) {
            console.error('Save error:', e);
            showNotification('Erreur de connexion', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const addQuestion = () => {
        if (!newQuestion.trim()) return;
        const updated = { ...questions };
        updated[activeLang] = [newQuestion.trim(), ...updated[activeLang]];
        setQuestions(updated);
        setNewQuestion('');
    };

    const deleteQuestion = (index: number) => {
        setIndexToDelete(index);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (indexToDelete === null) return;
        const updated = { ...questions };
        updated[activeLang] = updated[activeLang].filter((_, i) => i !== indexToDelete);
        setQuestions(updated);
        setIsDeleteModalOpen(false);
        setIndexToDelete(null);
    };

    const startEditing = (index: number, value: string) => {
        setEditingIndex(index);
        setEditingValue(value);
    };

    const saveEdit = () => {
        if (editingIndex === null) return;
        const updated = { ...questions };
        updated[activeLang][editingIndex] = editingValue.trim();
        setQuestions(updated);
        setEditingIndex(null);
    };

    const filteredQuestions = questions[activeLang].filter(q => 
        q.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
                    <p className="text-neon-cyan font-black uppercase tracking-widest text-xs">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 lg:p-12">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/admin')}
                            className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                        >
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <MessageSquare className="w-5 h-5 text-neon-cyan" />
                                <span className="text-neon-cyan font-black uppercase tracking-[0.3em] text-[10px]">Studio Management</span>
                            </div>
                            <h1 className="text-4xl font-display font-black uppercase italic tracking-tighter">
                                Questions <span className="text-neon-cyan">Aléatoires</span>
                            </h1>
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center justify-center gap-3 px-10 py-5 bg-neon-cyan text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)] disabled:opacity-50"
                    >
                        {isSaving ? <Plus className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Mettre à jour la base
                    </button>
                </div>

                {/* Main Control UI */}
                <div className="grid lg:grid-cols-[1fr_350px] gap-8">
                    <div className="space-y-6">
                        {/* Search & Add */}
                        <div className="flex flex-col md:flex-row gap-4 p-6 bg-white/[0.03] border border-white/10 rounded-[2.5rem]">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Chercher une question..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm font-bold placeholder:text-gray-600 outline-none focus:border-neon-cyan transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setActiveLang('fr')}
                                    className={`px-6 py-4 rounded-xl font-black text-xs transition-all border ${activeLang === 'fr' ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-gray-500 hover:text-white'}`}
                                >
                                    FRENCH
                                </button>
                                <button 
                                    onClick={() => setActiveLang('en')}
                                    className={`px-6 py-4 rounded-xl font-black text-xs transition-all border ${activeLang === 'en' ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-gray-500 hover:text-white'}`}
                                >
                                    ENGLISH
                                </button>
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {filteredQuestions.map((q, idx) => {
                                    const realIndex = questions[activeLang].indexOf(q);
                                    const isEditing = editingIndex === realIndex;

                                    return (
                                        <motion.div 
                                            key={`${activeLang}-${realIndex}`}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group flex items-center gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/20 transition-all"
                                        >
                                            <div className="w-8 h-8 flex items-center justify-center bg-black/40 rounded-lg text-gray-600 font-bold text-xs shrink-0">
                                                {realIndex + 1}
                                            </div>

                                            {isEditing ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input 
                                                        autoFocus
                                                        type="text"
                                                        value={editingValue}
                                                        onChange={(e) => setEditingValue(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                                        className="flex-1 bg-black/60 border border-neon-cyan/50 rounded-xl px-4 py-2 text-sm font-medium outline-none"
                                                    />
                                                    <button onClick={saveEdit} className="p-2 bg-neon-cyan/20 text-neon-cyan rounded-xl hover:bg-neon-cyan/40"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingIndex(null)} className="p-2 border border-white/10 rounded-xl text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="flex-1 font-bold text-gray-200 group-hover:text-white transition-colors">{q}</p>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => startEditing(realIndex, q)}
                                                            className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all shadow-lg"
                                                            title="Modifier"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteQuestion(realIndex)}
                                                            className="p-3 bg-red-500/10 rounded-xl hover:bg-red-500/20 text-red-500 transition-all shadow-lg"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    );
                                })}

                                {filteredQuestions.length === 0 && (
                                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                                        <p className="text-gray-600 font-black uppercase tracking-widest text-xs italic">Aucune question trouvée</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Sidebar: Quick Add */}
                    <div className="space-y-6">
                        <div className="p-8 bg-gradient-to-br from-neon-cyan/20 via-transparent to-transparent border border-neon-cyan/20 rounded-[2.5rem] relative overflow-hidden">
                            <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-neon-cyan opacity-5" />
                            
                            <h3 className="text-lg font-display font-black uppercase italic mb-6">Ajouter une question</h3>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-neon-cyan uppercase tracking-widest ml-1">Label {activeLang.toUpperCase()}</label>
                                    <textarea 
                                        value={newQuestion}
                                        onChange={(e) => setNewQuestion(e.target.value)}
                                        placeholder="Ex: Quel est ton top 3 collab ?"
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold min-h-[120px] resize-none outline-none focus:border-neon-cyan transition-all"
                                    />
                                </div>
                                <button 
                                    onClick={addQuestion}
                                    disabled={!newQuestion.trim()}
                                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-neon-cyan hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                                >
                                    Insérer dans la liste
                                </button>
                                <p className="text-[9px] text-gray-500 text-center uppercase font-bold tracking-widest pt-2 italic">
                                    N'oubliez pas d'enregistrer après l'ajout.
                                </p>
                            </div>
                        </div>

                        <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[2.5rem]">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Statistiques Base</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase italic">Français</span>
                                    <span className="text-sm font-black text-neon-cyan">{questions.fr.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase italic">Anglais</span>
                                    <span className="text-sm font-black text-white">{questions.en.length}</span>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-xs font-black text-white uppercase italic">TOTAL</span>
                                    <span className="text-lg font-black text-neon-cyan">{questions.fr.length + questions.en.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal 
                isOpen={isDeleteModalOpen}
                title="Supprimer la question"
                message="Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible jusqu'au prochain enregistrement."
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                type="danger"
                confirmText="Supprimer définitvement"
                cancelText="Annuler"
            />

            {/* Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000]"
                    >
                        <div className={`px-8 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-4 ${toast.type === 'success' ? 'bg-black/80 border-neon-cyan/50 text-white' : 'bg-red-950/80 border-red-500/50 text-white'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-neon-cyan/20' : 'bg-red-500/20'}`}>
                                {toast.type === 'success' ? <Check className="w-5 h-5 text-neon-cyan" /> : <X className="w-5 h-5 text-red-500" />}
                            </div>
                            <span className="font-black uppercase tracking-widest text-[10px]">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
