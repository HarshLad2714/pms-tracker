module.exports = {
  name: '009-create-activities',
  async up(db) {
    const exists = await db.listCollections({ name: 'activities' }).hasNext();
    if (!exists) {
      await db.createCollection('activities', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['entityType', 'entityId', 'user', 'action', 'message'],
            properties: {
              entityType: { enum: ['task', 'bug', 'project'] },
              entityId: { bsonType: 'objectId' },
              user: { bsonType: 'objectId' },
              action: { bsonType: 'string' },
              message: { bsonType: 'string' },
              meta: { bsonType: 'object' },
            },
          },
        },
      });
    }
    await db.collection('activities').createIndex({ entityType: 1, entityId: 1, createdAt: -1 });
  },
};
