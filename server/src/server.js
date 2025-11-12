import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

import { projectRoutes } from './routes/projects.js';
import { searchRoutes } from './routes/search.js';
import { exportRoutes } from './routes/export.js';
import { getProjectRoot } from './utils/pathHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
  },
  connectionTimeout: 0,  // Disable connection timeout
  keepAliveTimeout: 600000,  // 10 minutes
  requestTimeout: 600000  // 10 minutes for long operations like index rebuild
});

// Register CORS
await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000', 'http://localhost:5173']
    : true
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  await fastify.register(fastifyStatic, {
    root: join(__dirname, '../../client/dist'),
    prefix: '/'
  });
}

// API Routes
await fastify.register(projectRoutes, { prefix: '/api' });
await fastify.register(searchRoutes, { prefix: '/api' });
await fastify.register(exportRoutes, { prefix: '/api' });

// Catch-all route for SPA in production
if (process.env.NODE_ENV === 'production') {
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/')) {
      reply.code(404).send({ error: 'API endpoint not found' });
    } else {
      reply.sendFile('index.html');
    }
  });
}

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;
  
  fastify.log.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method
  });

  reply.status(statusCode).send({
    error: statusCode >= 500 ? 'Internal Server Error' : error.message,
    statusCode
  });
});

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('🔄 Gracefully shutting down...');
  try {
    await fastify.close();
    console.log('✅ Server closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3400;
    const host = process.env.HOST || '0.0.0.0';
    const projectRoot = getProjectRoot();

    await fastify.listen({ port: parseInt(port), host });

    console.log(`\n🚀 Claude Viewer Server running on http://localhost:${port}`);
    console.log(`📁 Projects root: ${projectRoot}`);
    console.log(`🔍 Search: SQLite FTS5 with persistent indexing`);
    console.log(`\n✨ Open http://localhost:${port} in your browser\n`);

  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${process.env.PORT || 3400} is already in use!`);
      console.error(`\n💡 Try one of these solutions:`);
      console.error(`   1. Use a different port: claudex --port 3500`);
      console.error(`   2. Kill the process using port ${process.env.PORT || 3400}:`);
      console.error(`      lsof -ti :${process.env.PORT || 3400} | xargs kill -9`);
      console.error(`   3. Use environment variable: PORT=3500 claudex\n`);
    } else {
      fastify.log.error(error);
      console.error(`\n❌ Server failed to start: ${error.message}\n`);
    }
    process.exit(1);
  }
};

start();