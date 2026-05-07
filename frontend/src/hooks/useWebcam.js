import { useState, useEffect, useRef, useCallback } from 'react';

export function useMediaStream() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const stopCurrentStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const startWebcam = useCallback(async () => {
    stopCurrentStream();
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      setIsScreenSharing(false);
    } catch (err) {
      setError(err.message || 'Failed to access webcam');
    }
  }, [stopCurrentStream]);

  const startScreenShare = useCallback(async () => {
    stopCurrentStream();
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      
      // Handle user clicking "Stop sharing" on the browser native bar
      mediaStream.getVideoTracks()[0].onended = () => {
        startWebcam(); // Revert to webcam
      };

      setStream(mediaStream);
      setIsScreenSharing(true);
    } catch (err) {
      setError(err.message || 'Failed to capture screen');
      startWebcam(); // Revert to webcam if failed/cancelled
    }
  }, [stopCurrentStream, startWebcam]);

  // Bind stream to video ref
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };
    }
  }, [stream]);

  // Initial startup
  useEffect(() => {
    startWebcam();
    return stopCurrentStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef, stream, error, isScreenSharing, startWebcam, startScreenShare };
}
