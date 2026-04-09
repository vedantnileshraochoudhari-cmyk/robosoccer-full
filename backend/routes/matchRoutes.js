const express = require('express');
const router = express.Router();

// GET all matches
router.get('/', async (req, res) => {
  try {
    const matches = await req.prisma.match.findMany({
      include: { teamA: true, teamB: true, winner: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create match
router.post('/', async (req, res) => {
  const { roundName, teamAId, teamBId } = req.body;
  if (!roundName || !teamAId) {
    return res.status(400).json({ error: 'Missing required fields: roundName, teamAId' });
  }
  try {
    const match = await req.prisma.match.create({
      data: {
        roundName,
        teamAId: Number(teamAId),
        teamBId: teamBId ? Number(teamBId) : null,
        status: 'upcoming',
        scoreA: 0,
        scoreB: 0
      },
      include: { teamA: true, teamB: true }
    });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT start match
router.put('/:id/start', async (req, res) => {
  const { id } = req.params;
  try {
    const match = await req.prisma.match.update({
      where: { id: Number(id) },
      data: { 
        status: 'live', 
        startedAt: new Date(),
        isPaused: false,
        elapsedSeconds: 0
      },
      include: { teamA: true, teamB: true }
    });
    req.io.emit('statusUpdate', match);
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT pause match
router.put('/:id/pause', async (req, res) => {
  const { id } = req.params;
  try {
    const match = await req.prisma.match.findUnique({ where: { id: Number(id) } });
    if (!match || match.status !== 'live' || match.isPaused) {
      return res.status(400).json({ error: "Cannot pause this match" });
    }

    const now = new Date();
    const start = new Date(match.startedAt);
    const sessionElapsed = Math.floor((now - start) / 1000);
    const totalElapsed = match.elapsedSeconds + sessionElapsed;

    const updated = await req.prisma.match.update({
      where: { id: Number(id) },
      data: {
        isPaused: true,
        elapsedSeconds: totalElapsed
      },
      include: { teamA: true, teamB: true }
    });

    req.io.emit('statusUpdate', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT resume match
router.put('/:id/resume', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await req.prisma.match.update({
      where: { id: Number(id) },
      data: {
        isPaused: false,
        startedAt: new Date()
      },
      include: { teamA: true, teamB: true }
    });

    req.io.emit('statusUpdate', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update score
router.put('/:id/score', async (req, res) => {
  const { id } = req.params;
  const { scoreA, scoreB } = req.body;
  try {
    const match = await req.prisma.match.update({
      where: { id: Number(id) },
      data: {
        scoreA: scoreA !== undefined ? Number(scoreA) : undefined,
        scoreB: scoreB !== undefined ? Number(scoreB) : undefined,
      },
      include: { teamA: true, teamB: true }
    });
    req.io.emit('scoreUpdate', match);
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT end match
router.put('/:id/end', async (req, res) => {
  const { id } = req.params;
  try {
    const match = await req.prisma.match.update({
      where: { id: Number(id) },
      data: { status: 'completed' },
      include: { teamA: true, teamB: true }
    });
    req.io.emit('statusUpdate', match);
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT winner
router.put('/:id/winner', async (req, res) => {
  const { id } = req.params;
  const { winnerId } = req.body;
  try {
    const match = await req.prisma.match.update({
      where: { id: Number(id) },
      data: { winnerId: Number(winnerId) },
      include: { teamA: true, teamB: true, winner: true }
    });
    req.io.emit('winnerUpdate', match);
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
