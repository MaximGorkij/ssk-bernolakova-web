const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { makeUploader } = require('../middleware/upload');

const galleryUpload = makeUploader('gallery');
const newsUpload = makeUploader('news');
const logoUpload = makeUploader('logo');

function nextId(collectionName) {
  const items = db.get(collectionName).value();
  return items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}

function str(v) {
  return (v === undefined || v === null ? '' : String(v)).trim();
}

function toScore(v) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

function findTeam(id) {
  return db.get('teams').find({ id: parseInt(id, 10) });
}

// ---------- LOGIN / LOGOUT ----------

router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = db.get('admin.username').value();
  const adminHash = db.get('admin.passwordHash').value();

  if (username === adminUser && adminHash && bcrypt.compareSync(password || '', adminHash)) {
    req.session.isAdmin = true;
    req.session.adminUser = username;
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: 'Nespravne meno alebo heslo.' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ---------- DASHBOARD ----------

router.get('/', requireAuth, (req, res) => {
  res.render('admin/dashboard', {
    counts: {
      teams: db.get('teams').size().value(),
      matches: db.get('matches').size().value(),
      news: db.get('news').size().value(),
      gallery: db.get('gallery').size().value()
    }
  });
});

// ---------- KLUB ----------

router.get('/club', requireAuth, (req, res) => {
  res.render('admin/club', { club: db.get('club').value(), saved: req.query.saved });
});

router.post('/club', requireAuth, logoUpload.single('logoFile'), (req, res) => {
  const { heroTitle, heroText, aboutTitle, aboutText, contactEmail, contactCity, facebook, instagram, values, heroImage } = req.body;
  db.set('club.heroTitle', heroTitle).write();
  db.set('club.heroText', heroText).write();
  db.set('club.aboutTitle', aboutTitle).write();
  db.set('club.aboutText', aboutText).write();
  db.set('club.contactEmail', contactEmail).write();
  db.set('club.contactCity', contactCity).write();
  db.set('club.facebook', facebook || '').write();
  db.set('club.instagram', instagram || '').write();
  if (heroImage) {
    db.set('club.heroImage', heroImage).write();
  }
  db.set('club.values', (values || '').split('\n').map((v) => v.trim()).filter(Boolean)).write();
  if (req.file) {
    db.set('club.logo', `/uploads/logo/${req.file.filename}`).write();
  }
  res.redirect('/admin/club?saved=1');
});

// ---------- DRUZSTVA ----------

router.get('/teams', requireAuth, (req, res) => {
  res.render('admin/teams', { teams: db.get('teams').value() });
});

router.post('/teams', requireAuth, (req, res) => {
  const { name, ageRange, photo } = req.body;
  db.get('teams').push({
    id: nextId('teams'),
    name: str(name),
    ageRange: str(ageRange),
    photo: str(photo),
    coach: '',
    members: []
  }).write();
  res.redirect('/admin/teams');
});

router.get('/teams/:id/edit', requireAuth, (req, res) => {
  const team = findTeam(req.params.id).value();
  if (!team) return res.redirect('/admin/teams');
  res.render('admin/team-edit', { team, members: team.members || [], saved: req.query.saved });
});

router.post('/teams/:id', requireAuth, (req, res) => {
  const team = findTeam(req.params.id);
  if (!team.value()) return res.redirect('/admin/teams');
  const { name, ageRange, photo, coach } = req.body;
  team.assign({ name: str(name), ageRange: str(ageRange), photo: str(photo), coach: str(coach) }).write();
  res.redirect(`/admin/teams/${req.params.id}/edit?saved=1`);
});

router.post('/teams/:id/delete', requireAuth, (req, res) => {
  db.get('teams').remove({ id: parseInt(req.params.id, 10) }).write();
  res.redirect('/admin/teams');
});

// ---------- CLENOVIA DRUZSTVA ----------

router.post('/teams/:id/members', requireAuth, (req, res) => {
  const team = findTeam(req.params.id);
  const t = team.value();
  if (!t) return res.redirect('/admin/teams');
  const members = (t.members || []).slice();
  const name = str(req.body.name);
  if (name) {
    const id = members.length ? Math.max(...members.map((m) => m.id)) + 1 : 1;
    members.push({ id, name, number: str(req.body.number), position: str(req.body.position) });
    team.assign({ members }).write();
  }
  res.redirect(`/admin/teams/${req.params.id}/edit?saved=1`);
});

router.post('/teams/:id/members/:mid', requireAuth, (req, res) => {
  const team = findTeam(req.params.id);
  const t = team.value();
  if (!t) return res.redirect('/admin/teams');
  const mid = parseInt(req.params.mid, 10);
  const name = str(req.body.name);
  const members = (t.members || []).map((m) => (
    m.id === mid && name
      ? { id: m.id, name, number: str(req.body.number), position: str(req.body.position) }
      : m
  ));
  team.assign({ members }).write();
  res.redirect(`/admin/teams/${req.params.id}/edit?saved=1`);
});

router.post('/teams/:id/members/:mid/delete', requireAuth, (req, res) => {
  const team = findTeam(req.params.id);
  const t = team.value();
  if (!t) return res.redirect('/admin/teams');
  const mid = parseInt(req.params.mid, 10);
  team.assign({ members: (t.members || []).filter((m) => m.id !== mid) }).write();
  res.redirect(`/admin/teams/${req.params.id}/edit?saved=1`);
});

// ---------- ZAPASY / VYSLEDKY ----------

router.get('/matches', requireAuth, (req, res) => {
  res.render('admin/matches', { matches: db.get('matches').value() });
});

router.post('/matches', requireAuth, (req, res) => {
  const { homeTeam, awayTeam, date, time, location, status, homeScore, awayScore } = req.body;
  const finished = status === 'finished';
  db.get('matches').push({
    id: nextId('matches'),
    homeTeam: str(homeTeam), awayTeam: str(awayTeam), date: str(date), time: str(time), location: str(location),
    status: finished ? 'finished' : 'upcoming',
    homeScore: finished ? toScore(homeScore) : null,
    awayScore: finished ? toScore(awayScore) : null
  }).write();
  res.redirect('/admin/matches');
});

router.get('/matches/:id/edit', requireAuth, (req, res) => {
  const match = db.get('matches').find({ id: parseInt(req.params.id, 10) }).value();
  if (!match) return res.redirect('/admin/matches');
  res.render('admin/match-edit', { match });
});

router.post('/matches/:id', requireAuth, (req, res) => {
  const match = db.get('matches').find({ id: parseInt(req.params.id, 10) });
  if (!match.value()) return res.redirect('/admin/matches');
  const { homeTeam, awayTeam, date, time, location, status, homeScore, awayScore } = req.body;
  const finished = status === 'finished';
  match.assign({
    homeTeam: str(homeTeam), awayTeam: str(awayTeam), date: str(date), time: str(time), location: str(location),
    status: finished ? 'finished' : 'upcoming',
    homeScore: finished ? toScore(homeScore) : null,
    awayScore: finished ? toScore(awayScore) : null
  }).write();
  res.redirect('/admin/matches');
});

router.post('/matches/:id/delete', requireAuth, (req, res) => {
  db.get('matches').remove({ id: parseInt(req.params.id, 10) }).write();
  res.redirect('/admin/matches');
});

// ---------- AKTUALITY ----------

router.get('/news', requireAuth, (req, res) => {
  res.render('admin/news', { news: db.get('news').sortBy('date').reverse().value() });
});

router.post('/news', requireAuth, newsUpload.single('imageFile'), (req, res) => {
  const { date, title, excerpt, imageUrl } = req.body;
  const image = req.file ? `/uploads/news/${req.file.filename}` : (imageUrl || '');
  db.get('news').push({ id: nextId('news'), date, title, excerpt, image }).write();
  res.redirect('/admin/news');
});

router.post('/news/:id/delete', requireAuth, (req, res) => {
  db.get('news').remove({ id: parseInt(req.params.id, 10) }).write();
  res.redirect('/admin/news');
});

// ---------- GALERIA ----------

router.get('/gallery', requireAuth, (req, res) => {
  res.render('admin/gallery', { gallery: db.get('gallery').value() });
});

router.post('/gallery', requireAuth, galleryUpload.single('imageFile'), (req, res) => {
  const { caption, imageUrl } = req.body;
  const image = req.file ? `/uploads/gallery/${req.file.filename}` : (imageUrl || '');
  if (image) {
    db.get('gallery').push({ id: nextId('gallery'), image, caption: caption || '' }).write();
  }
  res.redirect('/admin/gallery');
});

router.post('/gallery/:id/delete', requireAuth, (req, res) => {
  db.get('gallery').remove({ id: parseInt(req.params.id, 10) }).write();
  res.redirect('/admin/gallery');
});

// ---------- ZMENA HESLA ----------

router.get('/password', requireAuth, (req, res) => {
  res.render('admin/password', { error: null, saved: req.query.saved });
});

router.post('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword, newPassword2 } = req.body;
  const currentHash = db.get('admin.passwordHash').value();

  if (!bcrypt.compareSync(currentPassword || '', currentHash)) {
    return res.render('admin/password', { error: 'Sucasne heslo nie je spravne.', saved: null });
  }
  if (!newPassword || newPassword.length < 8) {
    return res.render('admin/password', { error: 'Nove heslo musi mat aspon 8 znakov.', saved: null });
  }
  if (newPassword !== newPassword2) {
    return res.render('admin/password', { error: 'Hesla sa nezhoduju.', saved: null });
  }

  db.set('admin.passwordHash', bcrypt.hashSync(newPassword, 10)).write();
  res.redirect('/admin/password?saved=1');
});

module.exports = router;
