import React, { useEffect, useRef } from 'react';

export const StarField: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: Star[] = [];
        const isMobile = window.innerWidth < 1024;
        const starCount = isMobile ? 50 : 150;

        class Star {
            x: number;
            y: number;
            size: number;
            speed: number;
            opacity: number;
            twinkle: number;

            constructor(width: number, height: number) {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 1.5;
                this.speed = Math.random() * 0.05;
                this.opacity = Math.random();
                this.twinkle = Math.random() * 0.02;
            }

            update(_width: number, height: number) {
                this.y -= this.speed;
                if (this.y < 0) this.y = height;

                this.opacity += this.twinkle;
                if (this.opacity > 1 || this.opacity < 0.2) {
                    this.twinkle = -this.twinkle;
                }
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = [];
            for (let i = 0; i < starCount; i++) {
                stars.push(new Star(canvas.width, canvas.height));
            }
        };

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(star => {
                star.update(canvas.width, canvas.height);
                star.draw(ctx);
            });
            animationFrameId = requestAnimationFrame(render);
        };

        window.addEventListener('resize', resize);
        resize();
        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0 opacity-40"
            style={{ filter: 'blur(0.5px)' }}
        />
    );
};
