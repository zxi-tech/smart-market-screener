import React, { useState, useEffect, useMemo } from 'react';
import Chart from './components/Chart';

function App() {
    const [ticker, setTicker] = useState('BBCA.JK');
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('1M');

    const watchList = [
        { symbol: 'BBCA.JK', name: 'Bank Central Asia' },
        { symbol: 'GOTO.JK', name: 'GoTo Gojek Tokopedia' },
        { symbol: 'AMMN.JK', name: 'Amman Mineral' },
        { symbol: 'AAPL', name: 'Apple Inc.' }
    ];

    // Mock global market indices for the top ticker bar
    const marketIndices = [
        { name: 'S&P 500', value: '5,234.18', change: '+1.02%', up: true },
        { name: 'NASDAQ', value: '16,340.50', change: '+1.54%', up: true },
        { name: 'BTC/USD', value: '$68,430.00', change: '-0.50%', up: false },
        { name: 'IHSG', value: '7,321.45', change: '+0.23%', up: true },
        { name: 'GOLD', value: '$2,156.20', change: '+0.88%', up: true },
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

    useEffect(() => {
        fetchStockData();
    }, [ticker]);

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

    const techIndicators = useMemo(() => {
        if (!stockData || !stockData.chart_data) return null;

        const latest = stockData.chart_data[stockData.chart_data.length - 1];
        const rsi = latest.RSI_14;
        const macdHist = latest.MACDh_12_26_9;

        let rsiState = { text: 'Neutral', color: 'text-blue-400', dot: 'bg-blue-500', bg: 'bg-blue-500/10' };
        if (rsi >= 70) rsiState = { text: 'Overbought (Bearish)', color: 'text-rose-400', dot: 'bg-rose-500', bg: 'bg-rose-500/10' };
        else if (rsi <= 30) rsiState = { text: 'Oversold (Bullish)', color: 'text-emerald-400', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10' };

        let macdState = { text: 'Neutral Phase', color: 'text-blue-400', dot: 'bg-blue-500', bg: 'bg-blue-500/10' };
        if (macdHist > 0) macdState = { text: 'Bullish (Accumulation)', color: 'text-emerald-400', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10' };
        else if (macdHist < 0) macdState = { text: 'Bearish (Distribution)', color: 'text-rose-400', dot: 'bg-rose-500', bg: 'bg-rose-500/10' };

        return { rsi: rsi?.toFixed(2), rsiState, macdState };
    }, [stockData]);

    return (
        <div className="min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col overflow-x-hidden relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Global Market Ticker (Marquee) */}
            <div className="w-full bg-[#020617] border-b border-white/5 py-2 overflow-hidden flex items-center shadow-lg relative z-20">
                <div className="flex animate-marquee whitespace-nowrap">
                    {[...marketIndices, ...marketIndices, ...marketIndices, ...marketIndices].map((idx, i) => (
                        <div key={i} className="flex items-center gap-2.5 mx-8 text-xs tracking-wide">
                            <span className="text-slate-500 font-semibold">{idx.name}</span>
                            <span className="text-slate-300 font-medium">{idx.value}</span>
                            <span className={`font-bold ${idx.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {idx.up ? '▲' : '▼'} {idx.change}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Glass Navbar */}
            <header className="sticky top-4 z-50 mx-4 lg:mx-auto max-w-7xl w-[calc(100%-2rem)] bg-[#0B0F19]/60 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl transition-all">

                <div className="relative group">
                    <select
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        className="appearance-none bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl pl-5 pr-12 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer backdrop-blur-md shadow-sm"
                    >
                        {watchList.map(stock => (
                            <option key={stock.symbol} value={stock.symbol} className="bg-slate-900 text-white">
                                {stock.symbol} - {stock.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 mt-2 relative z-10">

                {/* Left Area: Main Chart & Metrics */}
                <div className="lg:col-span-3 flex flex-col gap-6">

                    {/* Error Banner */}
                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 flex items-center gap-3 backdrop-blur-md">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Top Metrics Ribbon */}
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse border border-white/5"></div>
                            ))}
                        </div>
                    ) : metrics ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all duration-300">
                                <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[40px] rounded-full opacity-20 transition-opacity group-hover:opacity-40 ${metrics.isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Current Price</p>
                                <div className="flex items-end gap-2 mt-2">
                                    <h2 className="text-3xl font-bold tracking-tighter text-white">{metrics.price}</h2>
                                    <span className={`text-sm font-bold pb-1 flex items-center px-1.5 py-0.5 rounded-md ${metrics.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        {metrics.isPositive ? '▲' : '▼'} {metrics.changePercent}%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 p-5 rounded-2xl backdrop-blur-md hover:bg-white/[0.06] transition-all duration-300 flex flex-col justify-between">
                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">24h High</p>
                                <h2 className="text-2xl font-bold tracking-tight text-white mt-2">{metrics.high}</h2>
                            </div>

                            <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 p-5 rounded-2xl backdrop-blur-md hover:bg-white/[0.06] transition-all duration-300 flex flex-col justify-between">
                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">24h Low</p>
                                <h2 className="text-2xl font-bold tracking-tight text-white mt-2">{metrics.low}</h2>
                            </div>

                            <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 p-5 rounded-2xl backdrop-blur-md hover:bg-white/[0.06] transition-all duration-300 flex flex-col justify-between">
                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Volume (IDR)</p>
                                <h2 className="text-2xl font-bold tracking-tight text-white mt-2">{metrics.volume}</h2>
                            </div>
                        </div>
                    ) : null}

                    {/* Chart Container */}
                    <div className="bg-[#0B101E]/80 border border-white/10 rounded-2xl p-5 flex-1 min-h-[500px] flex flex-col relative backdrop-blur-xl shadow-2xl">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                Market Architecture
                            </h3>

                            {/* Segmented Timeframe Control */}
                            <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 backdrop-blur-sm">
                                {['1D', '1W', '1M', '3M', 'YTD'].map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${timeframe === tf
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 w-full relative rounded-xl overflow-hidden border border-white/5 bg-[#030712]/50">
                            {loading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm z-10 transition-all">
                                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    <p className="text-blue-400 font-medium tracking-wide animate-pulse">Synchronizing Data...</p>
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
                    <div className="bg-gradient-to-b from-[#1E1B4B]/80 to-[#0F172A]/80 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-[0_20px_40px_rgba(49,46,129,0.2)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                            </div>

                            {loading ? (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-12 bg-white/5 rounded-xl w-2/3"></div>
                                    <div className="h-3 bg-white/5 rounded w-full"></div>
                                </div>
                            ) : stockData?.ai_analysis && !stockData.ai_analysis.error ? (
                                <div>
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Algorithm Forecast</p>

                                    <div className="flex items-center gap-4 mt-1 mb-6">
                                        <span className={`text-5xl font-black tracking-tighter ${stockData.ai_analysis.prediction === 'UP' ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.4)]'}`}>
                                            {stockData.ai_analysis.prediction}
                                        </span>
                                        <div className={`p-2 rounded-xl ${stockData.ai_analysis.prediction === 'UP' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                            {stockData.ai_analysis.prediction === 'UP' ? (
                                                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                            ) : (
                                                <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-xs font-medium mb-1.5">
                                        <span className="text-slate-400">Model Confidence</span>
                                        <span className="text-indigo-300">{stockData.ai_analysis.confidence_score}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 relative ${stockData.ai_analysis.prediction === 'UP' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
                                            style={{ width: `${stockData.ai_analysis.confidence_score}%` }}
                                        >
                                            {/* Shine effect on progress bar */}
                                            <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-[100%] animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center border-2 border-dashed border-white/10 rounded-xl">
                                    <p className="text-slate-500 text-sm font-medium">Forecast offline.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Technical Indicators */}
                    <div className="bg-[#0B101E]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex-1 flex flex-col shadow-xl relative overflow-hidden">
                        {/* Decorative background circle */}
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none"></div>

                        <h3 className="font-bold text-white mb-5 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            Technical Signals
                        </h3>

                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-20 bg-white/5 rounded-xl w-full"></div>
                                <div className="h-20 bg-white/5 rounded-xl w-full"></div>
                            </div>
                        ) : techIndicators ? (
                            <div className="space-y-3 mb-6">
                                {/* RSI Box */}
                                <div className={`p-4 rounded-xl border border-white/5 ${techIndicators.rsiState.bg} backdrop-blur-sm transition-colors`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-slate-300 font-semibold text-sm">RSI (14)</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${techIndicators.rsiState.dot} text-white`}>
                                            {techIndicators.rsi}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Indicating <strong className={`${techIndicators.rsiState.color} uppercase tracking-wider text-[10px]`}>{techIndicators.rsiState.text}</strong>.
                                    </p>
                                </div>

                                {/* MACD Box */}
                                <div className={`p-4 rounded-xl border border-white/5 ${techIndicators.macdState.bg} backdrop-blur-sm transition-colors`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-slate-300 font-semibold text-sm">MACD History</span>
                                        <span className={`w-2 h-2 rounded-full mt-1.5 ${techIndicators.macdState.dot}`}></span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Shows signs of <strong className={`${techIndicators.macdState.color} uppercase tracking-wider text-[10px]`}>{techIndicators.macdState.text}</strong>.
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-auto pt-5 border-t border-white/10 text-center">
                            <p className="text-[10px] text-slate-500/70 leading-relaxed uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                Not Financial Advice
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
