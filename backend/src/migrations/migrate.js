require('dotenv').config();
const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');

const migrations = [
  require('./001-create-users'),
  require('./002-create-projects'),
  require('./003-create-tasks'),
  require('./004-create-comments'),
  require('./005-create-bugs'),
  require('./006-create-attendances'),
  require('./007-create-time-entries'),
  require('./008-create-notifications'),
  require('./009-create-activities'),
  require('./010-create-migration-meta'),
];

async function ensureMeta(db) {
  const exists = await db.listCollections({ name: 'schema_migrations' }).hasNext();
  if (!exists) {
    await db.createCollection('schema_migrations');
    await db.collection('schema_migrations').createIndex({ name: 1 }, { unique: true });
  }
}

async function alreadyRan(db, name) {
  return db.collection('schema_migrations').findOne({ name });
}

async function markRan(db, name) {
  await db.collection('schema_migrations').insertOne({ name, appliedAt: new Date() });
}

async function run() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  await ensureMeta(db);

  console.log(`Running migrations on ${db.databaseName}`);

  for (const migration of migrations) {
    const existing = await alreadyRan(db, migration.name);
    if (existing) {
      console.log(`  skip  ${migration.name}`);
      continue;
    }
    await migration.up(db);
    await markRan(db, migration.name);
    console.log(`  apply ${migration.name}`);
  }

  await mongoose.disconnect();
  console.log('Migrations complete');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
