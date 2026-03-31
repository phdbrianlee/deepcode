import { useEffect } from 'react';
import { MapContainer } from './components/MapContainer';
import { Navbar } from './components/Navbar';
import { ControlPanel } from './components/ControlPanel';
import { InfoPanel } from './components/InfoPanel';
import { LayerLegend } from './components/LayerLegend';
import { useStore } from './store/useStore';

function App() {
  const { isControlPanelOpen, setControlPanelOpen, isInfoPanelOpen, setInfoPanelOpen } = useStore();

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'h':
          setControlPanelOpen(!isControlPanelOpen);
          break;
        case 'i':
          setInfoPanelOpen(!isInfoPanelOpen);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isControlPanelOpen, isInfoPanelOpen, setControlPanelOpen, setInfoPanelOpen]);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      <Navbar />
      
      <main className="absolute inset-0 pt-14">
        <MapContainer />
      </main>

      <ControlPanel />
      <InfoPanel />
      <LayerLegend />
    </div>
  );
}

export default App;
