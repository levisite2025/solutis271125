
import { MediaItem, MediaType, Playlist, Terminal, TerminalStatus, ApiIntegration, IntegrationType } from './types';

export const BRAZIL_CITIES_BY_STATE: Record<string, string[]> = {
  "AC": ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá"],
  "AL": ["Maceió", "Arapiraca", "Palmeira dos Índios", "Rio Largo"],
  "AP": ["Macapá", "Santana", "Laranjal do Jari"],
  "AM": ["Manaus", "Parintins", "Itacoatiara", "Manacapuru"],
  "BA": ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Juazeiro", "Ilhéus", "Porto Seguro"],
  "CE": ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Sobral", "Crato"],
  "DF": ["Brasília", "Ceilândia", "Taguatinga", "Gama"],
  "ES": ["Vitória", "Vila Velha", "Serra", "Cariacica", "Cachoeiro de Itapemirim"],
  "GO": ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde"],
  "MA": ["São Luís", "Imperatriz", "São José de Ribamar", "Timon"],
  "MT": ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop"],
  "MS": ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá"],
  "MG": ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Uberaba"],
  "PA": ["Belém", "Ananindeua", "Santarém", "Marabá", "Parauapebas"],
  "PB": ["João Pessoa", "Campina Grande", "Santa Rita", "Patos"],
  "PR": ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "Foz do Iguaçu"],
  "PE": ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina"],
  "PI": ["Teresina", "Parnaíba", "Picos"],
  "RJ": ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Campos dos Goytacazes"],
  "RN": ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante"],
  "RS": ["Porto Alegre", "Caxias do Sul", "Canoas", "Pelotas", "Santa Maria", "Gramado"],
  "RO": ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena"],
  "RR": ["Boa Vista", "Rorainópolis"],
  "SC": ["Florianópolis", "Joinville", "Blumenau", "São José", "Chapecó", "Criciúma", "Balneário Camboriú"],
  "SP": ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "Sorocaba", "Ribeirão Preto", "Santos"],
  "SE": ["Aracaju", "Nossa Senhora do Socorro", "Lagarto"],
  "TO": ["Palmas", "Araguaína", "Gurupi"]
};

export const MOCK_MEDIA_LIBRARY: MediaItem[] = [
  {
    id: 'm1',
    title: 'Campanha Verão 2025',
    type: MediaType.IMAGE,
    url: 'https://picsum.photos/1920/1080?random=1',
    duration: 10,
    thumbnail: 'https://picsum.photos/300/200?random=1',
    customOverlayText: 'APROVEITE O VERÃO\nDescontos de até 50%',
    footerMessage: 'Oferta válida enquanto durarem os estoques.',
    audioEnabled: true
  },
  {
    id: 'm2',
    title: 'Vídeo Institucional',
    type: MediaType.VIDEO,
    url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
    duration: 15,
    thumbnail: 'https://picsum.photos/300/200?random=2',
    audioEnabled: true
  },
  {
    id: 'm3',
    title: 'Previsão do Tempo',
    type: MediaType.WIDGET_WEATHER,
    duration: 8,
    thumbnail: 'https://picsum.photos/300/200?random=3'
  },
  {
    id: 'm4',
    title: 'Notícias G1/UOL (IA)',
    type: MediaType.WIDGET_NEWS,
    duration: 12,
    thumbnail: 'https://picsum.photos/300/200?random=4',
    footerMessage: 'Fique bem informado com nosso canal digital.'
  },
  {
    id: 'm5',
    title: 'Promoção Relâmpago',
    type: MediaType.IMAGE,
    url: 'https://picsum.photos/1920/1080?random=5',
    duration: 5,
    thumbnail: 'https://picsum.photos/300/200?random=5',
    customOverlayText: 'HORA DO LANCHE\nCombo Especial R$ 19,90',
    audioEnabled: false
  },
  {
    id: 'm6',
    title: 'Placar da Rodada',
    type: MediaType.WIDGET_SPORTS,
    duration: 10,
    thumbnail: 'https://picsum.photos/300/200?random=6',
    footerMessage: 'Acompanhe os resultados do Brasileirão em tempo real.'
  },
  {
    id: 'm7',
    title: 'Loterias Caixa',
    type: MediaType.WIDGET_LOTTERY, // This needs to be added to MediaType enum in types.ts if not present, assuming it handles it generically or mapped
    duration: 10,
    thumbnail: 'https://picsum.photos/300/200?random=7',
    footerMessage: 'Boa sorte! Aposte com moderação.'
  }
];

export const MOCK_TERMINALS: Terminal[] = [
  {
    id: 't1',
    name: 'Recepção Principal',
    location: 'Térreo - Entrada A',
    status: TerminalStatus.ONLINE,
    lastSync: new Date(),
    ipAddress: '192.168.1.101',
    currentPlaylistId: 'p1'
  },
  {
    id: 't2',
    name: 'Corredor Norte',
    location: '2º Andar',
    status: TerminalStatus.OFFLINE,
    lastSync: new Date(Date.now() - 86400000),
    ipAddress: '192.168.1.105',
    currentPlaylistId: 'p1'
  },
  {
    id: 't3',
    name: 'Cafeteria',
    location: 'Área Comum',
    status: TerminalStatus.SYNCING,
    lastSync: new Date(Date.now() - 300000),
    ipAddress: '192.168.1.110',
    currentPlaylistId: 'p1'
  }
];

export const MOCK_PLAYLIST: Playlist = {
  id: 'p1',
  name: 'Programação Padrão',
  active: true,
  schedule: {
    startTime: '06:00',
    endTime: '23:00',
    daysOfWeek: [1, 2, 3, 4, 5]
  },
  audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  tickerSpeed: 25, // Default duration in seconds
  items: [MOCK_MEDIA_LIBRARY[0], MOCK_MEDIA_LIBRARY[2], MOCK_MEDIA_LIBRARY[1], MOCK_MEDIA_LIBRARY[5], MOCK_MEDIA_LIBRARY[3], MOCK_MEDIA_LIBRARY[4], MOCK_MEDIA_LIBRARY[6]]
};

export const MOCK_INTEGRATIONS: ApiIntegration[] = [
  {
    id: 'api1',
    name: 'Notícias G1',
    provider: 'RSS Feed',
    type: IntegrationType.NEWS,
    endpointUrl: 'https://g1.globo.com/rss/g1/',
    refreshInterval: 15, // 15 minutos
    animationSpeed: 20, // 20 segundos (velocidade normal)
    enabled: true,
    lastStatus: 'OK',
    lastSync: new Date()
  },
  {
    id: 'api2',
    name: 'Clima Tempo SP',
    provider: 'OpenWeatherMap',
    type: IntegrationType.WEATHER,
    endpointUrl: 'https://api.openweathermap.org/data/2.5/weather?q=Sao Paulo,BR',
    apiKey: 'sk_test_123456...',
    refreshInterval: 60,
    animationSpeed: 20,
    enabled: true,
    lastStatus: 'OK',
    lastSync: new Date()
  },
  {
    id: 'api3',
    name: 'Cotação Dólar/Euro',
    provider: 'AwesomeAPI',
    type: IntegrationType.FINANCE,
    endpointUrl: 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL',
    refreshInterval: 30,
    animationSpeed: 15, // Mais rápido
    enabled: true,
    lastStatus: 'OK',
    lastSync: new Date()
  },
  {
    id: 'api4',
    name: 'Resultados Loterias',
    provider: 'Simulação AI',
    type: IntegrationType.LOTTERY,
    endpointUrl: 'AI_GENERATED', // Marcador para usar o GeminiService
    refreshInterval: 240,
    animationSpeed: 25, // Mais lento
    enabled: true,
    lastStatus: 'OK',
    lastSync: new Date()
  },
  {
    id: 'api5',
    name: 'Resultados Futebol',
    provider: 'API-Futebol',
    type: IntegrationType.SPORTS,
    endpointUrl: 'https://api.api-futebol.com.br/v1/jogos',
    refreshInterval: 5,
    animationSpeed: 15,
    enabled: true,
    lastStatus: 'OK',
    lastSync: new Date()
  }
];
