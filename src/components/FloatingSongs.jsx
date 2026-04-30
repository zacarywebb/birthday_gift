import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { useNavigate } from 'react-router-dom';
import { songs, sideSongs, leftSideSongs, artworkOnly } from "../constants/songs.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const fetchCover = async (song) => {
  try {
    const query = encodeURIComponent(`${song.title} ${song.artist}`);
    const r = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&entity=musicTrack&limit=8`
    );
    const d = await r.json();
    if (!d.results?.length) return '/images/default-cover.jpeg';

    const tLow = song.title.toLowerCase();
    const aLow = song.artist.toLowerCase();

    // Score each result: exact title+artist match wins, then title-only, then first
    const scored = d.results.map((item) => {
      const t = (item.trackName  || '').toLowerCase();
      const a = (item.artistName || '').toLowerCase();
      if (t.includes(tLow) && a.includes(aLow)) return { item, score: 2 };
      if (t.includes(tLow))                      return { item, score: 1 };
      return { item, score: 0 };
    });
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0].item;
    return best.artworkUrl100?.replace('100x100bb.jpg', '600x600bb.jpg')
      || '/images/default-cover.jpeg';
  } catch {
    return '/images/default-cover.jpeg';
  }
};

export default function FloatingSongs() {
  const allSongs = [...songs, ...sideSongs, ...artworkOnly];

  const [songIdx, setSongIdx] = useState(0);
  const [order,   setOrder]   = useState(() => shuffle([...Array(allSongs.length).keys()]));
  const [artworks, setArtworks] = useState({ main: [], extra: [], side: [], left: [] });

  const [hoveredKey, setHoveredKey] = useState(null);

  const audioRef  = useRef(null);
  const navigate  = useNavigate();

  // Fetch all album art
  useEffect(() => {
    const load = async (list) => Promise.all(list.map(fetchCover));
    Promise.all([
      load(songs),
      load(artworkOnly),
      load(sideSongs),
      load(leftSideSongs),
    ]).then(([main, extra, side, left]) => setArtworks({ main, extra, side, left }));
  }, []);

  // Skip to next song
  const skipSong = () => {
    if (songIdx + 1 >= order.length) {
      setOrder(shuffle([...Array(allSongs.length).keys()]));
      setSongIdx(0);
    } else {
      setSongIdx(i => i + 1);
    }
  };

  const currentSong = allSongs[order[songIdx]];

  // Auto-play when song changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.play().catch(() => {});
  }, [currentSong]);

  // Float animation — runs after artworks load
  useEffect(() => {
    if (!artworks.main.length) return;
    gsap.utils.toArray('.float-wrap').forEach((el, i) => {
      gsap.to(el, {
        y: `${-(10 + (i % 4) * 5)}`,
        repeat: -1, yoyo: true,
        ease: 'sine.inOut',
        duration: 3.4 + (i % 5) * 0.75,
        delay: i * 0.14,
      });
    });
  }, [artworks]);

  // Now-playing artwork
  const curGlobalIdx = order[songIdx];
  const nowPlayingArt = (() => {
    if (curGlobalIdx < songs.length)
      return artworks.main[curGlobalIdx] || '/images/default-cover.jpeg';
    if (curGlobalIdx < songs.length + sideSongs.length)
      return artworks.side[curGlobalIdx - songs.length] || '/images/default-cover.jpeg';
    return artworks.extra[curGlobalIdx - songs.length - sideSongs.length] || '/images/default-cover.jpeg';
  })();

  // Build decorative artwork list with layout positions
  const decoArtworks = [
    // Top row — main playlist
    ...artworks.main.map((url, i) => ({
      key: `main-${i}`,
      url,
      label: `${songs[i].title} — ${songs[i].artist}`,
      artist: songs[i].artist,
      tooltipBelow: true,
      style: { top: '1.5%', left: `${1 + i * 5.2}%`, width: '88px', height: '88px' },
    })),
    // Bottom row — artwork-only
    ...artworks.extra.map((url, i) => ({
      key: `extra-${i}`,
      url,
      label: `${artworkOnly[i].title} — ${artworkOnly[i].artist}`,
      artist: artworkOnly[i].artist,
      style: { bottom: '1.5%', left: `${1 + i * 5.2}%`, width: '88px', height: '88px' },
    })),
    // Right column — side songs
    ...artworks.side.map((url, i) => ({
      key: `side-${i}`,
      url,
      label: `${sideSongs[i].title} — ${sideSongs[i].artist}`,
      artist: sideSongs[i].artist,
      style: { top: `${i * 11}%`, right: '1.5%', width: '88px', height: '88px' },
    })),
    // Left column — left songs
    ...artworks.left.map((url, i) => ({
      key: `left-${i}`,
      url,
      label: `${leftSideSongs[i].title} — ${leftSideSongs[i].artist}`,
      artist: leftSideSongs[i].artist,
      style: { top: `${4 + i * 11}%`, left: '1.5%', width: '88px', height: '88px' },
    })),
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700&display=swap');

        /* Full-screen fixed overlay — non-interactive by default */
        .float-overlay {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 2;
        }

        /* Each artwork wrapper */
        .float-wrap {
          position: absolute;
          border-radius: 11px; overflow: visible;
          pointer-events: auto;
        }
        .art-tooltip {
          position: absolute;
          bottom: calc(100% + 6px); left: 50%;
          transform: translateX(-50%);
          background: rgba(30, 8, 20, 0.86);
          color: #fce7f3;
          font-family: 'Baloo 2', cursive; font-size: 0.72rem; font-weight: 600;
          padding: 5px 10px; border-radius: 8px;
          white-space: nowrap; pointer-events: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          z-index: 100;
        }
        .art-tooltip.below {
          bottom: auto;
          top: calc(100% + 6px);
        }
        .float-wrap img {
          width: 100%; height: 100%;
          object-fit: cover; border-radius: 11px; display: block;
          opacity: 0.42;
          box-shadow: 0 3px 10px rgba(0,0,0,0.18);
          transition: opacity 0.25s, transform 0.22s, box-shadow 0.22s;
        }
        .float-wrap:hover img {
          opacity: 0.9;
          transform: scale(1.06);
          box-shadow: 0 6px 20px rgba(190,24,93,0.3);
        }


        /* Now Playing card */
        .now-playing {
          position: fixed; bottom: 120px; right: 20px;
          transform: none;
          background: rgba(255, 241, 248, 0.45);
          backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);
          border: 1.5px solid rgba(244, 114, 182, 0.42);
          border-radius: 22px;
          padding: 11px 18px 11px 11px;
          display: flex; align-items: center; gap: 14px;
          box-shadow:
            0 8px 34px rgba(190, 24, 93, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.08);
          pointer-events: auto; z-index: 1000;
          min-width: 270px; max-width: min(460px, 88vw);
          font-family: 'Baloo 2', cursive;
        }
        .np-art {
          width: 68px; height: 68px; border-radius: 13px;
          object-fit: cover; flex-shrink: 0;
          box-shadow: 0 3px 14px rgba(190, 24, 93, 0.28);
        }
        .np-info { flex: 1; min-width: 0; }
        .np-badge {
          font-size: 0.68rem; font-weight: 700; color: #ec4899;
          letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 3px;
        }
        .np-title {
          font-size: 0.97rem; font-weight: 700; color: #9d174d;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .np-artist {
          font-size: 0.8rem; color: #be185d; opacity: 0.72;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .skip-btn {
          background: linear-gradient(135deg, #ec4899, #be185d);
          border: none; border-radius: 50%;
          width: 38px; height: 38px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 1rem; color: white;
          box-shadow: 0 3px 12px rgba(190, 24, 93, 0.38);
          transition: transform 0.2s, box-shadow 0.2s;
          pointer-events: auto;
        }
        .skip-btn:hover {
          transform: scale(1.14);
          box-shadow: 0 5px 16px rgba(190, 24, 93, 0.55);
        }

        /* Home button */
        .home-btn {
          position: fixed; top: 20px; left: 20px;
          background: rgba(255, 241, 248, 0.88);
          backdrop-filter: blur(14px);
          border: 1.5px solid rgba(244, 114, 182, 0.4);
          border-radius: 50px; padding: 9px 22px;
          font-family: 'Baloo 2', cursive; font-size: 0.9rem; font-weight: 600;
          color: #be185d; cursor: pointer;
          box-shadow: 0 4px 14px rgba(190, 24, 93, 0.15);
          transition: transform 0.2s, box-shadow 0.2s;
          pointer-events: auto; z-index: 1000;
        }
        .home-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(190, 24, 93, 0.28);
        }
      `}</style>

      <audio
        ref={audioRef}
        src={currentSong?.mp3}
        onEnded={skipSong}
        autoPlay
      />

      {/* Floating album art overlay */}
      <div className="float-overlay">
        {decoArtworks.map((art) => (
          <div
            key={art.key}
            className="float-wrap"
            style={{ position: 'absolute', ...art.style }}
            onMouseEnter={() => setHoveredKey(art.key)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <img src={art.url} alt={art.label} />
            {hoveredKey === art.key && (
              <div className={`art-tooltip${art.tooltipBelow ? ' below' : ''}`}>{art.artist}</div>
            )}
          </div>
        ))}
      </div>

      {/* Now Playing card */}
      <div className="now-playing">
        <img src={nowPlayingArt} alt="album art" className="np-art" />
        <div className="np-info">
          <div className="np-badge">♪ Now Playing</div>
          <div className="np-title">{currentSong?.title || '…'}</div>
          <div className="np-artist">{currentSong?.artist || ''}</div>
        </div>
        <button className="skip-btn" onClick={skipSong} title="Skip song">⏭</button>
      </div>

      <button className="home-btn" onClick={() => navigate('/')}>← Home</button>
    </>
  );
}
