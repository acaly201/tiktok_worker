const redisService = require('../services/redis.service');
const { printLog, printErrLog } = require('./utils');

const ONE_DAY_TIME = 60*60*24

async function writeToRedis(key, value, expired_at = ONE_DAY_TIME) {
  try {
    if (expired_at == -1) {
      const result = await redis.set(key, value);
      printLog(`saved lock_key: ${key} to redis`);
      return result;
    } else {
      const result = await redis.set(key, value, "EX", expired_at);
      printLog(`saved lock_key: ${key} to redis`);
      return result;
    }
  } catch (error) {
    printErrLog(`Error writing key in Redis: ${error}`);
  }
}

async function checkIfKeyExists(key) {
  try {
    return await redisService.exists(key);
  } catch (error) {
    printErrLog(`Error checking key in Redis: ${error}`);
    return false;
  }
}

async function deleteKey(key) {
  try {
    await redisService.delete(key);
    printLog(`deleted key: ${key} from redis`);
  } catch (error) {
    printErrLog(`Error deleting key in Redis: ${error}`);
  }
}

const buildLockKey = (tiktok_uid) => {
  return `lockKey:addCrawJob:${tiktok_uid}`
}

const buildLastRunKey = (tiktok_uid) => {
  return `lastRunKey:${tiktok_uid}`
}

const buildScheduledKey = (tiktok_uid) => {
  return `scheduledKey:addCrawJob:${tiktok_uid}`
}

const buildSyncedToLiveKey = (tiktok_uid) => {
  return `syncedLiveKey:${tiktok_uid}`
}

const buildSyncedKey = (tiktok_uid) => {
  return `syncedKey:${tiktok_uid}`
}

module.exports = {
  checkIfKeyExists, writeToRedis, deleteKey, buildLockKey, buildScheduledKey, buildSyncedToLiveKey, buildLastRunKey
};