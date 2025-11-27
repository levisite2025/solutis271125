
import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Playlist, MediaItem, TerminalStatus, MediaType, Schedule, ApiIntegration, IntegrationType, OverlayStyle } from '../types';
import { MOCK_TERMINALS, MOCK_MEDIA_LIBRARY, MOCK_PLAYLIST, MOCK_INTEGRATIONS, BRAZIL_CITIES_BY_STATE } from '../constants';
import { 
  Monitor, PlaySquare, BarChart3, Upload, 
  Settings, CheckCircle, AlertCircle, Clock, 
  RefreshCw, Music, Calendar, XCircle,
  Edit, Trash2, Image as ImageIcon, MessageSquare, 
  ArrowUp, ArrowDown, Save, Plus, Radio, Volume2,
  Globe, Rss, CloudSun, Coins, Ticket, Gauge, Share2, Copy, Link, X, Trophy, FastForward,
  Bold, Palette, Type, PaintBucket, Wifi, PlugZap, MapPin
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  onStartPlayer: (playlist: Playlist, integrations: ApiIntegration[]) => void;
}

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'video/mp4'];

const Dashboard: React.FC<DashboardProps> = ({ onStartPlayer }) => {
  const [activeTab, setActiveTab] = useState<'terminals' | 'media' | 'reports' | 'playlists' | 'editor' | 'integrations'>('terminals');
  
  // Helper to load from local storage or fallback to constants
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      console.error(`Error loading ${key} from storage`, e);
      return defaultValue;
    }
  };

  // App State with Persistence
  const [terminals, setTerminals] = useState<Terminal[]>(() => loadFromStorage('indoor_terminals', MOCK_TERMINALS));
  const [media, setMedia] = useState<MediaItem[]>(() => loadFromStorage('indoor_media', MOCK_MEDIA_LIBRARY));
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadFromStorage('indoor_playlists', [MOCK_PLAYLIST]));
  const [integrations, setIntegrations] = useState<ApiIntegration[]>(() => loadFromStorage('indoor_integrations', MOCK_INTEGRATIONS));

  // Persist changes to LocalStorage
  useEffect(() => { localStorage.setItem('indoor_terminals', JSON.stringify(terminals)); }, [terminals]);
  useEffect(() => { localStorage.setItem('indoor_media', JSON.stringify(media)); }, [media]);
  useEffect(() => { localStorage.setItem('indoor_playlists', JSON.stringify(playlists)); }, [playlists]);
  useEffect(() => { localStorage.setItem('indoor_integrations', JSON.stringify(integrations)); }, [integrations]);
  
  // Editor State
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [showPlaylistSettings, setShowPlaylistSettings] = useState(false); // Modal logic

  // Media Detail Modal State
  const [viewingMediaItem, setViewingMediaItem] = useState<MediaItem | null>(null);

  // Terminal Sharing Modal State
  const [sharingTerminal, setSharingTerminal] = useState<Terminal | null>(null);

  // Integration Modal State
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [currentIntegration, setCurrentIntegration] = useState<Partial<ApiIntegration>>({});
  
  // URL Validation State
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [urlTestStatus, setUrlTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [urlTestMessage, setUrlTestMessage] = useState('');

  // Weather Integration Local State
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Upload State
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const statsData = [
    { name: '08:00', impressions: 400 },
    { name: '10:00', impressions: 1200 },
    { name: '12:00', impressions: 2400 },
    { name: '14:00', impressions: 1800 },
    { name: '16:00', impressions: 1600 },
    { name: '18:00', impressions: 2100 },
    { name: '20:00', impressions: 800 },
  ];

  // --- Handlers ---

  const getTerminalLink = (terminal: Terminal) => {
    // Generates a URL like: https://app.com/?terminalId=t1#player
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?terminalId=${terminal.id}#player`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
        setUploadSuccess(`${label} copiado!`);
        setTimeout(() => setUploadSuccess(null), 3000);
    }).catch(() => {
        setUploadError("Erro ao copiar");
    });
  };

  const handleShareMedia = async (item: MediaItem) => {
    if (!item.url) return;

    // Check for native share support
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Confira esta mídia do IndoorDisplay: ${item.title}`,
          url: item.url
        });
      } catch (error) {
        console.log('Compartilhamento cancelado ou falhou', error);
      }
    } else {
      // Fallback to Clipboard
      try {
        await navigator.clipboard.writeText(item.url);
        setUploadSuccess('Link copiado para a área de transferência!');
        setTimeout(() => setUploadSuccess(null), 3000);
      } catch (err) {
        setUploadError('Erro ao copiar link.');
        setTimeout(() => setUploadError(null), 3000);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, isBackgroundReplacement = false) => {
    const file = event.target.files?.[0];
    setUploadError(null);
    setUploadSuccess(null);

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Formato inválido. Apenas imagens (JPG, PNG) e vídeos (MP4).');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`Arquivo excede ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const fileUrl = URL.createObjectURL(file);

    if (isBackgroundReplacement && editingPlaylist && selectedSlideId) {
       // Replace background of selected slide
       const updatedItems = editingPlaylist.items.map(item => {
          if (item.id === selectedSlideId) {
             return {
                ...item,
                url: fileUrl,
                type: file.type.startsWith('video') ? MediaType.VIDEO : MediaType.IMAGE,
                thumbnail: file.type.startsWith('video') ? 'https://picsum.photos/300/200?grayscale' : fileUrl
             };
          }
          return item;
       });
       setEditingPlaylist({...editingPlaylist, items: updatedItems});
       setUploadSuccess("Mídia do slide atualizada!");
    } else {
      // Add new media to library
      const newMediaItem: MediaItem = {
        id: `m_${Date.now()}`,
        title: file.name,
        type: file.type.startsWith('video') ? MediaType.VIDEO : MediaType.IMAGE,
        url: fileUrl,
        duration: file.type.startsWith('video') ? 30 : 10,
        thumbnail: file.type.startsWith('video') ? 'https://picsum.photos/300/200?grayscale' : fileUrl,
        audioEnabled: true
      };
      setMedia([newMediaItem, ...media]);
      setUploadSuccess(`Upload de "${file.name}" concluído!`);
    }

    setTimeout(() => setUploadSuccess(null), 3000);
    if (event.target) event.target.value = '';
  };

  const openEditor = (playlist: Playlist) => {
     // Deep copy to avoid mutating state directly before save
     setEditingPlaylist(JSON.parse(JSON.stringify(playlist)));
     if (playlist.items.length > 0) setSelectedSlideId(playlist.items[0].id);
     setActiveTab('editor');
     setShowPlaylistSettings(false);
  };

  const handleSavePlaylist = () => {
    if (!editingPlaylist) return;
    const updated = playlists.map(p => p.id === editingPlaylist.id ? editingPlaylist : p);
    setPlaylists(updated);
    setUploadSuccess("Playlist salva com sucesso!");
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  const handleStartFromEditor = () => {
    if (!editingPlaylist) return;
    handleSavePlaylist();
    onStartPlayer(editingPlaylist, integrations);
  };

  const handleStartFromTerminals = (terminal: Terminal) => {
    // Find the actual playlist object from state based on terminal's assignment
    const playlist = playlists.find(p => p.id === terminal.currentPlaylistId) || playlists[0];
    onStartPlayer(playlist, integrations);
  };

  // Integration Handlers
  
  const checkUrlConnection = async (url: string): Promise<boolean> => {
      setIsTestingUrl(true);
      setUrlTestMessage('Verificando conexão...');
      setUrlTestStatus('idle');

      try {
          // 1. Syntax Check
          new URL(url);

          // 2. Network/Connectivity Check
          // Using AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          // We use mode: 'no-cors' to avoid CORS errors blocking the request completely.
          // This returns an opaque response (status 0) if successful, or throws if network fails.
          await fetch(url, {
              method: 'GET', // GET is safer for RSS feeds than HEAD sometimes
              mode: 'no-cors',
              signal: controller.signal
          });

          clearTimeout(timeoutId);
          setUrlTestStatus('success');
          setUrlTestMessage('URL válida e acessível.');
          setIsTestingUrl(false);
          return true;

      } catch (error: any) {
          setIsTestingUrl(false);
          setUrlTestStatus('error');
          
          if (error instanceof TypeError) {
              setUrlTestMessage('Formato de URL inválido. Inclua http:// ou https://');
          } else if (error.name === 'AbortError') {
              setUrlTestMessage('Tempo limite esgotado. O servidor demorou a responder.');
          } else {
              setUrlTestMessage('Não foi possível conectar ao endpoint (Erro de Rede ou DNS).');
          }
          return false;
      }
  };

  const handleSaveIntegration = async () => {
    if (!currentIntegration.name || !currentIntegration.endpointUrl) {
        setUrlTestStatus('error');
        setUrlTestMessage('Preencha os campos obrigatórios.');
        return;
    }

    // Validate URL before saving
    const isValid = await checkUrlConnection(currentIntegration.endpointUrl);
    if (!isValid) {
        // Stop saving if invalid
        return;
    }

    if (currentIntegration.id) {
      // Update existing
      setIntegrations(integrations.map(i => i.id === currentIntegration.id ? currentIntegration as ApiIntegration : i));
    } else {
      // Create new
      const newIntegration = {
        ...currentIntegration,
        id: `api_${Date.now()}`,
        lastStatus: 'OK',
        lastSync: new Date(),
        enabled: true,
        type: currentIntegration.type || IntegrationType.OTHER,
        refreshInterval: currentIntegration.refreshInterval || 15,
        animationSpeed: currentIntegration.animationSpeed || 20
      } as ApiIntegration;
      setIntegrations([...integrations, newIntegration]);
    }
    setShowIntegrationModal(false);
    setCurrentIntegration({});
    setSelectedState('');
    setSelectedCity('');
  };

  const deleteIntegration = (id: string) => {
    if(confirm('Tem certeza que deseja remover esta integração?')) {
      setIntegrations(integrations.filter(i => i.id !== id));
    }
  };

  const handleWeatherLocationChange = (state: string, city: string) => {
      setSelectedState(state);
      setSelectedCity(city);
      if (state && city) {
          // Auto generate OpenWeather URL format
          const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${state},BR`;
          setCurrentIntegration({
              ...currentIntegration,
              endpointUrl: url,
              name: `Clima ${city} - ${state}`
          });
      }
  };

  // Editor Helpers
  const getSelectedSlide = () => editingPlaylist?.items.find(i => i.id === selectedSlideId);

  const updateSlideField = (field: keyof MediaItem, value: any) => {
    if (!editingPlaylist || !selectedSlideId) return;
    const updatedItems = editingPlaylist.items.map(item => 
      item.id === selectedSlideId ? { ...item, [field]: value } : item
    );
    setEditingPlaylist({ ...editingPlaylist, items: updatedItems });
  };

  const updateSlideStyle = (field: keyof OverlayStyle, value: any) => {
    if (!editingPlaylist || !selectedSlideId) return;
    const currentItem = getSelectedSlide();
    if (!currentItem) return;

    const newStyle = { ...currentItem.overlayStyle, [field]: value };
    updateSlideField('overlayStyle', newStyle);
  };

  const moveSlide = (direction: 'up' | 'down') => {
    if (!editingPlaylist || !selectedSlideId) return;
    const items = [...editingPlaylist.items];
    const index = items.findIndex(i => i.id === selectedSlideId);
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
        [items[index], items[index - 1]] = [items[index - 1], items[index]];
    } else if (direction === 'down' && index < items.length - 1) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
    }
    setEditingPlaylist({ ...editingPlaylist, items });
  };

  const removeSlide = (id: string) => {
    if (!editingPlaylist) return;
    const items = editingPlaylist.items.filter(i => i.id !== id);
    setEditingPlaylist({ ...editingPlaylist, items });
    if (selectedSlideId === id && items.length > 0) setSelectedSlideId(items[0].id);
  };

  const updatePlaylistSettings = (field: keyof Playlist | keyof Schedule, value: any) => {
      if (!editingPlaylist) return;
      if (field === 'startTime' || field === 'endTime') {
          setEditingPlaylist({
              ...editingPlaylist,
              schedule: { ...editingPlaylist.schedule, [field]: value }
          });
      } else {
          setEditingPlaylist({ ...editingPlaylist, [field]: value });
      }
  };

  const getIntegrationIcon = (type: IntegrationType) => {
    switch (type) {
      case IntegrationType.WEATHER: return <CloudSun className="w-5 h-5 text-yellow-500" />;
      case IntegrationType.NEWS: return <Rss className="w-5 h-5 text-blue-500" />;
      case IntegrationType.FINANCE: return <Coins className="w-5 h-5 text-green-500" />;
      case IntegrationType.LOTTERY: return <Ticket className="w-5 h-5 text-purple-500" />;
      case IntegrationType.SPORTS: return <Trophy className="w-5 h-5 text-orange-500" />;
      default: return <Globe className="w-5 h-5 text-gray-400" />;
    }
  };

  // Styles helper for preview
  const getPreviewStyle = (item: MediaItem) => {
     const style = item.overlayStyle || {};
     const fontSizeClass = 
       style.fontSize === 'sm' ? 'text-3xl' : 
       style.fontSize === 'md' ? 'text-5xl' : 
       style.fontSize === 'xl' ? 'text-8xl' : 'text-6xl';
     
     return {
       color: style.textColor || '#ffffff',
       backgroundColor: style.backgroundColor || 'rgba(0,0,0,0.4)',
       fontWeight: style.isBold !== false ? 'bold' : 'normal',
       fontSizeClass
     };
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-blue-500 flex items-center">
            <Monitor className="mr-2" /> IndoorPro
          </h1>
          <p className="text-xs text-gray-400 mt-1">Gestão de Mídia Indoor</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('terminals')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'terminals' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <Monitor className="w-5 h-5 mr-3" /> Terminais
          </button>
          <button onClick={() => setActiveTab('playlists')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'playlists' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <PlaySquare className="w-5 h-5 mr-3" /> Playlists
          </button>
          <button onClick={() => setActiveTab('media')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'media' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <Upload className="w-5 h-5 mr-3" /> Mídia
          </button>
          <button onClick={() => setActiveTab('integrations')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'integrations' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <Globe className="w-5 h-5 mr-3" /> Integrações
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'reports' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <BarChart3 className="w-5 h-5 mr-3" /> Relatórios
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-gray-900">
        <header className="bg-gray-800 h-16 border-b border-gray-700 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center">
             {activeTab === 'editor' && (
               <button onClick={() => setActiveTab('playlists')} className="mr-4 hover:bg-gray-700 p-2 rounded-full text-gray-400 hover:text-white transition-colors">
                  <XCircle className="w-6 h-6"/>
               </button>
             )}
             <h2 className="text-xl font-semibold capitalize">
               {activeTab === 'editor' ? 'Editor de Campanha' : activeTab}
             </h2>
          </div>
          
          {/* Status Message */}
          {(uploadError || uploadSuccess) && (
            <div className={`px-4 py-2 rounded-lg flex items-center text-sm ${uploadError ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
              {uploadError ? <AlertCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              {uploadError || uploadSuccess}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-auto p-6 relative">
          
          {/* === INTEGRATIONS VIEW === */}
          {activeTab === 'integrations' && (
             <div>
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <h3 className="text-xl font-bold">Fontes de Dados (APIs)</h3>
                      <p className="text-sm text-gray-400">Configure notícias, clima, finanças e serviços externos.</p>
                   </div>
                   <button 
                      onClick={() => {
                        setCurrentIntegration({ type: IntegrationType.NEWS, refreshInterval: 15, animationSpeed: 20, enabled: true });
                        setShowIntegrationModal(true);
                        // Reset validations
                        setUrlTestStatus('idle');
                        setUrlTestMessage('');
                        setSelectedState('');
                        setSelectedCity('');
                      }}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg"
                   >
                      <Plus className="w-4 h-4 mr-2"/> Nova Integração
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {integrations.map((api) => (
                      <div key={api.id} className={`bg-gray-800 rounded-xl border ${api.enabled ? 'border-gray-600' : 'border-red-900/50 opacity-70'} p-6 relative overflow-hidden group`}>
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                               <div className="bg-gray-700 p-2 rounded-lg mr-3">
                                  {getIntegrationIcon(api.type)}
                               </div>
                               <div>
                                  <h3 className="font-bold text-lg">{api.name}</h3>
                                  <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">{api.provider}</span>
                               </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                     setCurrentIntegration(api);
                                     setShowIntegrationModal(true);
                                     // Reset validations
                                     setUrlTestStatus('idle');
                                     setUrlTestMessage('');
                                     setSelectedState('');
                                     setSelectedCity('');
                                  }}
                                  className="p-1 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                                >
                                   <Settings className="w-5 h-5"/>
                                </button>
                                <button 
                                  onClick={() => deleteIntegration(api.id)}
                                  className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                >
                                   <Trash2 className="w-5 h-5"/>
                                </button>
                            </div>
                         </div>
                         
                         <div className="bg-gray-900/50 rounded p-3 mb-4 font-mono text-xs text-gray-400 truncate border border-gray-700/50">
                            {api.endpointUrl}
                         </div>

                         <div className="flex justify-between items-center text-sm border-t border-gray-700 pt-3">
                            <div className="flex items-center text-gray-400" title="Intervalo de Atualização">
                               <Clock className="w-4 h-4 mr-1"/>
                               {api.refreshInterval} min
                            </div>
                            <div className="flex items-center text-gray-400" title="Velocidade da Animação">
                               <Gauge className="w-4 h-4 mr-1"/>
                               {api.animationSpeed}s
                            </div>
                            <div className={`flex items-center ${api.lastStatus === 'OK' ? 'text-green-500' : 'text-red-500'}`}>
                               {api.lastStatus === 'OK' ? <CheckCircle className="w-4 h-4 mr-1"/> : <AlertCircle className="w-4 h-4 mr-1"/>}
                               {api.lastStatus === 'OK' ? 'Online' : 'Erro'}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>

                {/* API Modal */}
                {showIntegrationModal && (
                   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                      <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-lg shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
                         <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold flex items-center">
                               {currentIntegration.id ? <Settings className="mr-2 w-5 h-5"/> : <Plus className="mr-2 w-5 h-5"/>}
                               {currentIntegration.id ? 'Editar Integração' : 'Nova Fonte de Dados'}
                            </h3>
                            <button onClick={() => setShowIntegrationModal(false)}><XCircle className="text-gray-400 hover:text-white"/></button>
                         </div>
                         
                         <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Nome</label>
                                  <input 
                                     className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-blue-500 outline-none" 
                                     placeholder="Ex: G1 Notícias"
                                     value={currentIntegration.name || ''}
                                     onChange={(e) => setCurrentIntegration({...currentIntegration, name: e.target.value})}
                                  />
                               </div>
                               <div>
                                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Tipo</label>
                                  <select 
                                     className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-blue-500 outline-none"
                                     value={currentIntegration.type}
                                     onChange={(e) => {
                                         const newType = e.target.value as IntegrationType;
                                         setCurrentIntegration({...currentIntegration, type: newType});
                                         if(newType === IntegrationType.WEATHER) {
                                             setSelectedState('');
                                             setSelectedCity('');
                                         }
                                     }}
                                  >
                                     <option value={IntegrationType.NEWS}>Notícias (RSS/JSON)</option>
                                     <option value={IntegrationType.WEATHER}>Clima/Tempo</option>
                                     <option value={IntegrationType.FINANCE}>Finanças/Cotação</option>
                                     <option value={IntegrationType.LOTTERY}>Loterias</option>
                                     <option value={IntegrationType.SPORTS}>Esportes</option>
                                     <option value={IntegrationType.OTHER}>Outros</option>
                                  </select>
                               </div>
                            </div>

                            <div>
                               <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Provedor / Fonte</label>
                               <input 
                                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-blue-500 outline-none" 
                                  placeholder="Ex: API Caixa, OpenWeather, UOL..."
                                  value={currentIntegration.provider || ''}
                                  onChange={(e) => setCurrentIntegration({...currentIntegration, provider: e.target.value})}
                               />
                            </div>

                            {/* Weather Location Selectors */}
                            {currentIntegration.type === IntegrationType.WEATHER && (
                                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30 mb-2">
                                    <div className="text-xs font-bold text-blue-300 mb-3 uppercase flex items-center">
                                        <CloudSun className="w-3 h-3 mr-2"/> Selecione a Localização
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Estado (UF)</label>
                                            <select 
                                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-blue-500 outline-none"
                                                value={selectedState}
                                                onChange={(e) => {
                                                    setSelectedState(e.target.value);
                                                    setSelectedCity(''); // Reset city
                                                }}
                                            >
                                                <option value="">Selecione...</option>
                                                {Object.keys(BRAZIL_CITIES_BY_STATE).map(uf => (
                                                    <option key={uf} value={uf}>{uf}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Cidade</label>
                                            <select 
                                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-blue-500 outline-none"
                                                value={selectedCity}
                                                disabled={!selectedState}
                                                onChange={(e) => handleWeatherLocationChange(selectedState, e.target.value)}
                                            >
                                                <option value="">{selectedState ? 'Selecione a cidade...' : 'Aguardando UF'}</option>
                                                {selectedState && BRAZIL_CITIES_BY_STATE[selectedState]?.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        * A URL da API será gerada automaticamente ao selecionar a cidade.
                                    </p>
                                </div>
                            )}

                            <div>
                               <label className="block text-xs uppercase font-bold text-gray-400 mb-1">URL do Endpoint (API/RSS)</label>
                               <div className="flex gap-2">
                                   <input 
                                      className={`flex-1 bg-gray-900 border rounded p-2 text-sm font-mono focus:border-blue-500 outline-none text-gray-300 ${urlTestStatus === 'error' ? 'border-red-500' : urlTestStatus === 'success' ? 'border-green-500' : 'border-gray-600'}`}
                                      placeholder="https://api.exemplo.com/v1/dados"
                                      value={currentIntegration.endpointUrl || ''}
                                      onChange={(e) => {
                                          setCurrentIntegration({...currentIntegration, endpointUrl: e.target.value});
                                          if (urlTestStatus !== 'idle') {
                                              setUrlTestStatus('idle');
                                              setUrlTestMessage('');
                                          }
                                      }}
                                      readOnly={currentIntegration.type === IntegrationType.WEATHER && selectedCity !== ''}
                                   />
                                   <button 
                                      onClick={() => currentIntegration.endpointUrl && checkUrlConnection(currentIntegration.endpointUrl)}
                                      disabled={isTestingUrl || !currentIntegration.endpointUrl}
                                      className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white px-3 rounded text-sm transition-colors disabled:opacity-50"
                                      title="Testar Conexão"
                                   >
                                      {isTestingUrl ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />}
                                   </button>
                               </div>
                               {/* Validation Feedback */}
                               {urlTestMessage && (
                                   <div className={`text-[10px] mt-1 flex items-center ${urlTestStatus === 'success' ? 'text-green-400' : urlTestStatus === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                                       {urlTestStatus === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                                       {urlTestStatus === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                                       {urlTestMessage}
                                   </div>
                               )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                   <label className="block text-xs uppercase font-bold text-gray-400 mb-1 flex items-center">
                                     <Clock className="w-3 h-3 mr-1"/> Atualização (Min)
                                   </label>
                                   <input 
                                      type="number"
                                      min="1"
                                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-center"
                                      value={currentIntegration.refreshInterval || 15}
                                      onChange={(e) => setCurrentIntegration({...currentIntegration, refreshInterval: parseInt(e.target.value)})}
                                   />
                                </div>
                                <div>
                                   <label className="block text-xs uppercase font-bold text-gray-400 mb-1 flex items-center">
                                      <Gauge className="w-3 h-3 mr-1"/> Velocidade (Seg)
                                   </label>
                                   <input 
                                      type="range"
                                      min="10"
                                      max="60"
                                      step="5"
                                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-3"
                                      value={currentIntegration.animationSpeed || 20}
                                      onChange={(e) => setCurrentIntegration({...currentIntegration, animationSpeed: parseInt(e.target.value)})}
                                   />
                                   <div className="text-center text-xs text-gray-500 mt-1">
                                      {currentIntegration.animationSpeed || 20}s (Ciclo)
                                   </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end pt-2">
                               <div className="flex items-center">
                                  <label className="text-xs uppercase font-bold text-gray-400 mr-2">Habilitado</label>
                                  <input 
                                     type="checkbox" 
                                     className="w-5 h-5 rounded border-gray-600 bg-gray-900 text-blue-600"
                                     checked={currentIntegration.enabled !== false}
                                     onChange={(e) => setCurrentIntegration({...currentIntegration, enabled: e.target.checked})}
                                  />
                               </div>
                            </div>
                         </div>
                         
                         <div className="bg-gray-900 px-6 py-4 flex justify-end gap-3 border-t border-gray-700">
                             <button onClick={() => setShowIntegrationModal(false)} className="px-4 py-2 rounded text-gray-300 hover:text-white hover:bg-gray-800 text-sm">Cancelar</button>
                             <button 
                                onClick={handleSaveIntegration} 
                                disabled={isTestingUrl}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                             >
                                {isTestingUrl && <RefreshCw className="w-4 h-4 mr-2 animate-spin"/>}
                                Salvar Integração
                             </button>
                         </div>
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* === EDITOR VIEW === */}
          {activeTab === 'editor' && editingPlaylist && (
            <div className="flex h-full gap-6">
              {/* Left: Settings & Slide List */}
              <div className="w-80 flex flex-col gap-4">
                  {/* Playlist Global Settings Card */}
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                      <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-sm text-gray-300 uppercase">Configuração Global</h3>
                          <button onClick={() => setShowPlaylistSettings(!showPlaylistSettings)} className="text-blue-400 hover:text-blue-300">
                              <Settings className="w-5 h-5" />
                          </button>
                      </div>
                      <div className="text-sm text-gray-400">
                          <div className="flex items-center mb-1"><Calendar className="w-4 h-4 mr-2"/> {editingPlaylist.schedule.startTime} - {editingPlaylist.schedule.endTime}</div>
                          <div className="flex items-center truncate"><Music className="w-4 h-4 mr-2"/> {editingPlaylist.audioUrl ? 'Rádio Ativa' : 'Sem Áudio Fundo'}</div>
                      </div>
                      
                      {/* Settings Modal/Panel */}
                      {showPlaylistSettings && (
                          <div className="mt-4 pt-4 border-t border-gray-700 space-y-3 animate-fade-in">
                              {/* ... (Existing global settings) ... */}
                              <div>
                                  <label className="text-xs text-gray-500 uppercase font-bold">Nome da Playlist</label>
                                  <input 
                                      className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-sm mt-1" 
                                      value={editingPlaylist.name} 
                                      onChange={(e) => updatePlaylistSettings('name', e.target.value)}
                                  />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                  <div>
                                      <label className="text-xs text-gray-500 uppercase font-bold">Início</label>
                                      <input type="time" className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-sm mt-1" value={editingPlaylist.schedule.startTime} onChange={(e) => updatePlaylistSettings('startTime', e.target.value)}/>
                                  </div>
                                  <div>
                                      <label className="text-xs text-gray-500 uppercase font-bold">Fim</label>
                                      <input type="time" className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-sm mt-1" value={editingPlaylist.schedule.endTime} onChange={(e) => updatePlaylistSettings('endTime', e.target.value)}/>
                                  </div>
                              </div>
                              <div>
                                  <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2"><Radio className="w-3 h-3"/> URL Rádio Indoor</label>
                                  <input 
                                      className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-sm mt-1" 
                                      placeholder="https://stream..."
                                      value={editingPlaylist.audioUrl || ''} 
                                      onChange={(e) => updatePlaylistSettings('audioUrl', e.target.value)}
                                  />
                              </div>
                              {/* Ticker Speed Control */}
                              <div>
                                  <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2"><FastForward className="w-3 h-3"/> Velocidade do Rodapé</label>
                                  <input 
                                      type="range"
                                      min="10"
                                      max="60"
                                      step="5"
                                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
                                      value={editingPlaylist.tickerSpeed || 20}
                                      onChange={(e) => updatePlaylistSettings('tickerSpeed', parseInt(e.target.value))}
                                  />
                                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                      <span>Rápido (10s)</span>
                                      <span>{editingPlaylist.tickerSpeed || 20}s</span>
                                      <span>Lento (60s)</span>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Slides List */}
                  <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col flex-1 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 font-bold flex justify-between items-center bg-gray-850">
                        <span>Slides ({editingPlaylist.items.length})</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {editingPlaylist.items.map((item, index) => (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedSlideId(item.id)}
                            className={`p-2 rounded-lg flex items-center cursor-pointer group transition-all ${selectedSlideId === item.id ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-gray-700/30 hover:bg-gray-700'}`}
                        >
                            <span className="text-xs text-gray-500 w-5 text-center">{index + 1}</span>
                            <img src={item.thumbnail} className="w-10 h-10 object-cover rounded bg-black mr-3" alt=""/>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate text-gray-200">{item.title}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    {item.type === MediaType.VIDEO && <span className="text-blue-400">Vídeo</span>}
                                    {item.type === MediaType.IMAGE && <span className="text-green-400">Img</span>}
                                    {item.duration}s
                                </div>
                            </div>
                            {selectedSlideId === item.id && (
                                <div className="flex flex-col gap-1 ml-2">
                                    <button onClick={(e) => { e.stopPropagation(); moveSlide('up'); }} className="p-1 hover:bg-black/20 rounded"><ArrowUp className="w-3 h-3"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); moveSlide('down'); }} className="p-1 hover:bg-black/20 rounded"><ArrowDown className="w-3 h-3"/></button>
                                </div>
                            )}
                        </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-700 space-y-2">
                        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm flex items-center justify-center">
                             <Plus className="w-4 h-4 mr-2"/> Adicionar Mídia
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={handleSavePlaylist} className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-bold flex items-center justify-center">
                                <Save className="w-4 h-4 mr-2" /> Salvar
                            </button>
                            <button onClick={handleStartFromEditor} className="bg-green-600 hover:bg-green-500 text-white py-2 rounded text-sm font-bold flex items-center justify-center">
                                <PlaySquare className="w-4 h-4 mr-2" /> Tocar
                            </button>
                        </div>
                    </div>
                  </div>
              </div>

              {/* Right: Preview & Detail Editor */}
              <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 flex flex-col overflow-hidden">
                {selectedSlideId && getSelectedSlide() ? (
                  <>
                     <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden group">
                        {/* Preview Content */}
                        {getSelectedSlide()!.type === MediaType.VIDEO ? (
                           <video src={getSelectedSlide()!.url} className="max-w-full max-h-full opacity-90" />
                        ) : (
                           <img src={getSelectedSlide()!.url} className="max-w-full max-h-full opacity-90" alt="preview" />
                        )}
                        
                        {/* Preview Overlay with Dynamic Styles */}
                        {getSelectedSlide()!.customOverlayText && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div 
                                className="p-8 rounded-xl max-w-4xl text-center whitespace-pre-line drop-shadow-lg animate-slide-up"
                                key={selectedSlideId} // Re-trigger animation on change
                                style={{
                                    backgroundColor: getPreviewStyle(getSelectedSlide()!).backgroundColor
                                }}
                             >
                                <h1 
                                    className={`${getPreviewStyle(getSelectedSlide()!).fontSizeClass} leading-tight`}
                                    style={{
                                        color: getPreviewStyle(getSelectedSlide()!).color,
                                        fontWeight: getPreviewStyle(getSelectedSlide()!).fontWeight
                                    }}
                                >
                                    {getSelectedSlide()!.customOverlayText}
                                </h1>
                             </div>
                          </div>
                        )}

                        {/* Preview Ticker */}
                        <div className="absolute bottom-0 w-full bg-blue-900 h-10 flex items-center px-4 text-white text-xs z-10">
                           <span className="font-bold mr-2 text-yellow-400">TICKER:</span> 
                           {getSelectedSlide()!.footerMessage || "Notícias e Clima (Padrão)..."}
                        </div>
                     </div>

                     {/* Configuration Panel */}
                     <div className="h-[45%] border-t border-gray-700 bg-gray-850 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center text-white">
                               <Edit className="w-5 h-5 mr-2 text-blue-500" /> Editar Slide
                            </h3>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">{getSelectedSlide()!.type} • ID: {getSelectedSlide()!.id}</span>
                        </div>
                        
                        <div className="grid grid-cols-12 gap-6">
                           {/* Visual Editing */}
                           <div className="col-span-7 space-y-5">
                              <div>
                                 <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Papel de Parede (Background)</label>
                                 <div className="flex gap-3">
                                    <input type="file" ref={bgInputRef} className="hidden" onChange={(e) => handleFileSelect(e, true)} accept="image/*,video/mp4" />
                                    <div className="w-20 h-14 bg-gray-900 rounded border border-gray-600 flex items-center justify-center overflow-hidden relative">
                                        <img src={getSelectedSlide()!.thumbnail} className="w-full h-full object-cover opacity-60" alt=""/>
                                    </div>
                                    <button onClick={() => bgInputRef.current?.click()} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center justify-center border border-gray-600 transition-colors">
                                       <ImageIcon className="w-4 h-4 mr-2" /> Alterar Arquivo
                                    </button>
                                 </div>
                              </div>

                              <div>
                                 <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Texto Sobreposto</label>
                                 <textarea 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-all placeholder-gray-600"
                                    rows={3}
                                    placeholder="Digite a mensagem principal para este slide..."
                                    value={getSelectedSlide()!.customOverlayText || ''}
                                    onChange={(e) => updateSlideField('customOverlayText', e.target.value)}
                                 ></textarea>
                                 
                                 {/* Formatting Toolbar */}
                                 <div className="flex items-center gap-2 mt-2 bg-gray-800 p-2 rounded border border-gray-700">
                                    <div className="flex items-center gap-1 group relative" title="Cor do Texto">
                                        <Palette className="w-4 h-4 text-gray-400" />
                                        <input 
                                            type="color" 
                                            className="w-6 h-6 rounded overflow-hidden bg-transparent cursor-pointer border-none"
                                            value={getSelectedSlide()!.overlayStyle?.textColor || '#ffffff'}
                                            onChange={(e) => updateSlideStyle('textColor', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-px h-4 bg-gray-600 mx-1"></div>
                                    
                                    <div className="flex items-center gap-1" title="Cor de Fundo">
                                        <PaintBucket className="w-4 h-4 text-gray-400" />
                                        <input 
                                            type="color" 
                                            className="w-6 h-6 rounded overflow-hidden bg-transparent cursor-pointer border-none"
                                            value={(getSelectedSlide()!.overlayStyle?.backgroundColor || '#000000').slice(0, 7)} // simple hex for input
                                            onChange={(e) => {
                                                // Convert hex to rgba for opacity support later or just keep simple for now
                                                updateSlideStyle('backgroundColor', e.target.value)
                                            }}
                                        />
                                    </div>
                                    <div className="w-px h-4 bg-gray-600 mx-1"></div>

                                    <button 
                                        className={`p-1 rounded ${getSelectedSlide()!.overlayStyle?.isBold !== false ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                                        onClick={() => updateSlideStyle('isBold', !(getSelectedSlide()!.overlayStyle?.isBold !== false))}
                                        title="Negrito"
                                    >
                                        <Bold className="w-4 h-4" />
                                    </button>

                                    <div className="flex items-center gap-1 ml-auto">
                                        <Type className="w-4 h-4 text-gray-400" />
                                        <select 
                                            className="bg-gray-900 border border-gray-600 rounded text-xs p-1 outline-none focus:border-blue-500"
                                            value={getSelectedSlide()!.overlayStyle?.fontSize || 'xl'}
                                            onChange={(e) => updateSlideStyle('fontSize', e.target.value)}
                                        >
                                            <option value="sm">Pequeno</option>
                                            <option value="md">Médio</option>
                                            <option value="lg">Grande</option>
                                            <option value="xl">Gigante</option>
                                        </select>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Settings Column */}
                           <div className="col-span-5 space-y-5">
                               <div>
                                 <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Mensagem Rodapé</label>
                                 <div className="flex items-center">
                                    <div className="bg-gray-700 h-10 w-10 flex items-center justify-center rounded-l border-y border-l border-gray-600">
                                        <MessageSquare className="w-4 h-4 text-gray-300" />
                                    </div>
                                    <input 
                                       type="text" 
                                       className="flex-1 bg-gray-900 border border-gray-600 rounded-r h-10 px-3 text-white focus:border-blue-500 focus:outline-none text-sm"
                                       placeholder="Opcional..."
                                       value={getSelectedSlide()!.footerMessage || ''}
                                       onChange={(e) => updateSlideField('footerMessage', e.target.value)}
                                    />
                                 </div>
                              </div>

                              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                 <label className="block text-xs font-bold text-gray-400 uppercase mb-3 flex items-center justify-between">
                                     Transmissão de Áudio
                                     {getSelectedSlide()!.audioEnabled !== false ? <Volume2 className="w-4 h-4 text-green-500"/> : <XCircle className="w-4 h-4 text-red-500"/>}
                                 </label>
                                 <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-300">Som do Vídeo</span>
                                    <button 
                                       onClick={() => updateSlideField('audioEnabled', !getSelectedSlide()!.audioEnabled)}
                                       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${getSelectedSlide()!.audioEnabled !== false ? 'bg-green-600' : 'bg-gray-600'}`}
                                    >
                                       <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${getSelectedSlide()!.audioEnabled !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                 </div>
                                 <p className="text-[10px] text-gray-500 leading-tight">
                                    {getSelectedSlide()!.audioEnabled !== false 
                                       ? "O áudio original do arquivo será tocado. A Rádio Indoor será reduzida." 
                                       : "O arquivo ficará mudo. A Rádio Indoor tocará normalmente."}
                                 </p>
                              </div>

                              <div>
                                 <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Duração (Seg)</label>
                                 <input 
                                    type="number" 
                                    className="w-full bg-gray-900 border border-gray-700 rounded h-10 px-3 text-white focus:border-blue-500"
                                    value={getSelectedSlide()!.duration}
                                    onChange={(e) => updateSlideField('duration', parseInt(e.target.value))}
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                  </>
                ) : (
                   <div className="flex items-center justify-center h-full text-gray-500 flex-col">
                       <PlaySquare className="w-16 h-16 mb-4 opacity-20"/>
                       <p>Selecione um slide para começar a editar</p>
                   </div>
                )}
              </div>
            </div>
          )}
          
          {/* ... (Terminals, Playlists, Media, Reports views same as before) ... */}
          {activeTab === 'terminals' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {terminals.map(terminal => {
                  const plName = playlists.find(p => p.id === terminal.currentPlaylistId)?.name || 'Padrão';
                  return (
                    <div key={terminal.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 relative overflow-hidden shadow-lg hover:border-blue-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">{terminal.name}</h3>
                            <p className="text-sm text-gray-400">{terminal.location}</p>
                        </div>
                        <div className={`p-2 rounded-full ${
                            terminal.status === TerminalStatus.ONLINE ? 'bg-green-500/20 text-green-500' :
                            terminal.status === TerminalStatus.OFFLINE ? 'bg-red-500/20 text-red-500' :
                            'bg-yellow-500/20 text-yellow-500'
                        }`}>
                            {terminal.status === TerminalStatus.ONLINE ? <CheckCircle size={20} /> : 
                            terminal.status === TerminalStatus.OFFLINE ? <AlertCircle size={20} /> :
                            <RefreshCw size={20} className="animate-spin" />}
                        </div>
                        </div>
                        
                        <div className="space-y-3 mb-6 bg-gray-900/50 p-3 rounded-lg text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">IP:</span>
                                <span className="font-mono text-gray-300">{terminal.ipAddress}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Playlist:</span>
                                <span className="text-blue-400 font-medium truncate max-w-[120px]">{plName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Último Sync:</span>
                                <span className="text-gray-300">{new Date(terminal.lastSync).toLocaleTimeString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                        <button 
                            onClick={() => handleStartFromTerminals(terminal)}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center shadow-lg shadow-blue-900/20"
                        >
                            <Monitor className="w-4 h-4 mr-2" /> Ver Tela
                        </button>
                        <button 
                            onClick={() => setSharingTerminal(terminal)}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 border border-gray-600"
                            title="Compartilhar Acesso"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => {
                                const pl = playlists.find(p => p.id === terminal.currentPlaylistId);
                                if (pl) openEditor(pl);
                            }}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 border border-gray-600"
                            title="Editar Playlist deste Terminal"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ... (Other Tabs are kept same) ... */}
          {activeTab === 'playlists' && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-xl font-bold">Listas de Reprodução</h3>
                   <p className="text-sm text-gray-400">Gerencie campanhas e agendamentos</p>
                 </div>
                 <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center">
                   <Plus className="w-4 h-4 mr-2"/> Nova Playlist
                 </button>
              </div>

              <div className="grid gap-4">
                  {playlists.map((playlist) => (
                    <div key={playlist.id} className="border border-gray-600 rounded-lg overflow-hidden bg-gray-700/30">
                        <div className="p-4 flex flex-wrap justify-between items-center border-b border-gray-600/50">
                        <div className="flex items-center gap-4">
                            <div>
                                <h4 className="font-bold text-lg text-white">{playlist.name}</h4>
                                <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> Seg-Sex</span>
                                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {playlist.schedule.startTime} - {playlist.schedule.endTime}</span>
                                    {playlist.audioUrl && <span className="flex items-center text-green-400"><Radio className="w-3 h-3 mr-1"/> Rádio Online</span>}
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded border ${playlist.active ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-600'}`}>
                                {playlist.active ? 'Ativa' : 'Inativa'}
                            </span>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                            <button onClick={() => openEditor(playlist)} className="flex items-center bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-sm transition-colors">
                                <Edit className="w-4 h-4 mr-2"/> Editar
                            </button>
                            <button onClick={() => onStartPlayer(playlist, integrations)} className="flex items-center bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/40 px-3 py-1.5 rounded text-sm transition-colors">
                                <PlaySquare className="w-4 h-4 mr-2"/> Preview
                            </button>
                        </div>
                        </div>
                        {/* Compact Items Preview */}
                        <div className="p-3 flex gap-2 overflow-x-auto whitespace-nowrap bg-gray-800/50">
                            {playlist.items.map((item, idx) => (
                                <div key={item.id} className="relative w-16 h-10 flex-shrink-0 rounded overflow-hidden opacity-70 border border-gray-600">
                                    <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute bottom-0 right-0 bg-black/60 text-[8px] px-1 text-white">{item.duration}s</div>
                                </div>
                            ))}
                            <div className="w-16 h-10 flex items-center justify-center text-xs text-gray-500 border border-dashed border-gray-600 rounded bg-gray-800">
                                +{playlist.items.length}
                            </div>
                        </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ... (Media & Reports kept same) ... */}
          {activeTab === 'media' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-bold">Biblioteca de Arquivos</h3>
                    <p className="text-sm text-gray-400">Arraste para playlists ou faça upload</p>
                 </div>
                 <div>
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={(e) => handleFileSelect(e)} 
                     className="hidden" 
                     accept=".jpg,.jpeg,.png,.mp4"
                   />
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center shadow-lg transition-transform active:scale-95"
                   >
                      <Upload className="w-4 h-4 mr-2" /> Upload Mídia
                   </button>
                 </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {media.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setViewingMediaItem(item)}
                    className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden group cursor-pointer hover:border-blue-500 transition-all relative"
                  >
                    <div className="relative aspect-video bg-gray-900">
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-bold tracking-wider">
                        {item.type === MediaType.VIDEO ? 'VÍDEO' : 'IMG'}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button className="bg-white/20 p-2 rounded-full hover:bg-white/40"><PlaySquare className="w-6 h-6 text-white"/></button>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-medium truncate text-gray-200" title={item.title}>{item.title}</div>
                      <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
                          <span>{item.duration}s</span>
                          <span>{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1 uppercase font-bold">Exibições (Hoje)</div>
                  <div className="text-4xl font-bold text-white">14,205</div>
                  <div className="text-green-500 text-sm mt-2 flex items-center font-bold">↑ 12.5%</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1 uppercase font-bold">Uptime da Rede</div>
                  <div className="text-4xl font-bold text-white">99.8%</div>
                  <div className="text-gray-500 text-sm mt-2">Últimos 30 dias</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1 uppercase font-bold">Terminais Offline</div>
                  <div className="text-4xl font-bold text-white">1</div>
                  <div className="text-yellow-500 text-sm mt-2">Requer atenção técnica</div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-96">
                <h3 className="text-lg font-bold mb-6 flex items-center"><BarChart3 className="mr-2 text-blue-500"/> Performance Horária</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{fontSize: 12}} />
                    <YAxis stroke="#9CA3AF" tick={{fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                    />
                    <Bar dataKey="impressions" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* --- MODALS --- */}

      {/* Media Detail Modal */}
      {viewingMediaItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          onClick={() => setViewingMediaItem(null)}
        >
           <div 
             className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]"
             onClick={e => e.stopPropagation()}
           >
              <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900">
                 <h3 className="font-bold text-lg flex items-center gap-2">
                    {viewingMediaItem.type === MediaType.VIDEO ? <PlaySquare className="text-blue-500"/> : <ImageIcon className="text-green-500"/>}
                    {viewingMediaItem.title}
                 </h3>
                 <button onClick={() => setViewingMediaItem(null)} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
              </div>
              
              <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[400px]">
                 {viewingMediaItem.type === MediaType.VIDEO ? (
                    <video src={viewingMediaItem.url} controls className="max-w-full max-h-[60vh] rounded" />
                 ) : (
                    <img src={viewingMediaItem.url} alt={viewingMediaItem.title} className="max-w-full max-h-[60vh] rounded shadow-lg" />
                 )}
              </div>

              <div className="p-6 bg-gray-850 border-t border-gray-700 flex justify-between items-center">
                  <div className="space-y-1 text-sm text-gray-400">
                      <p><span className="font-bold uppercase text-gray-500">ID:</span> {viewingMediaItem.id}</p>
                      <p><span className="font-bold uppercase text-gray-500">Duração:</span> {viewingMediaItem.duration} segundos</p>
                      {viewingMediaItem.customOverlayText && (
                        <p className="truncate max-w-xs"><span className="font-bold uppercase text-gray-500">Overlay:</span> {viewingMediaItem.customOverlayText}</p>
                      )}
                  </div>
                  
                  <div className="flex gap-3">
                     <button 
                        onClick={() => handleShareMedia(viewingMediaItem)}
                        className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-colors"
                     >
                        {navigator.share ? <Share2 className="w-4 h-4 mr-2"/> : <Link className="w-4 h-4 mr-2"/>}
                        {navigator.share ? 'Compartilhar' : 'Copiar Link'}
                     </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Terminal Sharing Modal */}
      {sharingTerminal && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSharingTerminal(null)}
        >
            <div 
                className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl animate-fade-in transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center text-white">
                        <Monitor className="mr-2 text-blue-500"/> Acesso do Terminal
                    </h3>
                    <button onClick={() => setSharingTerminal(null)}><X className="text-gray-400 hover:text-white"/></button>
                </div>
                
                <div className="space-y-6">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex items-center gap-4">
                        <div className="p-3 bg-gray-800 rounded-full">
                            <Monitor className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white leading-tight">{sharingTerminal.name}</h4>
                            <div className="flex items-center text-gray-400 text-sm mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {sharingTerminal.location}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                 <span className={`w-2 h-2 rounded-full ${sharingTerminal.status === TerminalStatus.ONLINE ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                 <span className="text-xs font-mono uppercase text-gray-500">{sharingTerminal.status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 relative group hover:border-blue-500/50 transition-colors">
                        <label className="block text-xs uppercase font-bold text-blue-400 mb-2 flex items-center">
                            <Globe className="w-3 h-3 mr-2"/> Link Web Player
                        </label>
                        <div className="flex gap-2">
                            <input 
                                readOnly 
                                value={getTerminalLink(sharingTerminal)} 
                                className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-xs text-gray-300 font-mono focus:outline-none focus:border-blue-500"
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <button 
                                onClick={() => copyToClipboard(getTerminalLink(sharingTerminal), 'Link')}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded transition-colors shadow-lg active:scale-95"
                                title="Copiar Link"
                            >
                                <Copy className="w-4 h-4"/>
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">Use este link para abrir o player em qualquer navegador ou Smart TV.</p>
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 relative group hover:border-green-500/50 transition-colors">
                        <label className="block text-xs uppercase font-bold text-green-400 mb-2 flex items-center">
                            <Wifi className="w-3 h-3 mr-2"/> IP da Rede Local
                        </label>
                        <div className="flex gap-2">
                             <input 
                                readOnly 
                                value={sharingTerminal.ipAddress} 
                                className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-xs text-gray-300 font-mono focus:outline-none focus:border-green-500"
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <button 
                                onClick={() => copyToClipboard(sharingTerminal.ipAddress, 'IP')}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors border border-gray-600 active:scale-95"
                                title="Copiar IP"
                            >
                                <Copy className="w-4 h-4"/>
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">Para configuração técnica em equipamentos dedicados ou softwares de gestão.</p>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
                    <button onClick={() => setSharingTerminal(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white">Fechar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
