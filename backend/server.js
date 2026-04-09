const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
].filter(Boolean);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

// Prisma setup
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// Inject prisma and io into every request
app.use((req, res, next) => {
  req.prisma = prisma;
  req.io = io;
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
// Used by UptimeRobot / external pingers to prevent Render free-tier spin-down
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

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

// ─── Email Route ──────────────────────────────────────────────────────────────

// POST /api/email — send a transactional email via Gmail SMTP
app.post('/api/email', async (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
  }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    return res.status(500).json({ error: 'Email not configured on server (GMAIL_USER/GMAIL_PASS missing)' });
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    });
    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body{font-family:Arial,sans-serif;background:#0c0c0f;color:#e8e8f0;margin:0;padding:0}
        .container{max-width:600px;margin:0 auto;padding:40px 20px}
        .header{background:#13131a;border-left:4px solid #e8ff3c;padding:24px;margin-bottom:24px;border-radius:4px}
        .header h1{font-family:'Arial Black',sans-serif;color:#e8ff3c;font-size:28px;margin:0 0 8px;letter-spacing:2px;text-transform:uppercase}
        .header p{color:#6b6b8a;margin:0;font-size:14px}
        .content{background:#13131a;padding:24px;border-radius:4px;margin-bottom:16px;border:1px solid #2a2a3a}
        .content p{line-height:1.7;color:#e8e8f0;font-size:16px}
        .footer{color:#6b6b8a;font-size:12px;text-align:center}
      </style></head><body>
      <div class="container">
        <div class="header"><h1>⚽ RoboSoccer</h1><p>Tectonics — College Fest</p></div>
        <div class="content"><p>${body.replace(/\n/g, '<br>')}</p></div>
        <div class="footer"><p>This is an automated message from the RoboSoccer Tournament System at Tectonics.</p></div>
      </div></body></html>`;
    await transporter.sendMail({
      from: `"Tectonics RoboSoccer" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: body,
      html,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Email error:', err);
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