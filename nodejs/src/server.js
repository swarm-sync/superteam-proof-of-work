'use strict';

// Entry point: build the app and listen. All wiring lives in app.js so
// tests can import the factory without starting a server.
const { buildApp } = require('./app');
const config = require('./config');

async function main() {
  const app = buildApp();
  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info({ port: config.port, host: config.host }, 'bounty-listings-api listening');
  } catch (err) {
    app.log.error(err, 'failed to start');
    process.exit(1);
  }
  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
