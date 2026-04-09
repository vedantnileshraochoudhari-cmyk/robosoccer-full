const express = require('express');
const router = express.Router();

// GET all teams
router.get('/', async (req, res) => {
  try {
    const teams = await req.prisma.team.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create team
router.post('/', async (req, res) => {
  const { name, email, players, college } = req.body;
  if (!name || !email || !players) {
    return res.status(400).json({ error: 'Missing required fields: name, email, players' });
  }
  try {
    const team = await req.prisma.team.create({
      data: { name, email, players, college }
    });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update team
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const team = await req.prisma.team.update({
      where: { id: Number(id) },
      data
    });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
