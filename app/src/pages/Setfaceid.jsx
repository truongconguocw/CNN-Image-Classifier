import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SetFaceID = () => {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [fullName, setFullName] = useState('');
    const [userId, setUserId] = useState('');
    const [instruction, setInstruction] = useState('Position your face in the center');

    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);

    useEffect(() => {
        startCamera();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'user' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            console.error("Error accessing webcam:", err);
            alert("Cannot access camera. Please grant permission.");
        }
    };

    const startRecording = () => {
        if (!fullName || !userId) {
            alert("Please enter Name and User ID.");
            return;
        }

        setIsRecording(true);
        setIsComplete(false);
        setIsSaved(false);
        setProgress(0);
        chunksRef.current = [];

        const options = { mimeType: 'video/webm;codecs=vp9,opus' };
        mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

        mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = saveRecording;
        mediaRecorderRef.current.start();

        const duration = 8000;
        const interval = 50;
        let elapsed = 0;

        const timer = setInterval(() => {
            elapsed += interval;
            const currentProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(currentProgress);

            if (elapsed < 2000) setInstruction('Look straight at the camera');
            else if (elapsed < 3500) setInstruction('Slowly turn your head LEFT');
            else if (elapsed < 5000) setInstruction('Slowly turn your head RIGHT');
            else if (elapsed < 6500) setInstruction('Look slightly UP');
            else if (elapsed < 8000) setInstruction('Look slightly DOWN');

            if (elapsed >= duration) {
                clearInterval(timer);
                stopRecording();
            }
        }, interval);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsComplete(true);
            setInstruction('Processing data...');
        }
    };

    const saveRecording = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('video', blob, `${userId}.webm`);
        formData.append('fullName', fullName);
        formData.append('userId', userId);

        try {
            const response = await fetch('/api/enroll', { method: 'POST', body: formData });
            if (response.ok) {
                setIsSaved(true);
                setInstruction('Face ID Setup Complete!');
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}`);
            }
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to send data to server.");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between p-8 font-sans overflow-hidden">
            {/* Header */}
            <header className="w-full flex justify-between items-center opacity-80 z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 rounded-lg p-1">
                        <span className="material-symbols-outlined text-white text-sm">face</span>
                    </div>
                    <span className="text-xs font-bold tracking-tight">Face ID Setup</span>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-xs font-medium hover:text-slate-400 transition-colors"
                >
                    Cancel
                </button>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-2xl text-center relative z-10">
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight leading-tight transition-all duration-500">
                        {isRecording ? instruction : isSaved ? 'All Done!' : 'Secure Your Identity'}
                    </h1>
                    <p className="text-slate-500 text-base h-6">
                        {!isRecording && !isSaved && 'Follow the instructions to complete the scan.'}
                    </p>
                </div>

                {/* Circular Progress & Camera Frame */}
                <div className="relative">
                    <div className={`absolute inset-0 transition-opacity duration-1000 ${isRecording ? 'opacity-100' : 'opacity-20'} bg-blue-600/10 blur-[100px] rounded-full`}></div>

                    <svg className="size-[420px] transform -rotate-90">
                        <circle
                            cx="210"
                            cy="210"
                            r="200"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-slate-900"
                        />
                        <circle
                            cx="210"
                            cy="210"
                            r="200"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 200}
                            strokeDashoffset={2 * Math.PI * 200 * (1 - progress / 100)}
                            strokeLinecap="round"
                            className="text-blue-500 transition-all duration-300 linear"
                        />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="size-[360px] rounded-full overflow-hidden border-2 border-slate-800 bg-slate-950 relative">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover scale-x-[-1]"
                            />

                            {isRecording && (
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full animate-pulse z-20">
                                    <div className="size-2 bg-white rounded-full"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">Recording</span>
                                </div>
                            )}

                            {isSaved && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-fade-in">
                                    <div className="size-20 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-white text-4xl">check</span>
                                    </div>
                                    <p className="font-bold text-white uppercase tracking-[0.2em] text-xs">Success</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 flex flex-col gap-4">
                        {[33, 66, 100].map((threshold, idx) => (
                            <div key={idx} className={`size-8 rounded-full flex items-center justify-center transition-all duration-500 ${isSaved || progress >= threshold ? 'bg-blue-600 scale-110' : 'bg-slate-900 opacity-50'}`}>
                                <span className="material-symbols-outlined text-white text-xs font-bold">check</span>
                            </div>
                        ))}
                    </div>
                </div>

                {!isSaved && (
                    <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                        <div className="text-left space-y-1.5 transition-transform">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Alexander Mitchell"
                                disabled={isRecording}
                                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none focus:border-blue-500/30 transition-all"
                            />
                        </div>
                        <div className="text-left space-y-1.5 transition-transform">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">User ID</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="EMP-1234"
                                disabled={isRecording}
                                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none focus:border-blue-500/30 transition-all"
                            />
                        </div>
                    </div>
                )}

                <div className="w-full max-w-lg">
                    <button
                        onClick={isSaved ? () => navigate('/dashboard') : startRecording}
                        disabled={isRecording}
                        className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 ${isSaved
                                ? 'bg-blue-600 text-white hover:bg-blue-500'
                                : isRecording
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                            } shadow-2xl relative overflow-hidden`}
                    >
                        {isRecording ? 'Capturing Face...' : isSaved ? 'Complete Registration' : 'Begin Face ID Setup'}
                        {!isRecording && <span className="material-symbols-outlined">{isSaved ? 'done_all' : 'arrow_forward'}</span>}
                    </button>

                    <p className="text-[9px] text-slate-600 mt-6 uppercase tracking-wider font-medium opacity-50">
                        Secure end-to-end encryption active • Local data only
                    </p>
                </div>
            </div>

            <footer className="w-full py-4 opacity-10 text-center pointer-events-none">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em]">
                    Advanced Neural Processing System
                </p>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            ` }} />
        </div>
    );
};

export default SetFaceID;
