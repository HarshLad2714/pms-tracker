module.exports = {
  name: '010-create-migration-meta',
  async up(db) {
    const exists = await db.listCollections({ name: 'schema_migrations' }).hasNext();
    if (!exists) {
      await db.createCollection('schema_migrations');
    }
    await db.collection('schema_migrations').createIndex({ name: 1 }, { unique: true });
  },
};
