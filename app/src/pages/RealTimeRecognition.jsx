import React, { useState, useEffect, useRef } from 'react';

const RealTimeRecognition = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [recognitionMethod, setRecognitionMethod] = useState('cnn'); // 'cnn' or 'vector'
    const [lastFPS, setLastFPS] = useState(0);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    // Frame processing loop
    useEffect(() => {
        let animationFrameId;
        let lastTime = Date.now();
        let frameCount = 0;

        const processFrame = async () => {
            if (videoRef.current && canvasRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                // 1. Draw video to canvas (or just use video and draw overlay on separate canvas)
                // Here we match canvas size to video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // 2. Prepare frame for sending
                // We send a frame every X ms to avoid flooding, or use requestAnimationFrame for max speed
                // For simplicity/performance balance, let's limit API calls but keep render loop fast

                // (Optional: Only send frame every 200-500ms for inference)
            }

            // Calculate FPS
            const now = Date.now();
            frameCount++;
            if (now - lastTime >= 1000) {
                setLastFPS(frameCount);
                frameCount = 0;
                lastTime = now;
            }

            animationFrameId = requestAnimationFrame(processFrame);
        };

        // Start loop only if streaming
        if (isStreaming) {
            // animationFrameId = requestAnimationFrame(processFrame);
            // NOTE: We need a separate interval for Inference to not block UI thread with fetch calls
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [isStreaming]);

    // Separate Independent Inference Loop
    useEffect(() => {
        let intervalId;

        const runInference = async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

            try {
                const video = videoRef.current;

                // Capture current frame
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = video.videoWidth;
                tempCanvas.height = video.videoHeight;
                tempCanvas.getContext('2d').drawImage(video, 0, 0);

                // Convert to blob
                tempCanvas.toBlob(async (blob) => {
                    if (!blob) return;

                    const formData = new FormData();
                    formData.append('file', blob, 'frame.jpg');

                    const endpoint = recognitionMethod === 'cnn' ? '/api/predict' : '/api/predict-vector';

                    const response = await fetch(endpoint, { method: 'POST', body: formData });
                    if (response.ok) {
                        const data = await response.json();
                        drawDetections(data.detections);
                    }
                }, 'image/jpeg', 0.8);

            } catch (err) {
                console.error("Inference error:", err);
            }
        };

        if (isStreaming) {
            intervalId = setInterval(runInference, 200); // 5 FPS Inference
        }

        return () => clearInterval(intervalId);
    }, [isStreaming, recognitionMethod]);

    const drawDetections = (detections) => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const video = videoRef.current;

        // Clear previous drawings (we need to redraw video frame first if we are drawing ON TOP of a blank canvas, 
        // BUT if we want an overlay, we should have the <video> visible and a transparent <canvas> on top)
        // Let's go with Transparent Canvas Overlay approach
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (!detections) return;

        detections.forEach(det => {
            const [x, y, w, h] = det.bbox;

            // Draw Box
            ctx.strokeStyle = recognitionMethod === 'cnn' ? '#3b82f6' : '#22c55e'; // Blue for CNN, Green for Vector
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, w, h);

            // Draw Label
            ctx.fillStyle = recognitionMethod === 'cnn' ? '#3b82f6' : '#22c55e';
            const label = `${det.prediction} (${Math.round(det.confidence)}%)`;
            const textWidth = ctx.measureText(label).width;
            ctx.fillRect(x, y - 30, textWidth + 20, 30);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillText(label, x + 10, y - 8);
        });
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'user' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    if (canvasRef.current) {
                        canvasRef.current.width = videoRef.current.videoWidth;
                        canvasRef.current.height = videoRef.current.videoHeight;
                    }
                    setIsStreaming(true);
                };
            }
        } catch (err) {
            console.error("Error accessing webcam:", err);
            alert("Cannot access camera.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            setIsStreaming(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header / Controls */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Real-time Recognition</h1>
                    <p className="text-slate-500 text-xs">Live inference stream • {lastFPS} FPS (UI)</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setRecognitionMethod('cnn')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${recognitionMethod === 'cnn' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <span className="material-symbols-outlined text-sm">psychology</span>
                            CNN Model
                        </button>
                        <button
                            onClick={() => setRecognitionMethod('vector')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${recognitionMethod === 'vector' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <span className="material-symbols-outlined text-sm">hub</span>
                            Vector Match
                        </button>
                    </div>
                </div>
            </div>

            {/* Video Container */}
            <div className="flex-1 relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 group">
                {!isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                        <p>Initializing Camera...</p>
                    </div>
                )}

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Tech Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 opacity-50 pointer-events-none">
                    <div className="text-[10px] font-mono text-green-500 bg-black/50 px-2 py-1 rounded">
                        SYSTEM: ONLINE
                    </div>
                    <div className="text-[10px] font-mono text-blue-500 bg-black/50 px-2 py-1 rounded">
                        METHOD: {recognitionMethod.toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RealTimeRecognition;
