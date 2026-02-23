import { getCountryCode } from '../../utils/flags';

interface FlagIconProps {
    location: string;
    className?: string;
}

export function FlagIcon({ location, className = "w-4 h-3" }: FlagIconProps) {
    const code = getCountryCode(location);

    if (!code) return null;

    return (
        <img
            src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${code.toUpperCase()}.svg`}
            alt={location}
            className={`inline-block object-cover rounded-sm shadow-sm ${className}`}
            onError={(e) => {
                // Fallback to text if image fails
                (e.target as HTMLImageElement).style.display = 'none';
            }}
        />
    );
}
