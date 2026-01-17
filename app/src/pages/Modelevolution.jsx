import React, { useState, useEffect } from 'react';

const ModelEvolution = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch('/api/metrics');
                if (response.ok) {
                    const data = await response.json();
                    setMetrics(data);
                }
            } catch (error) {
                console.error("Failed to fetch evolution metrics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 font-display tracking-tight">Model Evolution</h1>
                    <p className="text-slate-400">Detailed lifecycle tracking and performance drift analysis.</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-full px-4 py-1.5 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-xs font-bold text-white">Model: VGG16 v2.1 Active</span>
                </div>
            </div>

            {/* Performance Snapshot Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Stability Score</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{loading ? '...' : metrics?.stability}</span>
                        <span className="text-green-500 text-xs font-bold mb-1">+4.2%</span>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Avg Accuracy</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{loading ? '...' : (metrics?.accuracy + '%')}</span>
                        <span className="text-slate-500 text-xs font-bold mb-1">v2.1</span>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-primary">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Epochs</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{loading ? '...' : metrics?.history.accuracy.length}</span>
                        <span className="text-slate-500 text-xs font-bold mb-1">Lifetime</span>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Checkpoints</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">48</span>
                        <span className="text-primary text-[10px] font-bold mb-1 hover:underline cursor-pointer">BROWSE</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Graph Area */}
                <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">timeline</span>
                            <h3 className="font-bold text-white">Evolution Metrics</h3>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-primary"></span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-purple-500"></span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 p-8 min-h-[350px] relative">
                        {/* Dynamic SVG Chart */}
                        <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#137fec" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d={loading ? "" : `M 0 40 L 0 ${40 - (metrics?.history.accuracy[0] * 35)} ${metrics?.history.accuracy.map((acc, i) => `L ${(i / (metrics.history.accuracy.length - 1)) * 100} ${40 - (acc * 35)}`).join(' ')} L 100 40 Z`}
                                fill="url(#lineGrad)"
                            />
                            <path
                                d={loading ? "" : `M 0 ${40 - (metrics?.history.accuracy[0] * 35)} ${metrics?.history.accuracy.map((acc, i) => `L ${(i / (metrics.history.accuracy.length - 1)) * 100} ${40 - (acc * 35)}`).join(' ')}`}
                                fill="none"
                                stroke="#137fec"
                                strokeWidth="0.5"
                            />
                        </svg>

                        {/* X-Axis labels */}
                        <div className="absolute bottom-4 left-8 right-8 flex justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            <span>Fold 1</span>
                            <span>Fold 2</span>
                            <span>Fold 3</span>
                            <span>Fold 4</span>
                            <span>Fold 5</span>
                        </div>
                    </div>
                </div>

                {/* Training Sessions Sidebar */}
                <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">history</span>
                            <h3 className="font-bold text-white">Full-Fold Accuracy</h3>
                        </div>
                        <button className="material-symbols-outlined text-slate-500 hover:text-white transition-colors">tune</button>
                    </div>
                    <div className="p-4 space-y-4">
                        {loading ? <p className="text-slate-500 text-center py-10">Loading folds...</p> : (
                            metrics?.folds.map((fold, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="size-2 rounded-full bg-green-500"></div>
                                        <div>
                                            <p className="text-xs font-bold text-white">Fold {i + 1}</p>
                                            <p className="text-[10px] text-slate-400">Validation Performance</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-primary">{fold}%</span>
                                </div>
                            ))
                        )}
                        <button className="w-full py-3 text-xs font-bold text-slate-500 border border-dashed border-slate-800 rounded-xl hover:border-primary/50 hover:text-primary transition-all uppercase tracking-widest">
                            Load More Runs
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Parameter Tuning History */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">display_settings</span>
                        <h3 className="font-bold text-white">Parameter Tuning History</h3>
                    </div>
                    <button className="bg-primary/10 text-primary px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all">
                        Compare Experiments
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/20">
                                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Run ID</th>
                                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Learning Rate</th>
                                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Batch Size</th>
                                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Optimizer</th>
                                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Accuracy</th>
                                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {[
                                { id: 'EV-829', lr: '0.0001', batch: '64', opt: 'AdamW', acc: '98.4%', status: 'Best' },
                                { id: 'EV-828', lr: '0.001', batch: '32', opt: 'SGD', acc: '92.1%', status: 'Stable' },
                                { id: 'EV-827', lr: '0.01', batch: '128', opt: 'Adam', acc: '88.5%', status: 'Stable' },
                            ].map((row, i) => (
                                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4 font-bold text-white uppercase text-xs">{row.id}</td>
                                    <td className="p-4 text-slate-400 font-mono text-xs">{row.lr}</td>
                                    <td className="p-4 text-slate-400 font-mono text-xs">{row.batch}</td>
                                    <td className="p-4 text-slate-400 font-mono text-xs">{row.opt}</td>
                                    <td className="p-4 text-primary font-bold">{row.acc}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${row.status === 'Best' ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ModelEvolution;
