const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const guruRoutes = require('./routes/guruRoutes');
const siswaRoutes = require('./routes/siswaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parser Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static Files
app.use(express.static(path.join(__dirname, '../public')));

// View Engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Session Configuration
app.use(
  session({
    secret: 'absensi_sekolah_super_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
  })
);

// Global Variables in Views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/guru', guruRoutes);
app.use('/siswa', siswaRoutes);

// Root Route Redirect
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === 'ADMIN') return res.redirect('/admin/dashboard');
    if (role === 'GURU_MAPEL') return res.redirect('/guru/dashboard');
    if (role === 'SISWA') return res.redirect('/siswa/dashboard');
  }
  res.redirect('/auth/login');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('error/404', {
    title: '404 - Halaman Tidak Ditemukan',
    user: req.session ? req.session.user : null,
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Aplikasi Absensi Siswa & Guru Berhasil Berjalan!`);
  console.log(`🌐 Akses Server: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
