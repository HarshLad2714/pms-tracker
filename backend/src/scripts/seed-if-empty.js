const mongoose = require('mongoose');
const { spawn } = require('child_process');
const { mongoUri } = require('../config/env');

async function run() {
  await mongoose.connect(mongoUri);
  const count = await mongoose.connection.db.collection('users').estimatedDocumentCount();
  await mongoose.disconnect();

  if (count > 0) {
    console.log(`Seed skipped — ${count} user(s) already exist`);
    return;
  }

  console.log('No users found — loading demo data');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['src/seed/seed.js'], { stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`seed exited ${code}`))));
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
