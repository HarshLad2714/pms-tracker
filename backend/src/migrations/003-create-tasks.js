module.exports = {
  name: '003-create-tasks',
  async up(db) {
    const exists = await db.listCollections({ name: 'tasks' }).hasNext();
    if (!exists) {
      await db.createCollection('tasks', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['project', 'title', 'createdBy'],
            properties: {
              project: { bsonType: 'objectId' },
              title: { bsonType: 'string' },
              description: { bsonType: 'string' },
              assignees: { bsonType: 'array' },
              priority: { enum: ['low', 'medium', 'high', 'urgent'] },
              status: { enum: ['todo', 'in_progress', 'in_review', 'qa', 'done'] },
              startDate: { bsonType: ['date', 'null'] },
              dueDate: { bsonType: ['date', 'null'] },
              tags: { bsonType: 'array' },
              attachments: { bsonType: 'array' },
              estimatedMinutes: { bsonType: ['int', 'double', 'long'] },
              createdBy: { bsonType: 'objectId' },
              position: { bsonType: ['int', 'double', 'long'] },
            },
          },
        },
      });
    }
    await db.collection('tasks').createIndex({ project: 1, status: 1, position: 1 });
    await db.collection('tasks').createIndex({ assignees: 1 });
    await db.collection('tasks').createIndex({ dueDate: 1 });
    await db.collection('tasks').createIndex({ tags: 1 });
  },
};
