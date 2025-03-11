const Redis = require('ioredis');
const { printLog, printErrLog } = require('../helpers/utils');

class RedisService {
  constructor() {
    this.redis = new Redis();
    this.DASH_BOARD_MAIN_KEY = 'jobHash';
  }

  async set(key, value, expireTime = -1) {
    try {
      if (expireTime === -1) {
        return await this.redis.set(key, value);
      }
      return await this.redis.set(key, value, 'EX', expireTime);
    } catch (error) {
      printErrLog(`Error setting Redis key: ${error}`);
      throw error;
    }
  }

  async get(key) {
    try {
      return await this.redis.get(key);
    } catch (error) {
      printErrLog(`Error getting Redis key: ${error}`);
      throw error;
    }
  }

  async delete(key) {
    try {
      return await this.redis.del(key);
    } catch (error) {
      printErrLog(`Error deleting Redis key: ${error}`);
      throw error;
    }
  }

  async exists(key) {
    try {
      return await this.redis.exists(key) === 1;
    } catch (error) {
      printErrLog(`Error checking Redis key existence: ${error}`);
      throw error;
    }
  }

  async hset(key, field, value) {
    try {
      return await this.redis.hset(key, field, value);
    } catch (error) {
      printErrLog(`Error setting Redis hash: ${error}`);
      throw error;
    }
  }

  async hget(key, field) {
    try {
      return await this.redis.hget(key, field);
    } catch (error) {
      printErrLog(`Error getting Redis hash: ${error}`);
      throw error;
    }
  }

  async hdel(key, field) {
    try {
      return await this.redis.hdel(key, field);
    } catch (error) {
      printErrLog(`Error deleting Redis hash: ${error}`);
      throw error;
    }
  }

  async hgetall(key) {
    try {
      return await this.redis.hgetall(key);
    } catch (error) {
      printErrLog(`Error getting all Redis hash fields: ${error}`);
      throw error;
    }
  }

  async quit() {
    try {
      await this.redis.quit();
    } catch (error) {
      printErrLog(`Error closing Redis connection: ${error}`);
      throw error;
    }
  }
}

module.exports = new RedisService();