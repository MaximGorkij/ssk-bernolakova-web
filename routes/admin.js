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
  db.get('teams').push({ id: nextId('teams'), name, ageRange, photo }).write();
  res.redirect('/admin/teams');
});

router.post('/teams/:id/delete', requireAuth, (req, res) => {
  db.get('teams').remove({ id: parseInt(req.params.id, 10) }).write();
  res.redirect('/admin/teams');
});

// ---------- ZAPASY / VYSLEDKY ----------

router.get('/matches', requireAuth, (req, res) => {
  res.render('admin/matches', { matches: db.get('matches').value() });
});

router.post('/matches', requireAuth, (req, res) => {
  const { homeTeam, awayTeam, date, time, location, status, homeScore, awayScore } = req.body;
  db.get('matches').push({
    id: nextId('matches'),
    homeTeam, awayTeam, date, time: time || '', location: location || '',
    status: status === 'finished' ? 'finished' : 'upcoming',
    homeScore: status === 'finished' ? parseInt(homeScore, 10) : null,
    awayScore: status === 'finished' ? parseInt(awayScore, 10) : null
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
