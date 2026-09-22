require('dotenv').config();
const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Comment = require('../models/Comment');
const Attendance = require('../models/Attendance');
const TimeEntry = require('../models/TimeEntry');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

async function seed() {
  await mongoose.connect(mongoUri);
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Bug.deleteMany({}),
    Comment.deleteMany({}),
    Attendance.deleteMany({}),
    TimeEntry.deleteMany({}),
    Notification.deleteMany({}),
    Activity.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Aarav Shah',
    email: 'admin@forge.dev',
    password: 'Admin@123',
    role: 'admin',
    department: 'Operations',
    designation: 'Founder',
    joiningDate: new Date('2022-01-10'),
  });
  const manager = await User.create({
    name: 'Meera Kapoor',
    email: 'manager@forge.dev',
    password: 'Manager@123',
    role: 'manager',
    department: 'Delivery',
    designation: 'Studio Lead',
    joiningDate: new Date('2023-03-01'),
  });
  const [riya, kabir, anaya, vihaan] = await User.create([
    {
      name: 'Riya Desai',
      email: 'riya@forge.dev',
      password: 'Employee@123',
      role: 'employee',
      department: 'Engineering',
      designation: 'Frontend Engineer',
      joiningDate: new Date('2024-02-12'),
    },
    {
      name: 'Kabir Iyer',
      email: 'kabir@forge.dev',
      password: 'Employee@123',
      role: 'employee',
      department: 'Engineering',
      designation: 'Backend Engineer',
      joiningDate: new Date('2023-11-04'),
    },
    {
      name: 'Anaya Bose',
      email: 'anaya@forge.dev',
      password: 'Employee@123',
      role: 'employee',
      department: 'Quality',
      designation: 'QA Analyst',
      joiningDate: new Date('2024-06-18'),
    },
    {
      name: 'Vihaan Nair',
      email: 'vihaan@forge.dev',
      password: 'Employee@123',
      role: 'employee',
      department: 'Design',
      designation: 'Product Designer',
      joiningDate: new Date('2024-01-08'),
    },
  ]);

  const atlas = await Project.create({
    name: 'Atlas Commerce',
    description: 'Premium storefront rebuild with inventory, checkout and fulfillment.',
    startDate: new Date('2026-07-01'),
    deadline: new Date('2026-10-30'),
    members: [admin._id, manager._id, riya._id, kabir._id, anaya._id, vihaan._id],
    status: 'active',
    createdBy: manager._id,
  });
  const lumen = await Project.create({
    name: 'Lumen Mobile',
    description: 'Member wellness app — habits, streaks and coach chat.',
    startDate: new Date('2026-08-10'),
    deadline: new Date('2026-11-15'),
    members: [manager._id, riya._id, vihaan._id, anaya._id],
    status: 'active',
    createdBy: manager._id,
  });
  const kiln = await Project.create({
    name: 'Kiln Internal Tools',
    description: 'Finance ops console for invoices and vendor payouts.',
    startDate: new Date('2026-06-01'),
    deadline: new Date('2026-09-20'),
    members: [admin._id, kabir._id, anaya._id],
    status: 'on_hold',
    createdBy: admin._id,
  });

  const now = new Date();
  const days = (n) => new Date(now.getTime() + n * 86400000);

  const taskDocs = [
    { project: atlas._id, title: 'Design checkout ritual', description: 'Map the 3-step checkout with gift wrap and delayed shipping.', assignees: [vihaan._id], priority: 'high', status: 'in_review', dueDate: days(2), tags: ['ux', 'checkout'], estimatedMinutes: 480, createdBy: manager._id, position: 0 },
    { project: atlas._id, title: 'Inventory sync worker', description: 'Nightly sync from warehouse CSV into product stock.', assignees: [kabir._id], priority: 'urgent', status: 'in_progress', dueDate: days(1), tags: ['backend', 'jobs'], estimatedMinutes: 720, createdBy: manager._id, position: 0 },
    { project: atlas._id, title: 'Product mosaic grid', description: 'Responsive mosaic with hover states and quick-add.', assignees: [riya._id, vihaan._id], priority: 'medium', status: 'todo', dueDate: days(6), tags: ['frontend'], estimatedMinutes: 360, createdBy: manager._id, position: 0 },
    { project: atlas._id, title: 'QA payment edge cases', description: 'Failed cards, 3DS, refunds and partial capture.', assignees: [anaya._id], priority: 'high', status: 'qa', dueDate: days(3), tags: ['qa'], estimatedMinutes: 240, createdBy: manager._id, position: 0 },
    { project: atlas._id, title: 'Launch checklist', description: 'DNS, analytics, error budget and rollback notes.', assignees: [manager._id, kabir._id], priority: 'low', status: 'done', dueDate: days(-2), tags: ['ops'], estimatedMinutes: 180, createdBy: admin._id, position: 0 },
    { project: lumen._id, title: 'Habit ring animation', description: 'SVG ring that fills as the daily habit completes.', assignees: [riya._id], priority: 'medium', status: 'in_progress', dueDate: days(4), tags: ['motion'], estimatedMinutes: 300, createdBy: manager._id, position: 0 },
    { project: lumen._id, title: 'Coach chat thread', description: 'Realtime-looking thread with offline queue.', assignees: [kabir._id, riya._id], priority: 'high', status: 'todo', dueDate: days(8), tags: ['chat'], estimatedMinutes: 600, createdBy: manager._id, position: 0 },
    { project: lumen._id, title: 'Onboarding illustrations', description: 'Four frames for first-week ritual.', assignees: [vihaan._id], priority: 'low', status: 'in_review', dueDate: days(5), tags: ['design'], estimatedMinutes: 420, createdBy: manager._id, position: 0 },
    { project: kiln._id, title: 'Vendor payout export', description: 'CSV + PDF export for monthly payouts.', assignees: [kabir._id], priority: 'medium', status: 'todo', dueDate: days(12), tags: ['export'], estimatedMinutes: 240, createdBy: admin._id, position: 0 },
  ];

  const tasks = await Task.insertMany(taskDocs);

  const bugs = await Bug.insertMany([
    {
      task: tasks[3]._id,
      title: '3DS modal clips on Safari',
      description: 'Challenge window overflows the viewport on iOS Safari 17.',
      severity: 'high',
      stepsToReproduce: '1. Add item\n2. Pay with Visa 3DS test card\n3. Rotate device',
      status: 'open',
      assignedTo: riya._id,
      createdBy: anaya._id,
    },
    {
      task: tasks[1]._id,
      title: 'CSV parse fails on empty stock',
      description: 'Worker crashes when quantity cell is blank.',
      severity: 'critical',
      stepsToReproduce: 'Drop a warehouse file with blank qty and run nightly job.',
      status: 'in_progress',
      assignedTo: kabir._id,
      createdBy: anaya._id,
    },
    {
      task: tasks[5]._id,
      title: 'Ring overshoots 100%',
      description: 'Completing a habit twice makes the ring wrap past full.',
      severity: 'medium',
      status: 'fixed',
      assignedTo: riya._id,
      createdBy: manager._id,
    },
  ]);

  await Comment.insertMany([
    { entityType: 'task', entityId: tasks[1]._id, user: manager._id, body: 'Warehouse will send the new CSV format from Friday. Keep a fallback parser.' },
    { entityType: 'task', entityId: tasks[1]._id, user: kabir._id, body: 'Fallback is in. Still need retry on SFTP timeout.' },
    { entityType: 'bug', entityId: bugs[0]._id, user: anaya._id, body: 'Reproduced on iPhone 14. Desktop Safari is fine.' },
  ]);

  await Activity.insertMany([
    { entityType: 'task', entityId: tasks[1]._id, user: manager._id, action: 'created', message: 'Created task Inventory sync worker' },
    { entityType: 'task', entityId: tasks[1]._id, user: kabir._id, action: 'status_changed', message: 'Moved from todo to in_progress', meta: { from: 'todo', to: 'in_progress' } },
    { entityType: 'bug', entityId: bugs[1]._id, user: anaya._id, action: 'created', message: 'Logged bug CSV parse fails on empty stock' },
  ]);

  const dateKey = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const stamp = (offset, hour, minute) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const people = [admin, manager, riya, kabir, anaya, vihaan];
  const attendance = [];
  for (let day = -4; day <= 0; day += 1) {
    people.forEach((person, i) => {
      const inHour = 9 + (i % 3);
      const outHour = day === 0 ? null : 18 + (i % 2);
      const clockIn = stamp(day, inHour, 8 + i);
      const clockOut = outHour ? stamp(day, outHour, 10) : null;
      attendance.push({
        user: person._id,
        date: dateKey(day),
        clockIn,
        clockOut,
        totalMinutes: clockOut ? Math.round((clockOut - clockIn) / 60000) : 0,
        isLate: inHour >= 10,
        isEarlyOut: Boolean(outHour && outHour < 19),
      });
    });
  }
  await Attendance.insertMany(attendance);

  await TimeEntry.insertMany([
    { task: tasks[1]._id, user: kabir._id, startTime: stamp(-1, 10, 0), endTime: stamp(-1, 13, 20), durationMinutes: 200, source: 'timer', isRunning: false },
    { task: tasks[5]._id, user: riya._id, startTime: stamp(-1, 11, 0), endTime: stamp(-1, 14, 0), durationMinutes: 180, source: 'timer', isRunning: false },
    { task: tasks[0]._id, user: vihaan._id, startTime: stamp(-2, 14, 0), endTime: stamp(-2, 17, 30), durationMinutes: 210, source: 'manual', note: 'Critique + revisions', isRunning: false },
    { task: tasks[3]._id, user: anaya._id, startTime: stamp(0, 10, 30), endTime: stamp(0, 12, 0), durationMinutes: 90, source: 'timer', isRunning: false },
  ]);

  await Notification.insertMany([
    { user: riya._id, type: 'task_assigned', title: 'New task assigned', body: 'Product mosaic grid', link: `/tasks/${tasks[2]._id}` },
    { user: kabir._id, type: 'bug_added', title: 'New bug logged', body: 'CSV parse fails on empty stock', link: `/tasks/${tasks[1]._id}` },
    { user: manager._id, type: 'task_status', title: 'Task status changed', body: 'Habit ring animation is now in progress', link: `/tasks/${tasks[5]._id}` },
  ]);

  console.log('Seeded FORGE demo data');
  console.log('  admin@forge.dev / Admin@123');
  console.log('  manager@forge.dev / Manager@123');
  console.log('  riya@forge.dev / Employee@123');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
