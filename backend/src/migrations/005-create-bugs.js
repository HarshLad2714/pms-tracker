module.exports = {
  name: '005-create-bugs',
  async up(db) {
    const exists = await db.listCollections({ name: 'bugs' }).hasNext();
    if (!exists) {
      await db.createCollection('bugs', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['task', 'title', 'createdBy'],
            properties: {
              task: { bsonType: 'objectId' },
              title: { bsonType: 'string' },
              description: { bsonType: 'string' },
              severity: { enum: ['low', 'medium', 'high', 'critical'] },
              stepsToReproduce: { bsonType: 'string' },
              screenshots: { bsonType: 'array' },
              status: { enum: ['open', 'in_progress', 'fixed', 'reopened', 'closed'] },
              assignedTo: { bsonType: ['objectId', 'null'] },
              createdBy: { bsonType: 'objectId' },
            },
          },
        },
      });
    }
    await db.collection('bugs').createIndex({ task: 1, status: 1 });
    await db.collection('bugs').createIndex({ assignedTo: 1 });
    await db.collection('bugs').createIndex({ severity: 1 });
  },
};
