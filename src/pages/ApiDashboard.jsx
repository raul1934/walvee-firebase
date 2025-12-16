import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, DollarSign, Calendar, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  getGeminiStats, 
  logGeminiStats, 
  resetGeminiStats,
  GEMINI_CONFIG 
} from '../components/utils/geminiConfig';
import { 
  getGooglePlacesStats, 
  resetGooglePlacesStats,
  GOOGLE_PLACES_CONFIG 
} from '../components/utils/googlePlacesConfig';

// Taxa de câmbio USD -> BRL (pode ser atualizada)
const USD_TO_BRL = 5.15;

// Storage key for daily metrics
const METRICS_STORAGE_KEY = 'walvee_api_metrics_daily';

export default function ApiDashboard() {
  const [geminiStats, setGeminiStats] = useState(null);
  const [placesStats, setPlacesStats] = useState(null);
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [usdToBrl, setUsdToBrl] = useState(USD_TO_BRL);
  const [loading, setLoading] = useState(true);

  // Load stats
  const loadStats = () => {
    try {
      setGeminiStats(getGeminiStats());
      setPlacesStats(getGooglePlacesStats());
      setLoading(false);
    } catch (error) {
      console.error('[Dashboard] Error loading stats:', error);
      setLoading(false);
    }
  };

  // Load daily metrics from storage
  const loadDailyMetrics = () => {
    try {
      const stored = localStorage.getItem(METRICS_STORAGE_KEY);
      if (stored) {
        const metrics = JSON.parse(stored);
        setDailyMetrics(metrics);
      }
    } catch (error) {
      console.error('[Dashboard] Error loading metrics:', error);
    }
  };

  // Save current session to daily metrics
  const saveSessionToDaily = () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const stored = localStorage.getItem(METRICS_STORAGE_KEY);
      let metrics = stored ? JSON.parse(stored) : [];
      
      // Find today's entry
      const todayIndex = metrics.findIndex(m => m.date === today);
      const todayMetrics = todayIndex >= 0 ? metrics[todayIndex] : {
        date: today,
        gemini: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
        places: { calls: 0, textSearches: 0, details: 0, photos: 0, cost: 0 }
      };
      
      // Add current session stats
      const gemini = getGeminiStats();
      const places = getGooglePlacesStats();
      
      todayMetrics.gemini.calls += gemini.callCount;
      todayMetrics.gemini.inputTokens += gemini.totalInputTokens;
      todayMetrics.gemini.outputTokens += gemini.totalOutputTokens;
      todayMetrics.gemini.cost += gemini.estimatedCost;
      
      todayMetrics.places.calls += places.callCount;
      todayMetrics.places.textSearches += places.textSearchCount;
      todayMetrics.places.details += places.detailsCount;
      todayMetrics.places.photos += places.photosCount;
      todayMetrics.places.cost += places.estimatedCost;
      
      // Update or add today's metrics
      if (todayIndex >= 0) {
        metrics[todayIndex] = todayMetrics;
      } else {
        metrics.push(todayMetrics);
      }
      
      // Keep only last 30 days
      metrics = metrics
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30);
      
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
      loadDailyMetrics();
      
      alert('Session saved to daily metrics! ✅');
      console.log('[Dashboard] Session saved to daily metrics');
    } catch (error) {
      console.error('[Dashboard] Error saving session:', error);
      alert('Error saving session');
    }
  };

  // Reset current session
  const handleResetSession = () => {
    if (confirm('Reset current session stats? Daily history will be preserved.')) {
      resetGeminiStats();
      resetGooglePlacesStats();
      loadStats();
    }
  };

  // Clear all history
  const handleClearHistory = () => {
    if (confirm('Clear ALL historical data? This cannot be undone!')) {
      localStorage.removeItem(METRICS_STORAGE_KEY);
      setDailyMetrics([]);
    }
  };

  // Fetch USD -> BRL rate
  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      if (data.rates && data.rates.BRL) {
        setUsdToBrl(data.rates.BRL);
        console.log('[Dashboard] Exchange rate updated:', data.rates.BRL);
      }
    } catch (error) {
      console.warn('[Dashboard] Could not fetch exchange rate, using default:', USD_TO_BRL);
    }
  };

  // Load on mount
  useEffect(() => {
    loadStats();
    loadDailyMetrics();
    fetchExchangeRate();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate totals
  const totalCostUSD = (geminiStats?.estimatedCost || 0) + (placesStats?.estimatedCost || 0);
  const totalCostBRL = totalCostUSD * usdToBrl;

  const totalDailyCostUSD = dailyMetrics.reduce((sum, day) => 
    sum + (day.gemini.cost || 0) + (day.places.cost || 0), 0
  );
  const totalDailyCostBRL = totalDailyCostUSD * usdToBrl;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C0E11] text-white pt-20 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0E11] text-white pt-20 pb-12">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">API Monitoring Dashboard</h1>
            <p className="text-gray-400">Track usage and costs for Google Gemini & Places APIs</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={saveSessionToDaily}
              variant="outline"
              className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Save Session
            </Button>
            
            <Button
              onClick={loadStats}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* API Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Gemini Status */}
          <Card className="bg-[#1A1B23] border-[#2A2B35]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Google Gemini API
                </span>
                {GEMINI_CONFIG.ENABLED ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="text-lg font-semibold">
                    {GEMINI_CONFIG.ENABLED ? (
                      <span className="text-green-500">✓ Ativa</span>
                    ) : (
                      <span className="text-red-500">✗ Desligada</span>
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Modo</p>
                  <p className="text-lg font-semibold">
                    {GEMINI_CONFIG.ALLOW_INTERNET_CONTEXT ? (
                      <span className="text-orange-500">Produção</span>
                    ) : (
                      <span className="text-blue-500">Desenvolvimento</span>
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Modelo</p>
                  <p className="text-lg font-semibold text-purple-400">
                    {GEMINI_CONFIG.MODEL.toUpperCase()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Internet</p>
                  <p className="text-lg font-semibold">
                    {GEMINI_CONFIG.ALLOW_INTERNET_CONTEXT ? (
                      <span className="text-green-500">ON</span>
                    ) : (
                      <span className="text-gray-500">OFF</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#2A2B35]">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{geminiStats?.callCount || 0}</p>
                    <p className="text-xs text-gray-400">Calls</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {((geminiStats?.totalInputTokens || 0) + (geminiStats?.totalOutputTokens || 0)).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Tokens</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">
                      ${(geminiStats?.estimatedCost || 0).toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-400">Cost (USD)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Places Status */}
          <Card className="bg-[#1A1B23] border-[#2A2B35]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Google Places API
                </span>
                {GOOGLE_PLACES_CONFIG?.ENABLED ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="text-lg font-semibold">
                    {GOOGLE_PLACES_CONFIG?.ENABLED ? (
                      <span className="text-green-500">✓ Ativa</span>
                    ) : (
                      <span className="text-red-500">✗ Desligada</span>
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Cache</p>
                  <p className="text-lg font-semibold text-blue-400">24h TTL</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Text Search</p>
                  <p className="text-lg font-semibold text-white">
                    {placesStats?.textSearchCount || 0}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Details</p>
                  <p className="text-lg font-semibold text-white">
                    {placesStats?.detailsCount || 0}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#2A2B35]">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{placesStats?.callCount || 0}</p>
                    <p className="text-xs text-gray-400">Calls</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {placesStats?.photosCount || 0}
                    </p>
                    <p className="text-xs text-gray-400">Photos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">
                      ${(placesStats?.estimatedCost || 0).toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-400">Cost (USD)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Session Summary */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Current Session Summary
              </span>
              <Button
                onClick={handleResetSession}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Reset Session
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Total Calls</p>
                <p className="text-3xl font-bold text-white">
                  {(geminiStats?.callCount || 0) + (placesStats?.callCount || 0)}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Total Tokens</p>
                <p className="text-3xl font-bold text-purple-400">
                  {((geminiStats?.totalInputTokens || 0) + (geminiStats?.totalOutputTokens || 0)).toLocaleString()}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Cost (USD)</p>
                <p className="text-3xl font-bold text-green-400">
                  ${totalCostUSD.toFixed(4)}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Cost (BRL)</p>
                <p className="text-3xl font-bold text-green-400">
                  R$ {totalCostBRL.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="mt-4 text-center text-xs text-gray-500">
              Exchange rate: 1 USD = R$ {usdToBrl.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Daily History */}
        <Card className="bg-[#1A1B23] border-[#2A2B35]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Daily History (Last 30 Days)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  Total: R$ {totalDailyCostBRL.toFixed(2)}
                </span>
                <Button
                  onClick={handleClearHistory}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Clear History
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyMetrics.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No historical data yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Click "Save Session" to start tracking daily metrics
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyMetrics.map((day) => {
                  const dayTotalUSD = (day.gemini.cost || 0) + (day.places.cost || 0);
                  const dayTotalBRL = dayTotalUSD * usdToBrl;
                  const dayTotalCalls = (day.gemini.calls || 0) + (day.places.calls || 0);
                  
                  return (
                    <div
                      key={day.date}
                      className="flex items-center justify-between p-4 bg-[#0D0D0D] rounded-lg hover:bg-[#1A1B23] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px]">
                          <p className="text-sm font-semibold text-white">
                            {new Date(day.date).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'short' 
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs text-gray-500">Gemini</p>
                            <p className="text-sm font-semibold text-purple-400">
                              {day.gemini.calls} calls
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Places</p>
                            <p className="text-sm font-semibold text-blue-400">
                              {day.places.calls} calls
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-sm font-semibold text-white">
                              {dayTotalCalls} calls
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-400">
                            ${dayTotalUSD.toFixed(4)}
                          </p>
                          <p className="text-xs text-gray-600">USD</p>
                        </div>
                        
                        <div className="text-right min-w-[100px]">
                          <p className="text-lg font-bold text-green-400">
                            R$ {dayTotalBRL.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600">BRL</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        {dailyMetrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card className="bg-[#1A1B23] border-[#2A2B35]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  Gemini Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyMetrics.slice(0, 7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {new Date(day.date).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                          {day.gemini.calls} calls
                        </span>
                        <span className="text-sm font-semibold text-purple-400">
                          R$ {(day.gemini.cost * usdToBrl).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1B23] border-[#2A2B35]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  Places Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyMetrics.slice(0, 7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {new Date(day.date).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                          {day.places.calls} calls
                        </span>
                        <span className="text-sm font-semibold text-blue-400">
                          R$ {(day.places.cost * usdToBrl).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}