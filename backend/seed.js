import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database.js';
import User from './models/User.js';
import Assignment from './models/Assignment.js';

const demoPassword = 'Password123';

async function seed() {
  await connectDatabase();

  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const users = [
    { name: 'Demo Teacher', email: 'teacher@example.com', role: 'Teacher' },
    { name: 'Aarav Sharma', email: 'aarav@example.com', role: 'Student' },
    { name: 'Meera Patel', email: 'meera@example.com', role: 'Student' },
  ];

  const createdUsers = {};
  for (const userData of users) {
    const user = await User.findOneAndUpdate(
      { email: userData.email },
      { ...userData, password: passwordHash },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    createdUsers[userData.role === 'Teacher' ? 'teacher' : userData.email.split('@')[0]] = user;
  }

  const deadline = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const assignments = [
    {
      title: 'Data Structures Lab',
      subject: 'Computer Science',
      description: 'Implement stacks and queues, and submit a short report describing the time complexity of each operation.',
      deadline: deadline(7),
      maxMarks: 100,
    },
    {
      title: 'Algebra Problem Set',
      subject: 'Mathematics',
      description: 'Solve questions 1–15 from the quadratic equations and polynomials practice set.',
      deadline: deadline(10),
      maxMarks: 50,
    },
    {
      title: 'Environmental Science Presentation',
      subject: 'Science',
      description: 'Prepare an 8–10 slide presentation on renewable energy sources and their local applications.',
      deadline: deadline(14),
      maxMarks: 75,
    },
  ];

  for (const assignmentData of assignments) {
    await Assignment.findOneAndUpdate(
      { title: assignmentData.title, createdBy: createdUsers.teacher._id },
      { ...assignmentData, createdBy: createdUsers.teacher._id },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  console.info('Demo seed complete.');
  console.info('Teacher: teacher@example.com / Password123');
  console.info('Student: aarav@example.com / Password123');
  console.info('Student: meera@example.com / Password123');
}

seed()
  .catch((error) => {
    console.error(`Unable to seed demo data: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
