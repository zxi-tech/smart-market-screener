import React, { useState, useEffect, useMemo } from 'react';
import Chart from './components/Chart';

function App() {
    const [ticker, setTicker] = useState('BBCA.JK');
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('1M'); // UI Indicator

    const watchList = [
        { symbol: 'BBCA.JK', name: 'Bank Central Asia' },
        { symbol: 'GOTO.JK', name: 'GoTo Gojek Tokopedia' },
        { symbol: 'AMMN.JK', name: 'Amman Mineral' },
        { symbol: 'AAPL', name: 'Apple Inc.' }
    ];

    const fetchStockData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/stock/${ticker}`);
            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to fetch data from server');
            }

            setStockData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch data whenever the user changes the ticker dropdown
    useEffect(() => {
        fetchStockData();
    }, [ticker]);

    // Dynamically calculate key metrics from the latest chart data
    const metrics = useMemo(() => {
        if (!stockData || !stockData.chart_data || stockData.chart_data.length < 2) return null;

        const latest = stockData.chart_data[stockData.chart_data.length - 1];
        const prev = stockData.chart_data[stockData.chart_data.length - 2];
        const change = latest.Close - prev.Close;
        const changePercent = (change / prev.Close) * 100;
        const isPositive = change >= 0;

        return {
            price: latest.Close.toLocaleString(),
            change: Math.abs(change).toLocaleString(),
            changePercent: Math.abs(changePercent).toFixed(2),
            isPositive,
            volume: (latest.Volume / 1000000).toFixed(2) + 'M',
            high: latest.High.toLocaleString(),
            low: latest.Low.toLocaleString()
        };
    }, [stockData]);

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col">
            {/* Top Navbar with Blur Effect */}
            <header className="sticky top-0 z-50 bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
                {/* Modern Dropdown Selector */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <select
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 text-white rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer backdrop-blur-sm shadow-sm"
                        >
                            {watchList.map(stock => (
                                <option key={stock.symbol} value={stock.symbol} className="bg-slate-900 text-white">
                                    {stock.symbol} - {stock.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Area: Main Chart & Metrics Ribbon */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* Error Handling */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-center gap-3">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    {/* Overview Metrics Cards */}
                    {loading ? (
                        <div className="h-28 bg-white/5 rounded-2xl animate-pulse border border-white/5"></div>
                    ) : metrics ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm hover:bg-white/[0.07] transition-colors relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-16 h-16 blur-2xl rounded-full opacity-20 ${metrics.isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                <p className="text-slate-400 text-sm font-medium mb-1">Current Price</p>
                                <div className="flex items-end gap-2">
                                    <h2 className="text-3xl font-bold tracking-tight">{metrics.price}</h2>
                                    <span className={`text-sm font-semibold pb-1 flex items-center ${metrics.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {metrics.isPositive ? '▲' : '▼'} {metrics.changePercent}%
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm hover:bg-white/[0.07] transition-colors">
                                <p className="text-slate-400 text-sm font-medium mb-1">24h High</p>
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-200">{metrics.high}</h2>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm hover:bg-white/[0.07] transition-colors">
                                <p className="text-slate-400 text-sm font-medium mb-1">24h Low</p>
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-200">{metrics.low}</h2>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm hover:bg-white/[0.07] transition-colors">
                                <p className="text-slate-400 text-sm font-medium mb-1">Volume</p>
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-200">{metrics.volume}</h2>
                            </div>
                        </div>
                    ) : null}

                    {/* Chart Container */}
                    <div className="bg-[#0f172a]/50 border border-white/10 rounded-2xl p-4 flex-1 min-h-[500px] flex flex-col relative backdrop-blur-sm shadow-xl">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                                Price Action & Volume
                            </h3>

                            {/* Timeframe Selector (UI Feature) */}
                            <div className="flex bg-[#0B0F19] rounded-lg p-1 border border-white/10">
                                {['1D', '1W', '1M', '3M', 'YTD'].map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeframe === tf ? 'bg-blue-600 outline-none text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 w-full relative rounded-xl overflow-hidden">
                            {loading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0F19]/60 backdrop-blur-sm z-10 transition-all">
                                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                    <p className="text-blue-400 font-medium animate-pulse">Analyzing Market Data...</p>
                                </div>
                            ) : stockData?.chart_data ? (
                                <Chart data={stockData.chart_data} />
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Right Area: Sidebar & Insights */}
                <div className="flex flex-col gap-6">
                    {/* Glowing AI Prediction Card */}
                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm shadow-[0_0_30px_rgba(79,70,229,0.07)] relative overflow-hidden group">
                        {/* Glow effect on hover */}
                        <div className="absolute -inset-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                <h3 className="font-semibold text-indigo-300">AI Next-Day Forecast</h3>
                            </div>

                            {loading ? (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-10 bg-white/10 rounded-lg w-1/2"></div>
                                    <div className="h-4 bg-white/10 rounded w-full"></div>
                                </div>
                            ) : stockData?.ai_analysis && !stockData.ai_analysis.error ? (
                                <div>
                                    <div className="flex items-baseline justify-between mb-2">
                                        <p className="text-slate-400 text-sm">Predicted Trend</p>
                                        <span className="text-xs font-mono text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-full border border-indigo-500/30">
                                            Conf: {stockData.ai_analysis.confidence_score}%
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 mt-2 mb-6">
                                        <span className={`text-4xl font-black tracking-tight ${stockData.ai_analysis.prediction === 'UP' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.5)]'}`}>
                                            {stockData.ai_analysis.prediction}
                                        </span>
                                        {stockData.ai_analysis.prediction === 'UP' ? (
                                            <svg className="w-8 h-8 text-emerald-400 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                        ) : (
                                            <svg className="w-8 h-8 text-rose-400 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>
                                        )}
                                    </div>

                                    {/* Confidence Progress Bar */}
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-black/20">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${stockData.ai_analysis.prediction === 'UP' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-rose-500 to-rose-400'}`}
                                            style={{ width: `${stockData.ai_analysis.confidence_score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm">Analysis currently unavailable.</p>
                            )}
                        </div>
                    </div>

                    {/* Technical Indicators Mockup & Disclaimer */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex-1 flex flex-col">
                        <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            Technical Support
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex gap-3 text-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                                <p className="text-slate-400">RSI (Relative Strength Index) is currently in a <strong>neutral</strong> zone.</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex gap-3 text-sm">
                                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                                <p className="text-slate-400">MACD shows signs of potential accumulation phase.</p>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                                Not financial advice. All predictions are generated by AI models based on historical patterns and should be used strictly for informational purposes.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;