const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seeding Database...');

  // Clean existing tables
  await prisma.attendance.deleteMany();
  await prisma.teachingJournal.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Seed Classes
  const classX = await prisma.class.create({
    data: { namaKelas: 'X RPL 1', tingkat: 'X' },
  });
  const classXI = await prisma.class.create({
    data: { namaKelas: 'XI RPL 1', tingkat: 'XI' },
  });
  const classXII = await prisma.class.create({
    data: { namaKelas: 'XII RPL 1', tingkat: 'XII' },
  });

  console.log('✅ Classes created');

  // 2. Seed Admin
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: defaultPassword,
      nama: 'Budi Santoso, M.Pd (Waka Kurikulum)',
      role: 'ADMIN',
    },
  });

  // 3. Seed Teachers
  const teacher1 = await prisma.user.create({
    data: {
      username: 'gurumapel',
      password: defaultPassword,
      nama: 'Dra. Siti Aminah',
      role: 'GURU_MAPEL',
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      username: 'bambang',
      password: defaultPassword,
      nama: 'Bambang Hartono, S.Kom',
      role: 'GURU_MAPEL',
    },
  });

  console.log('✅ Admins & Teachers created');

  // 4. Seed Students
  const student1 = await prisma.user.create({
    data: {
      username: 'siswa',
      password: defaultPassword,
      nama: 'Ahmad Rizky',
      role: 'SISWA',
      nisn: '0051234567',
      classId: classX.id,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      username: 'dewi',
      password: defaultPassword,
      nama: 'Dewi Lestari',
      role: 'SISWA',
      nisn: '0051234568',
      classId: classX.id,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      username: 'fajar',
      password: defaultPassword,
      nama: 'Fajar Pratama',
      role: 'SISWA',
      nisn: '0051234569',
      classId: classX.id,
    },
  });

  const student4 = await prisma.user.create({
    data: {
      username: 'gita',
      password: defaultPassword,
      nama: 'Gita Gutawa',
      role: 'SISWA',
      nisn: '0051234570',
      classId: classX.id,
    },
  });

  const student5 = await prisma.user.create({
    data: {
      username: 'hendra',
      password: defaultPassword,
      nama: 'Hendra Setiawan',
      role: 'SISWA',
      nisn: '0051234571',
      classId: classXI.id,
    },
  });

  console.log('✅ Students created');

  // 5. Seed Subjects
  const subjPW = await prisma.subject.create({
    data: { namaMapel: 'Pemrograman Web & Perangkat Bergerak', kodeMapel: 'PWPB-01' },
  });
  const subjBD = await prisma.subject.create({
    data: { namaMapel: 'Basis Data Lanjut', kodeMapel: 'BD-02' },
  });
  const subjMTK = await prisma.subject.create({
    data: { namaMapel: 'Matematika Terapan', kodeMapel: 'MTK-03' },
  });

  console.log('✅ Subjects created');

  // 6. Seed Schedules
  const sched1 = await prisma.schedule.create({
    data: {
      classId: classX.id,
      subjectId: subjPW.id,
      teacherId: teacher1.id,
      hari: 'Senin',
      jamKe: '07.00 - 09.15 (Jam 1-3)',
    },
  });

  const sched2 = await prisma.schedule.create({
    data: {
      classId: classX.id,
      subjectId: subjBD.id,
      teacherId: teacher2.id,
      hari: 'Selasa',
      jamKe: '07.00 - 09.15 (Jam 1-3)',
    },
  });

  const sched3 = await prisma.schedule.create({
    data: {
      classId: classXI.id,
      subjectId: subjMTK.id,
      teacherId: teacher1.id,
      hari: 'Rabu',
      jamKe: '09.30 - 11.45 (Jam 4-6)',
    },
  });

  console.log('✅ Schedules created');

  // 7. Seed Past Attendance & Teaching Journals
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const prevWeek = new Date(today);
  prevWeek.setDate(today.getDate() - 7);

  // Teaching Journals
  await prisma.teachingJournal.create({
    data: {
      scheduleId: sched1.id,
      tanggal: prevWeek,
      materiAjar: 'Konsep Arsitektur Express.js & MVC Paradigm',
      catatanKelas: 'Siswa antusias, 4 siswa menyelesaikan hands-on tepat waktu.',
    },
  });

  await prisma.teachingJournal.create({
    data: {
      scheduleId: sched1.id,
      tanggal: yesterday,
      materiAjar: 'Implementasi Middleware & Session Auth EJS',
      catatanKelas: 'Pembahasan mengenai RBAC 3 level dan simulasi role.',
    },
  });

  // Attendances for previous sessions
  // Prev week: Sched 1
  await prisma.attendance.createMany({
    data: [
      { scheduleId: sched1.id, studentId: student1.id, tanggal: prevWeek, status: 'HADIR', verifiedByTeacher: true },
      { scheduleId: sched1.id, studentId: student2.id, tanggal: prevWeek, status: 'HADIR', verifiedByTeacher: true },
      { scheduleId: sched1.id, studentId: student3.id, tanggal: prevWeek, status: 'HADIR', verifiedByTeacher: true },
      { scheduleId: sched1.id, studentId: student4.id, tanggal: prevWeek, status: 'IZIN', verifiedByTeacher: true, keterangan: 'Acara keluarga' },
    ],
  });

  // Yesterday: Sched 1
  await prisma.attendance.createMany({
    data: [
      { scheduleId: sched1.id, studentId: student1.id, tanggal: yesterday, status: 'HADIR', verifiedByTeacher: true },
      { scheduleId: sched1.id, studentId: student2.id, tanggal: yesterday, status: 'HADIR', verifiedByTeacher: true },
      { scheduleId: sched1.id, studentId: student3.id, tanggal: yesterday, status: 'SAKIT', suratBuktiUrl: '/uploads/demo_surat_dokter.pdf', verifiedByTeacher: true, keterangan: 'Demam tinggi' },
      { scheduleId: sched1.id, studentId: student4.id, tanggal: yesterday, status: 'ALPA', verifiedByTeacher: true, keterangan: 'Tanpa keterangan' },
    ],
  });

  // Additional records for Student 4 (Gita) to trigger < 75% warning indicator for demo!
  const prevWeek2 = new Date(today);
  prevWeek2.setDate(today.getDate() - 14);
  await prisma.attendance.createMany({
    data: [
      { scheduleId: sched1.id, studentId: student1.id, tanggal: prevWeek2, status: 'HADIR', verifiedByTeacher: true },
      { scheduleId: sched1.id, studentId: student4.id, tanggal: prevWeek2, status: 'ALPA', verifiedByTeacher: true, keterangan: 'Tanpa keterangan' },
    ],
  });

  console.log('✅ Initial Attendance & Journals seeded');
  console.log('🎉 Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
