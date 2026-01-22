import React, { useState, useEffect } from 'react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [viewMode, setViewMode] = useState(null);
    const [datasetImages, setDatasetImages] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm(`Are you sure you want to delete user ${userId}? All associated videos and images will be permanently removed.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
            if (response.ok) {
                setUsers(users.filter(u => u.user_id !== userId));
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const openModal = (user, mode) => {
        setSelectedUser(user);
        setViewMode(mode);
        if (mode === 'dataset') {
            const images = Array.from({ length: user.image_count }, (_, i) =>
                `/data/datasets/${user.user_id}/face_${String(i).padStart(3, '0')}.jpg`
            );
            setDatasetImages(images);
        }
    };

    const closeModal = () => {
        setSelectedUser(null);
        setViewMode(null);
        setDatasetImages([]);
    };

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-slate-400">Manage enrolled FaceID profiles, raw videos, and extracted datasets.</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-full px-4 py-1.5 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-500"></span>
                    <span className="text-xs font-bold text-white">Database Active: {users.length} Profiles</span>
                </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-500">
                        <span className="animate-spin material-symbols-outlined text-4xl">sync</span>
                        <p className="font-medium">Loading Identity Registry...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-500 text-center">
                        <span className="material-symbols-outlined text-6xl opacity-20">group_off</span>
                        <div className="space-y-1">
                            <p className="text-white font-bold text-xl">No Profiles Found</p>
                            <p className="text-sm">New enrollments will appear here automatically.</p>
                        </div>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identified User</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User ID</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Assets</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Created At</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {users.map((user) => (
                                <tr key={user.id} className="group hover:bg-slate-800/20 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-blue-500 text-xl">person</span>
                                            </div>
                                            <span className="font-bold text-white">{user.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <code className="text-xs bg-slate-800/50 px-2 py-1 rounded text-primary border border-slate-700">{user.user_id}</code>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal(user, 'video')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-slate-700"
                                            >
                                                <span className="material-symbols-outlined text-xs">videocam</span>
                                                VIDEO
                                            </button>
                                            <button
                                                onClick={() => openModal(user, 'dataset')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-slate-700"
                                            >
                                                <span className="material-symbols-outlined text-xs">collections</span>
                                                {user.image_count} IMAGES
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                                        {new Date(user.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleDelete(user.user_id)}
                                            className="size-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white">
                                        {viewMode === 'video' ? 'videocam' : 'collections'}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white leading-tight">{selectedUser.full_name}</h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{viewMode === 'video' ? 'RAW BIOMETRIC RECORDING' : 'EXTRACTED DATASET (224x224)'}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="size-10 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            {viewMode === 'video' ? (
                                <div className="flex items-center justify-center h-full max-h-[600px] rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
                                    <video
                                        src={`/data/raw_videos/${selectedUser.user_id}.webm`}
                                        controls
                                        autoPlay
                                        className="max-h-full"
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {datasetImages.map((src, idx) => (
                                        <div key={idx} className="aspect-square bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group/img relative">
                                            <img src={src} alt={`Face ${idx}`} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                            <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                #{String(idx).padStart(3, '0')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            <span>{selectedUser.user_id} • {selectedUser.image_count} assets processed</span>
                            <span>Secure storage • Encryption active</span>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            ` }} />
        </div>
    );
};

export default Users;
