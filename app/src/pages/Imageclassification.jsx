import React, { useState, useEffect, useRef } from 'react';

const ImageClassification = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [predictionMethod, setPredictionMethod] = useState('cnn'); // 'cnn' or 'vector'
    const imgRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (prediction && prediction.detections && imgRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const img = imgRef.current;
            const ctx = canvas.getContext('2d');

            // Set canvas size to match image display size
            canvas.width = img.clientWidth;
            canvas.height = img.clientHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate scale factors
            const scaleX = img.clientWidth / img.naturalWidth;
            const scaleY = img.clientHeight / img.naturalHeight;

            prediction.detections.forEach((det, idx) => {
                const [x, y, w, h] = det.bbox;

                // Draw box
                ctx.strokeStyle = '#137fec';
                ctx.lineWidth = 3;
                ctx.strokeRect(x * scaleX, y * scaleY, w * scaleX, h * scaleY);

                // Draw label background
                ctx.fillStyle = '#137fec';
                ctx.font = 'bold 12px Inter, system-ui, sans-serif';
                const label = `${det.prediction} (${det.confidence}%)`;
                const textWidth = ctx.measureText(label).width;
                ctx.fillRect(x * scaleX, (y * scaleY) - 20, textWidth + 10, 20);

                // Draw text
                ctx.fillStyle = 'white';
                ctx.fillText(label, (x * scaleX) + 5, (y * scaleY) - 5);
            });
        }
    }, [prediction]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setPrediction(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        const endpoint = predictionMethod === 'cnn' ? '/api/predict' : '/api/predict-vector';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Prediction failed. Please try again.');
            }

            const data = await response.json();
            setPrediction(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10">
            {/* Header section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Face Recognition</h1>
                    <p className="text-slate-400 max-w-xl">
                        {predictionMethod === 'cnn'
                            ? 'Using deep learning CNN for direct face classification.'
                            : 'Using feature vector embeddings (Option B) for instant identity matching.'}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800 flex gap-1">
                        <button
                            onClick={() => setPredictionMethod('cnn')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${predictionMethod === 'cnn' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            CNN Classification
                        </button>
                        <button
                            onClick={() => setPredictionMethod('vector')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${predictionMethod === 'vector' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Vector Matching
                        </button>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700 rounded-full px-4 py-1.5 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-green-500"></span>
                        <span className="text-xs font-bold text-white">
                            {predictionMethod === 'cnn' ? 'ResNet/Custom-CNN Active' : 'Vector-Embedding Engine'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Upload Area */}
                <div
                    className={`lg:col-span-7 bg-slate-900/30 border-2 border-dashed ${selectedFile ? 'border-primary/50' : 'border-slate-800'} rounded-2xl flex flex-col items-center justify-center p-12 py-24 group hover:border-primary/50 transition-colors cursor-pointer relative`}
                    onClick={() => document.getElementById('fileInput').click()}
                >
                    <input
                        type="file"
                        id="fileInput"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                    {previewUrl ? (
                        <div className="flex flex-col items-center">
                            <div className="relative mb-6 group/preview">
                                <img
                                    ref={imgRef}
                                    src={previewUrl}
                                    alt="Preview"
                                    className="max-h-96 rounded-xl shadow-2xl border-4 border-slate-800"
                                    onLoad={() => {
                                        // Trigger a redraw when image loads
                                        if (prediction) setPrediction({ ...prediction });
                                    }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-xl"
                                />
                            </div>
                            <p className="text-slate-400 text-sm mb-4">{selectedFile.name}</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                disabled={loading}
                                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="animate-spin material-symbols-outlined">sync</span>
                                ) : (
                                    <span className="material-symbols-outlined">science</span>
                                )}
                                {loading ? 'Processing...' : 'Run Analysis'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="size-14 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
                                <span className="material-symbols-outlined text-3xl">upload</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Upload Source Image</h3>
                            <p className="text-slate-500 text-center text-sm mb-8 px-10">
                                Drag and drop your high-resolution image here, or browse local files. Supports JPG, PNG, WEBP.
                            </p>
                            <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all">
                                <span className="material-symbols-outlined">collections</span>
                                Select File
                            </button>
                        </>
                    )}
                </div>

                {/* Result Sidebar */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="material-symbols-outlined text-primary">assessment</span>
                            <div className="flex justify-between items-center w-full">
                                <h3 className="font-bold text-white">Classification Result</h3>
                                {prediction?.model_used && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-wider">
                                        CNN: {prediction.model_used}
                                    </span>
                                )}
                                {prediction?.method === 'vector_embedding' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-500 uppercase tracking-wider">
                                        VECTOR MATCHING
                                    </span>
                                )}
                            </div>
                        </div>

                        {prediction && prediction.detections ? (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                                {prediction.detections.map((det, idx) => (
                                    <div key={idx} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 transition-all hover:border-primary/50">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Face #{idx + 1}</p>
                                                <h2 className="text-xl font-bold text-white mb-1">{det.prediction}</h2>
                                            </div>
                                            <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded">
                                                {det.confidence}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                                style={{ width: `${det.confidence}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-800">
                                    <button
                                        onClick={handleUpload}
                                        className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">refresh</span>
                                        Re-classify
                                    </button>
                                    <button className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all">
                                        <span className="material-symbols-outlined text-sm">download</span>
                                        Export
                                    </button>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 grayscale transition-all">
                                <span className="material-symbols-outlined text-6xl text-red-500/50 mb-4 animate-pulse">error</span>
                                <p className="text-white font-bold mb-2">Analysis Failed</p>
                                <p className="text-slate-500 text-xs mb-6">{error}</p>
                                <button
                                    onClick={handleUpload}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2 rounded-lg text-xs font-bold transition-all"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 grayscale opacity-30">
                                <span className="material-symbols-outlined text-6xl mb-4">analytics</span>
                                <p className="text-white font-bold mb-1">No Analysis Active</p>
                                <p className="text-slate-500 text-xs">Run a prediction to see the classification results and confidence score.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="space-y-4 pt-10">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Recent Analysis History</h2>
                    <button className="text-primary text-xs font-bold hover:underline">View All History</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { name: 'Domestic Cat', time: '2 mins ago', score: 94, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDk9BmyzGrzIOSPQ3DoHb2lctNejhaR_dUcrJSa-4oUhT2nW7Hj5RFkavOuedtU-hvzozVxxzZtjXVwQOCvWbDv9yEZxi7E0j6Nt1Wl31J0417xupZTIYYsjGqkr9HuX5FJ9KbjkIRQWHmvnNPqqPHBHuZdK65NXda_ez4fn3791LAClAQuhs04GWtiTPCW7J9hpRGPnu6xcECG6Z5eW2Gy6n1btpynqnx8tcnOi4Uu6mqNrFZtvPXjs73iZ2_5seDxoPdlyTLI5hI' },
                        { name: 'French Bulldog', time: '15 mins ago', score: 89, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEEFmN-4FzlNx1VIq1wp9u-bESYaPz2iFpFiB_DTTQUpxZtIfBK2mD8lVfw-zH_IEUpGRycnmM6-nJbJJRS_gm6kfZwO9MnZmn68GfYG-z37YgffLDGTV1iGUiIMJiJLL8EBWSAc8FApJ3bvte42NZmV14HoVQXIwCbtZY3TDNWaujKiPBKODOHBmbhAFAC9bejERbafme8ExT9BOQgXYNzaf08gdryR2GPRZ87Nq2vrUrykKmiuNqlg4iT8L_L3oU4m-gQuc4qn4' },
                        { name: 'Ginger Tabby', time: '1 hour ago', score: 72, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDk9BmyzGrzIOSPQ3DoHb2lctNejhaR_dUcrJSa-4oUhT2nW7Hj5RFkavOuedtU-hvzozVxxzZtjXVwQOCvWbDv9yEZxi7E0j6Nt1Wl31J0417xupZTIYYsjGqkr9HuX5FJ9KbjkIRQWHmvnNPqqPHBHuZdK65NXda_ez4fn3791LAClAQuhs04GWtiTPCW7J9hpRGPnu6xcECG6Z5eW2Gy6n1btpynqnx8tcnOi4Uu6mqNrFZtvPXjs73iZ2_5seDxoPdlyTLI5hI' },
                        { name: 'Golden Retriever', time: '3 hours ago', score: 99, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzMZeV9WfU6tFEmiuJoQPOqHKycdpO9XWsGVqmrTwhxohFafXIJ1aZUx0m6BElIA4nCD6DmyPlpufyvrPvR7n22T0FwuhaMJHm4Nt8_5E7VAI6tqC4LPtHJ-07c-bYXeg1SNP1R1q7y0RpbF2x7Qp-krsD_UcDGkQTQO3JzsX1RXY6CmnVnYcP67jbKk60kznpfOZaP6M86_ZeSKpFI0cO7a_Nds-WnFyvQYu6G_22Jc4q0FSwRrmDAC1otjgF1nI9kbn48Fh8eVE' },
                    ].map((item, idx) => (
                        <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3 flex items-center gap-4 hover:border-slate-700 transition-colors cursor-pointer">
                            <div className="size-16 rounded-xl overflow-hidden flex-shrink-0">
                                <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                                <p className="text-[10px] text-slate-500 mb-2">{item.time}</p>
                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${item.score > 90 ? 'bg-green-500' : 'bg-primary'}`}
                                        style={{ width: `${item.score}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <span className={`text-[10px] font-bold ${item.score > 90 ? 'text-green-500' : 'text-primary'}`}>{item.score}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-800 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">copyright</span>
                    <span>2024 VisionAI. Developed for high-performance ML workloads.</span>
                </div>
                <div className="flex gap-6 uppercase tracking-wider font-bold">
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-white transition-colors">API Docs</a>
                </div>
            </footer>
        </div>
    );
};

export default ImageClassification;
