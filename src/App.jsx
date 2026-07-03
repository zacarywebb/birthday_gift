import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './Landing';
import Typewriter from './Typewriter';
import Letters from './Letters';
import MapPage from './MapPage';


function App() {
  return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/letters" element={<Letters />} />
        <Route path="/typewriter" element={<Typewriter />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}

export default App;
