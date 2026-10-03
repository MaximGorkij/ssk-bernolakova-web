const multer = require('multer');
const path = require('path');
const fs = require('fs');

function makeUploader(subfolder) {
  const dest = path.join(__dirname, '..', 'public', 'uploads', subfolder);
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
      const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + safeExt;
      cb(null, name);
    }
  });

  return multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|webp|gif/;
      const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
      cb(ok ? null : new Error('Nepovoleny typ suboru (povolene: jpg, png, webp, gif)'), ok);
    }
  });
}

module.exports = { makeUploader };
