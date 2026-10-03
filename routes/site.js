const express = require('express');
const router = express.Router();
const db = require('../db');

function parseDate(d) {
  // YYYY-MM-DD -> "12. 9. 2026"
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${parseInt(day, 10)}. ${parseInt(m, 10)}. ${y}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Bezpecne: najprv escape, potom nove riadky na <br>
function nl2br(s) {
  return escapeHtml(s || '').replace(/\r?\n/g, '<br>');
}

router.get('/', (req, res) => {
  const club = db.get('club').value();
  const teams = db.get('teams').value();
  const news = db.get('news').sortBy((n) => n.date).reverse().take(3).value();
  const gallery = db.get('gallery').value();
  const matches = db.get('matches').value();

  const finished = matches
    .filter((m) => m.status === 'finished')
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const upcoming = matches
    .filter((m) => m.status === 'upcoming')
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  res.render('index', {
    club,
    teams,
    news,
    gallery,
    nextMatch: upcoming[0] || null,
    recentResults: finished.slice(0, 2),
    upcomingList: upcoming.slice(0, 1),
    parseDate,
    nl2br
  });
});

module.exports = router;
