import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const FULL_TEXT =
`To the love of my life,

Though I strive for greatness in all aspects of my life... my greatest accomplishment will always have been to know you. For all of the times where it felt like all we had was each other; for all of the times you loved me enough for the both of us; know that it is you my soul orbits about; you are the song it will never stop singing.

Can you hear the music?`;

const PAUSES  = { '.': 480, ',': 175, ';': 190, '?': 520, '!': 420 };
const SPEED   = 72; // ms per character base

export default function Typewriter() {
  const [charCount, setCharCount] = useState(0);
  const [done,      setDone]      = useState(false);
  const [fadeOut,   setFadeOut]   = useState(false);
  const navigate  = useNavigate();
  const timerRef  = useRef(null);
  const idxRef    = useRef(0);
  const exitedRef = useRef(false);

  const doExit = () => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    setDone(true);
    setTimeout(() => setFadeOut(true), 5500);
    setTimeout(() => navigate('/letters'), 6900);
  };

  useEffect(() => {
    const type = () => {
      if (idxRef.current >= FULL_TEXT.length) { doExit(); return; }
      const ch = FULL_TEXT[idxRef.current++];
      setCharCount(idxRef.current);
      timerRef.current = setTimeout(type, PAUSES[ch] ?? SPEED);
    };
    timerRef.current = setTimeout(type, 1000); // opening pause
    return () => clearTimeout(timerRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const skip = () => {
    clearTimeout(timerRef.current);
    idxRef.current = FULL_TEXT.length;
    setCharCount(FULL_TEXT.length);
    doExit();
  };

  const displayed   = FULL_TEXT.slice(0, charCount);
  const paragraphs  = displayed.split('\n\n');

  return (
    <div
      onClick={skip}
      style={{
        position: 'fixed', inset: 0, cursor: 'pointer',
        background: 'radial-gradient(ellipse at center, #1c0d16 0%, #060206 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 1.4s ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400&display=swap');

        .tw-wrap {
          max-width: min(680px, 84vw);
          padding: 48px 32px;
          text-align: center;
        }

        .tw-para {
          font-family: 'Shadows Into Light', cursive;
          font-size: clamp(1.25rem, 2.3vw, 1.65rem);
          color: rgba(255, 235, 245, 0.88);
          line-height: 2.05;
          margin: 0 0 2em;
          white-space: pre-wrap;
        }
        .tw-para:last-child { margin-bottom: 0; }

        /* Last line — "Can you hear the music?" */
        .tw-para.final {
          color: rgba(255, 190, 220, 0.95);
          font-size: clamp(1.35rem, 2.6vw, 1.8rem);
          letter-spacing: 0.5px;
        }

        /* Blinking cursor */
        .tw-cursor {
          display: inline-block;
          width: 1.5px; height: 1em;
          background: rgba(255, 190, 220, 0.75);
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 0.9s step-end infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }

        .tw-hint {
          position: fixed; bottom: 28px; left: 50%;
          transform: translateX(-50%);
          font-family: 'Baloo 2', cursive;
          font-size: 0.7rem; letter-spacing: 2.5px;
          text-transform: uppercase;
          color: rgba(255, 180, 210, 0.28);
          pointer-events: none;
        }
      `}</style>

      <div className="tw-wrap">
        {paragraphs.map((para, i) => {
          const isLast = i === paragraphs.length - 1;
          const isFinalPara = isLast && para.includes('Can you hear');
          return (
            <p key={i} className={`tw-para${isFinalPara ? ' final' : ''}`}>
              {para}
              {isLast && !done && <span className="tw-cursor" />}
            </p>
          );
        })}
      </div>

      {!done && <div className="tw-hint">tap to skip</div>}
    </div>
  );
}
