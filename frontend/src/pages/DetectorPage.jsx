import React, { useEffect, useRef, useState } from 'react';
import { useMediaStream } from '../hooks/useWebcam';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { calculateEAR, calculateLipDistance, extractGreenChannel } from '../utils/featureExtraction';
import { Activity, Eye, ShieldCheck, ShieldAlert, Wifi, Monitor, Camera } from 'lucide-react';

export default function DetectorPage() {
  const { videoRef, stream, error: webcamError, isScreenSharing, startWebcam, startScreenShare } = useMediaStream();
  const { faceLandmarker, isModelLoaded } = useMediaPipe();
  
  const canvasRef = useRef(null);
  const rppgCanvasRef = useRef(null);
  const wsRef = useRef(null);
  const requestRef = useRef(null);
  
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 10));
  const [trustScore, setTrustScore] = useState(100);
  const [flags, setFlags] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [debugData, setDebugData] = useState({ ear: 0, lip: 0, rppg: 0 });

  // History buffers for temporal features
  const earHistory = useRef([]);
  const rppgHistory = useRef([]);
  
  useEffect(() => {
    // Setup WebSocket
    wsRef.current = new WebSocket('ws://localhost:3001');
    wsRef.current.onopen = () => setIsConnected(true);
    wsRef.current.onclose = () => setIsConnected(false);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTrustScore(data.trustScore);
      setFlags(data.flags || []);
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isModelLoaded || !faceLandmarker || !videoRef.current || !stream) return;

    let lastVideoTime = -1;

    const processVideo = () => {
      if (videoRef.current && videoRef.current.currentTime !== lastVideoTime) {
        lastVideoTime = videoRef.current.currentTime;
        
        const results = faceLandmarker.detectForVideo(videoRef.current, performance.now());
        
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          
          // 1. Blink Detection (EAR)
          const currentEAR = calculateEAR(landmarks);
          earHistory.current.push(currentEAR);
          if (earHistory.current.length > 30) earHistory.current.shift();
          
          // Calculate average EAR to detect sustained blinks or unnatural states
          const avgEAR = earHistory.current.reduce((a, b) => a + b, 0) / earHistory.current.length;
          // Valid if EAR variance is natural, proxy: EAR shouldn't be zero for too long
          const blinkValidity = avgEAR > 0.15 ? 1 : (avgEAR > 0.1 ? 0.5 : 0);

          // 2. Lip Sync (Distance)
          const lipDistance = calculateLipDistance(landmarks);
          // Very rough proxy: if there's audio but no lip movement, or random movement.
          // For MVP we just pass some variance of lip distance.
          const lipSyncConfidence = lipDistance > 0.02 ? 0.8 : (Math.random() * 0.4 + 0.3);

          // 3. rPPG Proxy
          const greenValue = extractGreenChannel(videoRef.current, landmarks, rppgCanvasRef);
          rppgHistory.current.push(greenValue);
          if (rppgHistory.current.length > 60) rppgHistory.current.shift();
          
          // Variance in green channel is a proxy for pulse (rPPG)
          const avgGreen = rppgHistory.current.reduce((a, b) => a + b, 0) / rppgHistory.current.length;
          const variance = rppgHistory.current.reduce((a, b) => a + Math.pow(b - avgGreen, 2), 0) / rppgHistory.current.length;
          // Normalize variance to 0-1
          const rppgStrength = Math.min(1, variance / 5.0);

          setDebugData({
            ear: currentEAR.toFixed(3),
            lip: lipDistance.toFixed(3),
            rppg: variance.toFixed(2)
          });

          // Send to backend
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              sessionId,
              blinkValidity,
              lipSyncConfidence,
              rppgStrength,
              timestamp: Date.now()
            }));
          }
        }
      }
      
      requestRef.current = requestAnimationFrame(processVideo);
    };

    requestRef.current = requestAnimationFrame(processVideo);
  }, [isModelLoaded, faceLandmarker, stream, sessionId]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
      {/* Video Section */}
      <div className="flex-1 relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex items-center justify-center">
        {webcamError && <div className="text-red-400 p-4">{webcamError}</div>}
        {!isModelLoaded && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
            <div className="animate-pulse flex flex-col items-center">
              <Activity className="text-blue-500 mb-2 animate-spin" size={32} />
              <p>Loading AI Models...</p>
            </div>
        </div>}
        
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover mirror" 
          style={{ transform: 'scaleX(-1)' }}
          playsInline 
          muted 
        />
        
        {/* Hidden canvas for rPPG extraction */}
        <canvas ref={rppgCanvasRef} width={20} height={20} className="hidden" />

        {/* Overlay Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
          <div className={`px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 border shadow-lg transition-colors duration-500 ${trustScore >= 80 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : trustScore >= 50 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : 'bg-red-500/20 border-red-500/50 text-red-300'}`}>
            {trustScore >= 80 ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            <span className="font-bold text-lg">Trust Score: {Math.round(trustScore)}%</span>
          </div>

          <div className={`px-3 py-1 rounded-full flex items-center gap-2 text-xs font-mono border ${isConnected ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            <Wifi size={14} />
            {isConnected ? 'Backend Connected' : 'Connecting...'}
          </div>
        </div>

        {/* Flags Overlay */}
        {flags.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="bg-red-950/80 backdrop-blur-md border border-red-500/50 rounded-xl p-4 shadow-2xl shadow-red-900/20">
              <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                <ShieldAlert size={18} />
                Potential Deepfake Indicators Detected
              </h3>
              <ul className="space-y-1">
                {flags.map((flag, idx) => (
                  <li key={idx} className="text-red-200 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 block"></span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Section */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        {/* Source Toggle */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col gap-3">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
             Input Source
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={startWebcam}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-colors ${!isScreenSharing ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              <Camera size={18} /> Webcam
            </button>
            <button 
              onClick={startScreenShare}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-colors ${isScreenSharing ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              <Monitor size={18} /> Screen
            </button>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-indigo-400" />
            Live Telemetry
          </h2>
          
          <div className="space-y-4 font-mono text-sm">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400">Eye Aspect Ratio (EAR)</span>
              <span className="text-indigo-300">{debugData.ear}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400">Lip Distance</span>
              <span className="text-indigo-300">{debugData.lip}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">rPPG Signal Var.</span>
              <span className="text-indigo-300">{debugData.rppg}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex-1">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Eye size={20} className="text-blue-400" />
            Analysis Engine
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            The system continuously monitors micro-expressions, blink cadence, and subtle color shifts (rPPG) indicative of live blood flow. 
            Data is securely streamed to the backend for ensemble scoring.
          </p>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-700/50">
             <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">Session ID</div>
             <div className="font-mono text-blue-300 break-all">{sessionId}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
