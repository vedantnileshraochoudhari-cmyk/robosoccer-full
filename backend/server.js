const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*", // allow all (for now)
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// ✅ SIMPLE GOAL API (NO PRISMA)
app.post('/api/goal', (req, res) => {
  console.log("⚽ Goal received:", req.body);

  // Send to frontend via socket
  io.emit("goal", req.body);

  res.json({ success: true });
});

// Socket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
});

// ✅ PORT FIX (RENDER READY)
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});