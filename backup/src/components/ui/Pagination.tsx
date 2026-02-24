import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHoverSound } from '../../hooks/useHoverSound';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const playHoverSound = useHoverSound();

    if (totalPages <= 1) return null;

    // Helper to generate the array of page numbers/ellipses
    const getPageNumbers = () => {
        const pages = [];
        const showEllipsisStart = currentPage > 3;
        const showEllipsisEnd = currentPage < totalPages - 2;

        if (totalPages <= 7) {
            // If total pages are 7 or less, show all numbers
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (showEllipsisStart) {
                pages.push('...');
            }

            // Determine start and end of the middle range
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            // Adjust if at the very beginning or end to show a consistent number of items
            if (currentPage <= 3) {
                start = 2;
                end = 4;
            } else if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
                end = totalPages - 1;
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (showEllipsisEnd) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2 mt-16 flex-wrap">
            {/* Previous Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                onMouseEnter={playHoverSound}
                className="p-2 md:p-3 rounded-xl border border-white/10 bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-neon-red hover:border-neon-red transition-all duration-300 group shadow-lg"
                title="Précédent"
            >
                <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>

            {/* Page Numbers */}
            <div className="flex items-center gap-2">
                {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                        <span key={`ellipsis-${index}`} className="text-gray-500 px-2 select-none">...</span>
                    ) : (
                        <motion.button
                            key={page}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onPageChange(page as number)}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-xl border flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-lg ${currentPage === page
                                ? 'border-neon-red bg-neon-red text-white shadow-[0_0_20px_rgba(255,0,51,0.4)]'
                                : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20'
                                }`}
                        >
                            {page}
                        </motion.button>
                    )
                ))}
            </div>

            {/* Next Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                onMouseEnter={playHoverSound}
                className="p-2 md:p-3 rounded-xl border border-white/10 bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-neon-red hover:border-neon-red transition-all duration-300 group shadow-lg"
                title="Suivant"
            >
                <ChevronRight className="w-5 h-5 text-white" />
            </motion.button>
        </div>
    );
}
