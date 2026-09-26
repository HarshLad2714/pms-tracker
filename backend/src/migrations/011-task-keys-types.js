const { ObjectId } = require('mongodb');

module.exports = {
  name: '011-task-keys-types',
  async up(db) {
    const tasks = await db.collection('tasks').find({ $or: [{ key: { $exists: false } }, { key: null }] }).sort({ createdAt: 1 }).toArray();
    let seq = 0;
    const existing = await db.collection('counters').findOne({ name: 'task' });
    if (existing) seq = existing.seq;
    for (const task of tasks) {
      seq += 1;
      await db.collection('tasks').updateOne(
        { _id: task._id },
        { $set: { key: `FRG-${seq}`, type: task.type || 'task', watchers: task.watchers || [] } }
      );
    }
    await db.collection('counters').updateOne(
      { name: 'task' },
      { $set: { seq, name: 'task' } },
      { upsert: true }
    );
    await db.collection('tasks').createIndex({ key: 1 }, { unique: true, sparse: true });
    await db.collection('tasks').createIndex({ parent: 1 });
    void ObjectId;
  },
};
