import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DetectorPage from './pages/DetectorPage';
import DashboardPage from './pages/DashboardPage';
import { ShieldAlert, LayoutDashboard } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-sans">
        <header className="bg-slate-800 border-b border-slate-700 py-4 px-6 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-blue-500" size={28} />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              Deepfake Detector
            </h1>
          </div>
          <nav className="flex gap-6">
            <Link to="/" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
              <ShieldAlert size={18} />
              <span>Detector</span>
            </Link>
            <Link to="/dashboard" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          </nav>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          <Routes>
            <Route path="/" element={<DetectorPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
