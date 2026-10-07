import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Flame,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Clock,
  Music,
  ArrowLeft,
  Share2,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  type BlindTestTheme,
  type DeezerTrack,
  type BlindTestRound,
  getBlindTestThemes,
  fetchDeezerPlaylist,
  generateGameRounds,
} from '../utils/blindTestService';

// Audio snippet tiers with their score rewards
const TIERS = [
  { duration: 0.5, label: '0.5s', points: 10 },
  { duration: 2, label: '2s', points: 6 },
  { duration: 4, label: '4s', points: 4 },
  { duration: 8, label: '8s', points: 2 },
  { duration: 15, label: '15s', points: 1 },
];

const ROUND_TIME_LIMIT = 30; // seconds

export function BlindTestPage() {
  const [searchParams] = useSearchParams();
  const themeParam = searchParams.get('theme');

  // Themes & Game Setup
  const [themes, setThemes] = useState<BlindTestTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<BlindTestTheme | null>(null);
  const [isLoadingTheme, setIsLoadingTheme] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);

  // Game Engine State
  const [rounds, setRounds] = useState<BlindTestRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [gameState, setGameState] = useState<'lobby' | 'loading' | 'playing' | 'round_end' | 'game_over'>('lobby');

  // Player scoring & perks
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [userSelectedOptionId, setUserSelectedOptionId] = useState<string | number | null>(null);

  // Tiers & Audio Player
  const [activeTierIndex, setActiveTierIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const checkTimeIntervalRef = useRef<number | null>(null);

  // Jokers (1 charge per game)
  const [joker50Used, setJoker50Used] = useState(false);
  const [jokerMainUsed, setJokerMainUsed] = useState(false);
  const [joker2xActive, setJoker2xActive] = useState(false);
  const [eliminatedOptionIds, setEliminatedOptionIds] = useState<(string | number)[]>([]);

  // Round Timer
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_LIMIT);
  const timerRef = useRef<number | null>(null);

  // Load available themes on start
  useEffect(() => {
    getBlindTestThemes().then((loaded) => {
      const activeThemes = loaded.filter((t) => t.enabled !== false);
      setThemes(activeThemes);

      if (themeParam) {
        const found = activeThemes.find((t) => t.id === themeParam);
        if (found) {
          handleSelectTheme(found);
        }
      }
    });
  }, [themeParam]);

  // Cleanup audio & timers
  useEffect(() => {
    return () => {
      stopAudio();
      stopTimer();
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (checkTimeIntervalRef.current) {
      window.clearInterval(checkTimeIntervalRef.current);
      checkTimeIntervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(ROUND_TIME_LIMIT);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Handle selecting a theme & loading playlist
  const handleSelectTheme = async (theme: BlindTestTheme) => {
    setSelectedTheme(theme);
    setGameState('loading');
    setGameError(null);
    setIsLoadingTheme(true);

    try {
      const data = await fetchDeezerPlaylist(theme.deezerPlaylistId);
      if (data.tracks.length < 4) {
        throw new Error('Cette playlist contient moins de 4 morceaux avec extrait.');
      }
      const generated = generateGameRounds(data.tracks, 10);
      setRounds(generated);
      setCurrentRoundIndex(0);
      setScore(0);
      setStreak(0);
      setRoundScores([]);
      setJoker50Used(false);
      setJokerMainUsed(false);
      setJoker2xActive(false);

      startRound(generated[0]);
    } catch (err: any) {
      console.error(err);
      setGameError(err.message || 'Impossible de charger la playlist.');
      setGameState('lobby');
    } finally {
      setIsLoadingTheme(false);
    }
  };

  // Start a specific round
  const startRound = (round: BlindTestRound) => {
    stopAudio();
    stopTimer();

    setUserSelectedOptionId(null);
    setActiveTierIndex(0);
    setEliminatedOptionIds([]);
    setJoker2xActive(false);
    setGameState('playing');

    // Setup Audio
    if (round.correctTrack.previewUrl) {
      const audio = new Audio(round.correctTrack.previewUrl);
      audio.volume = 0.8;
      audio.preload = 'auto';
      audioRef.current = audio;

      // Auto play the 0.5s snippet
      playSnippet(0, audio);
    }

    startTimer();
  };

  // Play audio snippet up to current tier
  const playSnippet = (tierIdx: number, customAudio?: HTMLAudioElement) => {
    const audio = customAudio || audioRef.current;
    if (!audio) return;

    if (checkTimeIntervalRef.current) {
      window.clearInterval(checkTimeIntervalRef.current);
    }

    const targetDuration = TIERS[tierIdx].duration;
    audio.currentTime = 0;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        const startTime = Date.now();

        checkTimeIntervalRef.current = window.setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed >= targetDuration || audio.currentTime >= targetDuration) {
            audio.pause();
            audio.currentTime = 0;
            setIsPlaying(false);
            if (checkTimeIntervalRef.current) {
              window.clearInterval(checkTimeIntervalRef.current);
              checkTimeIntervalRef.current = null;
            }
          }
        }, 30);
      })
      .catch((e) => {
        console.warn('Audio play restricted or failed', e);
        setIsPlaying(false);
      });
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playSnippet(activeTierIndex);
    }
  };

  // Skip to next tier button
  const handleSkipTier = () => {
    if (activeTierIndex < TIERS.length - 1) {
      const nextIdx = activeTierIndex + 1;
      setActiveTierIndex(nextIdx);
      playSnippet(nextIdx);
    }
  };

  // Click on a tier button
  const handleSelectTier = (index: number) => {
    if (index > activeTierIndex) {
      setActiveTierIndex(index);
    }
    playSnippet(index);
  };

  // Joker 50:50
  const handleUse5050 = () => {
    if (joker50Used || gameState !== 'playing') return;
    const currentRound = rounds[currentRoundIndex];
    if (!currentRound) return;

    const wrongOptions = currentRound.options.filter((o) => o.id !== currentRound.correctTrack.id);
    const shuffledWrong = [...wrongOptions].sort(() => 0.5 - Math.random());
    const toEliminate = shuffledWrong.slice(0, 2).map((o) => o.id);

    setEliminatedOptionIds(toEliminate);
    setJoker50Used(true);
  };

  // Joker MAIN (Skip directly to drop / 15s)
  const handleUseMain = () => {
    if (jokerMainUsed || gameState !== 'playing' || !audioRef.current) return;
    setJokerMainUsed(true);
    setActiveTierIndex(TIERS.length - 1); // 15s tier

    if (checkTimeIntervalRef.current) {
      window.clearInterval(checkTimeIntervalRef.current);
    }

    const audio = audioRef.current;
    audio.currentTime = 12; // Start right at main drop area
    audio.play();
    setIsPlaying(true);

    checkTimeIntervalRef.current = window.setInterval(() => {
      if (audio.currentTime >= 27) {
        audio.pause();
        setIsPlaying(false);
        if (checkTimeIntervalRef.current) {
          window.clearInterval(checkTimeIntervalRef.current);
          checkTimeIntervalRef.current = null;
        }
      }
    }, 50);
  };

  // Joker 2x Points
  const handleUse2x = () => {
    if (joker2xActive || gameState !== 'playing') return;
    setJoker2xActive(true);
  };

  // When time runs out
  const handleTimeExpired = () => {
    handleAnswerSubmit(null);
  };

  // When player clicks an option card
  const handleAnswerSubmit = (option: DeezerTrack | null) => {
    if (gameState !== 'playing') return;
    stopAudio();
    stopTimer();

    const currentRound = rounds[currentRoundIndex];
    const isCorrect = option && option.id === currentRound.correctTrack.id;

    setUserSelectedOptionId(option ? option.id : 'timeout');

    // Calculate score
    let pointsEarned = 0;
    if (isCorrect) {
      const basePoints = TIERS[activeTierIndex].points;
      pointsEarned = joker2xActive ? basePoints * 2 : basePoints;
      setScore((prev) => prev + pointsEarned);
      setStreak((prev) => prev + 1);

      // Play full audio celebration snippet
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      // Small confetti burst for fast answers (0.5s or 2s)
      if (activeTierIndex <= 1) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } else {
      setStreak(0);
    }

    setRoundScores((prev) => [...prev, pointsEarned]);
    setGameState('round_end');

    // Advance to next round or end game
    setTimeout(() => {
      if (currentRoundIndex + 1 < rounds.length) {
        const nextIdx = currentRoundIndex + 1;
        setCurrentRoundIndex(nextIdx);
        startRound(rounds[nextIdx]);
      } else {
        finishGame();
      }
    }, 2800);
  };

  // Game completed
  const finishGame = () => {
    stopAudio();
    stopTimer();
    setGameState('game_over');

    // Grand confetti finale
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    });
  };

  const currentRound = rounds[currentRoundIndex];

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-neon-red selection:text-white relative overflow-x-hidden pt-20 pb-12">
      {/* Dynamic Background Glows */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-neon-cyan/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-neon-red/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="max-w-6xl mx-auto w-full px-4 mb-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link
            to={gameState === 'lobby' ? '/' : '#'}
            onClick={(e) => {
              if (gameState !== 'lobby') {
                e.preventDefault();
                setGameState('lobby');
                stopAudio();
                stopTimer();
              }
            }}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {gameState === 'lobby' ? 'Retour Accueil' : 'Choisir un Thème'}
          </Link>

          {selectedTheme && gameState !== 'lobby' && (
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedTheme.color || '#00f0ff' }}
              />
              <span className="text-xs font-black uppercase italic tracking-wider text-white">
                {selectedTheme.title}
              </span>
            </div>
          )}
        </div>

        {/* Live HUD (Score, Streak, Round) */}
        {gameState !== 'lobby' && gameState !== 'loading' && (
          <div className="flex items-center gap-4">
            {streak > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-neon-orange/20 to-neon-red/20 border border-neon-red/40 rounded-full text-xs font-black text-neon-orange animate-pulse">
                <Flame className="w-3.5 h-3.5 text-neon-red fill-current" />
                <span>{streak} SÉRIE !</span>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl flex items-center gap-2">
              <Trophy className="w-4 h-4 text-neon-yellow" />
              <span className="font-display font-black text-base text-white tracking-wider">{score}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">PTS</span>
            </div>

            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-400 font-mono">
              <span className="text-white font-black">{currentRoundIndex + 1}</span> / {rounds.length}
            </div>
          </div>
        )}
      </header>

      {/* Main Game Container */}
      <main className="max-w-6xl mx-auto w-full px-3 md:px-6 flex-1 flex flex-col justify-center z-10">
        {/* ================= STATE 1: LOBBY (SELECT THEME) ================= */}
        {gameState === 'lobby' && (
          <div className="space-y-8 py-6">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neon-red/10 border border-neon-red/30 rounded-full text-xs font-black uppercase tracking-widest text-neon-red">
                <Sparkles className="w-3.5 h-3.5" /> Dropsiders Blind Test Live
              </div>
              <h1 className="text-4xl md:text-5xl font-black font-display uppercase italic tracking-tight text-white">
                LE BLIND TEST <span className="text-neon-red">EDM</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium">
                Devine les morceaux le plus vite possible dès la première demi-seconde pour remporter le maximum de points !
              </p>
            </div>

            {gameError && (
              <div className="max-w-xl mx-auto p-4 bg-neon-red/10 border border-neon-red/30 rounded-2xl text-xs text-neon-red flex items-center gap-3">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <span>{gameError}</span>
              </div>
            )}

            {/* Themes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  className="p-5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/30 rounded-3xl text-left transition-all duration-300 group flex flex-col justify-between relative overflow-hidden active:scale-95 cursor-pointer shadow-lg"
                  style={{
                    borderTopColor: theme.color || '#00f0ff',
                    borderTopWidth: '4px',
                  }}
                >
                  <div>
                    {theme.coverUrl ? (
                      <div className="relative mb-4 rounded-2xl overflow-hidden aspect-square border border-white/10">
                        <img
                          src={theme.coverUrl}
                          alt={theme.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        {theme.badge && (
                          <span
                            className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                            style={{
                              backgroundColor: `${theme.color}30`,
                              color: theme.color,
                              border: `1px solid ${theme.color}60`,
                            }}
                          >
                            {theme.badge}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4 rounded-2xl aspect-square bg-white/5 border border-white/10 flex items-center justify-center">
                        <Music className="w-12 h-12 text-gray-600" />
                      </div>
                    )}

                    <h3 className="text-base font-black text-white uppercase italic group-hover:text-neon-cyan transition-colors">
                      {theme.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 font-medium">
                      {theme.description || 'Session musicale Dropsiders'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-black uppercase tracking-wider text-neon-cyan">
                    <span>Lancer la manche</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= STATE 2: LOADING PLAYLIST ================= */}
        {gameState === 'loading' && (
          <div className="py-24 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-neon-cyan animate-spin mx-auto" />
            <h2 className="text-xl font-bold font-display uppercase italic text-white">
              Connexion à l&apos;API Deezer & Génération du Blind Test...
            </h2>
            <p className="text-xs text-gray-400">Récupération des extraits audio MP3 et des pochettes HD</p>
          </div>
        )}

        {/* ================= STATE 3: PLAYING & ROUND_END (THE CONSOLE) ================= */}
        {(gameState === 'playing' || gameState === 'round_end') && currentRound && (
          <div className="space-y-6 max-w-4xl mx-auto w-full">
            {/* Top Controller Bar (Matches the screenshot layout) */}
            <div className="bg-[#121318]/90 border border-white/15 rounded-full p-2.5 md:p-3 flex items-center justify-between gap-2 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative">
              {/* Play / Pause Circular Button with Glow Wave */}
              <button
                onClick={handleTogglePlay}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all flex-shrink-0 relative cursor-pointer ${
                  isPlaying
                    ? 'bg-emerald-500 text-black shadow-[0_0_25px_rgba(16,185,129,0.7)]'
                    : 'bg-emerald-500/20 hover:bg-emerald-500 border-2 border-emerald-500/60 text-emerald-400 hover:text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                }`}
                title={isPlaying ? 'Pause' : 'Écouter'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                )}
                {isPlaying && (
                  <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                )}
              </button>

              {/* "SKIP TO [X]s" Button */}
              {activeTierIndex < TIERS.length - 1 && (
                <button
                  onClick={handleSkipTier}
                  className="px-3 md:px-4 py-2.5 bg-yellow-400/10 hover:bg-yellow-400/20 border-2 border-yellow-400/60 text-yellow-300 rounded-2xl flex flex-col items-center justify-center leading-tight transition-all active:scale-95 flex-shrink-0 cursor-pointer shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                >
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center gap-1">
                    SKIP TO {TIERS[activeTierIndex + 1].label}
                  </span>
                </button>
              )}

              {/* Tiers Buttons: 0.5s, 2s, 4s, 8s, 15s */}
              <div className="hidden sm:flex items-center gap-1 md:gap-1.5 flex-1 justify-center">
                {TIERS.map((tier, idx) => {
                  const isActive = idx === activeTierIndex;
                  const isUnlocked = idx <= activeTierIndex;

                  return (
                    <button
                      key={tier.label}
                      onClick={() => handleSelectTier(idx)}
                      className={`px-3 py-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer min-w-[56px] md:min-w-[64px] ${
                        isActive
                          ? 'bg-emerald-400 text-black font-black shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-105'
                          : isUnlocked
                          ? 'bg-white/10 text-white font-bold hover:bg-white/15'
                          : 'bg-white/[0.03] text-gray-500 border border-white/5'
                      }`}
                    >
                      <span className="text-xs font-black leading-none">{tier.label}</span>
                      <span
                        className={`text-[9px] font-bold leading-tight uppercase ${
                          isActive ? 'text-black' : 'text-gray-400'
                        }`}
                      >
                        +{tier.points} PTS
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Jokers: 50:50, MAIN, 2x */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* 50:50 */}
                <button
                  onClick={handleUse5050}
                  disabled={joker50Used || gameState !== 'playing'}
                  className={`px-2.5 md:px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center ${
                    joker50Used
                      ? 'bg-white/5 text-gray-600 border border-white/5 opacity-50 cursor-not-allowed'
                      : 'bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer'
                  }`}
                  title="Élimine 2 mauvaises options"
                >
                  <span>50:50</span>
                  <span className="text-[8px] opacity-70">{joker50Used ? '0x' : '1x'}</span>
                </button>

                {/* MAIN (Drop) */}
                <button
                  onClick={handleUseMain}
                  disabled={jokerMainUsed || gameState !== 'playing'}
                  className={`px-2.5 md:px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center ${
                    jokerMainUsed
                      ? 'bg-white/5 text-gray-600 border border-white/5 opacity-50 cursor-not-allowed'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)] active:scale-95 cursor-pointer'
                  }`}
                  title="Écouter le Drop / Refrain directement"
                >
                  <span>▶ MAIN</span>
                  <span className="text-[8px] opacity-70">{jokerMainUsed ? '0x' : '1x'}</span>
                </button>

                {/* 2x Points */}
                <button
                  onClick={handleUse2x}
                  disabled={joker2xActive || gameState !== 'playing'}
                  className={`px-2.5 md:px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center ${
                    joker2xActive
                      ? 'bg-neon-yellow text-black font-black shadow-[0_0_15px_rgba(255,230,0,0.6)] animate-pulse'
                      : 'bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 active:scale-95 cursor-pointer'
                  }`}
                  title="Doubler les points sur cette manche"
                >
                  <span>2X</span>
                  <span className="text-[8px] opacity-70">{joker2xActive ? 'ACTIVE' : '1x'}</span>
                </button>
              </div>

              {/* Countdown Timer Circle (Matches 29s LEFT circle) */}
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center border-2 transition-colors flex-shrink-0 relative ${
                  timeLeft <= 5
                    ? 'border-neon-red text-neon-red bg-neon-red/10 animate-bounce'
                    : 'border-emerald-400 text-emerald-400 bg-emerald-400/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                }`}
              >
                <span className="text-sm md:text-base font-black leading-none">{timeLeft}s</span>
                <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-gray-300">LEFT</span>
              </div>
            </div>

            {/* The 4 Choice Cards (Identical layout to screenshot) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {currentRound.options.map((option, idx) => {
                const isEliminated = eliminatedOptionIds.includes(option.id);
                const isSelected = userSelectedOptionId === option.id;
                const isCorrect = option.id === currentRound.correctTrack.id;

                let cardStyle =
                  'bg-[#121318] hover:bg-[#181920] border-white/10 hover:border-white/30 text-white';

                if (gameState === 'round_end') {
                  if (isCorrect) {
                    cardStyle =
                      'bg-emerald-500/20 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)] text-white scale-[1.02]';
                  } else if (isSelected && !isCorrect) {
                    cardStyle = 'bg-neon-red/20 border-neon-red shadow-[0_0_30px_rgba(255,0,51,0.5)] text-white';
                  } else {
                    cardStyle = 'bg-[#121318]/50 border-white/5 opacity-40';
                  }
                }

                if (isEliminated) {
                  return (
                    <div
                      key={option.id}
                      className="p-4 bg-black/20 border border-white/5 rounded-3xl opacity-20 flex flex-col items-center justify-center aspect-square pointer-events-none"
                    >
                      <span className="text-xs font-bold text-gray-600 line-through">{idx + 1}</span>
                    </div>
                  );
                }

                return (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: gameState === 'playing' ? 1.03 : 1 }}
                    whileTap={{ scale: gameState === 'playing' ? 0.97 : 1 }}
                    disabled={gameState !== 'playing'}
                    onClick={() => handleAnswerSubmit(option)}
                    className={`p-3 md:p-4 rounded-3xl border-2 transition-all flex flex-col justify-between text-left relative overflow-hidden group cursor-pointer ${cardStyle}`}
                  >
                    {/* Number Badge (1, 2, 3, 4) */}
                    <div className="absolute top-5 left-5 z-10 w-6 h-6 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-xs font-black text-white shadow-md">
                      {idx + 1}
                    </div>

                    {/* Album Cover Art */}
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-3 border border-white/10 bg-black/40">
                      {option.coverUrl ? (
                        <img
                          src={option.coverUrl}
                          alt={option.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-10 h-10 text-gray-600" />
                        </div>
                      )}

                      {/* Correct / Wrong Overlay on Round End */}
                      {gameState === 'round_end' && isCorrect && (
                        <div className="absolute inset-0 bg-emerald-500/40 backdrop-blur-xs flex items-center justify-center">
                          <CheckCircle2 className="w-12 h-12 text-white animate-bounce" />
                        </div>
                      )}
                      {gameState === 'round_end' && isSelected && !isCorrect && (
                        <div className="absolute inset-0 bg-neon-red/40 backdrop-blur-xs flex items-center justify-center">
                          <XCircle className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Track Title & Artist (Clean & Prominent) */}
                    <div className="min-w-0">
                      <h4 className="text-sm md:text-base font-black text-white truncate group-hover:text-neon-cyan transition-colors">
                        {option.title}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{option.artist}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Round Feedback Banner */}
            {gameState === 'round_end' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-2"
              >
                {userSelectedOptionId === currentRound.correctTrack.id ? (
                  <p className="text-lg font-black font-display uppercase italic text-emerald-400 tracking-wider">
                    🎉 BRAVO ! +{roundScores[roundScores.length - 1]} POINTS
                  </p>
                ) : (
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    C&apos;était :{' '}
                    <strong className="text-white font-black">{currentRound.correctTrack.title}</strong> par{' '}
                    <span className="text-neon-cyan">{currentRound.correctTrack.artist}</span>
                  </p>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* ================= STATE 4: GAME OVER / RESULTS ================= */}
        {gameState === 'game_over' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto w-full bg-[#121318] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-red via-neon-yellow to-neon-cyan" />

            <div className="w-20 h-20 bg-neon-yellow/10 border border-neon-yellow/30 rounded-3xl flex items-center justify-center mx-auto text-neon-yellow shadow-[0_0_30px_rgba(255,230,0,0.3)]">
              <Trophy className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-3xl font-black font-display uppercase italic tracking-wider text-white">
                SESSION TERMINÉE !
              </h2>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1">
                Thème : {selectedTheme?.title}
              </p>
            </div>

            {/* Score Big Display */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-5xl font-black font-display text-white italic tracking-tight">{score}</span>
              <span className="text-xs text-gray-400 uppercase font-black tracking-widest block mt-1">POINTS OBTENUS</span>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <span className="text-gray-400 block font-bold">Bonnes Réponses</span>
                  <span className="text-white font-black text-base">
                    {roundScores.filter((s) => s > 0).length} / {rounds.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold">Meilleure Série</span>
                  <span className="text-neon-orange font-black text-base">{streak} à la suite</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => selectedTheme && handleSelectTheme(selectedTheme)}
                className="flex-1 py-3.5 bg-gradient-to-r from-neon-red to-neon-purple hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,0,51,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Rejouer ce Thème
              </button>
              <button
                onClick={() => setGameState('lobby')}
                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Changer de Thème
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="text-center text-xs text-gray-600 font-bold uppercase tracking-widest py-4 z-10">
        Propulsé par Dropsiders & Deezer API
      </footer>
    </div>
  );
}
