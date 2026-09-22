module.exports = {
  name: '001-create-users',
  async up(db) {
    const exists = await db.listCollections({ name: 'users' }).hasNext();
    if (!exists) {
      await db.createCollection('users', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'email', 'password', 'role'],
            properties: {
              name: { bsonType: 'string' },
              email: { bsonType: 'string' },
              password: { bsonType: 'string' },
              role: { enum: ['admin', 'manager', 'employee'] },
              department: { bsonType: 'string' },
              designation: { bsonType: 'string' },
              joiningDate: { bsonType: ['date', 'null'] },
              avatar: { bsonType: 'string' },
              isActive: { bsonType: 'bool' },
            },
          },
        },
      });
    }
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1, isActive: 1 });
  },
};
