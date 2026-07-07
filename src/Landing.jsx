import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

const FLOATERS = [
  '💕','✨','🌸','💖','🌷','✨','💗','🌸','💕','✨','💝','🌺'
];

export default function Landing() {
  // The No button lives inline next to Duh!! until first touched,
  // then escapes into fixed positioning and dodges around the screen
  const [noEscaped, setNoEscaped] = useState(false);
  const [noPos, setNoPos]         = useState({ top: 0, left: 0 });
  const [toast, setToast]     = useState(null);
  const containerRef           = useRef(null);
  const canvasRef              = useRef(null);
  const animRef                = useRef(null);
  const navigate               = useNavigate();

  // GSAP entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.message-card',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.05, ease: 'power3.out', delay: 0.15 }
      );
      gsap.fromTo('.ground-sprite',
        { y: 44, opacity: 0, scale: 0.82 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.12, duration: 0.75, ease: 'back.out(1.5)', delay: 0.45 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const moveNoBtn = () => {
    // Clamped so the button always stays fully tappable on screen
    setNoPos({
      top:  12 + Math.random() * Math.max(0, window.innerHeight - 76),
      left: 12 + Math.random() * Math.max(0, window.innerWidth - 174),
    });
    setNoEscaped(true);
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
          width: clamp(110px, 17vw, 280px);
          image-rendering: pixelated; cursor: pointer;
        }
        .charli-wrap img:hover { filter: brightness(1.12) drop-shadow(0 0 4px rgba(255,160,200,0.5)); }

        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0);     }
          50%      { transform: translateY(-16px); }
        }

        /* Message card */
        .message-card {
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
          max-width: min(520px, 88vw); width: 100%;
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

        .btn-row {
          display: flex; flex-wrap: wrap; gap: 12px;
          justify-content: center; align-items: center;
          margin-top: 20px;
        }
        .btn-yes {
          background: linear-gradient(135deg, #ec4899, #be185d);
          color: white; border: none; border-radius: 50px;
          padding: 13px 36px; font-size: 1.05rem;
          font-family: 'Baloo 2', cursive; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 5px 18px rgba(190, 24, 93, 0.38);
          transition: transform 0.2s, box-shadow 0.2s;
          letter-spacing: 0.3px;
        }
        .btn-yes:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 26px rgba(190, 24, 93, 0.52);
        }
        .btn-yes:active { transform: scale(0.97); }

        /* No button — inline until it escapes, then fixed and dodging */
        .btn-no {
          background: linear-gradient(135deg, #f9a8d4, #ec4899);
          color: white; border: none; border-radius: 50px;
          padding: 11px 26px; font-size: 0.95rem;
          font-family: 'Baloo 2', cursive; font-weight: 600;
          cursor: pointer; z-index: 999;
          box-shadow: 0 4px 14px rgba(236, 72, 153, 0.35);
          transition: top 0.22s ease, left 0.22s ease;
          user-select: none; -webkit-user-select: none;
          touch-action: manipulation;
        }
        .btn-no.escaped { position: fixed; }

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
        style={{ bottom: '8%', left: '23%', width: 'clamp(58px, 10vw, 155px)' }}
        onClick={() => showToast("Hey! Don't hit the animals 😟 — they practiced all week for this!")}
      />
      <img src="/images/fatCat.png"      alt="fat cat"      className="animal ground-sprite"
        style={{ bottom: '2%', left: '32%', width: 'clamp(74px, 13vw, 200px)' }}
        onClick={() => showToast("Hey! Don't hit the animals 😟 — they practiced all week for this!")}
      />
      <img src="/images/whiteBunny.png"  alt="white bunny"  className="animal ground-sprite"
        style={{ bottom: '8%', left: '44%', width: 'clamp(52px, 9vw, 138px)' }}
        onClick={() => showToast("Hey! Don't hit the animals 😟 — they practiced all week for this!")}
      />
      <img src="/images/birthdayDog.png" alt="birthday dog" className="animal ground-sprite"
        style={{ bottom: '2%', left: '50%', width: 'clamp(74px, 13vw, 200px)' }}
        onClick={() => showToast("Hey! Don't hit the animals 😟 — they practiced all week for this!")}
      />
      <img src="/images/pig.png"         alt="pig"          className="animal ground-sprite"
        style={{ bottom: '7%', left: '66%', width: 'clamp(74px, 13vw, 200px)' }}
        onClick={() => showToast("Hey! Don't hit the animals 😟 — they practiced all week for this!")}
      />

      {/* Message card — centered via flex wrapper so GSAP y-animation never conflicts */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, pointerEvents: 'none' }}>
      <div className="message-card" style={{ pointerEvents: 'auto', zIndex: 'auto' }}>
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
        <div className="btn-row">
          <button className="btn-yes" onClick={launchFireworks}>
            Duh!! 🎉
          </button>
          <button
            className={`btn-no${noEscaped ? ' escaped' : ''}`}
            style={noEscaped ? { top: `${noPos.top}px`, left: `${noPos.left}px` } : undefined}
            onMouseEnter={moveNoBtn}
            onTouchStart={(e) => { e.preventDefault(); moveNoBtn(); }}
            onClick={moveNoBtn}
          >
            No, you suck! 😤
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
