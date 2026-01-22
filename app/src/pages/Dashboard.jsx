import React, { useState, useEffect } from 'react';

const Dashboard = () => {
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
                console.error("Failed to fetch metrics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">System Dashboard</h1>
                    <p className="text-slate-500 text-sm">Real-time performance analytics for {metrics?.model_id?.toUpperCase() || 'loading...'} model.</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-xl">share</span>
                    </button>
                    <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-xl">refresh</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Accuracy</p>
                        <span className="material-symbols-outlined text-primary">target</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-bold text-white">{loading ? '...' : (metrics?.accuracy + '%')}</h3>
                        <span className="text-green-500 text-xs font-bold mb-1">+2.4%</span>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">System Loss</p>
                        <span className="material-symbols-outlined text-purple-500">show_chart</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-bold text-white">{loading ? '...' : metrics?.loss}</h3>
                        <span className="text-green-500 text-xs font-bold mb-1">-0.05%</span>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Active Folds</p>
                        <span className="material-symbols-outlined text-yellow-500">layers</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-bold text-white">5/5</h3>
                        <span className="text-slate-500 text-xs font-bold mb-1">K-Fold</span>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Dataset Size</p>
                        <span className="material-symbols-outlined text-primary">database</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-bold text-white">1,240</h3>
                        <span className="text-slate-500 text-xs font-bold mb-1">Images</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-base">Model Architecture</h3>
                            <button className="text-primary text-xs font-bold hover:underline">Edit Layers</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors cursor-pointer">
                                <div className="size-10 bg-primary/20 rounded flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">filter_frames</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Conv2D Layer</p>
                                    <p className="text-xs text-slate-500">32 filters, 3x3 kernel, ReLU</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors cursor-pointer">
                                <div className="size-10 bg-primary/20 rounded flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">grid_view</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold">MaxPooling2D</p>
                                    <p className="text-xs text-slate-500">2x2 pool size, stride 2</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors cursor-pointer">
                                <div className="size-10 bg-primary/20 rounded flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">density_small</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Dense Layer</p>
                                    <p className="text-xs text-slate-500">128 units, Softmax</p>
                                </div>
                            </div>
                            <button className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-xs font-bold hover:border-primary hover:text-primary transition-all">
                                + Add Layer
                            </button>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-base">Hyperparameters</h3>
                        </div>
                        <div className="p-5 space-y-5">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Learning Rate</label>
                                    <span className="text-xs font-bold text-primary">0.001</span>
                                </div>
                                <input
                                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                    type="range"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batch Size</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none p-2">
                                        <option>16</option>
                                        <option selected>32</option>
                                        <option>64</option>
                                        <option>128</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">K-Folds</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none p-2"
                                        type="number"
                                        defaultValue="5"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    defaultChecked
                                    className="rounded text-primary focus:ring-primary bg-slate-800 border-slate-700 size-4"
                                    type="checkbox"
                                />
                                <label className="text-xs font-medium text-slate-400">Apply Batch Normalization</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-base">Training Progress</h3>
                                <p className="text-xs text-slate-500">Real-time Accuracy & Loss curves</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-primary"></span>
                                    <span className="text-xs font-medium">Accuracy</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-[#fa6238]"></span>
                                    <span className="text-xs font-medium">Loss</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-6 flex items-end gap-1 min-h-[400px]">
                            <div className="w-full h-full relative border-l border-b border-slate-200 dark:border-slate-800">
                                <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                                    <div className="border-t border-slate-400 w-full h-0"></div>
                                    <div className="border-t border-slate-400 w-full h-0"></div>
                                    <div className="border-t border-slate-400 w-full h-0"></div>
                                    <div className="border-t border-slate-400 w-full h-0"></div>
                                </div>

                                <svg
                                    className="absolute inset-0 w-full h-full preserve-3d"
                                    preserveAspectRatio="none"
                                    viewBox="0 0 100 100"
                                >
                                    <path
                                        d="M0 20 Q 25 25, 50 45 T 100 80"
                                        fill="none"
                                        stroke="#fa6238"
                                        strokeWidth="2"
                                        vectorEffect="non-scaling-stroke"
                                    ></path>
                                    <path
                                        d="M0 90 Q 25 80, 50 40 T 100 10"
                                        fill="none"
                                        stroke="#137fec"
                                        strokeWidth="2"
                                        vectorEffect="non-scaling-stroke"
                                    ></path>
                                    <path
                                        d="M0 90 Q 25 80, 50 40 T 100 10 L 100 100 L 0 100 Z"
                                        fill="url(#accGrad)"
                                        opacity="0.1"
                                    ></path>
                                    <defs>
                                        <linearGradient id="accGrad" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#137fec"></stop>
                                            <stop offset="100%" stopColor="transparent"></stop>
                                        </linearGradient>
                                    </defs>
                                </svg>

                                <div className="absolute left-[70%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                    <div className="size-3 rounded-full border-2 border-white bg-primary shadow-lg z-10"></div>
                                    <div className="mt-2 bg-slate-900/90 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap border border-slate-700">
                                        Epoch 35: 88.4%
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition-all">
                                    <span className="material-symbols-outlined text-sm">pause</span> Pause
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-all">
                                    <span className="material-symbols-outlined text-sm">stop</span> Stop
                                </button>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">Estimated time remaining</p>
                                <p className="text-sm font-bold">12m 45s</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0c1219] rounded-xl border border-slate-800 overflow-hidden font-mono">
                        <div className="px-4 py-2 bg-slate-800/50 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Logs</span>
                            <div className="flex gap-1.5">
                                <span className="size-2 rounded-full bg-slate-700"></span>
                                <span className="size-2 rounded-full bg-slate-700"></span>
                                <span className="size-2 rounded-full bg-slate-700"></span>
                            </div>
                        </div>
                        <div className="p-4 h-32 overflow-y-auto text-[11px] space-y-1 text-slate-400">
                            <p><span className="text-green-500">[INFO]</span> Epoch 14/50 started...</p>
                            <p><span className="text-primary">[DATA]</span> Batch 1024/2048 processed in 234ms</p>
                            <p><span className="text-slate-500">[SYSTEM]</span> Memory usage: 4.2GB / 8.0GB</p>
                            <p><span className="text-green-500">[INFO]</span> Validation accuracy increased (0.842 -&gt; 0.851). Saving checkpoint...</p>
                            <p className="animate-pulse underline decoration-primary underline-offset-4 tracking-tighter">_</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
