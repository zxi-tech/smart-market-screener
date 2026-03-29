import { useState } from 'react';

function App() {
    const [ticker, setTicker] = useState('BBCA.JK');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Daftar saham statis untuk dropdown MVP
    const watchList = ['BBCA.JK', 'GOTO.JK', 'AMMN.JK', 'AAPL'];

    const fetchPrediction = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Memanggil API Flask di port 5000
            const response = await fetch(`http://127.0.0.1:5000/api/predict?ticker=${ticker}`);
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Gagal mengambil data dari server');
            }

            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
            <div className="max-w-2xl mx-auto">

                {/* Header Section */}
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-bold text-blue-400 mb-2">Smart Market Screener</h1>
                    <p className="text-slate-400">AI-Powered Trend Prediction for Swing & Intraday</p>
                </header>

                {/* Control Panel */}
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg mb-8 flex gap-4">
                    <select
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        className="flex-1 bg-slate-700 text-white border border-slate-600 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                    >
                        {watchList.map(stock => (
                            <option key={stock} value={stock}>{stock}</option>
                        ))}
                    </select>

                    <button
                        onClick={fetchPrediction}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Analyzing...' : 'Analyze Trend'}
                    </button>
                </div>

                {/* Error Handling */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-8 text-center">
                        {error}
                    </div>
                )}

                {/* Result Card */}
                {result && (
                    <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700 text-center animate-fade-in">
                        <h2 className="text-2xl font-semibold mb-2">Hasil Analisis: {result.ticker}</h2>
                        <p className="text-slate-400 mb-6">Tanggal Data Terakhir: {result.latest_date}</p>

                        <div className="flex justify-center items-center gap-12">
                            <div>
                                <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Prediksi</p>
                                <p className={`text-5xl font-bold ${result.prediction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                                    {result.prediction}
                                </p>
                            </div>

                            <div className="h-16 w-px bg-slate-600"></div>

                            <div>
                                <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Confidence</p>
                                <p className="text-4xl font-bold text-blue-400">
                                    {result.confidence_score}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default App;