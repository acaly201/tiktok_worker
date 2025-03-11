const Redis = require('ioredis');
const bcrypt = require('bcrypt');
const { promisify } = require('util');

class User {
  constructor() {
    this.redis = new Redis();
    this.saltRounds = 10;
  }

  async createUser(username, password) {
    const userExists = await this.userExists(username);
    if (userExists) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    await this.redis.hset('users', username, hashedPassword);
  }

  async authenticateUser(username, password) {
    const storedPassword = await this.redis.hget('users', username);
    if (!storedPassword) {
      return false;
    }
    return bcrypt.compare(password, storedPassword);
  }

  async userExists(username) {
    return await this.redis.hexists('users', username);
  }

  async hashPassword(password) {
    return bcrypt.hash(password, this.saltRounds);
  }
}

module.exports = User;
