import { useEffect, useRef, useState } from "react";
import { songs, sideSongs, artworkOnly } from "../constants/songs.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const allSongs = [...songs, ...sideSongs, ...artworkOnly];

export default function MusicPlayer() {
  const [order, setOrder]     = useState(() => shuffle([...Array(allSongs.length).keys()]));
  const [songIdx, setSongIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const currentSong = allSongs[order[songIdx]];

  const skipSong = () => {
    if (songIdx + 1 >= order.length) {
      setOrder(shuffle([...Array(allSongs.length).keys()]));
      setSongIdx(0);
    } else {
      setSongIdx(i => i + 1);
    }
  };

  // Auto-play when the song changes (mobile browsers may block until first tap)
  useEffect(() => {
    audioRef.current?.play().catch(() => setPlaying(false));
  }, [currentSong]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700&display=swap');

        .music-player {
          position: fixed;
          bottom: calc(14px + env(safe-area-inset-bottom));
          right: 14px;
          background: rgba(255, 241, 248, 0.82);
          backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);
          border: 1.5px solid rgba(244, 114, 182, 0.42);
          border-radius: 20px;
          padding: 9px 12px 9px 9px;
          display: flex; align-items: center; gap: 11px;
          box-shadow:
            0 8px 34px rgba(190, 24, 93, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.08);
          z-index: 1000;
          width: min(340px, calc(100vw - 28px));
          font-family: 'Baloo 2', cursive;
        }
        @media (max-width: 640px) {
          .music-player {
            right: 50%;
            transform: translateX(50%);
          }
        }
        .mp-art {
          width: 52px; height: 52px; border-radius: 12px;
          object-fit: cover; flex-shrink: 0;
          box-shadow: 0 3px 14px rgba(190, 24, 93, 0.28);
        }
        .mp-info { flex: 1; min-width: 0; }
        .mp-badge {
          font-size: 0.62rem; font-weight: 700; color: #ec4899;
          letter-spacing: 1.4px; text-transform: uppercase; margin-bottom: 2px;
        }
        .mp-title {
          font-size: 0.9rem; font-weight: 700; color: #9d174d;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mp-artist {
          font-size: 0.75rem; color: #be185d; opacity: 0.72;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mp-btn {
          background: linear-gradient(135deg, #ec4899, #be185d);
          border: none; border-radius: 50%;
          width: 36px; height: 36px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 0.9rem; color: white;
          box-shadow: 0 3px 12px rgba(190, 24, 93, 0.38);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .mp-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 5px 16px rgba(190, 24, 93, 0.55);
        }
        .mp-btn:active { transform: scale(0.95); }
      `}</style>

      <audio
        ref={audioRef}
        src={currentSong?.mp3}
        onEnded={skipSong}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        autoPlay
      />

      <div className="music-player">
        <img src="/images/musicGif.gif" alt="music" className="mp-art" />
        <div className="mp-info">
          <div className="mp-badge">♪ Now Playing</div>
          <div className="mp-title">{currentSong?.title || '…'}</div>
          <div className="mp-artist">{currentSong?.artist || ''}</div>
        </div>
        <button className="mp-btn" onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>
          {playing ? '⏸' : '▶'}
        </button>
        <button className="mp-btn" onClick={skipSong} title="Skip song">⏭</button>
      </div>
    </>
  );
}
