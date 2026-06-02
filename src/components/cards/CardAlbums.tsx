import { useUser } from '../../context/UserContext';
import { DropsidersCardComponent } from './DropsidersCard';

const ALBUMS = [
    {
        id: 'french-touch',
        title: 'Légendes de la French Touch',
        description: 'Les pionniers qui ont fait briller la France à l\'international.',
        cardNames: ['Daft Punk', 'David Guetta', 'DJ Snake', 'Justice', 'Martin Solveig'],
        rewardXP: 1000
    },
    {
        id: 'tomorrowland',
        title: 'Mainstage Tomorrowland',
        description: 'Les têtes d\'affiche habituelles de la Mainstage.',
        cardNames: ['Martin Garrix', 'Armin van Buuren', 'Dimitri Vegas & Like Mike', 'Tiësto', 'Tomorrowland'],
        rewardXP: 1500
    },
    {
        id: 'ibiza-clubs',
        title: 'Les Temples d\'Ibiza',
        description: 'Les clubs les plus légendaires de l\'île blanche.',
        cardNames: ['Ushuaïa', 'Hï', 'Amnesia', 'Pacha', 'DC-10'],
        rewardXP: 800
    },
    {
        id: 'techno-berlin',
        title: 'Berlin Underground',
        description: 'L\'essence pure de la Techno industrielle.',
        cardNames: ['Berghain', 'Watergate', 'Tresor', 'Amelie Lens', 'Charlotte de Witte'],
        rewardXP: 1200
    }
];

export function CardAlbums() {
    const { collectedCards, showNotification, earnPoints } = useUser();

    // Map user cards by name for quick lookup
    const userCardNames = new Set(collectedCards.map(c => c.name));

    const claimReward = (albumId: string, rewardXP: number) => {
        const claimed = localStorage.getItem(`album_claimed_${albumId}`);
        if (claimed) {
            showNotification('Récompense déjà récupérée !', 'info');
            return;
        }

        earnPoints(rewardXP, 0);
        localStorage.setItem(`album_claimed_${albumId}`, 'true');
        showNotification(`Album complété ! +${rewardXP} XP`, 'success');
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-12">
            <div className="text-center">
                <h2 className="text-4xl font-black uppercase tracking-widest text-white mb-2">Albums de Collection</h2>
                <p className="text-white/60">Complétez des sets thématiques pour gagner des récompenses exclusives.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {ALBUMS.map(album => {
                    const ownedCount = album.cardNames.filter(name => userCardNames.has(name)).length;
                    const totalCount = album.cardNames.length;
                    const isComplete = ownedCount === totalCount;
                    const isClaimed = typeof localStorage !== 'undefined' && localStorage.getItem(`album_claimed_${album.id}`);

                    return (
                        <div key={album.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                            
                            {/* Progress Background */}
                            <div 
                                className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-600/20 pointer-events-none transition-all duration-1000"
                                style={{ width: `${(ownedCount / totalCount) * 100}%`, opacity: isComplete ? 1 : 0.3 }}
                            />

                            <div className="relative z-10 flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-wider">{album.title}</h3>
                                    <p className="text-white/60 text-sm mt-1">{album.description}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-600">
                                        {ownedCount}
                                    </span>
                                    <span className="text-xl font-bold text-white/40">/{totalCount}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 mb-6 relative z-10">
                                {album.cardNames.map((name, i) => {
                                    const hasCard = userCardNames.has(name);
                                    // Try to find the actual card object from user's collection to render a mini version
                                    const actualCard = hasCard ? collectedCards.find(c => c.name === name) : null;

                                    return (
                                        <div key={i} className="flex flex-col items-center gap-1">
                                            {actualCard ? (
                                                <div className="w-16 hover:scale-150 hover:z-50 transition-transform origin-bottom duration-300">
                                                    <DropsidersCardComponent card={actualCard} scale={0.3} />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-[23px] sm:h-[24px] rounded-md border-2 border-dashed border-white/20 bg-black/40 flex items-center justify-center" style={{ height: '70px' }}>
                                                    <span className="text-white/20 text-xs font-bold">?</span>
                                                </div>
                                            )}
                                            <span className={`text-[10px] font-bold text-center max-w-[64px] truncate ${hasCard ? 'text-white' : 'text-white/30'}`}>
                                                {name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="relative z-10 pt-4 border-t border-white/10 flex justify-between items-center">
                                <span className="text-orange-400 font-bold">Récompense : {album.rewardXP} XP</span>
                                <button
                                    onClick={() => claimReward(album.id, album.rewardXP)}
                                    disabled={!isComplete || !!isClaimed}
                                    className={`px-6 py-2 font-bold uppercase tracking-widest rounded-lg transition-all ${
                                        isClaimed
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-default'
                                            : isComplete
                                            ? 'bg-orange-500 text-white hover:scale-105 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                                            : 'bg-white/5 text-white/30 cursor-not-allowed'
                                    }`}
                                >
                                    {isClaimed ? 'Récupérée ✓' : 'Réclamer'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
