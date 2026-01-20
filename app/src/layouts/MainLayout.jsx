import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const MainLayout = () => {
    const [models, setModels] = useState([]);
    const [activeModel, setActiveModel] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const response = await fetch('/api/models');
            if (response.ok) {
                const data = await response.json();
                setModels(data.available_models);
                setActiveModel(data.active_model);
            }
        } catch (error) {
            console.error("Failed to fetch models:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleModelChange = async (modelId) => {
        try {
            const response = await fetch('/api/select_model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_id: modelId })
            });
            if (response.ok) {
                const data = await response.json();
                setActiveModel(data.active_model);
                // Force a refresh of the current page data by triggering a custom event or just reloading
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Failed to change model:", error);
        }
    };
    return (
        <div className="flex h-screen overflow-hidden">
            {/* SideNavBar */}
            <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col justify-between p-4">
                <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-3 px-2">
                        <div className="bg-primary rounded-lg p-2 text-white flex items-center justify-center">
                            <span className="material-symbols-outlined">psychology</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-base font-bold leading-tight">Nhom 1</h1>
                            <p className="text-slate-500 dark:text-[#9dabb9] text-xs">AI Engineer v2.1</p>
                        </div>
                    </div>
                    <nav className="flex flex-col gap-2">
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined fill-1">dashboard</span>
                            <p className="text-sm font-medium">Dashboard</p>
                        </NavLink>
                        <NavLink
                            to="/classification"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined">image</span>
                            <p className="text-sm font-medium">Image Classification</p>
                        </NavLink>
                        <NavLink
                            to="/evolution"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined">analytics</span>
                            <p className="text-sm font-medium">Model Evolution</p>
                        </NavLink>
                        <NavLink
                            to="/kfold"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined">history</span>
                            <p className="text-sm font-medium">K-Fold Validation</p>
                        </NavLink>
                        <NavLink
                            to="/set-faceid"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined">face</span>
                            <p className="text-sm font-medium">Set FaceID</p>
                        </NavLink>
                        <NavLink
                            to="/users"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined">manage_accounts</span>
                            <p className="text-sm font-medium">User Management</p>
                        </NavLink>
                        <NavLink
                            to="/realtime"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined">videocam</span>
                            <p className="text-sm font-medium">Real-time Detection</p>
                        </NavLink>
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* TopNavBar */}
                <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark px-8 py-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold tracking-tight">Nhom 1 AI</h2>
                            <select
                                value={activeModel}
                                onChange={(e) => handleModelChange(e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 border-none rounded-full px-3 py-1 text-[10px] font-bold text-primary uppercase tracking-wider outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                {models.map(m => (
                                    <option key={m.id} value={m.id} disabled={!m.exists}>
                                        {m.name} {!m.exists ? '(Not Found)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 w-64">
                            <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                            <input
                                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-500 outline-none ml-2"
                                placeholder="Search experiments..."
                                type="text"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 mr-4 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                GPU-0: 78% Load
                            </span>
                        </div>
                        <button className="flex items-center justify-center size-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20">
                            Export Model
                        </button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
