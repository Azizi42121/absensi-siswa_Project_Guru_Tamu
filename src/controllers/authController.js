const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === 'ADMIN') return res.redirect('/admin/dashboard');
    if (role === 'GURU_MAPEL') return res.redirect('/guru/dashboard');
    if (role === 'SISWA') return res.redirect('/siswa/dashboard');
  }
  res.render('auth/login', { error: null, title: 'Login - Sistem Absensi' });
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { class: true },
    });

    if (!user) {
      return res.render('auth/login', {
        error: 'Username atau password salah!',
        title: 'Login - Sistem Absensi',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', {
        error: 'Username atau password salah!',
        title: 'Login - Sistem Absensi',
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      nisn: user.nisn,
      classId: user.classId,
      namaKelas: user.class ? user.class.namaKelas : null,
    };

    if (user.role === 'ADMIN') return res.redirect('/admin/dashboard');
    if (user.role === 'GURU_MAPEL') return res.redirect('/guru/dashboard');
    if (user.role === 'SISWA') return res.redirect('/siswa/dashboard');

    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', {
      error: 'Terjadi kesalahan sistem.',
      title: 'Login - Sistem Absensi',
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect('/auth/login');
  });
};
