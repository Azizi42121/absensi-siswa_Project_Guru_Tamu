const prisma = require('../config/prisma');

// 1. Dashboard Siswa
exports.getDashboard = async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const classId = req.session.user.classId;

    // Student's class schedules
    const schedules = await prisma.schedule.findMany({
      where: { classId: classId || -1 },
      include: { subject: true, teacher: true },
    });

    // Student attendance records across all schedules
    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      include: {
        schedule: {
          include: { subject: true, teacher: true },
        },
      },
      orderBy: { tanggal: 'desc' },
    });

    // Calculate attendance summary per subject
    const subjectStats = schedules.map((sched) => {
      const schedAtts = attendances.filter((a) => a.scheduleId === sched.id);
      const hadir = schedAtts.filter((a) => a.status === 'HADIR').length;
      const sakit = schedAtts.filter((a) => a.status === 'SAKIT').length;
      const izin = schedAtts.filter((a) => a.status === 'IZIN').length;
      const alpa = schedAtts.filter((a) => a.status === 'ALPA').length;
      const total = schedAtts.length;
      const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100;
      const isWarning = total > 0 && percentage < 75;

      return {
        schedule: sched,
        hadir,
        sakit,
        izin,
        alpa,
        total,
        percentage,
        isWarning,
      };
    });

    // Overall total stats
    const totalAtts = attendances.length;
    const overallHadir = attendances.filter((a) => a.status === 'HADIR').length;
    const overallPercentage = totalAtts > 0 ? Math.round((overallHadir / totalAtts) * 100) : 100;
    const overallWarning = totalAtts > 0 && overallPercentage < 75;

    res.render('siswa/dashboard', {
      title: 'Dashboard Siswa / Wali Murid',
      user: req.session.user,
      subjectStats,
      totalAtts,
      overallPercentage,
      overallWarning,
      recentAttendances: attendances.slice(0, 5),
    });
  } catch (err) {
    console.error('Siswa Dashboard Error:', err);
    res.status(500).send('Server Error');
  }
};

// 2. Personal Attendance Recap
exports.getPersonalRecap = async (req, res) => {
  try {
    const studentId = req.session.user.id;

    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      include: {
        schedule: {
          include: { subject: true, teacher: true },
        },
      },
      orderBy: { tanggal: 'desc' },
    });

    const hadirCount = attendances.filter((a) => a.status === 'HADIR').length;
    const sakitCount = attendances.filter((a) => a.status === 'SAKIT').length;
    const izinCount = attendances.filter((a) => a.status === 'IZIN').length;
    const alpaCount = attendances.filter((a) => a.status === 'ALPA').length;
    const totalCount = attendances.length;
    const percentage = totalCount > 0 ? Math.round((hadirCount / totalCount) * 100) : 100;

    res.render('siswa/personal_recap', {
      title: 'Rekapitulasi Kehadiran Pribadi',
      user: req.session.user,
      attendances,
      stats: {
        hadir: hadirCount,
        sakit: sakitCount,
        izin: izinCount,
        alpa: alpaCount,
        total: totalCount,
        percentage,
        isWarning: totalCount > 0 && percentage < 75,
      },
    });
  } catch (err) {
    console.error('Siswa Recap Error:', err);
    res.status(500).send('Server Error');
  }
};

// 3. Upload Surat Sakit / Izin Form & Action
exports.getUploadNote = async (req, res) => {
  try {
    const classId = req.session.user.classId;

    const schedules = await prisma.schedule.findMany({
      where: { classId: classId || -1 },
      include: { subject: true, teacher: true },
    });

    res.render('siswa/upload_note', {
      title: 'Upload Surat Keterangan Sakit / Izin',
      user: req.session.user,
      schedules,
      error: null,
      success: req.query.success === '1',
    });
  } catch (err) {
    console.error('Get Upload Note Error:', err);
    res.status(500).send('Server Error');
  }
};

exports.postUploadNote = async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const { scheduleId, tanggal, status, keterangan } = req.body;

    if (!req.file) {
      const schedules = await prisma.schedule.findMany({
        where: { classId: req.session.user.classId || -1 },
        include: { subject: true, teacher: true },
      });
      return res.render('siswa/upload_note', {
        title: 'Upload Surat Keterangan Sakit / Izin',
        user: req.session.user,
        schedules,
        error: 'Mohon unggah file surat keterangan (JPG/PNG/PDF)!',
        success: false,
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const targetDate = new Date(tanggal);
    targetDate.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setDate(targetDate.getDate() + 1);

    const parsedScheduleId = parseInt(scheduleId);

    // Check if attendance record exists
    const existingAtt = await prisma.attendance.findFirst({
      where: {
        scheduleId: parsedScheduleId,
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
          status: status || 'SAKIT',
          suratBuktiUrl: fileUrl,
          verifiedByTeacher: false,
          keterangan: keterangan || 'Mengunggah surat bukti keterangan.',
        },
      });
    } else {
      await prisma.attendance.create({
        data: {
          scheduleId: parsedScheduleId,
          studentId,
          tanggal: targetDate,
          status: status || 'SAKIT',
          suratBuktiUrl: fileUrl,
          verifiedByTeacher: false,
          keterangan: keterangan || 'Mengunggah surat bukti keterangan.',
        },
      });
    }

    res.redirect('/siswa/upload-note?success=1');
  } catch (err) {
    console.error('Post Upload Note Error:', err);
    res.status(500).send('Server Error');
  }
};
