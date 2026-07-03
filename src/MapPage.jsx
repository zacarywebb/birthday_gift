import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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
const visitedIcon = makeIcon('💖');
const futureIcon  = makeIcon('✈️');

function ClickCatcher({ active, onPick }) {
  useMapEvents({
    click(e) {
      if (active) onPick(e.latlng);
    },
  });
  return null;
}

// Fit the map to all pins once, after the first load
function FitToPins({ pins }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || !pins.length) return;
    fitted.current = true;
    const bounds = L.latLngBounds(pins.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.25), { maxZoom: 10 });
  }, [pins, map]);
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
  const [form, setForm] = useState({ title: '', description: '', date: '', isFuture: false });
  const [files, setFiles] = useState([]);

  const addPhotosInputRef = useRef(null);

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

  // Run an action only once the password has been entered
  const withPassword = (action) => {
    if (unlocked || !MAP_PASSWORD) { action(); return; }
    pendingRef.current = action;
    setPwInput('');
    setPwError(false);
    setAskPw(true);
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

  const savePin = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      const { data: pin, error } = await supabase.from('pins').insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        visit_date: form.date || null,
        is_future: form.isFuture,
        lat: draftPos.lat,
        lng: draftPos.lng,
      }).select().single();
      if (error) throw error;
      if (files.length) await uploadPhotos(pin.id, files);
      setDraftPos(null);
      setForm({ title: '', description: '', date: '', isFuture: false });
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
        .pin-card-head {
          padding: 18px 22px 12px;
          border-bottom: 1px solid rgba(244, 114, 182, 0.2);
          position: relative;
        }
        .pin-card-title { font-size: 1.15rem; font-weight: 700; color: #9d174d; margin: 0; padding-right: 30px; }
        .pin-card-date  { font-size: 0.8rem; color: #be185d; opacity: 0.75; margin-top: 2px; }
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
        .modal input[type="text"], .modal input[type="password"],
        .modal input[type="date"], .modal textarea {
          width: 100%; box-sizing: border-box;
          border: 1.5px solid rgba(244, 114, 182, 0.4);
          border-radius: 13px; padding: 10px 14px;
          font-family: 'Baloo 2', cursive; font-size: 0.95rem; color: #7c2d4e;
          background: white; outline: none;
        }
        .modal input:focus, .modal textarea:focus { border-color: #ec4899; }
        .modal textarea { resize: vertical; min-height: 84px; }
        .modal input[type="file"] {
          width: 100%; font-family: 'Baloo 2', cursive; font-size: 0.82rem; color: #9d174d;
        }
        .modal input[type="file"]::file-selector-button {
          border: none; border-radius: 50px; padding: 8px 18px;
          font-family: 'Baloo 2', cursive; font-size: 0.82rem; font-weight: 600;
          background: rgba(190, 24, 93, 0.12); color: #be185d;
          cursor: pointer; margin-right: 10px;
        }
        .modal input[type="file"]::file-selector-button:hover {
          background: rgba(190, 24, 93, 0.2);
        }
        .check-row {
          display: flex; align-items: center; gap: 9px; margin-top: 14px;
          font-size: 0.9rem; color: #9d174d; font-weight: 600; cursor: pointer;
        }
        .check-row input { width: 17px; height: 17px; accent-color: #ec4899; cursor: pointer; }
        .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
        .pw-error { color: #dc2662; font-size: 0.82rem; margin: 8px 0 0; font-weight: 600; }
        .file-note { font-size: 0.78rem; color: #be185d; opacity: 0.7; margin-top: 5px; }

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
          <FitToPins pins={pins} />
          {pins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={pin.is_future ? futureIcon : visitedIcon}
              eventHandlers={{ click: () => setSelectedId(pin.id) }}
            />
          ))}
          {draftPos && <Marker position={draftPos} icon={visitedIcon} />}
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
        <div className="pin-card">
          <div className="pin-card-head">
            <p className="pin-card-title">{selected.is_future ? '✈️ ' : '💖 '}{selected.title}</p>
            <div className="pin-card-date">
              {selected.is_future
                ? (selected.visit_date ? `Planned — ${fmtDate(selected.visit_date)}` : 'Someday soon…')
                : (fmtDate(selected.visit_date) || '')}
            </div>
            <button className="pin-card-close" onClick={() => setSelectedId(null)}>✕</button>
          </div>
          <div className="pin-card-body">
            {selected.description && <p className="pin-card-desc">{selected.description}</p>}
            {selected.pin_photos?.length ? (
              <div className="photo-grid">
                {selected.pin_photos.map((ph) => (
                  <img
                    key={ph.id}
                    src={photoUrl(ph.storage_path)}
                    alt={selected.title}
                    loading="lazy"
                    onClick={() => setLightbox(photoUrl(ph.storage_path))}
                  />
                ))}
              </div>
            ) : (
              <p className="pin-card-desc" style={{ opacity: 0.55 }}>No photos here yet 📷</p>
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
            >
              {saving ? 'Uploading…' : '+ Add photos'}
            </button>
            <button className="card-btn subtle" disabled={saving} onClick={deletePin} title="Remove pin">🗑</button>
          </div>
        </div>
      )}

      {/* Password modal */}
      {askPw && (
        <div className="modal-scrim" onClick={() => setAskPw(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submitPassword}>
            <h3>What's the magic word? 🔐</h3>
            <input
              type="password" autoFocus placeholder="Our secret password…"
              value={pwInput} onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
            />
            {pwError && <p className="pw-error">Hmm, that's not it… 🤔</p>}
            <div className="modal-actions">
              <button type="button" className="card-btn subtle" style={{ flex: 1 }} onClick={() => setAskPw(false)}>Cancel</button>
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
              type="text" autoFocus placeholder="e.g. Weekend in Charleston"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <label>A little note (optional)</label>
            <textarea
              placeholder="What made this one special?"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <label>When?</label>
            <input
              type="date"
              value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <label className="check-row" style={{ display: 'flex' }}>
              <input
                type="checkbox"
                checked={form.isFuture} onChange={(e) => setForm({ ...form, isFuture: e.target.checked })}
              />
              <span>A future trip ✈️ — somewhere we're going!</span>
            </label>
            <label>Photos</label>
            <input
              type="file" accept="image/*" multiple
              onChange={(e) => setFiles([...e.target.files])}
            />
            {files.length > 0 && <div className="file-note">{files.length} photo{files.length > 1 ? 's' : ''} selected</div>}
            <div className="modal-actions">
              <button type="button" className="card-btn subtle" style={{ flex: 1 }} disabled={saving} onClick={() => setDraftPos(null)}>Cancel</button>
              <button type="submit" className="card-btn" disabled={saving || !form.title.trim()}>
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
