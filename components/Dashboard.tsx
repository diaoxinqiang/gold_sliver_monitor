import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchLivePrices, fetchMarketAnalysis } from '../services/geminiService';
import { getStoredHistory, saveStoredHistory } from '../services/storageService';
import { MarketData, AnalysisResult, Timeframe } from '../types';
import PriceCard from './PriceCard';
import RatioChart from './RatioChart';
import { RefreshCw, DollarSign, Activity, AlertCircle, Clock, Calendar } from 'lucide-react';

const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 Hour

const Dashboard: React.FC = () => {
  const [currentData, setCurrentData] = useState<MarketData | null>(null);
  const [history, setHistory] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1H');

  // Load history from local storage on mount
  useEffect(() => {
    const stored = getStoredHistory();
    if (stored.length > 0) {
      setHistory(stored);
      setCurrentData(stored[stored.length - 1]);
    }
    
    // Check if we need to fetch immediately (if data is stale > 1 hour)
    const lastTimestamp = stored.length > 0 ? stored[stored.length - 1].timestamp : 0;
    if (Date.now() - lastTimestamp > UPDATE_INTERVAL) {
      refreshData(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = async (currentHistory?: MarketData[]) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLivePrices();
      if (data) {
        setCurrentData(data);
        
        setHistory(prev => {
          // Use provided history if available (for initial load sync), otherwise use state
          const baseHistory = currentHistory || prev;
          
          // Avoid duplicates if refresh is clicked multiple times rapidly
          const lastEntry = baseHistory[baseHistory.length - 1];
          if (lastEntry && (data.timestamp - lastEntry.timestamp < 10000)) {
            return baseHistory; 
          }

          const newHistory = [...baseHistory, data];
          // Limit history size to prevent localStorage overflow (e.g. 5000 points ~ 200 days of hourly data)
          const trimmedHistory = newHistory.length > 5000 ? newHistory.slice(-5000) : newHistory;
          
          saveStoredHistory(trimmedHistory);
          return trimmedHistory;
        });
      } else {
        setError("Unable to retrieve live prices. Please try again.");
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = useCallback(async () => {
    if (!currentData) return;
    setAnalyzing(true);
    try {
      const result = await fetchMarketAnalysis(currentData.ratio);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  }, [currentData]);

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Filter/Aggregate data based on timeframe
  const displayData = useMemo(() => {
    if (timeframe === '1H') {
      return history;
    } else {
      // Aggregate by Day (taking the last value of the day)
      const dailyMap = new Map<string, MarketData>();
      history.forEach(item => {
        const dateKey = new Date(item.timestamp).toLocaleDateString();
        // Always overwrite to keep the latest entry for the day
        dailyMap.set(dateKey, item);
      });
      return Array.from(dailyMap.values());
    }
  }, [history, timeframe]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500">
            Gold/Silver Monitor
          </h1>
          <p className="text-slate-400 mt-1">Real-time Ratio Calculator & Tracker</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
             <button
            onClick={() => refreshData()}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              loading 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Updating...' : 'Update Now'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <PriceCard 
          title="Gold Price (Oz)" 
          value={currentData?.goldPrice || 0} 
          colorClass="text-yellow-400"
          icon={<DollarSign className="w-4 h-4 text-yellow-500" />}
        />
        <PriceCard 
          title="Silver Price (Oz)" 
          value={currentData?.silverPrice || 0} 
          colorClass="text-slate-300"
          icon={<DollarSign className="w-4 h-4 text-slate-400" />}
        />
        <PriceCard 
          title="Gold/Silver Ratio" 
          value={currentData?.ratio || 0} 
          isCurrency={false}
          colorClass="text-emerald-400"
          icon={<Activity className="w-4 h-4 text-emerald-500" />}
        />
      </div>

      {/* Chart Section */}
      <div className="mb-8">
        <div className="flex justify-end mb-2 space-x-2">
           <button
             onClick={() => setTimeframe('1H')}
             className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
               timeframe === '1H' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
             }`}
           >
             <Clock className="w-3 h-3" /> Hourly
           </button>
           <button
             onClick={() => setTimeframe('1D')}
             className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
               timeframe === '1D' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
             }`}
           >
             <Calendar className="w-3 h-3" /> Daily
           </button>
        </div>
        <RatioChart data={displayData} timeframe={timeframe} />
      </div>

      {/* AI Analysis Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
            <span className="text-2xl">🧠</span> AI Market Analysis
          </h3>
          <button
            onClick={runAnalysis}
            disabled={!currentData || analyzing}
            className={`mt-2 md:mt-0 text-sm px-3 py-1.5 rounded-md border transition-colors ${
              analyzing 
                ? 'border-slate-600 text-slate-500' 
                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {analyzing ? 'Analyzing...' : 'Generate Analysis'}
          </button>
        </div>

        <div className="space-y-4">
          {analysis ? (
            <div className="animate-fade-in">
              <p className="text-slate-300 leading-relaxed text-lg">
                {analysis.text}
              </p>
              {analysis.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Sources</p>
                  <ul className="flex flex-wrap gap-3">
                    {analysis.sources.map((source, idx) => (
                      <li key={idx}>
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                        >
                          🔗 {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 text-center py-8 italic">
              {currentData 
                ? "Click 'Generate Analysis' to get insights on the current ratio." 
                : "Waiting for market data..."}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-slate-600">
        <p>Data is stored locally in your browser. Prices updated hourly.</p>
        <p>Disclaimer: Data provided by AI-powered search grounding. Not financial advice. Prices may be delayed.</p>
      </div>
    </div>
  );
};

export default Dashboard;
