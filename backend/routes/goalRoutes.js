const express = require('express');
const router = express.Router();

// Helper to handle goal logic
const handleGoal = async (req, res, team) => {
  try {
    // Find the current live match
    const liveMatch = await req.prisma.match.findFirst({
      where: { status: 'live' }
    });

    if (!liveMatch) {
      return res.status(404).json({ error: "No live match found. Start a match first!" });
    }

    const updateData = {};
    if (team === 'A') {
      updateData.scoreA = liveMatch.scoreA + 1;
    } else if (team === 'B') {
      updateData.scoreB = liveMatch.scoreB + 1;
    } else {
      return res.status(400).json({ error: "Invalid team. Use 'A' or 'B'" });
    }

    const updated = await req.prisma.match.update({
      where: { id: liveMatch.id },
      data: updateData,
      include: { teamA: true, teamB: true }
    });

    req.io.emit('scoreUpdate', updated);
    res.json({ success: true, team, match: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/goal
// For testing in browser (Defaults to Team A)
router.get('/', async (req, res) => {
  await handleGoal(req, res, 'A');
});

// POST /api/goal
// Hardware trigger from ESP32
router.post('/', async (req, res) => {
  const { team } = req.body; // "A" or "B"
  if (!team) {
    return res.status(400).json({ error: 'Missing required field: team ("A" or "B")' });
  }
  await handleGoal(req, res, team);
});

module.exports = router;
