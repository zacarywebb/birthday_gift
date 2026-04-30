import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

const FLOATERS = [
  '💕','✨','🌸','💖','🌷','✨','💗','🌸','💕','✨','💝','🌺'
];

export default function Landing() {
  const [noPos, setNoPos]     = useState({ top: 0, left: 0 });
  const [noPosSet, setNoPosSet] = useState(false);
  const [toast, setToast]     = useState(null);
  const containerRef           = useRef(null);
  const canvasRef              = useRef(null);
  const animRef                = useRef(null);
  const navigate               = useNavigate();

  // Position No-button beside Duh!! button — measured synchronously
  // before GSAP's useEffect runs (effects fire in declaration order)
  const positionNoBtn = () => {
    const duhBtn = document.getElementById('duh-btn');
    if (!duhBtn) return;
    const b = duhBtn.getBoundingClientRect();
    setNoPos({ top: b.top, left: b.right + 16 });
    setNoPosSet(true);
  };

  useEffect(() => {
    window.addEventListener('resize', positionNoBtn);
    return () => window.removeEventListener('resize', positionNoBtn);
  }, []);

  // GSAP entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.message-card',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.05, ease: 'power3.out', delay: 0.15, onComplete: positionNoBtn }
      );
      gsap.fromTo('.ground-sprite',
        { y: 44, opacity: 0, scale: 0.82 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.12, duration: 0.75, ease: 'back.out(1.5)', delay: 0.45 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const moveNoBtn = () => {
    setNoPos({
      top:  Math.random() * (window.innerHeight - 52),
      left: Math.random() * (window.innerWidth  - 160),
    });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  };


  const launchFireworks = () => {
    const canvas = canvasRef.current;
    if (!canvas) { navigate('/typewriter'); return; }
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#ff80b4','#ffb3d1','#ff4d94','#ffd700','#ffffff','#f9a8d4','#fbbf24','#ff69b4'];
    let particles = [];

    const makeParticles = (x, y) => {
      const base = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < 70; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          alpha: 1,
          decay: Math.random() * 0.018 + 0.012,
          size:  Math.random() * 3.5 + 1,
          color: Math.random() > 0.35 ? base : '#ffffff',
        });
      }
    };

    // Staggered burst positions
    const bursts = [
      { delay: 0,   x: 0.20, y: 0.38 },
      { delay: 140, x: 0.80, y: 0.28 },
      { delay: 260, x: 0.50, y: 0.20 },
      { delay: 380, x: 0.15, y: 0.50 },
      { delay: 460, x: 0.85, y: 0.42 },
      { delay: 580, x: 0.35, y: 0.32 },
      { delay: 660, x: 0.65, y: 0.26 },
      { delay: 780, x: 0.50, y: 0.48 },
    ];
    bursts.forEach(b =>
      setTimeout(() => makeParticles(b.x * window.innerWidth, b.y * window.innerHeight), b.delay)
    );

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.vy   += 0.12;        // gravity
        p.vx   *= 0.98;
        p.x    += p.vx;
        p.y    += p.vy;
        p.alpha -= p.decay;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      particles = particles.filter(p => p.alpha > 0);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    // Navigate after display
    setTimeout(() => {
      cancelAnimationFrame(animRef.current);
      navigate('/typewriter');
    }, 2000);
  };

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&display=swap');

        .pixel-bg {
          position: absolute; inset: 0;
          background-image: url('/images/landingBackground.png');
          background-size: cover; background-position: center bottom;
          image-rendering: pixelated;
        }
        .vignette {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.22) 100%);
        }

        /* Floating hearts */
        .hearts { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .heart  { position: absolute; bottom: -30px; animation: riseUp linear infinite; opacity: 0; }
        @keyframes riseUp {
          0%   { transform: translateY(0)      rotate(-6deg)  scale(1);   opacity: 0;    }
          8%   { opacity: 0.65; }
          88%  { opacity: 0.2;  }
          100% { transform: translateY(-108vh) rotate(18deg) scale(0.45); opacity: 0; }
        }

        /* Animals */
        .animal { position: absolute; image-rendering: pixelated; cursor: pointer; }
        .animal:hover { filter: brightness(1.12) drop-shadow(0 0 4px rgba(255,160,200,0.5)); }

        .charli-wrap {
          position: absolute; bottom: 37%; left: 8%;
          animation: gentleFloat 9s ease-in-out infinite;
        }
        .charli-wrap:hover { animation-play-state: paused; }
        .charli-wrap img {
          width: min(280px, 17vw);
          image-rendering: pixelated; cursor: pointer;
        }
        .charli-wrap img:hover { filter: brightness(1.12) drop-shadow(0 0 4px rgba(255,160,200,0.5)); }

        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0);     }
          50%      { transform: translateY(-16px); }
        }

        /* Message card */
        .message-card {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 242, 249, 0.87);
          backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);
          border: 1.5px solid rgba(244, 114, 182, 0.45);
          border-radius: 28px;
          padding: clamp(22px, 4vw, 42px) clamp(26px, 5vw, 50px);
          box-shadow:
            0 12px 50px rgba(190, 24, 93, 0.18),
            0 2px  8px  rgba(0, 0, 0, 0.07),
            inset 0 1px 0 rgba(255,255,255,0.85);
          display: flex; flex-direction: column; align-items: center; text-align: center;
          max-width: min(520px, 88vw); width: 100%; z-index: 20;
          font-family: 'Baloo 2', cursive;
        }
        .card-title {
          font-size: clamp(1rem, 2.6vw, 1.45rem);
          font-weight: 700; color: #be185d;
          line-height: 1.55; margin: 0 0 18px;
        }
        .puppy-gif {
          width: min(170px, 33vw); border-radius: 14px; cursor: pointer;
          box-shadow: 0 4px 18px rgba(190, 24, 93, 0.22);
          transition: transform 0.3s ease;
        }
        .puppy-gif:hover { transform: scale(1.07); }

        .btn-yes {
          background: linear-gradient(135deg, #ec4899, #be185d);
          color: white; border: none; border-radius: 50px;
          padding: 13px 36px; font-size: 1.05rem;
          font-family: 'Baloo 2', cursive; font-weight: 700;
          cursor: pointer; margin-top: 20px;
          box-shadow: 0 5px 18px rgba(190, 24, 93, 0.38);
          transition: transform 0.2s, box-shadow 0.2s;
          letter-spacing: 0.3px;
        }
        .btn-yes:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 26px rgba(190, 24, 93, 0.52);
        }
        .btn-yes:active { transform: scale(0.97); }

        /* No button */
        .btn-no {
          position: fixed;
          background: linear-gradient(135deg, #f9a8d4, #ec4899);
          color: white; border: none; border-radius: 50px;
          padding: 11px 26px; font-size: 0.95rem;
          font-family: 'Baloo 2', cursive; font-weight: 600;
          cursor: pointer; z-index: 999;
          box-shadow: 0 4px 14px rgba(236, 72, 153, 0.35);
          transition: top 0.22s ease, left 0.22s ease;
          user-select: none;
        }

        /* Toast */
        .toast {
          position: fixed; top: 5%; left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 219, 238, 0.95);
          backdrop-filter: blur(14px);
          color: #9d174d; padding: 13px 28px; border-radius: 50px;
          box-shadow: 0 4px 22px rgba(190, 24, 93, 0.22);
          font-family: 'Baloo 2', cursive; font-size: 1rem; font-weight: 600;
          z-index: 99999; border: 1px solid rgba(244, 114, 182, 0.4);
          animation: toastIn 0.3s ease forwards;
          max-width: 90vw; text-align: center;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, -14px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }} />
      <div className="pixel-bg" />
      <div className="vignette" />

      {/* Floating hearts / sparkles */}
      <div className="hearts">
        {FLOATERS.map((emoji, i) => (
          <span key={i} className="heart" style={{
            left:              `${(i + 0.5) * (100 / FLOATERS.length)}%`,
            fontSize:          `${0.75 + (i % 3) * 0.32}rem`,
            animationDuration: `${9 + (i % 5) * 2.1}s`,
            animationDelay:    `${(i * 1.15) % 9}s`,
          }}>
            {emoji}
          </span>
        ))}
      </div>

      {toast && <div className="toast">{toast}</div>}

      {/* Charli — floating */}
      <div className="charli-wrap">
        <img
          src="/images/charli.png"
          alt="charli"
          className="ground-sprite"
          onClick={() => showToast("Happy birthday to my favorite human!! I'm just hanging around ❤️🎈")}
        />
      </div>

      {/* Ground animals */}
      <img src="/images/greyBunny.png"   alt="grey bunny"   className="animal ground-sprite"
        style={{ bottom: '8%', left: '23%', width: 'min(155px, 10vw)' }}
        onClick={() => showToast("Hey! Don't hit the animals 😟 — they practiced all week for this!")}
      />
      <img src="/images/fatCat.png"      alt="fat cat"      className="animal ground-sprite"
        style={{ bottom: '2%', left: '32%', width: 'min(200px, 13vw)' }}
        onClick={() => showToast("Hey! Don't hit the animals 😟 — they practiced all week for this!")}
      />
      <img src="/images/whiteBunny.png"  alt="white bunny"  className="animal ground-sprite"
        style={{ bottom: '8%', left: '44%', width: 'min(138px, 9vw)' }}
        onClick={() => showToast("Hey! Don't hit the animals 😟 — they practiced all week for this!")}
      />
      <img src="/images/birthdayDog.png" alt="birthday dog" className="animal ground-sprite"
        style={{ bottom: '2%', left: '50%', width: 'min(200px, 13vw)' }}
        onClick={() => showToast("Hey! Don't hit the animals 😟 — they practiced all week for this!")}
      />
      <img src="/images/pig.png"         alt="pig"          className="animal ground-sprite"
        style={{ bottom: '7%', left: '66%', width: 'min(200px, 13vw)' }}
        onClick={() => showToast("Hey! Don't hit the animals 😟 — they practiced all week for this!")}
      />

      {/* Message card */}
      <div className="message-card">
        <p className="card-title">
          Happy Birthday, Pretty Girl!! 🎂<br />
          <span style={{ fontSize: '0.88em', color: '#9d174d', fontWeight: 600, letterSpacing: '0.5px' }}>
            ...and Congratulations, Graduate! 🎓
          </span>
        </p>
        <p style={{
          fontFamily: "'Baloo 2', cursive", fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
          color: '#be185d', margin: '0 0 14px', opacity: 0.8
        }}>
          Do you want to see the special gift we all made for you?
        </p>
        <img
          src="/images/puppyGif.gif"
          alt="cute gif"
          className="puppy-gif"
          onClick={() => showToast("Look, it's us!! 🐶💕")}
        />
        <button id="duh-btn" className="btn-yes" onClick={launchFireworks}>
          Duh!! 🎉
        </button>
      </div>

      {/* No button */}
      <button
        className="btn-no"
        style={{ top: `${noPos.top}px`, left: `${noPos.left}px`, opacity: noPosSet ? 1 : 0 }}
        onMouseEnter={moveNoBtn}
      >
        No, you suck! 😤
      </button>
    </div>
  );
}
