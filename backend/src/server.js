const { app } = require('./app');
const { connectDb } = require('./config/db');
const { port } = require('./config/env');

async function start() {
  await connectDb();
  app.listen(port, () => {
    console.log(`FORGE API listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
