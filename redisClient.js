const redis = require('redis');

// Create a Redis client instance with a socket configuration
const redisClient = redis.createClient({
  socket: {
    host: 'localhost',
    port: 6379,
  }
});

// Connect the client. This returns a promise.
redisClient.connect()
  .then(() => {
    console.log('Redis client connected.');
  })
  .catch((err) => {
    console.error('Redis connection error:', err);
  });

module.exports = redisClient;
