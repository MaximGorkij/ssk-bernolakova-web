const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const adapter = new FileSync(path.join(DATA_DIR, 'db.json'));
const db = low(adapter);

// Vychodzie data prevzate z povodneho statickeho code.html
db.defaults({
  admin: {
    username: null,
    passwordHash: null
  },
  club: {
    name: 'ŠŠK Bernolákova Košice',
    tagline: 'KOŠICE • HÁDZANÁ',
    heroTitle: 'SPOLU NA\nIHRISKU.',
    heroText: 'Miesto, kde dievčatá rastú ako športovkyne, spoluhráčky aj osobnosti. Hádzaná, tímový duch a radosť z pohybu.',
    aboutTitle: 'VIAC NEŽ\nHÁDZANÁ.',
    aboutText: 'ŠŠK Bernolákova Košice je klub zameraný na rozvoj dievčenskej a mládežníckej hádzanej. Chceme vytvárať prostredie, v ktorom sa dievčatá môžu zlepšovať, športovať, vytvárať priateľstvá a byť súčasťou tímu.',
    values: [
      '🤾‍♀️ LÁSKA K HÁDZANEJ',
      '💪 TÍMOVÝ DUCH',
      '👧 PRÁCA S MLÁDEŽOU',
      '🏆 ROZVOJ HRÁČOK'
    ],
    contactEmail: 'email@klub.sk',
    contactCity: 'Košice',
    facebook: '',
    instagram: '',
    logo: '',
    heroImage: 'https://images.pexels.com/photos/25048028/pexels-photo-25048028.jpeg?auto=compress&cs=tinysrgb&w=1800'
  },
  teams: [
    { id: 1, name: 'MINI', ageRange: '6–8 rokov', photo: 'https://www.handball.ee/_next/image?q=75&url=https%3A%2F%2Fekl-bucket.s3.eu-north-1.amazonaws.com%2FEMV%2F2025%2520EMV%2520TU12%2520I%2520etapp.jpg&w=1600' },
    { id: 2, name: 'MLADŠIE ŽIAČKY', ageRange: '9–11 rokov', photo: 'https://images.pexels.com/photos/25048041/pexels-photo-25048041.jpeg?auto=compress&cs=tinysrgb&w=1200' },
    { id: 3, name: 'STARŠIE ŽIAČKY', ageRange: '12–14 rokov', photo: 'https://images.unsplash.com/photo-1584196825674-e6f64590b914?auto=format&fit=crop&w=1200&q=85' },
    { id: 4, name: 'DORAST', ageRange: '15–17 rokov', photo: 'https://images.unsplash.com/photo-1584196821326-c25b58b054c5?auto=format&fit=crop&w=1200&q=85' }
  ],
  matches: [
    { id: 1, homeTeam: 'ŠŠK Bernolákova', awayTeam: 'Súper', date: '2026-09-20', time: '15:00', location: 'Košice', status: 'upcoming', homeScore: null, awayScore: null },
    { id: 2, homeTeam: 'ŠŠK Bernolákova', awayTeam: 'Súper', date: '2026-09-14', time: '', location: '', status: 'finished', homeScore: 24, awayScore: 19 },
    { id: 3, homeTeam: 'ŠŠK Bernolákova', awayTeam: 'Súper', date: '2026-09-07', time: '', location: '', status: 'finished', homeScore: 18, awayScore: 18 },
    { id: 4, homeTeam: 'ŠŠK Bernolákova', awayTeam: 'Súper', date: '2026-09-28', time: '15:00', location: '', status: 'upcoming', homeScore: null, awayScore: null }
  ],
  news: [
    { id: 1, date: '2026-09-12', title: 'Košice Handball Cup', excerpt: 'Naše družstvá sa predstavili na turnaji a odniesli si množstvo skúseností.', image: 'https://images.pexels.com/photos/25048041/pexels-photo-25048041.jpeg?auto=compress&cs=tinysrgb&w=1200' },
    { id: 2, date: '2026-09-05', title: 'Začína nová sezóna', excerpt: 'Nová sezóna je tu. Pozrite si tréningy a rozpis jednotlivých družstiev.', image: 'https://images.unsplash.com/photo-1584196825674-e6f64590b914?auto=format&fit=crop&w=1200&q=85' },
    { id: 3, date: '2026-08-28', title: 'Ďakujeme za podporu', excerpt: 'Ďakujeme našim partnerom a mestu Košice za podporu mládežníckej hádzanej.', image: 'https://images.unsplash.com/photo-1584196821326-c25b58b054c5?auto=format&fit=crop&w=1200&q=85' }
  ],
  gallery: [
    { id: 1, image: 'https://images.pexels.com/photos/25048028/pexels-photo-25048028.jpeg?auto=compress&cs=tinysrgb&w=1800', caption: '' },
    { id: 2, image: 'https://images.pexels.com/photos/25048041/pexels-photo-25048041.jpeg?auto=compress&cs=tinysrgb&w=1200', caption: '' },
    { id: 3, image: 'https://images.unsplash.com/photo-1584196825674-e6f64590b914?auto=format&fit=crop&w=1200&q=85', caption: '' },
    { id: 4, image: 'https://images.unsplash.com/photo-1584196821326-c25b58b054c5?auto=format&fit=crop&w=1200&q=85', caption: '' },
    { id: 5, image: 'https://www.handball.ee/_next/image?q=75&url=https%3A%2F%2Fekl-bucket.s3.eu-north-1.amazonaws.com%2FEMV%2F2025%2520EMV%2520TU12%2520I%2520etapp.jpg&w=1600', caption: '' }
  ]
}).write();

module.exports = db;
