const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const http = require('http');
const db = require('./db');
const { calculateTrustScore } = require('./scoring');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Simple REST API for dashboard
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await db.getLogs();
    res.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

app.post('/api/logs/label', async (req, res) => {
  const { id, label } = req.body;
  try {
    await db.updateLabel(id, label);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update label" });
  }
});

wss.on('connection', (ws) => {
  console.log('Client connected for deepfake detection');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      // Calculate trust score based on features
      const scoringResult = calculateTrustScore(data);
      
      // Send result back to client
      ws.send(JSON.stringify(scoringResult));

      // Log session data asynchronously
      if (data.sessionId) {
         await db.logSession(data.sessionId, data, scoringResult);
      }
      
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Deepfake Detector Backend running on port ${PORT}`);
  db.initDB();
});
