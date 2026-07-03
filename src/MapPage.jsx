import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase, MAP_PASSWORD, PHOTO_BUCKET, photoUrl } from './lib/supabase.js';

const DEFAULT_CENTER = [39.5, -98.35]; // roughly center of the US
const DEFAULT_ZOOM   = 4;

const makeIcon = (emoji) => L.divIcon({
  className: 'pin-marker',
  html: `<div class="pin-emoji">${emoji}</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 36],
});
const ICONS = {
  both:  makeIcon('💖'),
  zac:   makeIcon('🧑🏽'),
  reese: makeIcon('👩🏻'),
};
const iconFor = (owner) => ICONS[owner] || ICONS.both;

const ownerEmoji = (p) => p.owner === 'zac' ? '🧑🏽' : p.owner === 'reese' ? '👩🏻' : '💖';
const ownerLabel = (p) => p.owner === 'zac' ? "Zac's adventure" : p.owner === 'reese' ? "Reese's adventure" : '';

function ClickCatcher({ active, onPick }) {
  useMapEvents({
    click(e) {
      if (active) onPick(e.latlng);
    },
  });
  return null;
}

const fmtDate = (d) => {
  if (!d) return null;
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
};

export default function MapPage() {
  const navigate = useNavigate();

  const [pins, setPins]         = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding]     = useState(false);
  const [draftPos, setDraftPos] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [toast, setToast]       = useState(null);
  const [saving, setSaving]     = useState(false);

  // Password gate
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('map-unlocked') === '1');
  const [askPw, setAskPw]       = useState(false);
  const [pwInput, setPwInput]   = useState('');
  const [pwError, setPwError]   = useState(false);
  const pendingRef = useRef(null);

  // New-pin form
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('both');
  const [files, setFiles] = useState([]);
  const [dropHover, setDropHover] = useState(false);
  const [cardDropHover, setCardDropHover] = useState(false);

  // Editing existing pins
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [markerNonce, setMarkerNonce] = useState(0); // bumped to snap dragged pins back

  const addPhotosInputRef = useRef(null);
  const newPinInputRef    = useRef(null);

  const imageFiles = (list) => [...list].filter(f => f.type.startsWith('image/'));

  const selected = pins.find(p => p.id === selectedId) || null;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const loadPins = async () => {
    const { data, error } = await supabase
      .from('pins')
      .select('*, pin_photos(*)')
      .order('created_at', { ascending: true });
    if (error) { showToast("Couldn't load our pins 😢 — try refreshing?"); return; }
    setPins(data || []);
  };

  useEffect(() => {
    if (supabase) loadPins();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Leaving a pin or switching pins closes any in-progress title edit
  useEffect(() => { setEditingTitle(false); }, [selectedId]);

  // Run an action only once the password has been entered
  const withPassword = (action) => {
    if (unlocked || !MAP_PASSWORD) { action(); return; }
    pendingRef.current = action;
    setPwInput('');
    setPwError(false);
    setAskPw(true);
  };

  const cancelPassword = () => {
    setAskPw(false);
    pendingRef.current = null;
    setMarkerNonce(n => n + 1); // snap any dragged-but-unsaved pin back to its saved spot
  };

  const submitPassword = (e) => {
    e.preventDefault();
    if (pwInput === MAP_PASSWORD) {
      sessionStorage.setItem('map-unlocked', '1');
      setUnlocked(true);
      setAskPw(false);
      pendingRef.current?.();
      pendingRef.current = null;
    } else {
      setPwError(true);
    }
  };

  const startAdding = () => withPassword(() => {
    setSelectedId(null);
    setAdding(true);
  });

  const uploadPhotos = async (pinId, fileList) => {
    for (const file of fileList) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `${pinId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file);
      if (upErr) throw upErr;
      const { error: rowErr } = await supabase.from('pin_photos').insert({ pin_id: pinId, storage_path: path });
      if (rowErr) throw rowErr;
    }
  };

  const onPinDragEnd = (pin, e) => {
    const { lat, lng } = e.target.getLatLng();
    withPassword(async () => {
      setPins(ps => ps.map(p => p.id === pin.id ? { ...p, lat, lng } : p));
      const { error } = await supabase.from('pins').update({ lat, lng }).eq('id', pin.id);
      if (error) { showToast("Couldn't move that pin 😢"); loadPins(); }
      else showToast('Pin moved! 📍');
    });
  };

  const saveTitle = async (e) => {
    e.preventDefault();
    const t = titleDraft.trim();
    if (!t || !selected) return;
    setEditingTitle(false);
    if (t === selected.title) return;
    setPins(ps => ps.map(p => p.id === selected.id ? { ...p, title: t } : p));
    const { error } = await supabase.from('pins').update({ title: t }).eq('id', selected.id);
    if (error) { showToast("Couldn't save the new title 😢"); loadPins(); }
  };

  const deletePhoto = (ph) => withPassword(async () => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await supabase.storage.from(PHOTO_BUCKET).remove([ph.storage_path]);
      const { error } = await supabase.from('pin_photos').delete().eq('id', ph.id);
      if (error) throw error;
      setPins(ps => ps.map(p => p.id === ph.pin_id
        ? { ...p, pin_photos: p.pin_photos.filter(x => x.id !== ph.id) }
        : p));
    } catch {
      showToast("Couldn't delete that photo 😢");
      loadPins();
    }
  });

  const savePin = async (e) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const row = { title: title.trim(), lat: draftPos.lat, lng: draftPos.lng };
      let { data: pin, error } = await supabase.from('pins').insert({ ...row, owner }).select().single();
      if (error) {
        // owner column may not exist yet (migration not run) — save without it
        ({ data: pin, error } = await supabase.from('pins').insert(row).select().single());
      }
      if (error) throw error;
      if (files.length) await uploadPhotos(pin.id, files);
      setDraftPos(null);
      setTitle('');
      setOwner('both');
      setFiles([]);
      await loadPins();
      setSelectedId(pin.id);
      showToast('Pinned! Another memory on the map 💕');
    } catch {
      showToast("Something went wrong saving the pin 😢");
    } finally {
      setSaving(false);
    }
  };

  const addPhotosToPin = async (fileList) => {
    if (!fileList.length || !selected || saving) return;
    setSaving(true);
    try {
      await uploadPhotos(selected.id, fileList);
      await loadPins();
      showToast('Photos added! 📸');
    } catch {
      showToast("Something went wrong uploading 😢");
    } finally {
      setSaving(false);
    }
  };

  const deletePin = () => withPassword(async () => {
    if (!selected) return;
    if (!window.confirm(`Remove "${selected.title}" and its photos?`)) return;
    setSaving(true);
    try {
      const paths = (selected.pin_photos || []).map(p => p.storage_path);
      if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
      const { error } = await supabase.from('pins').delete().eq('id', selected.id);
      if (error) throw error;
      setSelectedId(null);
      await loadPins();
      showToast('Pin removed');
    } catch {
      showToast("Couldn't remove that pin 😢");
    } finally {
      setSaving(false);
    }
  });

  if (!supabase) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #fdf2f8, #fce7f3)', fontFamily: "'Baloo 2', cursive",
        padding: 24, textAlign: 'center',
      }}>
        <div>
          <h2 style={{ color: '#be185d' }}>The map isn't set up yet 🗺️</h2>
          <p style={{ color: '#9d174d', maxWidth: 440 }}>
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a
            <code> .env</code> file (see README) and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, fontFamily: "'Baloo 2', cursive" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700&display=swap');

        .leaflet-container { width: 100%; height: 100%; background: #f8e8f0; }
        .adding-mode .leaflet-container { cursor: crosshair !important; }

        .pin-marker { background: none; border: none; }
        .pin-emoji {
          font-size: 30px; line-height: 40px; text-align: center;
          filter: drop-shadow(0 3px 4px rgba(120, 20, 60, 0.4));
          transition: transform 0.15s ease;
        }
        .pin-marker:hover .pin-emoji { transform: scale(1.2); }

        .map-chip {
          position: fixed;
          background: rgba(255, 241, 248, 0.92);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border: 1.5px solid rgba(244, 114, 182, 0.4);
          border-radius: 50px; padding: 9px 22px;
          font-family: 'Baloo 2', cursive; font-size: 0.9rem; font-weight: 600;
          color: #be185d; cursor: pointer;
          box-shadow: 0 4px 14px rgba(190, 24, 93, 0.15);
          transition: transform 0.2s, box-shadow 0.2s;
          z-index: 1000; border-style: solid;
        }
        .map-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(190, 24, 93, 0.28);
        }
        .map-chip.primary {
          background: linear-gradient(135deg, #ec4899, #be185d);
          color: white; border-color: transparent;
          box-shadow: 0 5px 18px rgba(190, 24, 93, 0.38);
        }

        .map-title {
          position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
          background: rgba(255, 241, 248, 0.92);
          backdrop-filter: blur(14px);
          border: 1.5px solid rgba(244, 114, 182, 0.4);
          border-radius: 50px; padding: 9px 26px;
          font-size: 1rem; font-weight: 700; color: #9d174d;
          box-shadow: 0 4px 14px rgba(190, 24, 93, 0.15);
          z-index: 1000; white-space: nowrap;
        }

        .adding-banner {
          position: fixed; top: 74px; left: 50%; transform: translateX(-50%);
          background: rgba(255, 219, 238, 0.96);
          color: #9d174d; padding: 11px 26px; border-radius: 50px;
          font-size: 0.95rem; font-weight: 600;
          box-shadow: 0 4px 22px rgba(190, 24, 93, 0.25);
          border: 1px solid rgba(244, 114, 182, 0.4);
          z-index: 1000; white-space: nowrap;
        }

        .toast {
          position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
          background: rgba(255, 219, 238, 0.96);
          color: #9d174d; padding: 12px 26px; border-radius: 50px;
          font-size: 0.95rem; font-weight: 600;
          box-shadow: 0 4px 22px rgba(190, 24, 93, 0.25);
          border: 1px solid rgba(244, 114, 182, 0.4);
          z-index: 3000; max-width: 90vw; text-align: center;
        }

        /* Detail card */
        .pin-card {
          position: fixed; top: 78px; right: 18px; bottom: 18px;
          width: min(360px, calc(100vw - 36px));
          background: rgba(255, 247, 251, 0.96);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(244, 114, 182, 0.42);
          border-radius: 22px;
          box-shadow: 0 12px 44px rgba(190, 24, 93, 0.22);
          z-index: 1100;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        @media (max-width: 640px) {
          .pin-card {
            top: auto; right: 0; left: 0; bottom: 0; width: 100%;
            max-height: 62vh; border-radius: 22px 22px 0 0;
          }
        }
        .pin-card.drop-hover {
          border-color: #ec4899;
          box-shadow: 0 12px 44px rgba(190, 24, 93, 0.4), inset 0 0 0 2px rgba(236, 72, 153, 0.55);
        }
        .pin-card-head {
          padding: 18px 22px 12px;
          border-bottom: 1px solid rgba(244, 114, 182, 0.2);
          position: relative;
        }
        .pin-card-title { font-size: 1.15rem; font-weight: 700; color: #9d174d; margin: 0; padding-right: 30px; }
        .pin-card-date  { font-size: 0.8rem; color: #be185d; opacity: 0.75; margin-top: 2px; }
        .edit-btn {
          background: none; border: none; cursor: pointer;
          font-size: 0.82rem; margin-left: 6px; opacity: 0.5;
          transition: opacity 0.15s;
        }
        .edit-btn:hover { opacity: 1; }
        .title-edit-row { display: flex; gap: 8px; padding-right: 30px; }
        .title-edit-input {
          flex: 1; min-width: 0;
          border: 1.5px solid rgba(244, 114, 182, 0.5); border-radius: 10px;
          padding: 6px 10px; font-family: 'Baloo 2', cursive;
          font-size: 1rem; font-weight: 700; color: #7c2d4e;
          background: white; outline: none;
        }
        .title-edit-input:focus { border-color: #ec4899; }
        .title-edit-save {
          border: none; border-radius: 10px; width: 36px; flex-shrink: 0;
          background: linear-gradient(135deg, #ec4899, #be185d);
          color: white; cursor: pointer; font-size: 0.95rem;
        }
        .pin-card-close {
          position: absolute; top: 14px; right: 14px;
          background: none; border: none; cursor: pointer;
          font-size: 1.1rem; color: #be185d; opacity: 0.6;
        }
        .pin-card-close:hover { opacity: 1; }
        .pin-card-body { padding: 14px 22px 18px; overflow-y: auto; flex: 1; }
        .pin-card-desc {
          font-size: 0.92rem; color: #7c2d4e; line-height: 1.65;
          margin: 0 0 14px; white-space: pre-wrap;
        }
        .photo-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px;
        }
        .photo-cell { position: relative; }
        .photo-del {
          position: absolute; top: 4px; right: 4px;
          width: 22px; height: 22px; border-radius: 50%;
          border: none; background: rgba(30, 8, 20, 0.55); color: white;
          font-size: 0.68rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          opacity: 0.85; transition: background 0.15s, opacity 0.15s;
        }
        .photo-del:hover { background: #be185d; opacity: 1; }
        .photo-grid img {
          width: 100%; aspect-ratio: 1; object-fit: cover;
          border-radius: 10px; cursor: pointer;
          box-shadow: 0 2px 8px rgba(190, 24, 93, 0.18);
          transition: transform 0.18s ease;
        }
        .photo-grid img:hover { transform: scale(1.05); }
        .pin-card-actions {
          display: flex; gap: 8px; padding: 12px 22px 16px;
          border-top: 1px solid rgba(244, 114, 182, 0.2);
        }
        .card-btn {
          flex: 1; border: none; border-radius: 50px;
          padding: 10px 14px; font-family: 'Baloo 2', cursive;
          font-size: 0.85rem; font-weight: 600; cursor: pointer;
          background: linear-gradient(135deg, #ec4899, #be185d); color: white;
          box-shadow: 0 4px 12px rgba(190, 24, 93, 0.3);
          transition: transform 0.15s;
        }
        .card-btn:hover { transform: translateY(-1px); }
        .card-btn:disabled { opacity: 0.6; cursor: default; transform: none; }
        .card-btn.subtle {
          flex: 0 0 auto; background: rgba(190, 24, 93, 0.1); color: #be185d;
          box-shadow: none;
        }

        /* Modals */
        .modal-scrim {
          position: fixed; inset: 0; background: rgba(40, 8, 24, 0.45);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 2000; padding: 18px;
        }
        .modal {
          background: rgba(255, 247, 251, 0.98);
          border: 1.5px solid rgba(244, 114, 182, 0.45);
          border-radius: 24px; padding: 26px 28px;
          width: min(420px, 100%);
          box-shadow: 0 16px 56px rgba(120, 10, 50, 0.35);
          max-height: 88vh; overflow-y: auto;
        }
        .modal h3 { margin: 0 0 16px; color: #9d174d; font-size: 1.15rem; }
        .modal label {
          display: block; font-size: 0.8rem; font-weight: 700;
          color: #be185d; margin: 12px 0 4px; letter-spacing: 0.4px;
        }
        .modal input[type="text"], .modal input[type="password"] {
          width: 100%; box-sizing: border-box;
          border: 1.5px solid rgba(244, 114, 182, 0.4);
          border-radius: 13px; padding: 10px 14px;
          font-family: 'Baloo 2', cursive; font-size: 0.95rem; color: #7c2d4e;
          background: white; outline: none;
        }
        .modal input:focus { border-color: #ec4899; }
        .owner-row { display: flex; gap: 8px; }
        .owner-opt {
          flex: 1; border: 1.5px solid rgba(244, 114, 182, 0.4);
          border-radius: 50px; background: white; padding: 9px 4px;
          font-family: 'Baloo 2', cursive; font-size: 0.82rem; font-weight: 600;
          color: #be185d; cursor: pointer; white-space: nowrap;
          transition: background 0.15s, color 0.15s, box-shadow 0.15s;
        }
        .owner-opt:hover { background: rgba(252, 231, 243, 0.8); }
        .owner-opt.sel {
          background: linear-gradient(135deg, #ec4899, #be185d);
          color: white; border-color: transparent;
          box-shadow: 0 3px 10px rgba(190, 24, 93, 0.32);
        }
        .dropzone {
          border: 2px dashed rgba(236, 72, 153, 0.5);
          border-radius: 14px; padding: 22px 16px;
          text-align: center; cursor: pointer;
          font-size: 0.88rem; font-weight: 600; color: #be185d;
          background: rgba(252, 231, 243, 0.35);
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
        }
        .dropzone:hover, .dropzone.over {
          background: rgba(252, 231, 243, 0.85);
          border-color: #ec4899;
        }
        .dropzone.over { transform: scale(1.02); }
        .clear-files {
          background: none; border: none; cursor: pointer;
          font-family: 'Baloo 2', cursive; font-size: 0.78rem; font-weight: 600;
          color: #be185d; opacity: 0.65; text-decoration: underline;
          margin-top: 6px; padding: 0;
        }
        .clear-files:hover { opacity: 1; }
        .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
        .pw-error { color: #dc2662; font-size: 0.82rem; margin: 8px 0 0; font-weight: 600; }

        /* Lightbox */
        .lightbox {
          position: fixed; inset: 0; background: rgba(20, 4, 12, 0.88);
          display: flex; align-items: center; justify-content: center;
          z-index: 4000; cursor: zoom-out; padding: 24px;
        }
        .lightbox img {
          max-width: 100%; max-height: 100%;
          border-radius: 14px; box-shadow: 0 20px 80px rgba(0,0,0,0.6);
        }
      `}</style>

      <div className={adding ? 'adding-mode' : ''} style={{ position: 'absolute', inset: 0 }}>
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} zoomControl={false} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <ClickCatcher active={adding} onPick={(latlng) => { setAdding(false); setDraftPos(latlng); }} />
          {pins.map((pin) => (
            <Marker
              key={`${pin.id}-${markerNonce}`}
              position={[pin.lat, pin.lng]}
              icon={iconFor(pin.owner)}
              draggable
              eventHandlers={{
                click: () => setSelectedId(pin.id),
                dragend: (e) => onPinDragEnd(pin, e),
              }}
            />
          ))}
          {draftPos && <Marker position={draftPos} icon={iconFor(owner)} />}
        </MapContainer>
      </div>

      <div className="map-title">Our Adventures 🗺️💕</div>
      <button className="map-chip" style={{ top: 20, left: 20 }} onClick={() => navigate('/letters')}>← Letters</button>
      {adding ? (
        <button className="map-chip" style={{ bottom: 24, right: 20 }} onClick={() => setAdding(false)}>Cancel</button>
      ) : (
        <button className="map-chip primary" style={{ bottom: 24, right: 20 }} onClick={startAdding}>+ Add a pin</button>
      )}

      {adding && <div className="adding-banner">Tap the map where this memory belongs 💫</div>}
      {toast && <div className="toast">{toast}</div>}

      {/* Pin detail card */}
      {selected && (
        <div
          className={`pin-card${cardDropHover ? ' drop-hover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setCardDropHover(true); }}
          onDragLeave={() => setCardDropHover(false)}
          onDrop={(e) => {
            e.preventDefault();
            setCardDropHover(false);
            const imgs = imageFiles(e.dataTransfer.files);
            if (imgs.length) withPassword(() => addPhotosToPin(imgs));
          }}
        >
          <div className="pin-card-head">
            {editingTitle ? (
              <form className="title-edit-row" onSubmit={saveTitle}>
                <input
                  className="title-edit-input" autoFocus
                  value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
                />
                <button type="submit" className="title-edit-save" title="Save title">✓</button>
              </form>
            ) : (
              <p className="pin-card-title">
                {ownerEmoji(selected)} {selected.title}
                <button
                  className="edit-btn" title="Edit title"
                  onClick={() => withPassword(() => { setTitleDraft(selected.title); setEditingTitle(true); })}
                >✏️</button>
              </p>
            )}
            <div className="pin-card-date">
              {[ownerLabel(selected), fmtDate(selected.visit_date)].filter(Boolean).join(' · ')}
            </div>
            <button className="pin-card-close" onClick={() => setSelectedId(null)}>✕</button>
          </div>
          <div className="pin-card-body">
            {selected.description && <p className="pin-card-desc">{selected.description}</p>}
            {selected.pin_photos?.length ? (
              <div className="photo-grid">
                {selected.pin_photos.map((ph) => (
                  <div key={ph.id} className="photo-cell">
                    <img
                      src={photoUrl(ph.storage_path)}
                      alt={selected.title}
                      loading="lazy"
                      onClick={() => setLightbox(photoUrl(ph.storage_path))}
                    />
                    <button className="photo-del" title="Delete photo" onClick={() => deletePhoto(ph)}>✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pin-card-desc" style={{ opacity: 0.55 }}>No photos here yet 📷 — tap below, or drag some straight onto this card</p>
            )}
          </div>
          <div className="pin-card-actions">
            <input
              ref={addPhotosInputRef}
              type="file" accept="image/*" multiple hidden
              onChange={(e) => { addPhotosToPin([...e.target.files]); e.target.value = ''; }}
            />
            <button
              className="card-btn"
              disabled={saving}
              onClick={() => withPassword(() => addPhotosInputRef.current?.click())}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation(); // card-level drop handler would double-upload
                setCardDropHover(false);
                const imgs = imageFiles(e.dataTransfer.files);
                if (imgs.length) withPassword(() => addPhotosToPin(imgs));
              }}
            >
              {saving ? 'Uploading…' : '+ Add photos (tap or drop)'}
            </button>
            <button className="card-btn subtle" disabled={saving} onClick={deletePin} title="Remove pin">🗑</button>
          </div>
        </div>
      )}

      {/* Password modal */}
      {askPw && (
        <div className="modal-scrim" onClick={cancelPassword}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submitPassword}>
            <h3>What's the magic word? 🔐</h3>
            <input
              type="password" autoFocus placeholder="Our secret password…"
              value={pwInput} onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
            />
            {pwError && <p className="pw-error">Hmm, that's not it… 🤔</p>}
            <div className="modal-actions">
              <button type="button" className="card-btn subtle" style={{ flex: 1 }} onClick={cancelPassword}>Cancel</button>
              <button type="submit" className="card-btn">Unlock</button>
            </div>
          </form>
        </div>
      )}

      {/* New pin form */}
      {draftPos && (
        <div className="modal-scrim" onClick={() => !saving && setDraftPos(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={savePin}>
            <h3>New memory 📍</h3>
            <label>Where / what was it?</label>
            <input
              type="text" autoFocus
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
            <label>Whose trip?</label>
            <div className="owner-row">
              {[['both', '💖 Both of us'], ['zac', '🧑🏽 Zac'], ['reese', '👩🏻 Reese']].map(([val, lab]) => (
                <button
                  type="button" key={val}
                  className={`owner-opt${owner === val ? ' sel' : ''}`}
                  onClick={() => setOwner(val)}
                >
                  {lab}
                </button>
              ))}
            </div>
            <label>Photos</label>
            <input
              ref={newPinInputRef}
              type="file" accept="image/*" multiple hidden
              onChange={(e) => { setFiles(prev => [...prev, ...imageFiles(e.target.files)]); e.target.value = ''; }}
            />
            <div
              className={`dropzone${dropHover ? ' over' : ''}`}
              onClick={() => newPinInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
              onDragLeave={() => setDropHover(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDropHover(false);
                setFiles(prev => [...prev, ...imageFiles(e.dataTransfer.files)]);
              }}
            >
              {files.length
                ? `${files.length} photo${files.length > 1 ? 's' : ''} ready 💕 — tap or drop to add more`
                : 'Tap to pick photos, or drag them here 📸'}
            </div>
            {files.length > 0 && (
              <button type="button" className="clear-files" onClick={() => setFiles([])}>clear photos</button>
            )}
            <div className="modal-actions">
              <button type="button" className="card-btn subtle" style={{ flex: 1 }} disabled={saving} onClick={() => { setDraftPos(null); setFiles([]); }}>Cancel</button>
              <button type="submit" className="card-btn" disabled={saving || !title.trim()}>
                {saving ? 'Saving…' : 'Pin it! 💕'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="memory" />
        </div>
      )}
    </div>
  );
}
