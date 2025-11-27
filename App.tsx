import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Player from './components/Player';
import { Playlist, ApiIntegration, Terminal } from './types';
import { MOCK_PLAYLIST, MOCK_INTEGRATIONS, MOCK_TERMINALS } from './constants';

const App: React.FC = () => {
  const [mode, setMode] = useState<'dashboard' | 'player'>('dashboard');
  
  // Função auxiliar robusta para carregar dados salvos ou usar o padrão
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      console.error(`Error loading ${key}`, e);
      return defaultValue;
    }
  };

  // Inicializa o estado verificando a URL e carregando dados do Storage imediatamente
  // Isso previne o "flash" de tela preta ou estado inicial incorreto
  const initializeState = () => {
     const hash = window.location.hash;
     const params = new URLSearchParams(window.location.search);
     const terminalId = params.get('terminalId');

     // Se estiver na rota #player (via link ou refresh)
     if (hash === '#player') {
         const playlists = loadFromStorage<Playlist[]>('indoor_playlists', [MOCK_PLAYLIST]);
         const terminals = loadFromStorage<Terminal[]>('indoor_terminals', MOCK_TERMINALS);
         const integrations = loadFromStorage<ApiIntegration[]>('indoor_integrations', MOCK_INTEGRATIONS);

         let targetPlaylist: Playlist | undefined;

         if (terminalId) {
             const terminal = terminals.find(t => t.id === terminalId);
             if (terminal && terminal.currentPlaylistId) {
                 targetPlaylist = playlists.find(p => p.id === terminal.currentPlaylistId);
             }
         }

         if (!targetPlaylist) {
             targetPlaylist = playlists.find(p => p.active) || playlists[0];
         }

         return {
             mode: 'player' as const,
             activePlaylist: targetPlaylist || null,
             activeIntegrations: integrations
         };
     }

     return {
         mode: 'dashboard' as const,
         activePlaylist: null,
         activeIntegrations: []
     };
  };

  // Estado inicial calculado
  const [state, setState] = useState(initializeState);

  // Listener para mudanças na URL (Navegação)
  useEffect(() => {
    const handleLocationChange = () => {
      const newState = initializeState();
      setState(newState);
      setMode(newState.mode);
    };

    window.addEventListener('hashchange', handleLocationChange);
    return () => window.removeEventListener('hashchange', handleLocationChange);
  }, []); 

  const startPlayer = (playlist: Playlist, integrations: ApiIntegration[]) => {
    setState({
        mode: 'player',
        activePlaylist: playlist,
        activeIntegrations: integrations
    });
    setMode('player');
    window.location.hash = 'player';
  };

  const exitPlayer = () => {
    setMode('dashboard');
    setState({
        mode: 'dashboard',
        activePlaylist: null,
        activeIntegrations: []
    });
    // Limpa a URL
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "dashboard";
    window.history.pushState({}, '', url);
  };

  // Fallback de erro se algo quebrar na renderização
  if (state.mode === 'player' && !state.activePlaylist) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
          <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl border border-red-500/30">
             <h1 className="text-2xl font-bold mb-4 text-red-400">Erro de Carregamento</h1>
             <p className="mb-6 text-gray-400">Não foi possível carregar a playlist. Verifique as configurações.</p>
             <button onClick={exitPlayer} className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-500 transition-colors">
               Voltar ao Painel
             </button>
          </div>
        </div>
      );
  }

  return (
    <div className="antialiased text-gray-900 bg-gray-100 min-h-screen">
      {mode === 'dashboard' ? (
        <Dashboard onStartPlayer={startPlayer} />
      ) : (
        <Player 
          playlist={state.activePlaylist!} 
          integrations={state.activeIntegrations}
          onExit={exitPlayer} 
        />
      )}
    </div>
  );
};

export default App;