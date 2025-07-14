import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const [noPos, setNoPos] = useState({ top: 0, left: 0 });
  const [showToast, setShowToast] = useState(false);
  const [charliToast, setCharliToast] = useState(false);
  const [gifToast, setGifToast] = useState(false);

  const moveNoButton = () => {
    const container = document.getElementById('bg-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = Math.floor(Math.random() * (rect.width - 300));
      const y = Math.floor(Math.random() * (rect.height - 300));
      setNoPos({ top: y, left: x });
    }
  };

useEffect(() => {
  const updatePositionAfterLoad = () => {
    requestAnimationFrame(() => {
      const duhBtn = document.getElementById('duh-btn');
      const container = document.getElementById('bg-container');
      if (duhBtn && container) {
        const rect = duhBtn.getBoundingClientRect();
        const parentRect = container.getBoundingClientRect();
        setNoPos({
          top: rect.top - parentRect.top,
          left: rect.left - parentRect.left + rect.width + 15
        });
      }
    });
  };

  // Trigger after all images/fonts loaded
  if (document.readyState === 'complete') {
    updatePositionAfterLoad();
  } else {
    window.addEventListener('load', updatePositionAfterLoad);
    return () => window.removeEventListener('load', updatePositionAfterLoad);
  }

  window.addEventListener('resize', updatePositionAfterLoad);
  return () => window.removeEventListener('resize', updatePositionAfterLoad);
}, []);


  const handleSpriteClick = (charliClick, gifClick=false) => {
    if (charliClick) {
      setCharliToast(true);
      setTimeout(() => setCharliToast(false), 5000);
      return;
    }
    if (gifClick) {
      setGifToast(true);
      setTimeout(() => setGifToast(false), 3500);
      return;
    }
    // Show toast message when any sprite is clicked
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const navigate = useNavigate();
  const handleDuhButtonClick = () => {
    navigate('/letters');
  };


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;700&display=swap');

        .bg-container {
          position: fixed;
          width: 1800px;
          height: 1000px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-image: url('/images/landingBackground.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          image-rendering: pixelated;
          z-index: 0;
        }

        .cute-button {
          background-color: #c2185b;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 1rem;
          font-family: 'Baloo 2', cursive;
          transition: transform 0.2s ease, filter 0.2s ease;
        }

        .cute-button:hover {
          transform: scale(1.15);
          filter: brightness(1.1);
        }

        .gif-hover {
          transition: transform 0.3s ease;
        }

        .gif-hover:hover {
          transform: scale(1.15);
        }

        @keyframes float {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(-200px); }
          100% { transform: translateY(0); }
        }

        .floating {
          animation: float 12s ease-in-out infinite;
        }

        .sprite {
          position: absolute;
          image-rendering: pixelated;
          transition: transform 0.3s ease;
        }

        .sprite:hover {
          transform: scale(1.15);
          cursor: pointer;
        }

        .sprite.floating:hover {
          animation-play-state: paused;
          transform: translateY(-200px) scale(1.15);
        }

        .charli { position: absolute; bottom: 40%; left: 10%; }
        .charli img { width: 350px; }

        .greyBunny { bottom: 80px; left: 420px; width: 180px; }
        .whiteBunny { bottom: 80px; left: 800px; width: 150px; }
        .fatCat { bottom: 20px; left: 570px; width: 240px; }
        .birthdayDog { bottom: 20px; left: 900px; width: 225px; }
        .pig { bottom: 70px; left: 1200px; width: 225px; }

        .no-button {
          position: absolute;
          transition: top 0.2s ease, left 0.2s ease;
          z-index: 10000;
        }

        .message-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(255, 228, 236, 0.8);
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 0 20px rgba(255, 105, 180, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          max-width: 600px;
          width: 90%;
          z-index: 1;
        }

        .custom-toast {
          position: fixed;
          top: 10%;
          left: 50%;
          transform: translateX(-50%);
          background: #ffcae9;
          color: #b4004e;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          font-family: 'Baloo 2', cursive;
          font-size: 1.2rem;
          z-index: 9999;
          opacity: 1;
          transition: opacity 0.3s ease;
        }

      `}</style>

      <div id="bg-container" className="bg-container">
        {/* Toast */}
        {showToast && (
          <div className="custom-toast">
            Hey! Don’t hit the animals😟 — they practiced all week for this! 
          </div>
        )}
        {charliToast && (
          <div className="custom-toast">
            Happy birthday to my favorite human!! Don't mind me, I'm just hanging around❤️🎈
          </div>
        )}
        {gifToast && (
          <div className="custom-toast">
            Look, it's us!! 🐶💕
          </div>
        )}

        {/* Sprites */}
        <div className="floating charli">
          <img src="/images/charli.png" alt="charli" className="sprite" onClick={() => handleSpriteClick(true)}/>
        </div>
        <img src="/images/greyBunny.png" alt="grey bunny" className="sprite greyBunny" onClick={() => handleSpriteClick(false)}/>
        <img src="/images/whiteBunny.png" alt="white bunny" className="sprite whiteBunny" onClick={() => handleSpriteClick(false)}/>
        <img src="/images/fatCat.png" alt="fat cat" className="sprite fatCat" onClick={() => handleSpriteClick(false)}/>
        <img src="/images/birthdayDog.png" alt="birthday dog" className="sprite birthdayDog" onClick={() => handleSpriteClick(false)}/>
        <img src="/images/pig.png" alt="birthday pig" className="sprite pig" onClick={() => handleSpriteClick(false)}/>

        {/* Message Container */}
        <div className="message-container">
          <h1 style={{
            fontSize: '1.4rem',
            marginBottom: '20px',
            padding: '0 10px',
            color: '#c2185b',
            fontFamily: "'Baloo 2', cursive",
          }}>
            Happy Birthday, Pretty Girl!!<br />
            Do you want to see the special gift we all made for you!?
          </h1>
          <img
            src="/images/puppyGif.gif"
            alt="cute gif"
            className="gif-hover"
            onClick={() => handleSpriteClick(false, true)}
            style={{ width: '220px' }}
          />
          <div style={{ marginTop: '20px' }}>
            <button
              id="duh-btn"
              onClick={() => handleDuhButtonClick()}
              className="cute-button yes-button"
              style={{ marginRight: '100px' }}
            >
              Duh!!
            </button>
          </div>
        </div>

        {/* No Button */}
        <button
          onMouseEnter={moveNoButton}
          className="cute-button no-button"
          style={{
            top: `${noPos.top}px`,
            left: `${noPos.left}px`,
          }}
        >
          No, you suck!
        </button>
      </div>
    </>
  );
}
