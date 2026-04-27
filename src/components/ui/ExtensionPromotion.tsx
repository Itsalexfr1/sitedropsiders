import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { useUser } from '../../context/UserContext';

export function ExtensionPromotion({ initialLoad }: { initialLoad: boolean }) {
  const [showPopup, setShowPopup] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { setGlobalAlert } = useUser();
  
  const isMobile = window.innerWidth < 1024;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    if (!initialLoad) {
      const delay = setTimeout(() => setShowPopup(true), 2000);
      const autoClose = setTimeout(() => setShowPopup(false), 12000);
      return () => {
        clearTimeout(delay);
        clearTimeout(autoClose);
      };
    }
  }, [initialLoad]);

  const handleInstallClick = async () => {
    if (isMobile) {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
        setShowPopup(false);
      } else if (isIOS) {
        setGlobalAlert({ message: "Sur iPhone : Clique sur 'Partager' (icône flèche) puis 'Sur l'écran d'accueil' 📲", type: "info" });
      } else {
        setGlobalAlert({ message: "Ajoute le site à ton écran d'accueil pour profiter de l'App ! 🚀", type: "info" });
      }
    } else {
      setShowPopup(false);
      const link = document.createElement('a');
      link.href = '/extension_dropsiders.zip';
      link.download = 'extension_dropsiders.zip';
      link.click();
      setGlobalAlert({ 
        message: "Extension téléchargée ! Pour l'installer : décompresse le zip, va sur chrome://extensions, active le 'Mode développeur' et clique sur 'Charger l'extension décompressée' 🚀", 
        type: "info" 
      });
    }
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md"
        >
          <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-red/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative w-16 h-16 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 flex-shrink-0">
              <img src="/Logo.png" className="w-10 h-10 object-contain" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-red text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-lg">
                !
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black uppercase italic text-sm tracking-tighter">
                Dropsiders <span className="text-neon-red">{isMobile ? "L'Application" : "Extension"}</span>
              </h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                {isMobile ? "Installe l'app pour recevoir les alertes mobile !" : "Recevez nos alertes flash en temps réel !"}
              </p>
              
              <button 
                onClick={handleInstallClick}
                className="inline-block mt-3 text-[9px] font-black text-neon-red uppercase tracking-[0.2em] hover:underline"
              >
                {isMobile ? "Installer l'App →" : "Télécharger l'extension →"}
              </button>
            </div>

            <button 
              onClick={() => setShowPopup(false)}
              className="p-2 text-gray-500 hover:text-white transition-colors relative z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
