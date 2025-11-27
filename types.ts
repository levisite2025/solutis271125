

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  WIDGET_WEATHER = 'WIDGET_WEATHER',
  WIDGET_NEWS = 'WIDGET_NEWS',
  WIDGET_SPORTS = 'WIDGET_SPORTS',
  WIDGET_LOTTERY = 'WIDGET_LOTTERY',
  WEB = 'WEB'
}

export enum TerminalStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  SYNCING = 'SYNCING'
}

export enum IntegrationType {
  NEWS = 'NEWS',
  WEATHER = 'WEATHER',
  FINANCE = 'FINANCE',
  LOTTERY = 'LOTTERY',
  SPORTS = 'SPORTS',
  OTHER = 'OTHER'
}

export enum TransitionEffect {
  FADE = 'FADE',
  SLIDE_LEFT = 'SLIDE_LEFT',
  SLIDE_RIGHT = 'SLIDE_RIGHT',
  SLIDE_UP = 'SLIDE_UP',
  ZOOM = 'ZOOM',
  ZOOM_OUT = 'ZOOM_OUT',
  NONE = 'NONE'
}

export interface ApiIntegration {
  id: string;
  name: string; // e.g., "G1 Notícias"
  provider: string; // e.g., "RSS", "OpenWeather", "API Própria"
  type: IntegrationType;
  endpointUrl: string;
  apiKey?: string;
  refreshInterval: number; // in minutes (Tempo de atualização)
  animationSpeed?: number; // in seconds (Velocidade de animação/rolagem - quanto menor, mais rápido)
  enabled: boolean;
  lastStatus: 'OK' | 'ERROR';
  lastSync: Date;
}

export interface Schedule {
  startTime: string; // "08:00"
  endTime: string; // "22:00"
  daysOfWeek: number[]; // 0-6 (Sun-Sat)
}

export interface OverlayStyle {
  textColor?: string;
  backgroundColor?: string;
  isBold?: boolean;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  url?: string;
  duration: number; // in seconds
  thumbnail?: string;
  
  // New customization fields
  customOverlayText?: string; // Text displayed over the image/video
  overlayStyle?: OverlayStyle; // Formatting for the overlay text
  footerMessage?: string; // Custom message for the ticker
  audioEnabled?: boolean; // If false, mutes video or dips background audio
}

export interface Playlist {
  id: string;
  name: string;
  items: MediaItem[];
  schedule: Schedule;
  audioUrl?: string; // Background radio
  tickerSpeed?: number; // Animation duration in seconds (10 = Fast, 60 = Slow)
  active: boolean;
  transitionEffect?: TransitionEffect;
}

export interface Terminal {
  id: string;
  name: string;
  location: string;
  status: TerminalStatus;
  currentPlaylistId?: string;
  lastSync: Date;
  ipAddress: string;
}

export interface ReportData {
  name: string;
  impressions: number;
}

export interface SportsMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'LIVE' | 'FINISHED' | 'SCHEDULED';
  league: string;
}