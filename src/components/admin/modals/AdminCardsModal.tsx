import { useState, useMemo } from "react";
import { X, Search, Sparkles, LayoutGrid, Award, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DropsidersCard } from "../../../context/UserContext";
import { DropsidersCardComponent } from "../../cards/DropsidersCard";
import wikiFestivals from "../../../data/wiki_festivals.json";
import wikiClubs from "../../../data/wiki_clubs.json";
import wikiDjs from "../../../data/wiki_djs.json";

interface AdminCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getRarity(rank: number): DropsidersCard["rarity"] {
  if (rank <= 10) return "legendary";
  if (rank <= 30) return "epic";
  if (rank <= 60) return "rare";
  return "common";
}

export function AdminCardsModal({ isOpen, onClose }: AdminCardsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState<"type" | "rarity" | "country">("type");
  const [selectedRarityFilter, setSelectedRarityFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedCard, setSelectedCard] = useState<DropsidersCard | null>(null);

  // Build the complete card pool
  const allCards = useMemo((): DropsidersCard[] => {
    const djCards: DropsidersCard[] = (wikiDjs as any[]).map((d) => ({
      id: d.id,
      type: "dj" as const,
      name: d.name,
      city: d.city || "Global",
      country: d.country,
      image: d.image,
      djmag_rank: d.djmag_rank || 99,
      rarity: getRarity(d.djmag_rank || 99),
      collectedAt: new Date().toISOString(),
      top_tracks: d.top_tracks || [],
    }));

    const festivalCards: DropsidersCard[] = (wikiFestivals as any[]).map((f) => ({
      id: f.id,
      type: "festival" as const,
      name: f.name,
      city: f.city,
      country: f.country,
      image: f.image,
      djmag_rank: f.djmag_rank || 99,
      rarity: getRarity(f.djmag_rank || 99),
      collectedAt: new Date().toISOString(),
      attendees: f.attendees,
      attendees_label: f.attendees_label,
    }));

    const clubCards: DropsidersCard[] = (wikiClubs as any[]).map((c) => ({
      id: c.id,
      type: "club" as const,
      name: c.name,
      city: c.city,
      country: c.country,
      image: c.image,
      djmag_rank: c.djmag_rank || 99,
      rarity: getRarity(c.djmag_rank || 99),
      collectedAt: new Date().toISOString(),
      attendees: c.attendees,
      attendees_label: c.attendees_label,
    }));

    return [...djCards, ...festivalCards, ...clubCards];
  }, []);

  // Filtered cards
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      const matchesSearch =
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRarity =
        selectedRarityFilter === "ALL" || card.rarity === selectedRarityFilter.toLowerCase();
      
      const matchesType =
        selectedTypeFilter === "ALL" || card.type === selectedTypeFilter.toLowerCase();

      return matchesSearch && matchesRarity && matchesType;
    });
  }, [allCards, searchTerm, selectedRarityFilter, selectedTypeFilter]);

  // Grouped cards depending on groupBy state
  const groupedCards = useMemo(() => {
    const groups: { [key: string]: DropsidersCard[] } = {};

    filteredCards.forEach((card) => {
      let key = "";
      if (groupBy === "type") {
        key = card.type === "dj" ? "DJs" : card.type === "festival" ? "Festivals" : "Clubs";
      } else if (groupBy === "rarity") {
        const labels: { [key: string]: string } = {
          legendary: "Légendaire (Top 10)",
          epic: "Épique (Top 11-30)",
          rare: "Rare (Top 31-60)",
          common: "Commun (Top 61+)",
        };
        key = labels[card.rarity] || card.rarity;
      } else if (groupBy === "country") {
        key = card.country || "Autre";
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(card);
    });

    // Sort group keys
    return Object.keys(groups)
      .sort((a, b) => {
        // Custom sort logic to keep Legendary on top or certain order
        if (groupBy === "rarity") {
          const order = ["Légendaire (Top 10)", "Épique (Top 11-30)", "Rare (Top 31-60)", "Commun (Top 61+)"];
          return order.indexOf(a) - order.indexOf(b);
        }
        return a.localeCompare(b);
      })
      .map((key) => ({
        title: key,
        cards: groups[key].sort((a, b) => a.djmag_rank - b.djmag_rank),
      }));
  }, [filteredCards, groupBy]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-6xl h-[85vh] rounded-3xl bg-[#07070a]/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
        >
          {/* Neon Top border glow */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan opacity-80" />

          {/* Header */}
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 bg-black/20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-neon-cyan animate-pulse" />
                <h2 className="text-xl font-black uppercase tracking-wider text-white">
                  Visualiseur de Cartes Dropsiders
                </h2>
                <span className="text-[10px] font-bold bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
                  {filteredCards.length} / {allCards.length} cartes
                </span>
              </div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Base de données globale des récompenses de visite super admin
              </p>
            </div>

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full border border-white/10 hover:border-white/20 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all hover:rotate-90 duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Filter Controls */}
          <div className="p-6 border-b border-white/5 bg-black/40 grid grid-cols-1 md:grid-cols-4 gap-4 z-10">
            {/* Search Input */}
            <div className="relative col-span-1 md:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="RECHERCHER PAR NOM, VILLE, PAYS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 font-bold text-xs uppercase tracking-wider focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all"
              />
            </div>

            {/* Filter by Type */}
            <div>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/30 transition-all"
              >
                <option value="ALL" className="bg-[#07070a]">TOUS LES TYPES</option>
                <option value="DJ" className="bg-[#07070a]">DJS</option>
                <option value="FESTIVAL" className="bg-[#07070a]">FESTIVALS</option>
                <option value="CLUB" className="bg-[#07070a]">CLUBS</option>
              </select>
            </div>

            {/* Filter by Rarity */}
            <div>
              <select
                value={selectedRarityFilter}
                onChange={(e) => setSelectedRarityFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red/30 transition-all"
              >
                <option value="ALL" className="bg-[#07070a]">TOUTES LES RARETÉS</option>
                <option value="LEGENDARY" className="bg-[#07070a]">LÉGENDAIRE</option>
                <option value="EPIC" className="bg-[#07070a]">ÉPIQUE</option>
                <option value="RARE" className="bg-[#07070a]">RARE</option>
                <option value="COMMON" className="bg-[#07070a]">COMMUN</option>
              </select>
            </div>
          </div>

          {/* Grouping switcher */}
          <div className="px-6 py-3 border-b border-white/5 bg-[#0a0a0f] flex items-center justify-between flex-wrap gap-2 z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Trier et regrouper par :
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setGroupBy("type")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                  groupBy === "type"
                    ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Catégorie (DJ/Festival/Club)
              </button>
              <button
                onClick={() => setGroupBy("rarity")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                  groupBy === "rarity"
                    ? "bg-neon-red/20 border-neon-red text-neon-red shadow-[0_0_10px_rgba(255,0,51,0.2)]"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Rareté (Top DjMag)
              </button>
              <button
                onClick={() => setGroupBy("country")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                  groupBy === "country"
                    ? "bg-neon-purple/20 border-neon-purple text-neon-purple shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Pays
              </button>
            </div>
          </div>

          {/* Cards Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {groupedCards.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-2">
                  Aucune carte ne correspond à votre recherche
                </p>
                <p className="text-gray-600 text-xs font-medium">
                  Essayez d'ajuster vos filtres de recherche ou de catégorie.
                </p>
              </div>
            ) : (
              groupedCards.map((group) => (
                <div key={group.title} className="space-y-4">
                  {/* Group Header */}
                  <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                      {group.title}
                    </h3>
                    <span className="text-[9px] font-bold bg-white/5 text-white/40 px-2 py-0.5 rounded-full">
                      {group.cards.length} {group.cards.length > 1 ? "cartes" : "carte"}
                    </span>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
                    {group.cards.map((card) => (
                      <div key={card.id} className="relative group cursor-pointer hover:scale-105 transition-transform duration-300">
                        <div onClick={() => setSelectedCard(card)}>
                          <DropsidersCardComponent
                            card={card}
                            flippable={false}
                            scale={0.9}
                          />
                        </div>
                        {/* Additional admin actions or info under the card */}
                        <div className="mt-2 text-center">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                            Rang : #{card.djmag_rank}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Fullscreen Selected Card Overlay */}
        <AnimatePresence>
          {selectedCard && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4"
              onClick={() => setSelectedCard(null)}
            >
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute top-6 right-6 p-3 rounded-full border border-white/20 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all z-50 hover:rotate-90 duration-300"
              >
                <X className="w-8 h-8" />
              </button>
              
              <motion.div 
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="relative flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <DropsidersCardComponent
                  card={selectedCard}
                  flippable={true}
                  scale={1.8}
                />
                <p className="text-white/50 text-sm mt-8 uppercase tracking-widest font-bold animate-pulse">
                  Cliquez sur la carte pour la retourner
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
