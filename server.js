require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = require('./db');
const siteRoutes = require('./routes/site');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Ak bezi aplikacia za Traefikom/reverse proxy s HTTPS
const behindProxy = (process.env.TRUST_PROXY || 'false').toLowerCase() === 'true';
if (behindProxy) {
  app.set('trust proxy', 1);
}

// Pri prvom spusteni nastav admina z .env
if (!db.get('admin.passwordHash').value()) {
  const initialUser = process.env.ADMIN_USER || 'admin';
  const initialPass = process.env.ADMIN_PASSWORD || 'admin123';
  db.set('admin.username', initialUser).write();
  db.set('admin.passwordHash', bcrypt.hashSync(initialPass, 10)).write();
  console.log('[INFO] Admin ucet inicializovany z env (uzivatel: ' + initialUser + ').');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'zmen-ma',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8,
    secure: behindProxy
  }
}));

app.use('/', siteRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).send('404 - Stranka nenajdena');
});

app.listen(PORT, () => {
  console.log('Web bezi na porte ' + PORT + ', admin na /admin');
});
