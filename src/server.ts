import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Kitaplık backend ${env.NODE_ENV} modunda çalışıyor`);
  console.log(`   http://localhost:${env.PORT}`);
});

// Düzgün kapanış
const shutdown = (signal: string): void => {
  console.log(`\n${signal} alındı, sunucu kapatılıyor...`);
  server.close(() => {
    console.log('Sunucu kapandı.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
