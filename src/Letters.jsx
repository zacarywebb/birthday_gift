import { useRef, useEffect, useState } from "react";
import { letters } from "./constants/letters.js";
import { gsap } from "gsap";
import FloatingSongs from "./components/FloatingSongs.jsx";
export default function Letters() {
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".letters-container",
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleNextLetter = () => {
    setCurrentLetterIndex((prev) =>
      prev < letters.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrevLetter = () => {
    setCurrentLetterIndex((prev) =>
      prev > 0 ? prev - 1 : letters.length - 1
    );
  };



  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;700&display=swap');

        .letters-bg {
          position: fixed;
          width: 100vw;
          height: 100vh;
          top: 0;
          left: 0;
          background-image: url('/images/lettersBackground.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          image-rendering: pixelated;
          z-index: -2;
        }

        .letters-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          gap: 40px;
          flex-wrap: wrap;
        }

        .gif-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .dancing-gif {
          width: 250px;
          max-width: 40vw;
          image-rendering: pixelated;
        }

        .arrow-gif {
          width: 100px;
          max-width: 15vw;
          image-rendering: pixelated;
        }

        .letters-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 10px;
          max-width: 800px;
          background-color: rgba(255, 240, 246, 0.7);
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          font-family: 'Baloo 2', cursive;
          color: #b4004e;
          text-align: center;
        }

        .letter-sprite {
          background-image: url('/images/letterSprite.png');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          margin-bottom: 20px;
          width: 100%;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          image-rendering: pixelated;
          font-family: 'Shadows Into Light', cursive;
          font-size: 1.3rem;
          color: #5c3a2e;
          text-align: left;
          white-space: pre-wrap;
        }

        .letter-text h2 {
          margin-bottom: 12px;
          font-size: 1.6rem;
          color: #a35646;
        }

        .nav-buttons {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 20px;
        }

        .cute-button {
          background-color: #c2185b;
          color: rgb(253, 208, 225);
          border: none;
          border-radius: 10px;
          padding: 10px 22px;
          cursor: pointer;
          font-size: 1rem;
          font-family: 'Baloo 2', cursive;
          transition: transform 0.2s ease, filter 0.2s ease;
          margin-bottom: 50px;
        }

        .cute-button:hover {
          transform: scale(1.1);
          filter: brightness(1.1);
        }

        .gif-hover {
          transition: transform 0.3s ease;
        }

        .music-gif {
          width: 180px;
          max-width: 40vw;
          image-rendering: pixelated;
        }
      `}</style>

      <div className="letters-bg"></div>

      <div className="letters-wrapper" ref={containerRef}>
        <div className="gif-column">
          <img src="/images/dancingGif.gif" alt="Dancing GIF" className="dancing-gif" />
        </div>

        <div className="letters-container">
          <div className="letter-sprite">
            <div className="letter-text">
              <h1>Letters from Yours</h1>
              <h2>Dear Reese,</h2>
              {letters[currentLetterIndex]}
            </div>
          </div>
          <div className="nav-buttons">
            <button className="cute-button" onClick={handlePrevLetter}>Previous</button>
            <button className="cute-button" onClick={handleNextLetter}>Next</button>
          </div>
        </div>

        <img src="/images/musicGif.gif" alt="Music GIF" className="music-gif" />

        <FloatingSongs />
      </div>
    </>
  );
}
