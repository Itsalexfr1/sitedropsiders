import { Link } from 'react-router-dom';

export function NewsletterStudio() {
    return (
        <div className="min-h-screen bg-dark-bg py-32 px-6 flex items-center justify-center">
            <h1 className="text-5xl text-white font-black">STUDIO DE CRÉATION - TEST VISIBLE</h1>
            <Link to="/admin" className="ml-8 text-neon-cyan underline">Retour Admin</Link>
        </div>
    );
}
