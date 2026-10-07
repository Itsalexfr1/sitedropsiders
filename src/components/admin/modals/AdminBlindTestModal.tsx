import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Trash2,
  Edit2,
  Check,
  Music,
  Gamepad2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Search,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  type BlindTestTheme,
  type DeezerTrack,
  getBlindTestThemes,
  saveBlindTestThemes,
  fetchDeezerPlaylist,
  extractDeezerPlaylistId,
} from '../../../utils/blindTestService';

interface AdminBlindTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Néon Cyan', value: '#00f0ff' },
  { name: 'Néon Rose', value: '#ff007f' },
  { name: 'Néon Jaune', value: '#ffe600' },
  { name: 'Néon Violet', value: '#a855f7' },
  { name: 'Néon Vert', value: '#10b981' },
  { name: 'Néon Rouge', value: '#ff0033' },
  { name: 'Néon Orange', value: '#ff6600' },
];

export function AdminBlindTestModal({ isOpen, onClose }: AdminBlindTestModalProps) {
  const [themes, setThemes] = useState<BlindTestTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit / Create Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BlindTestTheme>>({
    title: '',
    description: '',
    deezerPlaylistId: '',
    color: '#00f0ff',
    badge: 'EDM',
    enabled: true,
  });
  const [isTestingDeezer, setIsTestingDeezer] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    title?: string;
    coverUrl?: string;
    tracksCount?: number;
    error?: string;
  } | null>(null);

  // In-modal audio preview testing
  const [activePreviewTrack, setActivePreviewTrack] = useState<DeezerTrack | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [testedPlaylistData, setTestedPlaylistData] = useState<{
    themeId: string;
    tracks: DeezerTrack[];
  } | null>(null);
  const [testingThemeId, setTestingThemeId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadThemes();
    } else {
      stopAudioPreview();
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadThemes = async () => {
    setIsLoading(true);
    try {
      const data = await getBlindTestThemes();
      setThemes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudioPreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
    }
    setActivePreviewTrack(null);
  };

  const handlePlayPreview = (track: DeezerTrack) => {
    if (activePreviewTrack?.id === track.id) {
      stopAudioPreview();
      return;
    }
    stopAudioPreview();

    if (!track.previewUrl) {
      showToast('Aucun extrait audio 30s disponible pour ce morceau.');
      return;
    }

    const audio = new Audio(track.previewUrl);
    audio.volume = 0.6;
    audio.play().catch((err) => console.error('Play error', err));
    audio.onended = () => {
      stopAudioPreview();
    };
    setPreviewAudio(audio);
    setActivePreviewTrack(track);
  };

  const handleToggleTheme = async (id: string) => {
    const updated = themes.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
    setThemes(updated);
    await saveBlindTestThemes(updated);
    showToast('Statut du thème mis à jour');
  };

  const handleDeleteTheme = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce thème ?')) return;
    const updated = themes.filter((t) => t.id !== id);
    setThemes(updated);
    await saveBlindTestThemes(updated);
    showToast('Thème supprimé');
  };

  const handleOpenCreate = () => {
    setEditingThemeId(null);
    setFormData({
      title: '',
      description: '',
      deezerPlaylistId: '',
      color: '#00f0ff',
      badge: 'NOUVEAU',
      enabled: true,
      coverUrl: '',
    });
    setTestResult(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (theme: BlindTestTheme) => {
    setEditingThemeId(theme.id);
    setFormData({
      ...theme,
    });
    setTestResult(null);
    setIsFormOpen(true);
  };

  const handleVerifyDeezerUrl = async () => {
    if (!formData.deezerPlaylistId) {
      setTestResult({ success: false, error: 'Veuillez saisir un lien ou un ID Deezer.' });
      return;
    }

    setIsTestingDeezer(true);
    setTestResult(null);
    try {
      const res = await fetchDeezerPlaylist(formData.deezerPlaylistId);
      setTestResult({
        success: true,
        title: res.title,
        coverUrl: res.coverUrl,
        tracksCount: res.tracks.length,
      });

      // Auto-fill form fields if empty
      setFormData((prev) => ({
        ...prev,
        title: prev.title || res.title,
        coverUrl: prev.coverUrl || res.coverUrl,
        deezerPlaylistId: extractDeezerPlaylistId(prev.deezerPlaylistId || '') || prev.deezerPlaylistId,
      }));
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Impossible de charger la playlist Deezer.',
      });
    } finally {
      setIsTestingDeezer(false);
    }
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.deezerPlaylistId) {
      alert('Veuillez renseigner au moins le titre et la playlist Deezer.');
      return;
    }

    const cleanId = extractDeezerPlaylistId(formData.deezerPlaylistId) || formData.deezerPlaylistId;
    const themeToSave: BlindTestTheme = {
      id: editingThemeId || `theme_${Date.now()}`,
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      deezerPlaylistId: cleanId,
      deezerPlaylistUrl: `https://www.deezer.com/fr/playlist/${cleanId}`,
      coverUrl: formData.coverUrl || '',
      color: formData.color || '#00f0ff',
      badge: formData.badge?.trim() || 'EDM',
      enabled: formData.enabled !== undefined ? formData.enabled : true,
    };

    let updated: BlindTestTheme[];
    if (editingThemeId) {
      updated = themes.map((t) => (t.id === editingThemeId ? themeToSave : t));
    } else {
      updated = [themeToSave, ...themes];
    }

    setThemes(updated);
    await saveBlindTestThemes(updated);
    setIsFormOpen(false);
    showToast(editingThemeId ? 'Thème mis à jour avec succès !' : 'Nouveau thème ajouté !');
  };

  const handleTestPlaylistInModal = async (theme: BlindTestTheme) => {
    if (testedPlaylistData?.themeId === theme.id) {
      setTestedPlaylistData(null);
      stopAudioPreview();
      return;
    }

    setTestingThemeId(theme.id);
    stopAudioPreview();
    try {
      const res = await fetchDeezerPlaylist(theme.deezerPlaylistId);
      setTestedPlaylistData({
        themeId: theme.id,
        tracks: res.tracks,
      });
      showToast(`${res.tracks.length} morceaux chargés depuis Deezer !`);
    } catch (err: any) {
      showToast(`Erreur: ${err.message || 'Échec du chargement Deezer'}`);
    } finally {
      setTestingThemeId(null);
    }
  };

  const filteredThemes = themes.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.badge?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#09090b] border border-white/10 rounded-[2.5rem] w-full max-w-5xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh] relative"
      >
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan" />

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-neon-red/30 to-neon-purple/30 border border-neon-red/40 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,51,0.3)]">
              <Gamepad2 className="w-6 h-6 text-neon-red" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black font-display text-white uppercase italic tracking-wider">
                  Blind Test <span className="text-neon-red">Deezer</span>
                </h2>
                <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 rounded-full">
                  API LIVE
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Gérez vos thèmes musicaux et connectez les playlists Deezer pour le jeu interactif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/blind-test"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-gradient-to-r from-neon-red to-neon-purple hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,51,0.4)]"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Jouer en Direct ↗
            </a>
            <button
              onClick={onClose}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neon-red text-white font-bold text-xs rounded-full shadow-[0_0_20px_rgba(255,0,51,0.5)] flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Action & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un thème, style, artiste..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neon-red/50 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadThemes}
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleOpenCreate}
                className="px-5 py-2.5 bg-white text-black hover:bg-neon-red hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" /> Ajouter un Thème
              </button>
            </div>
          </div>

          {/* Themes Grid */}
          {isLoading ? (
            <div className="py-20 text-center text-gray-500 text-xs font-bold uppercase tracking-widest flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-neon-red" />
              Chargement des thèmes...
            </div>
          ) : filteredThemes.length === 0 ? (
            <div className="py-16 text-center bg-white/[0.02] border border-white/5 rounded-2xl p-8">
              <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-white font-bold text-sm uppercase">Aucun thème trouvé</h3>
              <p className="text-gray-500 text-xs mt-1">
                Cliquez sur &quot;Ajouter un Thème&quot; pour créer votre première playlist Deezer de Blind Test.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredThemes.map((theme) => {
                const isTested = testedPlaylistData?.themeId === theme.id;
                const isTesting = testingThemeId === theme.id;

                return (
                  <div
                    key={theme.id}
                    className="p-5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl transition-all relative group flex flex-col justify-between overflow-hidden"
                    style={{
                      borderLeftColor: theme.color || '#00f0ff',
                      borderLeftWidth: '4px',
                    }}
                  >
                    <div>
                      {/* Top status bar */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {theme.badge && (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                              style={{
                                backgroundColor: `${theme.color}20`,
                                color: theme.color,
                                border: `1px solid ${theme.color}40`,
                              }}
                            >
                              {theme.badge}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                              theme.enabled ? 'text-emerald-400' : 'text-gray-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                theme.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
                              }`}
                            />
                            {theme.enabled ? 'Actif sur le jeu' : 'Désactivé'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleTheme(theme.id)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title={theme.enabled ? 'Désactiver' : 'Activer'}
                          >
                            {theme.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(theme)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTheme(theme.id)}
                            className="p-1.5 bg-white/5 hover:bg-neon-red/20 rounded-lg text-gray-400 hover:text-neon-red transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Info & Cover */}
                      <div className="flex gap-4 items-start mb-4">
                        {theme.coverUrl ? (
                          <img
                            src={theme.coverUrl}
                            alt={theme.title}
                            className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <Music className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-white uppercase italic tracking-tight truncate">
                            {theme.title}
                          </h4>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1 font-medium">
                            {theme.description || 'Aucune description'}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-mono">
                              ID Deezer: {theme.deezerPlaylistId}
                            </span>
                            <a
                              href={`https://www.deezer.com/fr/playlist/${theme.deezerPlaylistId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-neon-cyan hover:underline flex items-center gap-1 font-bold"
                            >
                              Ouvrir sur Deezer <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Test Player Trigger */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleTestPlaylistInModal(theme)}
                        disabled={isTesting}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          isTested
                            ? 'bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        {isTesting ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" /> Test Deezer...
                          </>
                        ) : isTested ? (
                          <>
                            <VolumeX className="w-3 h-3" /> Fermer l&apos;écoute
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-neon-cyan" /> Tester les sons Deezer
                          </>
                        )}
                      </button>

                      <a
                        href={`/blind-test?theme=${theme.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-gray-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        Tester la partie ↗
                      </a>
                    </div>

                    {/* Expandable Tracks Preview inside Card */}
                    {isTested && testedPlaylistData && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-3 border-t border-white/10 space-y-2 bg-black/40 -mx-5 -mb-5 p-4 rounded-b-2xl"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-neon-cyan uppercase tracking-wider">
                            🎵 Extraits Deezer disponibles ({testedPlaylistData.tracks.length} morceaux)
                          </p>
                          {activePreviewTrack && (
                            <span className="text-[9px] font-bold text-neon-red animate-pulse">
                              ▶ En lecture : {activePreviewTrack.title}
                            </span>
                          )}
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                          {testedPlaylistData.tracks.slice(0, 15).map((tr) => {
                            const isPlaying = activePreviewTrack?.id === tr.id;
                            return (
                              <div
                                key={tr.id}
                                className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                                  isPlaying ? 'bg-neon-red/20 border border-neon-red/40' : 'bg-white/5 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {tr.coverUrl && (
                                    <img src={tr.coverUrl} alt="" className="w-7 h-7 rounded-md object-cover" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-bold text-white truncate text-[11px]">{tr.title}</p>
                                    <p className="text-[9px] text-gray-400 truncate">{tr.artist}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handlePlayPreview(tr)}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    isPlaying
                                      ? 'bg-neon-red text-white'
                                      : 'bg-white/10 hover:bg-white/20 text-gray-300'
                                  }`}
                                  title={isPlaying ? 'Arrêter' : 'Écouter 30s'}
                                >
                                  {isPlaying ? (
                                    <Square className="w-3 h-3 fill-current" />
                                  ) : (
                                    <Play className="w-3 h-3 fill-current" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create / Edit Drawer Modal */}
        <AnimatePresence>
          {isFormOpen && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#121216] border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative space-y-5"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-xl font-black font-display text-white uppercase italic">
                    {editingThemeId ? 'Modifier le Thème' : 'Ajouter un Thème Deezer'}
                  </h3>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTheme} className="space-y-4">
                  {/* Deezer URL / ID with Auto-Check */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                      Lien ou ID de la Playlist Deezer <span className="text-neon-red">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.deezerPlaylistId || ''}
                        onChange={(e) => setFormData({ ...formData, deezerPlaylistId: e.target.value })}
                        placeholder="ex: https://www.deezer.com/fr/playlist/3264808726 ou 3264808726"
                        required
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyDeezerUrl}
                        disabled={isTestingDeezer}
                        className="px-4 py-2.5 bg-neon-cyan/20 border border-neon-cyan/40 hover:bg-neon-cyan hover:text-black text-neon-cyan rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        {isTestingDeezer ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        Vérifier
                      </button>
                    </div>

                    {/* Test result feedback */}
                    {testResult && (
                      <div
                        className={`mt-2 p-3 rounded-xl text-xs flex items-center gap-2 ${
                          testResult.success
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                            : 'bg-neon-red/10 border border-neon-red/30 text-neon-red'
                        }`}
                      >
                        {testResult.success ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>
                              Trouvé : <strong>{testResult.title}</strong> ({testResult.tracksCount} morceaux avec
                              extrait audio MP3)
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-neon-red flex-shrink-0" />
                            <span>{testResult.error}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                      Nom du Thème <span className="text-neon-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="ex: EDM Classics 2010-2015"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-red"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                      Description / Artistes clés
                    </label>
                    <input
                      type="text"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="ex: David Guetta, Avicii, Calvin Harris, Martin Garrix..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-red"
                    />
                  </div>

                  {/* Badge & Color */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                        Badge (Label)
                      </label>
                      <input
                        type="text"
                        value={formData.badge || ''}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        placeholder="ex: HOT, FESTIVAL, VINTAGE"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-red"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                        Couleur d&apos;accent
                      </label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {COLOR_PRESETS.map((col) => (
                          <button
                            key={col.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, color: col.value })}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              formData.color === col.value
                                ? 'scale-125 border-white shadow-lg'
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: col.value }}
                            title={col.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cover URL preview */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                      Image de pochette (URL personnalisée ou auto Deezer)
                    </label>
                    <input
                      type="text"
                      value={formData.coverUrl || ''}
                      onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-red"
                    />
                  </div>

                  {/* Enabled Toggle */}
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="theme-enabled"
                      checked={formData.enabled !== false}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-neon-red focus:ring-neon-red bg-white/5 border-white/10"
                    />
                    <label htmlFor="theme-enabled" className="text-xs text-gray-300 font-bold select-none cursor-pointer">
                      Activer immédiatement ce thème sur le jeu public
                    </label>
                  </div>

                  {/* Submit */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-neon-red to-neon-purple hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,0,51,0.4)] flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Enregistrer le Thème
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
