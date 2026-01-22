import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SetFaceID = () => {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isFaceValid, setIsFaceValid] = useState(false);
    const [fullName, setFullName] = useState('');
    const [userId, setUserId] = useState('');
    const [instruction, setInstruction] = useState('Position your face in the center');
    const [statusColor, setStatusColor] = useState('text-blue-500');
    const [currentPose, setCurrentPose] = useState('unknown');

    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);
    const validationIntervalRef = useRef(null);
    const recordingIntervalRef = useRef(null);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
            if (validationIntervalRef.current) clearInterval(validationIntervalRef.current);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
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
            startFaceValidationLoop();
        } catch (err) {
            console.error("Error accessing webcam:", err);
            alert("Cannot access camera. Please grant permission.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    const startFaceValidationLoop = () => {
        if (validationIntervalRef.current) clearInterval(validationIntervalRef.current);
        validationIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || isRecording || isSaved) return;

            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const formData = new FormData();
                formData.append('file', blob, 'check.jpg');

                try {
                    const response = await fetch('/api/validate-face', { method: 'POST', body: formData });
                    const data = await response.json();
                    setIsFaceValid(data.valid);
                    if (data.valid) {
                        setInstruction('Face detected! You can now start.');
                    } else {
                        setInstruction('Please position your face in the frame');
                    }
                } catch (err) {
                    console.error("Validation failed:", err);
                }
            }, 'image/jpeg', 0.5);
        }, 1000);
    };

    const startRecording = () => {
        if (!fullName || !userId) {
            alert("Please enter Name and User ID.");
            return;
        }

        if (!isFaceValid) {
            alert("Vui lòng giữ đúng khuôn mặt người trước camera để tiếp tục.");
            return;
        }

        if (validationIntervalRef.current) clearInterval(validationIntervalRef.current);

        setIsRecording(true);
        setIsSaved(false);
        setProgress(0);
        chunksRef.current = [];
        setStatusColor('text-blue-500');

        try {
            const options = { mimeType: 'video/webm;codecs=vp9,opus' };
            mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = saveRecording;
            mediaRecorderRef.current.start(1000);

            let currentProgress = 0;

            recordingIntervalRef.current = setInterval(async () => {
                if (!videoRef.current || isSaved) return;

                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

                canvas.toBlob(async (blob) => {
                    if (!blob) return;
                    const formData = new FormData();
                    formData.append('file', blob, 'pose.jpg');

                    try {
                        const response = await fetch('/api/detect-pose', { method: 'POST', body: formData });
                        const data = await response.json();
                        const pose = data.pose;
                        setCurrentPose(pose);

                        let expectedPose = 'unknown';
                        let currentInst = '';

                        if (currentProgress < 20) {
                            expectedPose = 'frontal';
                            currentInst = 'Look straight at the camera';
                        } else if (currentProgress < 40) {
                            expectedPose = 'left';
                            currentInst = 'Slowly turn your head LEFT';
                        } else if (currentProgress < 60) {
                            expectedPose = 'right';
                            currentInst = 'Slowly turn your head RIGHT';
                        } else if (currentProgress < 80) {
                            expectedPose = 'frontal';
                            currentInst = 'Look slightly UP';
                        } else {
                            expectedPose = 'frontal';
                            currentInst = 'Look slightly DOWN';
                        }

                        setInstruction(currentInst);

                        if (pose === expectedPose || (expectedPose === 'frontal' && pose !== 'unknown')) {
                            currentProgress += 2;
                            setProgress(Math.min(currentProgress, 100));
                            setStatusColor('text-green-500');
                        } else {
                            setStatusColor('text-blue-500');
                        }

                        if (currentProgress >= 100) {
                            clearInterval(recordingIntervalRef.current);
                            stopRecording();
                        }
                    } catch (err) {
                        console.error("Pose detection error:", err);
                    }
                }, 'image/jpeg', 0.5);

            }, 200);
        } catch (err) {
            console.error("MediaRecorder start failed:", err);
            alert("Failed to start recording.");
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setInstruction('Processing data...');
        }
    };

    const saveRecording = async () => {
        if (chunksRef.current.length === 0) {
            alert("No video data captured. Please try again.");
            setIsRecording(false);
            setProgress(0);
            startFaceValidationLoop();
            return;
        }

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
                setStatusColor('text-green-500');
            } else {
                const errorData = await response.json();
                alert(`Enrollment failed: ${errorData.error}`);
                setIsRecording(false);
                setProgress(0);
                startFaceValidationLoop();
            }
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to send data to server.");
            setIsRecording(false);
            setProgress(0);
            startFaceValidationLoop();
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between p-8 font-sans overflow-hidden">
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

            <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-2xl text-center relative z-10">
                <div className="space-y-4">
                    <h1 className={`text-4xl font-bold tracking-tight leading-tight transition-all duration-500 ${isRecording ? statusColor : ''}`}>
                        {isRecording ? instruction : isSaved ? 'Verification Success!' : instruction}
                    </h1>
                    {isRecording && (
                        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] mt-2">
                            Status: <span className={statusColor}>{currentPose === 'unknown' ? 'PLEASE MOVE' : 'DETECTING ' + currentPose.toUpperCase()}</span>
                        </p>
                    )}
                </div>

                <div className="relative">
                    <div className={`absolute inset-0 transition-opacity duration-1000 ${isRecording || isSaved ? 'opacity-100' : 'opacity-20'} ${statusColor.replace('text-', 'bg-')}/10 blur-[100px] rounded-full`}></div>

                    <svg className="size-[420px] transform -rotate-90">
                        <circle cx="210" cy="210" r="200" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-900" />
                        <circle
                            cx="210" cy="210" r="200"
                            stroke="currentColor" strokeWidth="6" fill="transparent"
                            strokeDasharray={2 * Math.PI * 200}
                            strokeDashoffset={2 * Math.PI * 200 * (1 - progress / 100)}
                            strokeLinecap="round"
                            className={`${statusColor} transition-all duration-300 linear`}
                        />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className={`size-[360px] rounded-full overflow-hidden border-2 bg-slate-950 relative transition-colors duration-500 ${isFaceValid || isSaved ? 'border-green-500' : 'border-slate-800'}`}>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />

                            {isRecording && (
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full animate-pulse z-20">
                                    <div className="size-2 bg-white rounded-full"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">Recording</span>
                                </div>
                            )}

                            {isSaved && (
                                <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fade-in text-green-500">
                                    <div className="size-24 rounded-full bg-green-600/20 border-2 border-green-500 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                                        <span className="material-symbols-outlined text-green-500 text-6xl">check_circle</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Registration Success</h2>
                                    <p className="font-bold uppercase tracking-[0.3em] text-[10px] text-green-500">Biometrics Securely Enrolled</p>
                                </div>
                            )}

                            {!isRecording && !isFaceValid && !isSaved && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                    <p className="text-white text-xs font-bold uppercase tracking-wider animate-pulse">Waiting for Human Face...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!isSaved && (
                    <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                        <div className="text-left space-y-1.5 transition-transform">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
                            <input
                                type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                placeholder="Alexander Mitchell" disabled={isRecording}
                                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none focus:border-blue-500/30 transition-all"
                            />
                        </div>
                        <div className="text-left space-y-1.5 transition-transform">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">User ID</label>
                            <input
                                type="text" value={userId} onChange={(e) => setUserId(e.target.value)}
                                placeholder="EMP-1234" disabled={isRecording}
                                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none focus:border-blue-500/30 transition-all"
                            />
                        </div>
                    </div>
                )}

                <div className="w-full max-w-lg">
                    <button
                        onClick={startRecording}
                        disabled={isRecording || isSaved || !isFaceValid}
                        className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 ${isSaved
                            ? 'bg-green-600 text-white cursor-default'
                            : isRecording
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : !isFaceValid
                                    ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                                    : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                            } shadow-2xl relative overflow-hidden`}
                    >
                        {isRecording ? 'Vui lòng xoay mặt...' : isSaved ? 'System Success' : isFaceValid ? 'Begin Face ID Setup' : 'Detecting Human Face...'}
                        {!isRecording && <span className="material-symbols-outlined">{isSaved ? 'check_circle' : isFaceValid ? 'arrow_forward' : 'hourglass_bottom'}</span>}
                    </button>

                    <p className="text-[10px] text-slate-500 mt-6 uppercase tracking-wider font-bold">
                        {isRecording ? 'Hệ thống đang kiểm tra tư thế của bạn...' : isSaved ? 'Redirecting to dashboard...' : 'Tiến trình sẽ tạm dừng nếu bạn không di chuyển.'}
                    </p>
                </div>
            </div>

            <footer className="w-full py-4 opacity-10 text-center pointer-events-none">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em]">
                    Advanced Neural Processing System • Real-time Pose Validation
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
