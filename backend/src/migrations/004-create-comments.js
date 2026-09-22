module.exports = {
  name: '004-create-comments',
  async up(db) {
    const exists = await db.listCollections({ name: 'comments' }).hasNext();
    if (!exists) {
      await db.createCollection('comments', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['entityType', 'entityId', 'user', 'body'],
            properties: {
              entityType: { enum: ['task', 'bug'] },
              entityId: { bsonType: 'objectId' },
              user: { bsonType: 'objectId' },
              body: { bsonType: 'string' },
            },
          },
        },
      });
    }
    await db.collection('comments').createIndex({ entityType: 1, entityId: 1, createdAt: 1 });
  },
};
