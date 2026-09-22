module.exports = {
  name: '002-create-projects',
  async up(db) {
    const exists = await db.listCollections({ name: 'projects' }).hasNext();
    if (!exists) {
      await db.createCollection('projects', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'createdBy'],
            properties: {
              name: { bsonType: 'string' },
              description: { bsonType: 'string' },
              startDate: { bsonType: ['date', 'null'] },
              deadline: { bsonType: ['date', 'null'] },
              members: { bsonType: 'array' },
              status: { enum: ['active', 'on_hold', 'completed', 'archived'] },
              createdBy: { bsonType: 'objectId' },
              archivedAt: { bsonType: ['date', 'null'] },
            },
          },
        },
      });
    }
    await db.collection('projects').createIndex({ status: 1, deadline: 1 });
    await db.collection('projects').createIndex({ members: 1 });
    await db.collection('projects').createIndex({ createdBy: 1 });
  },
};
