const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

// 1. Dashboard Admin & Real-time Audit Stats
exports.getDashboard = async (req, res) => {
  try {
    const totalStudents = await prisma.user.count({ where: { role: 'SISWA' } });
    const totalTeachers = await prisma.user.count({ where: { role: 'GURU_MAPEL' } });
    const totalClasses = await prisma.class.count();
    const totalSubjects = await prisma.subject.count();

    // Today's attendance stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        tanggal: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const totalTodayRecs = todayAttendances.length;
    const countHadir = todayAttendances.filter((a) => a.status === 'HADIR').length;
    const countSakit = todayAttendances.filter((a) => a.status === 'SAKIT').length;
    const countIzin = todayAttendances.filter((a) => a.status === 'IZIN').length;
    const countAlpa = todayAttendances.filter((a) => a.status === 'ALPA').length;

    const hadirPercentage = totalTodayRecs > 0 ? Math.round((countHadir / totalTodayRecs) * 100) : 100;

    // Recent Teaching Activity Audit
    const recentJournals = await prisma.teachingJournal.findMany({
      take: 5,
      orderBy: { tanggal: 'desc' },
      include: {
        schedule: {
          include: {
            class: true,
            subject: true,
            teacher: true,
          },
        },
      },
    });

    res.render('admin/dashboard', {
      title: 'Dashboard Admin - Monitoring Absensi',
      user: req.session.user,
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalTodayRecs,
        countHadir,
        countSakit,
        countIzin,
        countAlpa,
        hadirPercentage,
      },
      recentJournals,
    });
  } catch (err) {
    console.error('Admin Dashboard Error:', err);
    res.status(500).send('Server Error');
  }
};

// 2. Class CRUD
exports.getClasses = async (req, res) => {
  const classes = await prisma.class.findMany({
    include: { _count: { select: { students: true, schedules: true } } },
    orderBy: { namaKelas: 'asc' },
  });
  res.render('admin/classes', { title: 'Kelola Data Kelas', user: req.session.user, classes });
};

exports.createClass = async (req, res) => {
  const { namaKelas, tingkat } = req.body;
  await prisma.class.create({ data: { namaKelas, tingkat } });
  res.redirect('/admin/classes');
};

exports.deleteClass = async (req, res) => {
  const { id } = req.params;
  await prisma.class.delete({ where: { id: parseInt(id) } });
  res.redirect('/admin/classes');
};

// 3. Student CRUD
exports.getStudents = async (req, res) => {
  const students = await prisma.user.findMany({
    where: { role: 'SISWA' },
    include: { class: true },
    orderBy: { nama: 'asc' },
  });
  const classes = await prisma.class.findMany({ orderBy: { namaKelas: 'asc' } });
  res.render('admin/students', { title: 'Kelola Data Siswa', user: req.session.user, students, classes });
};

exports.createStudent = async (req, res) => {
  const { nama, username, password, nisn, classId } = req.body;
  const hashedPassword = await bcrypt.hash(password || 'password123', 10);
  await prisma.user.create({
    data: {
      nama,
      username,
      password: hashedPassword,
      nisn: nisn || null,
      role: 'SISWA',
      classId: classId ? parseInt(classId) : null,
    },
  });
  res.redirect('/admin/students');
};

exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id: parseInt(id) } });
  res.redirect('/admin/students');
};

// 4. Teacher CRUD
exports.getTeachers = async (req, res) => {
  const teachers = await prisma.user.findMany({
    where: { role: 'GURU_MAPEL' },
    include: { _count: { select: { teacherSchedules: true } } },
    orderBy: { nama: 'asc' },
  });
  res.render('admin/teachers', { title: 'Kelola Data Guru Mapel', user: req.session.user, teachers });
};

exports.createTeacher = async (req, res) => {
  const { nama, username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password || 'password123', 10);
  await prisma.user.create({
    data: {
      nama,
      username,
      password: hashedPassword,
      role: 'GURU_MAPEL',
    },
  });
  res.redirect('/admin/teachers');
};

exports.deleteTeacher = async (req, res) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id: parseInt(id) } });
  res.redirect('/admin/teachers');
};

// 5. Subject CRUD
exports.getSubjects = async (req, res) => {
  const subjects = await prisma.subject.findMany({ orderBy: { kodeMapel: 'asc' } });
  res.render('admin/subjects', { title: 'Kelola Mata Pelajaran', user: req.session.user, subjects });
};

exports.createSubject = async (req, res) => {
  const { namaMapel, kodeMapel } = req.body;
  await prisma.subject.create({ data: { namaMapel, kodeMapel } });
  res.redirect('/admin/subjects');
};

exports.deleteSubject = async (req, res) => {
  const { id } = req.params;
  await prisma.subject.delete({ where: { id: parseInt(id) } });
  res.redirect('/admin/subjects');
};

// 6. Schedule CRUD
exports.getSchedules = async (req, res) => {
  const schedules = await prisma.schedule.findMany({
    include: { class: true, subject: true, teacher: true },
    orderBy: [{ hari: 'asc' }, { jamKe: 'asc' }],
  });
  const classes = await prisma.class.findMany();
  const subjects = await prisma.subject.findMany();
  const teachers = await prisma.user.findMany({ where: { role: 'GURU_MAPEL' } });

  res.render('admin/schedules', {
    title: 'Kelola Jadwal Pelajaran',
    user: req.session.user,
    schedules,
    classes,
    subjects,
    teachers,
  });
};

exports.createSchedule = async (req, res) => {
  const { classId, subjectId, teacherId, hari, jamKe } = req.body;
  await prisma.schedule.create({
    data: {
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      teacherId: parseInt(teacherId),
      hari,
      jamKe,
    },
  });
  res.redirect('/admin/schedules');
};

exports.deleteSchedule = async (req, res) => {
  const { id } = req.params;
  await prisma.schedule.delete({ where: { id: parseInt(id) } });
  res.redirect('/admin/schedules');
};

// 7. Audit Log Pengisian Presensi Guru
exports.getAuditLog = async (req, res) => {
  try {
    const journals = await prisma.teachingJournal.findMany({
      orderBy: { tanggal: 'desc' },
      include: {
        schedule: {
          include: {
            class: true,
            subject: true,
            teacher: true,
          },
        },
      },
    });

    // Fetch attendances per journal schedule date
    const auditLogs = await Promise.all(
      journals.map(async (j) => {
        const attendances = await prisma.attendance.findMany({
          where: {
            scheduleId: j.scheduleId,
            tanggal: j.tanggal,
          },
        });

        const hadir = attendances.filter((a) => a.status === 'HADIR').length;
        const sakit = attendances.filter((a) => a.status === 'SAKIT').length;
        const izin = attendances.filter((a) => a.status === 'IZIN').length;
        const alpa = attendances.filter((a) => a.status === 'ALPA').length;

        return {
          id: j.id,
          tanggal: j.tanggal,
          teacherName: j.schedule.teacher.nama,
          className: j.schedule.class.namaKelas,
          subjectName: j.schedule.subject.namaMapel,
          jamKe: j.schedule.jamKe,
          materiAjar: j.materiAjar,
          catatanKelas: j.catatanKelas,
          recap: { hadir, sakit, izin, alpa, total: attendances.length },
        };
      })
    );

    res.render('admin/audit', {
      title: 'Log Audit Pengisian Presensi Guru',
      user: req.session.user,
      auditLogs,
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
    res.status(500).send('Server Error');
  }
};
