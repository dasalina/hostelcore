import { Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import EventsPage from '@/pages/EventsPage';
import HostPanelPage from '@/pages/HostPanelPage';
import LoginPage from '@/pages/LoginPage';

function App() {
  return (
      <div className="flex flex-col h-screen bg-white w-screen">
        <Navbar />
        <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route path="/host-panel" element={<HostPanelPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
