const prisma = require('../config/prisma');

// 1. Dashboard Guru
exports.getDashboard = async (req, res) => {
  try {
    const teacherId = req.session.user.id;

    // Assigned Schedules
    const schedules = await prisma.schedule.findMany({
      where: { teacherId },
      include: { class: true, subject: true },
      orderBy: { hari: 'asc' },
    });

    // Recent Journals filled by this teacher
    const recentJournals = await prisma.teachingJournal.findMany({
      where: {
        schedule: { teacherId },
      },
      take: 5,
      orderBy: { tanggal: 'desc' },
      include: {
        schedule: { include: { class: true, subject: true } },
      },
    });

    // Pending Doctor/Permission Notes requiring verification
    const pendingNotesCount = await prisma.attendance.count({
      where: {
        verifiedByTeacher: false,
        suratBuktiUrl: { not: null },
        schedule: { teacherId },
      },
    });

    res.render('guru/dashboard', {
      title: 'Dashboard Guru Mapel',
      user: req.session.user,
      schedules,
      recentJournals,
      pendingNotesCount,
    });
  } catch (err) {
    console.error('Guru Dashboard Error:', err);
    res.status(500).send('Server Error');
  }
};

// Helpers for consistent local date handling without timezone offset shifts
function parseLocalDate(dateStr) {
  if (!dateStr) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 2. Form Input Presensi & Jurnal Materi per Schedule
exports.getAttendanceInput = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const teacherId = req.session.user.id;
    const queryDate = parseLocalDate(req.query.tanggal);

    const schedule = await prisma.schedule.findFirst({
      where: { id: parseInt(scheduleId), teacherId },
      include: { class: true, subject: true },
    });

    if (!schedule) {
      return res.status(404).send('Jadwal tidak ditemukan atau tidak diperbolehkan.');
    }

    // Get all students in the class
    const students = await prisma.user.findMany({
      where: { role: 'SISWA', classId: schedule.classId },
      orderBy: { nama: 'asc' },
    });

    // Get existing attendances for this schedule and date
    const endOfDay = new Date(queryDate);
    endOfDay.setDate(queryDate.getDate() + 1);

    const existingAttendances = await prisma.attendance.findMany({
      where: {
        scheduleId: schedule.id,
        tanggal: {
          gte: queryDate,
          lt: endOfDay,
        },
      },
    });

    // Map existing attendance status per student
    const attendanceMap = {};
    existingAttendances.forEach((att) => {
      attendanceMap[att.studentId] = att;
    });

    // Existing Teaching Journal for this session
    const existingJournal = await prisma.teachingJournal.findFirst({
      where: {
        scheduleId: schedule.id,
        tanggal: {
          gte: queryDate,
          lt: endOfDay,
        },
      },
    });

    res.render('guru/attendance_input', {
      title: `Input Presensi - ${schedule.class.namaKelas} (${schedule.subject.namaMapel})`,
      user: req.session.user,
      schedule,
      students,
      attendanceMap,
      existingJournal,
      selectedDate: formatLocalDate(queryDate),
      success: req.query.success === '1',
    });
  } catch (err) {
    console.error('Get Attendance Input Error:', err);
    res.status(500).send('Server Error');
  }
};

// 3. Save Input Presensi Siswa & Jurnal Materi Pelajaran
exports.postAttendanceInput = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { tanggal, materiAjar, catatanKelas, attendanceData } = req.body;
    const teacherId = req.session.user.id;

    const targetDate = parseLocalDate(tanggal);
    const formattedDate = formatLocalDate(targetDate);

    const schedule = await prisma.schedule.findFirst({
      where: { id: parseInt(scheduleId), teacherId },
    });

    if (!schedule) {
      return res.status(403).send('Akses ditolak.');
    }

    const endOfDay = new Date(targetDate);
    endOfDay.setDate(targetDate.getDate() + 1);

    const safeMateriAjar = (materiAjar && materiAjar.trim()) ? materiAjar.trim() : 'Materi Pelajaran Hari Ini';
    const safeCatatanKelas = (catatanKelas && catatanKelas.trim()) ? catatanKelas.trim() : null;

    // Save or update Teaching Journal
    const existingJournal = await prisma.teachingJournal.findFirst({
      where: {
        scheduleId: schedule.id,
        tanggal: {
          gte: targetDate,
          lt: endOfDay,
        },
      },
    });

    if (existingJournal) {
      await prisma.teachingJournal.update({
        where: { id: existingJournal.id },
        data: {
          materiAjar: safeMateriAjar,
          catatanKelas: safeCatatanKelas,
        },
      });
    } else {
      await prisma.teachingJournal.create({
        data: {
          scheduleId: schedule.id,
          tanggal: targetDate,
          materiAjar: safeMateriAjar,
          catatanKelas: safeCatatanKelas,
        },
      });
    }

    // Save or update attendance per student
    if (attendanceData && typeof attendanceData === 'object') {
      const classStudents = await prisma.user.findMany({
        where: { role: 'SISWA', classId: schedule.classId },
        select: { id: true },
      });
      const validStudentIds = new Set(classStudents.map((s) => s.id));
      const allowedStatuses = ['HADIR', 'SAKIT', 'IZIN', 'ALPA'];

      for (const [studentIdStr, statusRaw] of Object.entries(attendanceData)) {
        const studentId = parseInt(studentIdStr);
        if (isNaN(studentId) || !validStudentIds.has(studentId)) {
          continue;
        }

        const status = allowedStatuses.includes(statusRaw) ? statusRaw : 'HADIR';

        const existingAtt = await prisma.attendance.findFirst({
          where: {
            scheduleId: schedule.id,
            studentId,
            tanggal: {
              gte: targetDate,
              lt: endOfDay,
            },
          },
        });

        if (existingAtt) {
          await prisma.attendance.update({
            where: { id: existingAtt.id },
            data: {
              status,
              verifiedByTeacher: true,
            },
          });
        } else {
          await prisma.attendance.create({
            data: {
              scheduleId: schedule.id,
              studentId,
              tanggal: targetDate,
              status,
              verifiedByTeacher: true,
            },
          });
        }
      }
    }

    res.redirect(`/guru/attendance/${schedule.id}?tanggal=${formattedDate}&success=1`);
  } catch (err) {
    console.error('Post Attendance Error:', err);
    res.status(500).send('Server Error');
  }
};

// 4. Verifikasi Surat Sakit/Izin
exports.getVerifyNotes = async (req, res) => {
  try {
    const teacherId = req.session.user.id;

    const unverifiedNotes = await prisma.attendance.findMany({
      where: {
        suratBuktiUrl: { not: null },
        schedule: { teacherId },
      },
      include: {
        student: true,
        schedule: {
          include: { class: true, subject: true },
        },
      },
      orderBy: { tanggal: 'desc' },
    });

    res.render('guru/verify_notes', {
      title: 'Verifikasi Surat Sakit / Izin Siswa',
      user: req.session.user,
      notes: unverifiedNotes,
    });
  } catch (err) {
    console.error('Verify Notes Error:', err);
    res.status(500).send('Server Error');
  }
};

exports.postVerifyNote = async (req, res) => {
  try {
    const { attendanceId, statusAction, keterangan } = req.body;
    // statusAction can be "APPROVE" or "REJECT"

    const att = await prisma.attendance.findUnique({
      where: { id: parseInt(attendanceId) },
    });

    if (!att) return res.status(404).send('Data presensi tidak ditemukan');

    if (statusAction === 'APPROVE') {
      await prisma.attendance.update({
        where: { id: att.id },
        data: {
          verifiedByTeacher: true,
          keterangan: keterangan || 'Surat telah diverifikasi & disetujui guru',
        },
      });
    } else {
      await prisma.attendance.update({
        where: { id: att.id },
        data: {
          status: 'ALPA',
          verifiedByTeacher: true,
          keterangan: keterangan || 'Surat bukti ditolak oleh guru',
        },
      });
    }

    res.redirect('/guru/verify-notes?success=1');
  } catch (err) {
    console.error('Post Verify Note Error:', err);
    res.status(500).send('Server Error');
  }
};

// 5. Cetak Rekapitulasi Presensi Bulanan
exports.getMonthlyRecap = async (req, res) => {
  try {
    const teacherId = req.session.user.id;
    const selectedScheduleId = req.query.scheduleId ? parseInt(req.query.scheduleId) : null;
    const selectedMonth = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM

    const schedules = await prisma.schedule.findMany({
      where: { teacherId },
      include: { class: true, subject: true },
    });

    let activeSchedule = null;
    let students = [];
    let recapData = [];

    if (selectedScheduleId) {
      activeSchedule = schedules.find((s) => s.id === selectedScheduleId);
    } else if (schedules.length > 0) {
      activeSchedule = schedules[0];
    }

    if (activeSchedule) {
      // Get all students in class
      students = await prisma.user.findMany({
        where: { role: 'SISWA', classId: activeSchedule.classId },
        orderBy: { nama: 'asc' },
      });

      // Filter date range for selected month
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1;

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const attendances = await prisma.attendance.findMany({
        where: {
          scheduleId: activeSchedule.id,
          tanggal: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      recapData = students.map((s) => {
        const studentAtts = attendances.filter((a) => a.studentId === s.id);
        const hadir = studentAtts.filter((a) => a.status === 'HADIR').length;
        const sakit = studentAtts.filter((a) => a.status === 'SAKIT').length;
        const izin = studentAtts.filter((a) => a.status === 'IZIN').length;
        const alpa = studentAtts.filter((a) => a.status === 'ALPA').length;
        const total = studentAtts.length;
        const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100;

        return {
          student: s,
          hadir,
          sakit,
          izin,
          alpa,
          total,
          percentage,
        };
      });
    }

    res.render('guru/monthly_recap', {
      title: 'Rekapitulasi Presensi Bulanan',
      user: req.session.user,
      schedules,
      activeSchedule,
      selectedMonth,
      recapData,
    });
  } catch (err) {
    console.error('Monthly Recap Error:', err);
    res.status(500).send('Server Error');
  }
};
