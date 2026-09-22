module.exports = {
  name: '008-create-notifications',
  async up(db) {
    const exists = await db.listCollections({ name: 'notifications' }).hasNext();
    if (!exists) {
      await db.createCollection('notifications', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['user', 'type', 'title'],
            properties: {
              user: { bsonType: 'objectId' },
              type: { bsonType: 'string' },
              title: { bsonType: 'string' },
              body: { bsonType: 'string' },
              link: { bsonType: 'string' },
              read: { bsonType: 'bool' },
              meta: { bsonType: 'object' },
            },
          },
        },
      });
    }
    await db.collection('notifications').createIndex({ user: 1, read: 1, createdAt: -1 });
  },
};
