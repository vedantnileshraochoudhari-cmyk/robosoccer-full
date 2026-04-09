const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

// Prisma setup
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Inject prisma and io into every request
app.use((req, res, next) => {
  req.prisma = prisma;
  req.io = io;
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const teamRoutes = require('./routes/teamRoutes');
const matchRoutes = require('./routes/matchRoutes');
const goalRoutes = require('./routes/goalRoutes');

app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/goal', goalRoutes);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/admin/export — download all teams + matches as JSON (frontend converts to CSV)
app.get('/api/admin/export', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });
    const matches = await prisma.match.findMany({
      include: { teamA: true, teamB: true, winner: true },
      orderBy: { updatedAt: 'desc' }
    });

    // Build CSV rows
    const rows = [
      ['Round', 'Team A', 'Score A', 'Score B', 'Team B', 'Winner', 'Status'],
      ...matches.map(m => [
        m.roundName,
        m.teamA?.name || '',
        m.scoreA,
        m.scoreB,
        m.teamB?.name || 'BYE',
        m.winner?.name || '-',
        m.status
      ])
    ];

    const csv = rows.map(r => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tournament_results.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin — tournament management actions
app.post('/api/admin', async (req, res) => {
  const { action } = req.body;
  console.log(`🔧 Admin action: ${action}`);
  try {
    if (action === 'reset') {
      // Delete all matches, clear attendance
      await prisma.match.deleteMany({});
      await prisma.team.updateMany({ data: { attendance: false } });
      io.emit('adminReset', { action: 'reset' });
      return res.json({ message: 'Tournament reset. All matches deleted, attendance cleared.' });
    }

    if (action === 'reset_full') {
      // Delete everything
      await prisma.match.deleteMany({});
      await prisma.team.deleteMany({});
      io.emit('adminReset', { action: 'reset_full' });
      return res.json({ message: 'Full reset complete. All teams and matches deleted.' });
    }

    res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error('Admin action error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Socket Connection ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Kill the existing process first.`);
    process.exit(1);
  } else {
    console.error(err);
  }
});