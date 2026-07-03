import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { letters } from "./constants/letters.js";
import { gsap } from "gsap";
import FloatingSongs from "./components/FloatingSongs.jsx";

export default function Letters() {
  const [idx, setIdx]       = useState(0);
  const containerRef         = useRef(null);
  const letterBodyRef        = useRef(null);
  const navigate             = useNavigate();

  // Entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.letter-card',
        { opacity: 0, y: 55 },
        { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const goTo = (newIdx) => {
    const el = letterBodyRef.current;
    if (!el) { setIdx(newIdx); return; }
    gsap.to(el, {
      opacity: 0, y: -14, duration: 0.28, ease: 'power2.in',
      onComplete: () => {
        setIdx(newIdx);
        gsap.fromTo(el,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' }
        );
      },
    });
  };

  const prev = () => goTo(idx > 0 ? idx - 1 : letters.length - 1);
  const next = () => goTo(idx < letters.length - 1 ? idx + 1 : 0);

  return (
    <div ref={containerRef} style={{ position: 'relative', minHeight: '100vh', fontFamily: "'Baloo 2', cursive" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700&display=swap');

        .letters-pixel-bg {
          position: fixed; inset: 0;
          background-image: url('/images/lettersBackground.png');
          background-size: cover; background-position: center;
          image-rendering: pixelated; z-index: -1;
        }
        .letters-pixel-bg::after {
          content: '';
          position: absolute; inset: 0;
          background: rgba(30, 10, 20, 0.18);
        }

        .letters-page {
          display: flex; justify-content: center; align-items: center;
          min-height: 100vh; padding: 80px 20px 140px;
        }

        /* Card */
        .letter-card {
          max-width: min(700px, 92vw); width: 100%;
          background: rgba(255, 251, 245, 0.92);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(212, 168, 83, 0.32);
          border-radius: 8px;
          box-shadow:
            0 16px 56px rgba(0, 0, 0, 0.22),
            0 2px  8px  rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.9);
          overflow: hidden;
        }

        /* Card header */
        .card-header {
          background: linear-gradient(135deg, #c2185b 0%, #880e4f 100%);
          padding: 22px 32px 18px;
          text-align: center;
        }
        .card-header-title {
          font-family: 'Baloo 2', cursive;
          font-size: clamp(1.1rem, 2.5vw, 1.5rem);
          font-weight: 700; color: rgba(255,255,255,0.96);
          letter-spacing: 1px; margin: 0 0 5px;
        }
        .letter-counter {
          font-family: 'Baloo 2', cursive;
          font-size: 0.8rem; color: rgba(255,218,234,0.8);
          letter-spacing: 2.5px; text-transform: uppercase;
        }

        /* Dot indicators */
        .dots-row {
          display: flex; justify-content: center; gap: 7px;
          padding: 14px 16px;
          background: rgba(252, 231, 243, 0.5);
          border-bottom: 1px solid rgba(212, 168, 83, 0.14);
          flex-wrap: wrap;
        }
        .dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: rgba(190, 24, 93, 0.22);
          transition: background 0.25s, transform 0.25s;
          cursor: pointer; flex-shrink: 0;
        }
        .dot.active { background: #be185d; transform: scale(1.35); }
        .dot:hover:not(.active) { background: rgba(190, 24, 93, 0.5); }

        /* Letter body */
        .letter-body {
          padding: 32px 38px 28px;
          min-height: 380px;
          display: flex; flex-direction: column; position: relative;
          background: rgba(255, 250, 243, 0.6);
        }
        .letter-body::before {
          content: '';
          position: absolute; inset: 0;
          background-image: url('/images/letterPaper.png');
          background-size: cover; background-position: center;
          opacity: 0.22;
          pointer-events: none; border-radius: 0;
        }
        .letter-salutation {
          font-family: 'Shadows Into Light', cursive;
          font-size: clamp(1.05rem, 2vw, 1.3rem);
          color: #7c3d28; margin: 0 0 14px; font-style: italic;
        }
        .letter-text {
          font-family: 'Shadows Into Light', cursive;
          font-size: clamp(1.05rem, 2vw, 1.25rem);
          color: #5c3020; line-height: 1.9;
          white-space: pre-wrap; margin: 0; flex: 1;
        }

        /* Navigation */
        .letter-nav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 28px;
          background: rgba(252, 231, 243, 0.65);
          border-top: 1px solid rgba(244, 114, 182, 0.2);
        }
        .nav-btn {
          background: linear-gradient(135deg, #ec4899, #be185d);
          color: white; border: none; border-radius: 50px;
          padding: 11px 30px; font-size: 0.95rem;
          font-family: 'Baloo 2', cursive; font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(190, 24, 93, 0.32);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .nav-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(190, 24, 93, 0.48);
        }
        .nav-btn:active { transform: scale(0.97); }

        /* Map page link — mirrors the Home button, top-right */
        .map-link-btn {
          position: fixed; top: 20px; right: 20px;
          background: rgba(255, 241, 248, 0.88);
          backdrop-filter: blur(14px);
          border: 1.5px solid rgba(244, 114, 182, 0.4);
          border-radius: 50px; padding: 9px 22px;
          font-family: 'Baloo 2', cursive; font-size: 0.9rem; font-weight: 600;
          color: #be185d; cursor: pointer;
          box-shadow: 0 4px 14px rgba(190, 24, 93, 0.15);
          transition: transform 0.2s, box-shadow 0.2s;
          z-index: 1000;
        }
        .map-link-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(190, 24, 93, 0.28);
        }
      `}</style>

      <button className="map-link-btn" onClick={() => navigate('/map')}>
        Our Adventures →
      </button>

      <div className="letters-pixel-bg" />

      <div className="letters-page">
        <div className="letter-card">

          <div className="card-header">
            <div className="card-header-title">✉ Letters from Yours</div>
            <div className="letter-counter">Letter {idx + 1} of {letters.length}</div>
          </div>

          <div className="dots-row">
            {letters.map((_, i) => (
              <div
                key={i}
                className={`dot${i === idx ? ' active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          <div className="letter-body">
            <p className="letter-salutation">Dear Reese,</p>
            <p ref={letterBodyRef} className="letter-text">
              {letters[idx]}
            </p>
          </div>

          <div className="letter-nav">
            <button className="nav-btn" onClick={prev}>← Prev</button>
            <button className="nav-btn" onClick={next}>Next →</button>
          </div>

        </div>
      </div>

      <FloatingSongs />
    </div>
  );
}
