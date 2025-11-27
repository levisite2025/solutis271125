
import React, { useState, useEffect, useRef } from 'react';
import { Playlist, MediaType, MediaItem, ApiIntegration, IntegrationType, SportsMatch } from '../types';
import { fetchSimulatedNews, fetchSimulatedWeather, fetchSimulatedSports, NewsItem, WeatherInfo } from '../services/geminiService';
import { CloudOff, Wifi, WifiOff, Volume2, VolumeX, Trophy } from 'lucide-react';

interface PlayerProps {
  playlist: Playlist;
  integrations?: ApiIntegration[];
  onExit: () => void;
  isKioskMode?: boolean;
}

const Player: React.FC<PlayerProps> = ({ playlist, integrations = [], onExit, isKioskMode = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<MediaItem>(playlist.items[0]);
  const [progress, setProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Dynamic Data
  const [news, setNews] = useState<NewsItem[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [sportsMatches, setSportsMatches] = useState<SportsMatch[]>([]);

  const [isGlobalMuted, setIsGlobalMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper to find integration settings
  const getIntegrationSettings = (type: IntegrationType) => {
    return integrations.find(i => i.type === type && i.enabled);
  };

  // Data Fetching Logic (News & Weather) with Intervals
  useEffect(() => {
    const fetchNews = async () => {
      const newsData = await fetchSimulatedNews();
      setNews(newsData);
    };

    const fetchWeather = async () => {
      const weatherData = await fetchSimulatedWeather('São Paulo');
      setWeather(weatherData);
    };

    const fetchSports = async () => {
      const sportsData = await fetchSimulatedSports();
      setSportsMatches(sportsData);
    };

    // Initial fetch
    fetchNews();
    fetchWeather();
    fetchSports();

    // Set up intervals based on integration config
    const newsConfig = getIntegrationSettings(IntegrationType.NEWS);
    const weatherConfig = getIntegrationSettings(IntegrationType.WEATHER);
    const sportsConfig = getIntegrationSettings(IntegrationType.SPORTS);

    let newsInterval: ReturnType<typeof setInterval>;
    let weatherInterval: ReturnType<typeof setInterval>;
    let sportsInterval: ReturnType<typeof setInterval>;

    if (newsConfig && newsConfig.refreshInterval > 0) {
       newsInterval = setInterval(fetchNews, newsConfig.refreshInterval * 60 * 1000);
    }

    if (weatherConfig && weatherConfig.refreshInterval > 0) {
       weatherInterval = setInterval(fetchWeather, weatherConfig.refreshInterval * 60 * 1000);
    }

    if (sportsConfig && sportsConfig.refreshInterval > 0) {
       sportsInterval = setInterval(fetchSports, sportsConfig.refreshInterval * 60 * 1000);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (newsInterval) clearInterval(newsInterval);
      if (weatherInterval) clearInterval(weatherInterval);
      if (sportsInterval) clearInterval(sportsInterval);
    };
  }, [integrations]);

  // Audio Logic (Background Radio vs Video Audio)
  useEffect(() => {
    if (!audioRef.current) return;

    const shouldPlayBackground = playlist.audioUrl && !isGlobalMuted;
    
    // Check if current item is a VIDEO and has audio enabled
    const isVideoWithSound = currentItem.type === MediaType.VIDEO && currentItem.audioEnabled !== false;

    if (shouldPlayBackground) {
        if (isVideoWithSound) {
            // Duck volume if video is playing sound
            audioRef.current.volume = 0.1;
        } else {
            // Normal volume
            audioRef.current.volume = 0.4;
        }
        audioRef.current.play().catch(() => {});
    } else {
        audioRef.current.pause();
    }
  }, [currentIndex, currentItem, isGlobalMuted, playlist.audioUrl]);

  // Playlist Logic
  useEffect(() => {
    const item = playlist.items[currentIndex];
    setCurrentItem(item);
    setProgress(0);

    let duration = item.duration * 1000;
    const intervalTime = 100; // Update progress every 100ms
    const step = 100 / (duration / intervalTime);

    // Video Handling
    if (item.type === MediaType.VIDEO && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = item.audioEnabled === false || isGlobalMuted;
        videoRef.current.play().catch(e => console.error("Video play error", e));
    }

    const timer = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          clearInterval(timer);
          handleNext();
          return 0;
        }
        return old + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, playlist.items, isGlobalMuted]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % playlist.items.length);
  };

  const renderContent = () => {
    switch (currentItem.type) {
      case MediaType.IMAGE:
        return (
          <img 
            src={currentItem.url} 
            alt={currentItem.title} 
            className="w-full h-full object-cover animate-fade-in"
          />
        );
      case MediaType.VIDEO:
        return (
          <video
            ref={videoRef}
            src={currentItem.url}
            className="w-full h-full object-cover"
            // Muted logic handled in useEffect
          />
        );
      case MediaType.WIDGET_WEATHER:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-blue-900 text-white p-10">
            <h1 className="text-6xl font-bold mb-4">Previsão do Tempo</h1>
            {weather ? (
              <div className="text-center">
                <div className="text-9xl font-bold mb-4">{weather.temp}°C</div>
                <div className="text-4xl mb-8 capitalize">{weather.condition}</div>
                <div className="text-2xl opacity-80">{weather.city}</div>
                <div className="mt-8 text-xl bg-white/20 p-4 rounded-xl">{weather.forecast}</div>
              </div>
            ) : (
              <p>Carregando dados...</p>
            )}
          </div>
        );
      case MediaType.WIDGET_NEWS:
        return (
          <div className="w-full h-full flex flex-col bg-white text-gray-900 p-10">
            <div className="flex items-center mb-8 border-b-4 border-red-600 pb-4">
              <h1 className="text-5xl font-bold text-red-600 mr-6">NOTÍCIAS</h1>
              <span className="text-2xl text-gray-500">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-8">
              {news.slice(0, 3).map((n, i) => (
                <div key={i} className="flex flex-col animate-slide-up" style={{animationDelay: `${i*0.2}s`}}>
                  <span className="bg-red-600 text-white px-2 py-1 w-fit text-sm font-bold uppercase mb-2">{n.source}</span>
                  <h2 className="text-4xl font-bold leading-tight">{n.headline}</h2>
                  <p className="text-xl text-gray-600 mt-2">{n.category}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case MediaType.WIDGET_SPORTS:
        return (
          <div className="w-full h-full flex flex-col bg-green-900 text-white p-10 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] opacity-30"></div>
             <div className="relative z-10">
                <div className="flex items-center mb-10 border-b-4 border-yellow-400 pb-4">
                  <Trophy className="w-16 h-16 text-yellow-400 mr-6" />
                  <h1 className="text-6xl font-bold text-white uppercase tracking-tighter">Placar da Rodada</h1>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   {sportsMatches.slice(0, 4).map((match, idx) => (
                     <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 flex items-center justify-between animate-fade-in">
                        <div className="text-center w-1/3">
                           <div className="text-2xl font-bold mb-1">{match.homeTeam}</div>
                           <div className="text-xs text-gray-300">Casa</div>
                        </div>
                        <div className="bg-black/40 px-6 py-2 rounded-lg text-4xl font-mono font-bold tracking-widest border border-white/10">
                           {match.homeScore} x {match.awayScore}
                        </div>
                        <div className="text-center w-1/3">
                           <div className="text-2xl font-bold mb-1">{match.awayTeam}</div>
                           <div className="text-xs text-gray-300">Visitante</div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        );
      case MediaType.WIDGET_LOTTERY:
          // ... (Existing implementation if any, otherwise simple placeholder) ...
          return (
             <div className="w-full h-full flex flex-col items-center justify-center bg-purple-900 text-white">
                 <h1 className="text-6xl font-bold">Loterias</h1>
                 <p className="text-2xl mt-4">Resultados em breve...</p>
             </div>
          );
      default:
        return <div className="flex items-center justify-center h-full bg-black">Conteúdo não suportado</div>;
    }
  };

  // Determine Ticker Speed from Playlist Settings or Default
  const tickerDuration = playlist.tickerSpeed ? `${playlist.tickerSpeed}s` : '20s';

  // Overlay styles helper
  const getOverlayStyle = (item: MediaItem) => {
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

  const overlayStyles = getOverlayStyle(currentItem);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden flex flex-col group">
      {/* Hidden Audio Player for Background Music */}
      {playlist.audioUrl && (
        <audio ref={audioRef} src={playlist.audioUrl} loop />
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {renderContent()}
        
        {/* Custom Overlay Text with Dynamic Styles */}
        {currentItem.customOverlayText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
                className="backdrop-blur-sm p-8 rounded-xl max-w-4xl text-center animate-slide-up"
                style={{ backgroundColor: overlayStyles.backgroundColor }}
            >
              <h1 
                className={`${overlayStyles.fontSizeClass} leading-tight whitespace-pre-line drop-shadow-lg`}
                style={{ 
                    color: overlayStyles.color,
                    fontWeight: overlayStyles.fontWeight
                }}
              >
                {currentItem.customOverlayText}
              </h1>
            </div>
          </div>
        )}

        {/* Offline Badge */}
        {!isOnline && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center shadow-lg animate-pulse">
            <CloudOff className="w-6 h-6 mr-2" />
            <span>Modo Offline (Cache)</span>
          </div>
        )}

        {/* Debug/Control Overlay (Shows on Hover) */}
        <div className="absolute top-0 left-0 w-full p-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/50 to-transparent flex justify-between items-center z-50">
           <div className="text-white text-xs">
              <p>Terminal: Recepção 01</p>
              <p>Mídia ID: {currentItem.id}</p>
           </div>
           <div className="flex gap-4">
             <button onClick={() => {
                setIsGlobalMuted(!isGlobalMuted);
             }} className="text-white hover:text-blue-400">
               {isGlobalMuted ? <VolumeX /> : <Volume2 />}
             </button>
             {!isKioskMode && (
               <button onClick={onExit} className="bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded backdrop-blur-sm">
                 Sair do Player
               </button>
             )}
           </div>
        </div>
      </div>

      {/* Footer / Ticker */}
      <div className="h-16 bg-blue-900 text-white flex items-center relative overflow-hidden shadow-2xl z-10 border-t border-blue-700">
        <div className="bg-blue-800 h-full px-6 flex items-center z-20 shadow-md">
            <span className="font-bold text-lg tracking-wider">INFO</span>
        </div>
        
        {/* Animated Ticker with dynamic duration */}
        <div 
          className="whitespace-nowrap flex items-center animate-ticker absolute left-full pl-4 h-full"
          style={{ animationDuration: tickerDuration }}
        >
           {/* Priority: Custom Message -> News -> Weather -> Sports */}
           {currentItem.footerMessage ? (
             <span className="mx-8 text-2xl font-semibold flex items-center text-yellow-300">
               <span className="w-3 h-3 bg-yellow-400 rounded-full mr-4 animate-pulse"></span>
               {currentItem.footerMessage}
             </span>
           ) : (
             <>
                {news.map((item, idx) => (
                  <span key={idx} className="mx-8 text-xl font-light flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                    <span className="font-bold mr-2">[{item.source}]</span> 
                    {item.headline}
                  </span>
                ))}
                {sportsMatches.length > 0 && (
                    <span className="mx-8 text-xl font-light flex items-center text-green-200">
                        <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                        {sportsMatches[0].homeTeam} {sportsMatches[0].homeScore} x {sportsMatches[0].awayScore} {sportsMatches[0].awayTeam}
                    </span>
                )}
                {weather && (
                  <span className="mx-8 text-xl font-light flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                      {weather.city}: {weather.temp}°C - {weather.forecast}
                  </span>
                )}
             </>
           )}
        </div>
        
        {/* Status Icons in footer */}
        <div className="absolute right-0 top-0 h-full bg-blue-900/90 pl-6 pr-4 flex items-center space-x-4 z-20 backdrop-blur-sm">
           {isOnline ? <Wifi className="text-green-400 w-5 h-5"/> : <WifiOff className="text-red-400 w-5 h-5" />}
           <div className="text-xs text-blue-200">
             {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-800 w-full">
        <div 
          className="h-full bg-yellow-500 transition-all duration-100 ease-linear" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Player;
