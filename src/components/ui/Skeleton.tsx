import { twMerge } from 'tailwind-merge';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={twMerge(
                "animate-pulse bg-white/5 rounded-lg overflow-hidden relative",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
    );
}
