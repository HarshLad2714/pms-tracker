module.exports = {
  name: '006-create-attendances',
  async up(db) {
    const exists = await db.listCollections({ name: 'attendances' }).hasNext();
    if (!exists) {
      await db.createCollection('attendances', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['user', 'date', 'clockIn'],
            properties: {
              user: { bsonType: 'objectId' },
              date: { bsonType: 'string' },
              clockIn: { bsonType: 'date' },
              clockOut: { bsonType: ['date', 'null'] },
              totalMinutes: { bsonType: ['int', 'double', 'long'] },
              isLate: { bsonType: 'bool' },
              isEarlyOut: { bsonType: 'bool' },
            },
          },
        },
      });
    }
    await db.collection('attendances').createIndex({ user: 1, date: 1 }, { unique: true });
    await db.collection('attendances').createIndex({ date: 1 });
  },
};
