import { testDatabaseConnection } from './config/postgres';
import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

const PORT = 5000;

async function start() {
  await testDatabaseConnection();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();