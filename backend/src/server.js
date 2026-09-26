const { app } = require('./app');
const { connectDb } = require('./config/db');
const { port } = require('./config/env');

async function start() {
  await connectDb();
  app.listen(port, '0.0.0.0', () => {
    console.log(`FORGE API listening on http://0.0.0.0:${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
