import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Player from './components/Player';
import { Playlist, ApiIntegration } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<'dashboard' | 'player'>('dashboard');
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [activeIntegrations, setActiveIntegrations] = useState<ApiIntegration[]>([]);

  // Simple hash-based routing to simulate separate apps or allow bookmarking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#player' && activePlaylist) {
        setMode('player');
      } else {
        setMode('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activePlaylist]);

  const startPlayer = (playlist: Playlist, integrations: ApiIntegration[]) => {
    setActivePlaylist(playlist);
    setActiveIntegrations(integrations);
    setMode('player');
    window.location.hash = 'player';
  };

  const exitPlayer = () => {
    setMode('dashboard');
    window.location.hash = 'dashboard';
  };

  return (
    <div className="antialiased text-gray-900 bg-gray-100 min-h-screen">
      {mode === 'dashboard' ? (
        <Dashboard onStartPlayer={startPlayer} />
      ) : activePlaylist ? (
        <Player 
          playlist={activePlaylist} 
          integrations={activeIntegrations}
          onExit={exitPlayer} 
        />
      ) : (
        <div className="flex items-center justify-center h-screen bg-black text-white">
          <div className="text-center">
             <h1 className="text-2xl font-bold mb-4">Nenhuma Playlist Carregada</h1>
             <button onClick={exitPlayer} className="bg-blue-600 px-4 py-2 rounded">Voltar ao Painel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;