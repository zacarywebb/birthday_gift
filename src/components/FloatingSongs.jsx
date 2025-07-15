import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { useNavigate } from 'react-router-dom'
import {
  songs,
  sideSongs,
  leftSideSongs,
  artworkOnly,
} from "../constants/songs.js";

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 1; i--) {
    const j = Math.floor(Math.random() * (i - 1)) + 1;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const indexOfZero = arr.indexOf(0);
  if (indexOfZero !== 0) {
    [arr[0], arr[indexOfZero]] = [arr[indexOfZero], arr[0]];
  }
  return arr;
}

export default function FloatingSongs() {
  const allSongs = [...songs, ...sideSongs];

  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [shuffledArrayIndices, setShuffledArrayIndices] = useState(
    shuffleArray([...Array(allSongs.length).keys()])
  );

  const [songArtworks, setSongArtworks] = useState([]);
  const [artworkOnlyCovers, setArtworkOnlyCovers] = useState([]);
  const [sideArtworks, setSideArtworks] = useState([]);
  const [leftArtworks, setLeftArtworks] = useState([]);

  const audioRef = useRef(null);

  const fetchArtworkForList = async (list) => {
    const covers = await Promise.all(
      list.map(async (song) => {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(
            `${song.title} ${song.artist}`
          )}&limit=1`
        );
        const data = await res.json();
        return (
          data.results[0]?.artworkUrl100?.replace(
            "100x100bb.jpg",
            "300x300bb.jpg"
          ) || "/images/default-cover.jpeg"
        );
      })
    );
    return covers;
  };

  useEffect(() => {
    const fetchAllArtworks = async () => {
      const [main, extra, side, left] = await Promise.all([
        fetchArtworkForList(songs),
        fetchArtworkForList(artworkOnly),
        fetchArtworkForList(sideSongs),
        fetchArtworkForList(leftSideSongs),
      ]);
      setSongArtworks(main);
      setArtworkOnlyCovers(extra);
      setSideArtworks(side);
      setLeftArtworks(left);
    };

    fetchAllArtworks();
  }, []);

  const handleSongEnd = () => {
    if (currentSongIndex + 1 >= shuffledArrayIndices.length) {
      setShuffledArrayIndices(
        shuffleArray([...Array(allSongs.length).keys()])
      );
      setCurrentSongIndex(0);
    } else {
      setCurrentSongIndex((i) => i + 1);
    }
  };
  const navigate = useNavigate();
  const handleGoHome = () => {
    navigate("/");
  };

  const currentSong = allSongs[shuffledArrayIndices[currentSongIndex]];

  useEffect(() => {
    if (audioRef.current) audioRef.current.play();
  }, [currentSong]);

  useEffect(() => {
    gsap.utils.toArray(".floating-art").forEach((el, i) => {
      gsap.to(el, {
        y: "-=20",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        duration: 4 + Math.random() * 2,
        delay: i * 0.1,
      });
    });
  }, [songArtworks, artworkOnlyCovers, sideArtworks, leftArtworks]);

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSong?.mp3}
        onEnded={handleSongEnd}
        autoPlay
      />

      <div className="floating-songs-container">
        {/* main playlist (top‑left, horizontal) */}
        {songArtworks.map((url, idx) => (
          <img
            key={`main-${idx}`}
            src={url}
            alt={`${songs[idx].title} artwork`}
            className="floating-art"
            style={{
              position: "absolute",
              width: "100px",
              height: "100px",
              top: "2%",
              left: `${1 + idx * 5}%`,
              zIndex: 0,
              opacity: 0.38,
              pointerEvents: "none",
              borderRadius: "8px",
            }}
          />
        ))}

        {/* artwork‑only (bottom‑left, horizontal) */}
        {artworkOnlyCovers.map((url, idx) => (
          <img
            key={`extra-${idx}`}
            src={url}
            alt={`${artworkOnly[idx].title} artwork`}
            className="floating-art"
            style={{
              position: "absolute",
              width: "100px",
              height: "100px",
              bottom: "-2%",
              left: `${1 + idx * 5.5}%`,
              zIndex: 0,
              opacity: 0.38,
              pointerEvents: "none",
              borderRadius: "8px",
            }}
          />
        ))}

        {/* sideSongs (RIGHT column, vertical) */}
        {sideArtworks.map((url, idx) => (
          <img
            key={`side-${idx}`}
            src={url}
            alt={`${sideSongs[idx].title} artwork`}
            className="floating-art"
            style={{
              position: "absolute",
              width: "100px",
              height: "100px",
              top: `${ idx * 11}%`,
              right: "2%",
              zIndex: 0,
              opacity: 0.38,
              pointerEvents: "none",
              borderRadius: "8px",
            }}
          />
        ))}

        {/* leftSideSongs (LEFT column, vertical) */}
        {leftArtworks.map((url, idx) => (
          <img
            key={`left-${idx}`}
            src={url}
            alt={`${leftSideSongs[idx].title} artwork`}
            className="floating-art"
            style={{
              position: "absolute",
              width: "100px",
              height: "100px",
              top: `${5 + idx * 11}%`,
              left: "2%",
              zIndex: 0,
              opacity: 0.38,
              pointerEvents: "none",
              borderRadius: "8px",
            }}
          />
        ))}

        {/* fast‑forward button */}
        <img
          src="/images/arrow_gif.gif"
          alt="Fast forward arrow"
          onClick={handleSongEnd}
          style={{
            position: "fixed",
            bottom: "200px",
            right: "190px",
            width: "100px",
            cursor: "pointer",
            zIndex: 9999,
            imageRendering: "pixelated",
            opacity: 0.8,
            transition: "transform 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.25)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />
        <div className="nav-buttons">
          <button 
          className="cute-button" 
          onClick={handleGoHome}
          style = {{
            position: "fixed",
            bottom: "0px",
            right: "20px",
            zIndex: 9999,
          }}>Home</button>
        </div>
      </div>
    </>
  );
}
