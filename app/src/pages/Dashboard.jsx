import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [metrics, setMetrics] = useState({
        accuracy: 0,
        loss: 0,
        model_id: '',
        history: { accuracy: [], loss: [] }
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, usersRes] = await Promise.all([
                    fetch('/api/metrics'),
                    fetch('/api/users')
                ]);

                if (metricsRes.ok) {
                    const metricsData = await metricsRes.ok ? await metricsRes.json() : null;
                    if (metricsData) setMetrics(metricsData);
                }

                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    setUsers(usersData);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const totalImages = users.reduce((acc, user) => acc + (user.image_count || 0), 0);

    const StatCard = ({ title, value, icon, trend, trendColor, label }) => (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-6xl text-white">{icon}</span>
            </div>
            <div className="relative z-10">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
                        {loading ? '...' : value}
                    </h3>
                    {trend && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trendColor}`}>
                            {trend}
                        </span>
                    )}
                </div>
                <p className="text-slate-500 text-[10px] mt-2 font-medium">{label}</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                        System Overview
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20">
                            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                            System Online
                        </span>
                        <span className="text-slate-500 text-sm font-medium">
                            Monitoring {metrics.model_id?.toUpperCase() || 'CNN Core'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link to="/realtime" className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <span className="material-symbols-outlined text-lg">videocam</span>
                        Live Monitor
                    </Link>
                    <Link to="/set-faceid" className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Enroll User
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <StatCard
                    title="Model Accuracy"
                    value={`${metrics.accuracy}%`}
                    icon="verified"
                    trend="+2.1%"
                    trendColor="bg-green-500/10 text-green-500"
                    label={`Verified by ${metrics.model_id}`}
                />
                <StatCard
                    title="Dataset Size"
                    value={totalImages.toLocaleString()}
                    icon="database"
                    label="Processed high-res frames"
                />
                <StatCard
                    title="System Loss"
                    value={metrics.loss || '0.00'}
                    icon="monitoring"
                    trend="-0.04"
                    trendColor="bg-green-500/10 text-green-500"
                    label="Optimization convergence"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/5 rounded-3xl p-6">
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-400">psychology</span>
                                Recognition Strategy
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl">
                                    <span className="text-slate-300 text-sm italic">CNN Softmax</span>
                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase">Active</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl">
                                    <span className="text-slate-300 text-sm italic">Vector Euclidean</span>
                                    <span className="px-2 py-0.5 bg-slate-500/10 text-slate-500 text-[10px] font-bold rounded uppercase">Standby</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-white/5 rounded-3xl p-6">
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-orange-400">hub</span>
                                Model Evolution
                            </h4>
                            <p className="text-slate-400 text-sm mb-4">Latest training session completed 2 hours ago with VGG16 backbone.</p>
                            <Link to="/evolution" className="text-white text-xs font-bold px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all block text-center">
                                Review Evolution
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                            <span className="text-slate-400">RAM Usage</span>
                            <span className="text-slate-300">4.2GB</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-slate-500 rounded-full transition-all duration-1000" style={{ width: '52%' }}></div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-2xl">
                            <span className="material-symbols-outlined text-primary">info</span>
                            <p className="text-[10px] text-slate-300 leading-tight">All systems operational. Latency levels optimal for real-time inference.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
