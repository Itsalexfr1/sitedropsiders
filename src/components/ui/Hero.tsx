
export function Hero() {
    return (
        <section className="relative h-[75vh] w-full flex items-center overflow-hidden bg-black">
            {/* Background Video */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/90 via-dark-bg/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-bg z-10" />
                <div className="absolute inset-0 w-full h-full">
                    <iframe
                        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 scale-[1.09] aspect-video pointer-events-none border-none"
                        src="https://www.youtube.com/embed/xoB5fdoOMV8?autoplay=1&mute=1&controls=0&loop=1&playlist=xoB5fdoOMV8&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title="Hero Video"
                    />
                </div>
            </div>

            <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Overlay content removed as requested */}
            </div>
        </section>
    );
}
