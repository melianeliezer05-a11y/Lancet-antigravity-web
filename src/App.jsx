import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingCliente from './pages/LandingCliente';
import PanelAdmin from './pages/PanelAdmin';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Web Pública de NM Electroclima */}
        <Route path="/" element={<LandingCliente />} />
        
        {/* Panel Privado para la Asistente */}
        <Route path="/admin" element={<PanelAdmin />} />
      </Routes>
    </Router>
  );
}