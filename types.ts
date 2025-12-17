export interface MarketData {
  timestamp: number;
  goldPrice: number;
  silverPrice: number;
  ratio: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AnalysisResult {
  text: string;
  sources: GroundingSource[];
}

export type Timeframe = '1H' | '1D';
