import { Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import Typewriter from './Typewriter';
import Letters from './Letters'; // ✅ Import the Letters component


function App() {
  return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/letters" element={<Letters />} />
        <Route path="/typewriter" element={<Typewriter />} />

      </Routes>
  );
}

export default App;
