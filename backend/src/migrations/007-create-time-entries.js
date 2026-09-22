module.exports = {
  name: '007-create-time-entries',
  async up(db) {
    const exists = await db.listCollections({ name: 'timeentries' }).hasNext();
    if (!exists) {
      await db.createCollection('timeentries', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['task', 'user', 'startTime'],
            properties: {
              task: { bsonType: 'objectId' },
              user: { bsonType: 'objectId' },
              startTime: { bsonType: 'date' },
              endTime: { bsonType: ['date', 'null'] },
              durationMinutes: { bsonType: ['int', 'double', 'long'] },
              source: { enum: ['timer', 'manual'] },
              note: { bsonType: 'string' },
              isRunning: { bsonType: 'bool' },
            },
          },
        },
      });
    }
    await db.collection('timeentries').createIndex({ task: 1, user: 1, startTime: -1 });
    await db.collection('timeentries').createIndex({ user: 1, isRunning: 1 });
    await db.collection('timeentries').createIndex({ startTime: 1 });
  },
};
