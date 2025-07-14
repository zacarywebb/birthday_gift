import { Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import Letters from './Letters'; // ✅ Import the Letters component


function App() {
  return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/letters" element={<Letters />} />

      </Routes>
  );
}

export default App;
