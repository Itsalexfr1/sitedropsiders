import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Check,
  Trash2,
  Sparkles,
  Music,
  Shuffle,
  Radio,
  Clock,
  Loader2,
  Info
} from 'lucide-react';
import { type RadioScheduleBlock, formatRadioTimeSlot } from '../../../utils/radioSchedule';

export const SoundCloudIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z" />
  </svg>
);

interface AdminSoundCloudPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: RadioScheduleBlock[];
  defaultBlockId?: string | null;
  onSaveSoundCloudPlaylist: (
    blockId: string,
    data: {
      url: string;
      title?: string;
      author?: string;
      coverUrl?: string;
    }
  ) => void;
  onRemoveSoundCloudPlaylist?: (blockId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'warn' | 'info') => void;
}

export function AdminSoundCloudPlaylistModal({
  isOpen,
  onClose,
  blocks,
  defaultBlockId,
  onSaveSoundCloudPlaylist,
  onRemoveSoundCloudPlaylist,
  onShowToast,
}: AdminSoundCloudPlaylistModalProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [playlistUrl, setPlaylistUrl] = useState<string>('');
  const [playlistTitle, setPlaylistTitle] = useState<string>('');
  const [playlistAuthor, setPlaylistAuthor] = useState<string>('');
  const [playlistCover, setPlaylistCover] = useState<string>('');
  const [isFetchingInfo, setIsFetchingInfo] = useState<boolean>(false);
  const [randomize, setRandomize] = useState<boolean>(true);

  // Sync initial selection
  useEffect(() => {
    if (isOpen) {
      const initialId = defaultBlockId || (blocks.length > 0 ? blocks[0].id : '');
      setSelectedBlockId(initialId);
      
      const targetBlock = blocks.find((b) => b.id === initialId);
      if (targetBlock?.soundcloudPlaylistUrl) {
        setPlaylistUrl(targetBlock.soundcloudPlaylistUrl);
        setPlaylistTitle(targetBlock.soundcloudPlaylistTitle || '');
        setPlaylistAuthor(targetBlock.soundcloudPlaylistAuthor || '');
        setPlaylistCover(targetBlock.soundcloudPlaylistCover || '');
      } else {
        setPlaylistUrl('');
        setPlaylistTitle('');
        setPlaylistAuthor('');
        setPlaylistCover('');
      }
    }
  }, [isOpen, defaultBlockId, blocks]);

  // When selected block changes, load its existing SoundCloud playlist
  const handleSelectBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    const targetBlock = blocks.find((b) => b.id === blockId);
    if (targetBlock?.soundcloudPlaylistUrl) {
      setPlaylistUrl(targetBlock.soundcloudPlaylistUrl);
      setPlaylistTitle(targetBlock.soundcloudPlaylistTitle || '');
      setPlaylistAuthor(targetBlock.soundcloudPlaylistAuthor || '');
      setPlaylistCover(targetBlock.soundcloudPlaylistCover || '');
    } else {
      setPlaylistUrl('');
      setPlaylistTitle('');
      setPlaylistAuthor('');
      setPlaylistCover('');
    }
  };

  // Auto-fetch SoundCloud playlist oEmbed info
  const handleFetchOEmbed = async (urlToFetch: string) => {
    const trimmed = urlToFetch.trim();
    if (!trimmed.includes('soundcloud.com')) return;

    setIsFetchingInfo(true);
    try {
      const endpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trimmed)}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.title && !playlistTitle) {
          setPlaylistTitle(data.title);
        }
        if (data.author_name && !playlistAuthor) {
          setPlaylistAuthor(data.author_name);
        }
        if (data.thumbnail_url && !playlistCover) {
          setPlaylistCover(data.thumbnail_url);
        }
        onShowToast('✓ Informations SoundCloud récupérées avec succès !', 'success');
      }
    } catch {
      // Ignore network/CORS error, link can still be saved directly
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const currentBlock = blocks.find((b) => b.id === selectedBlockId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockId) {
      onShowToast('Veuillez choisir une émission', 'warn');
      return;
    }
    if (!playlistUrl.trim()) {
      onShowToast('Veuillez entrer le lien de la playlist SoundCloud', 'warn');
      return;
    }
    if (!playlistUrl.includes('soundcloud.com')) {
      onShowToast('Le lien doit provenir de soundcloud.com', 'warn');
      return;
    }

    onSaveSoundCloudPlaylist(selectedBlockId, {
      url: playlistUrl.trim(),
      title: playlistTitle.trim() || undefined,
      author: playlistAuthor.trim() || undefined,
      coverUrl: playlistCover.trim() || undefined,
    });

    onShowToast(`✓ Playlist SoundCloud liée à « ${currentBlock?.title || 'l’émission'} » !`, 'success');
    onClose();
  };

  const handleRemove = () => {
    if (!selectedBlockId) return;
    if (onRemoveSoundCloudPlaylist) {
      onRemoveSoundCloudPlaylist(selectedBlockId);
    } else {
      onSaveSoundCloudPlaylist(selectedBlockId, { url: '' });
    }
    setPlaylistUrl('');
    setPlaylistTitle('');
    setPlaylistAuthor('');
    setPlaylistCover('');
    onShowToast(`Playlist SoundCloud retirée de « ${currentBlock?.title} »`, 'info');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-[#0e1017] border border-[#ff5500]/40 rounded-3xl shadow-[0_0_50px_rgba(255,85,0,0.25)] overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#18111a] via-[#1f1418] to-[#18111a] flex items-center justify-between relative shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff5500] to-[#ff3300] flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,85,0,0.5)] shrink-0">
                <SoundCloudIcon className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-display font-black text-white uppercase italic tracking-tight">
                    Playlist SoundCloud
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#ff5500]/20 text-[#ff7722] border border-[#ff5500]/40">
                    Radio Manager
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Associez une playlist SoundCloud pour alimenter une émission en lecture aléatoire
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
            {/* 1. Sélecteur d'Émission */}
            <div className="space-y-1.5">
              <label className="text-xs font-display font-black uppercase text-gray-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#ff5500]" />
                  1. Choisir l&apos;Émission
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  {blocks.length} émissions dans la grille
                </span>
              </label>

              <select
                value={selectedBlockId}
                onChange={(e) => handleSelectBlock(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-white font-bold text-xs sm:text-sm focus:outline-none focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500]/50 transition-all cursor-pointer"
              >
                {blocks.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#12141c] text-white">
                    {b.emoji || '📻'} {b.title} ({formatRadioTimeSlot(b.startHour, b.endHour)})
                    {b.soundcloudPlaylistUrl ? ' • 🟠 Playlist Active' : ''}
                  </option>
                ))}
              </select>

              {currentBlock && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Créneau :{' '}
                    <strong className="text-white">
                      {formatRadioTimeSlot(currentBlock.startHour, currentBlock.endHour)}
                    </strong>
                  </span>
                  <span>
                    Morceaux actuels :{' '}
                    <strong className="text-white">{(currentBlock.tracks || []).length}</strong>
                  </span>
                  {currentBlock.soundcloudPlaylistUrl && (
                    <span className="text-[#ff7722] font-black uppercase text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Déjà liée
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 2. Lien de la Playlist SoundCloud */}
            <div className="space-y-1.5">
              <label className="text-xs font-display font-black uppercase text-gray-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <SoundCloudIcon className="w-3.5 h-3.5 text-[#ff5500]" />
                  2. Lien de la Playlist SoundCloud
                </span>
                {isFetchingInfo && (
                  <span className="text-[10px] text-[#ff7722] flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Analyse du lien...
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={playlistUrl}
                  onChange={(e) => {
                    const u = e.target.value;
                    setPlaylistUrl(u);
                    if (u.includes('soundcloud.com')) {
                      handleFetchOEmbed(u);
                    }
                  }}
                  onBlur={() => {
                    if (playlistUrl.includes('soundcloud.com')) {
                      handleFetchOEmbed(playlistUrl);
                    }
                  }}
                  placeholder="https://soundcloud.com/artiste/sets/nom-de-la-playlist"
                  className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-[#ff5500]/40 text-white font-mono text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500]/50 transition-all pr-24"
                />
                <button
                  type="button"
                  onClick={() => handleFetchOEmbed(playlistUrl)}
                  disabled={!playlistUrl.trim() || isFetchingInfo}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-[#ff5500]/20 hover:bg-[#ff5500] text-[#ff7722] hover:text-black border border-[#ff5500]/40 text-[10px] font-black uppercase italic tracking-wider transition-all cursor-pointer disabled:opacity-40"
                >
                  Analyser
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Collez simplement l&apos;URL de n&apos;importe quelle playlist SoundCloud (publique ou non répertoriée).
              </p>
            </div>

            {/* Détails optionnels (Titre / Auteur / Cover) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Titre de la playlist</label>
                <input
                  type="text"
                  value={playlistTitle}
                  onChange={(e) => setPlaylistTitle(e.target.value)}
                  placeholder="Ex: EDM Bangers & Sets"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#ff5500]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Curateur / DJ</label>
                <input
                  type="text"
                  value={playlistAuthor}
                  onChange={(e) => setPlaylistAuthor(e.target.value)}
                  placeholder="Ex: Dropsiders Radio"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#ff5500]"
                />
              </div>
            </div>

            {/* Aperçu visuel de la playlist si analysée */}
            {playlistCover && (
              <div className="p-3 rounded-2xl bg-black/50 border border-[#ff5500]/30 flex items-center gap-3">
                <img
                  src={playlistCover}
                  alt={playlistTitle}
                  className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {playlistTitle || 'Playlist SoundCloud'}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{playlistAuthor || 'Artiste inconnu'}</p>
                  <span className="text-[9px] font-mono text-[#ff7722] bg-[#ff5500]/10 px-1.5 py-0.5 rounded border border-[#ff5500]/20 inline-block mt-1">
                    Prête pour la diffusion
                  </span>
                </div>
              </div>
            )}

            {/* 3. Règles d'alternance et tirage aléatoire */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1a131f] to-[#12131a] border border-purple-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-black uppercase text-purple-300 flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5 text-purple-400" />
                  Tirage aléatoire des morceaux
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={randomize}
                    onChange={(e) => setRandomize(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500" />
                </label>
              </div>

              <div className="text-[11px] text-gray-300 leading-relaxed space-y-1">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Jingles & Promos respectés :</strong> La radio appliquera automatiquement la règle
                    d&apos;alternance choisie pour cette émission (ex :{' '}
                    <em>Normal → Son → Spécial → Promo</em>) et insérera votre Top Horaire à chaque heure pile.
                  </span>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
              {currentBlock?.soundcloudPlaylistUrl ? (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dissocier de l&apos;émission</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5500] to-[#ff3300] hover:from-[#ff6611] hover:to-[#ff4400] text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,85,0,0.4)] transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer la Playlist</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
