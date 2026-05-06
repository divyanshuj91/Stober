# Stober — Real-time Deepfake Detection for Video Calls

## Project Overview
Stober detects potential deepfake or spoofed video streams during browser-based WebRTC calls. It performs privacy-first, on-device checks (blink detection, lip-sync mismatch, rPPG pulse estimation), sends compact feature vectors (no raw frames or full audio) to a backend scorer, and displays a live trust score overlay and reason tags in the call UI.

## Demo Goals (MVP)
- One-to-one browser WebRTC call demo with webcam streams.
- Client-side feature extraction: face detection, blink rate, lip-sync correlation, rPPG pulse estimate.
- Secure WebSocket to backend that returns a trust score and reason tags.
- Live UI overlay showing trust score and flagged reasons.
- Simple logging dashboard for scores and manual labeling.

## Tech Stack
- Frontend: React, WebRTC, WebGL, TensorFlow.js or ONNX.js, face-api.js or MediaPipe
- Backend: Node.js + Express, WebSocket (ws)
- Storage: SQLite or JSON logs
- Dev tools: Puppeteer (optional tests), ngrok (for cross-device testing)
- Deployment: Vercel / Netlify (frontend), Render / Fly / Heroku (backend) or local Docker

## Repo Structure
- /frontend
  - package.json
  - src/
    - index.jsx
    - App.jsx
    - CallPage.jsx
    - VideoOverlay.jsx
    - featureExtractors/
      - faceDetection.js
      - blinkDetector.js
      - lipSync.js
      - rPPG.js
    - wsClient.js
- /backend
  - package.json
  - src/
    - server.js
    - scorer.js
    - db.js
    - routes/
      - logs.js
- /scripts
  - sample-deepfake-clips/
  - generate_sample_data.sh
- README.md
- LICENSE

## Quickstart (local)

Prerequisites
- Node.js >= 16, npm or yarn
- Git; optional: ngrok for external WebRTC testing

1. Clone
   ```bash
   git clone <repo-url>
   cd stober
