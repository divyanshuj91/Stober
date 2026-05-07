// Calculate Eye Aspect Ratio (EAR) for blink detection
export function calculateEAR(landmarks) {
  // landmarks for left eye
  const leftEye = [33, 160, 158, 133, 153, 144].map(idx => landmarks[idx]);
  // landmarks for right eye
  const rightEye = [362, 385, 387, 263, 373, 380].map(idx => landmarks[idx]);

  const calculateDistance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  const getEAR = (eye) => {
    const v1 = calculateDistance(eye[1], eye[5]);
    const v2 = calculateDistance(eye[2], eye[4]);
    const h = calculateDistance(eye[0], eye[3]);
    return (v1 + v2) / (2.0 * h);
  };

  const leftEAR = getEAR(leftEye);
  const rightEAR = getEAR(rightEye);
  
  return (leftEAR + rightEAR) / 2.0;
}

// Calculate Lip Distance (for Lip Sync proxy)
export function calculateLipDistance(landmarks) {
  // Inner lips landmarks
  const topLip = landmarks[13];
  const bottomLip = landmarks[14];
  const distance = Math.abs(topLip.y - bottomLip.y);
  return distance;
}

// Extract green channel average from a region (for simple rPPG proxy)
export function extractGreenChannel(video, landmarks, canvasRef) {
  if (!canvasRef.current || !video) return 0;
  const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
  
  // Forehead landmark approximate
  const forehead = landmarks[10];
  
  // Convert relative coordinates to video pixel coordinates
  const x = Math.floor(forehead.x * video.videoWidth);
  const y = Math.floor(forehead.y * video.videoHeight);
  
  // Create a small bounding box
  const size = 20;
  const startX = Math.max(0, x - size/2);
  const startY = Math.max(0, y - size/2);
  
  try {
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
    const frame = ctx.getImageData(0, 0, size, size);
    const data = frame.data;
    
    let gSum = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      gSum += data[i + 1]; // Green channel
    }
    
    return gSum / pixelCount;
  } catch (e) {
    return 0;
  }
}
