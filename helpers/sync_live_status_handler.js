const redisService = require('../services/redis.service');

const {
  SYNC_STATUS_TURN_ON,
  SYNC_STATUS_TURN_OFF,
  DEFAULT_SYNC_STATUS
} = require('./constants.js');

class SyncLiveStatusHandler {
  constructor(tiktok_uid) {
    this.redis = new Redis();
    this.tiktok_uid = tiktok_uid
  }

  async createSyncStatus(status = SYNC_STATUS_TURN_ON) {
    const exist = await this.checkIfKeyExists(this.buildSyncKey());

    if (exist) {
      return false;
    } else {
      const result = await this.writeToRedis(status, -1);
      return result;
    }
  }

  async getSyncStatus() {
    const result = await this.redis.get(this.buildSyncKey());
    if (result) {
      return result;
    } else {
      return DEFAULT_SYNC_STATUS;
    }
  }

  async updateStatus(status) {
    const exist = await this.checkIfKeyExists();
    const key = this.buildSyncKey();

    if (exist) {
      const currentValue = await this.redis.get(key);
      if (currentValue == status) {
      } else {
        const result = await this.writeToRedis(status, -1);
        return result;
      }
    } else {
      const result = await this.writeToRedis(status, -1);
      return result;
    }
  }

  async checkIfKeyExists() {
    try {
      return await redisService.exists(this.buildSyncKey());
    } catch (error) {
      console.error(`Error checking key in Redis: ${error}`);
      return false;
    }
  }

  async clear() {
    await this.redis.del(this.buildSyncKey());
  }

  async is_turn_off() {
    const currentStatus = await this.getSyncStatus();
    return currentStatus == SYNC_STATUS_TURN_OFF;
  }

  async writeToRedis(value, expired_at = 60*60*24) {
    try {
      if (expired_at == -1){
        const result = await this.redis.set(this.buildSyncKey(), value);
      } else {
        const result = await this.redis.set(this.buildSyncKey(), value, "EX", expired_at);
      }

      return true;
    } catch (error) {
      console.error(`Error writing key in Redis: ${error} | value: ${value} | expired_at: ${expired_at}`);
      return false;
    }
  }

  buildSyncKey() {
    return `syncLiveStatus:${this.tiktok_uid}`;
  }
}

module.exports = SyncLiveStatusHandler;
