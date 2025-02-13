// Message Types
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

// Analysis Types
export interface AnalysisResult {
  score: number;
  message: string;
  alternatives: Array<{
    message: string;
    score: number;
  }>;
}

// Visualization Types
export interface Dot {
  x: number;
  y: number;
  active?: boolean;
  state?: 'success' | 'warning' | 'error' | 'neutral';
}

export interface StateUpdate {
  dots: Dot[];
}

export interface MonteCarloUpdate {
  dots: Dot[];
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'message' | 'analysis' | 'state_update' | 'monte_carlo_update';
  data: Message | AnalysisResult | StateUpdate | MonteCarloUpdate;
}

// Store Types
export interface ChatState {
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AnalysisState {
  results: AnalysisResult[];
  stateData: StateUpdate | null;
  monteCarloData: MonteCarloUpdate | null;
  goal: string;
  isLoading: boolean;
  error: string | null;
}

// Configuration Types
export interface Config {
  wsUrl: string;
  apiUrl: string;
  environment: string;
  features: {
    enableVideo: boolean;
    enableVoice: boolean;
  };
  analytics: {
    id: string;
  };
} 