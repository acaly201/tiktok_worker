const redisService = require('../services/redis.service');
const { printLog,printErrLog,getCurrentTimeAsString } = require('./utils');
const {
  buildLockKey,
  buildScheduledKey,
  deleteKey,
  buildSyncedToLiveKey,
  checkIfKeyExists,
  writeToRedis,
  buildLastRunKey
} = require('./redis_cache_helpers');

const SyncLiveStatusHandler = require('./sync_live_status_handler');
const SyncActiveStatusHandler = require('./sync_active_status_handler');
const LastRunHandler = require('./last_run_handler.js');

const {
  SYNC_STATUS_TURN_ON,
  SYNC_STATUS_TURN_OFF,
  DEFAULT_SYNC_STATUS
} = require('./constants.js')

const {
  countDocumentsByTikTokUidAndIndex
} = require('./es_helpers')

const DASH_BOARD_MAIN_KEY = 'jobHash'

async function saveJobToRedisHash(jobName, createdAt) {
  try {
    await redisService.hset(DASH_BOARD_MAIN_KEY, jobName, createdAt);
  } catch (error) {
    printErrLog(`Error saving job to Redis Hash: ${error}`);
  }
}

async function deleteJobByJobName(jobName) {
  try {
    const result = await redisService.hdel(DASH_BOARD_MAIN_KEY, jobName);
    if (result === 1) {
      printLog(`Deleted job ${jobName} from Redis Hash.`);

      const lock_key = buildLockKey(jobName);
      await deleteKey(lock_key);

      const scheduledKey = buildScheduledKey(jobName);
      await deleteKey(scheduledKey);

      const liveHandle = new SyncLiveStatusHandler(jobName)
      await liveHandle.clear()

      const activeHandle = new SyncActiveStatusHandler(jobName)
      await activeHandle.clear()

      const lastRun = new LastRunHandler(jobName);
      await lastRun.clear()

      return true;
    } else {
      printLog(`Job ${jobName} not found in Redis Hash.`);
      return false;
    }

  } catch (error) {
    printErrLog(`Error deleting job from Redis Hash: ${error}`);
    return false;
  }
}

async function getJobInfoFromRedisHash(jobName) {
  try {
    const createdAt = await redisService.hget(DASH_BOARD_MAIN_KEY, jobName);
    if (createdAt === null) {
      printLog(`Job ${jobName} not found in Redis Hash.`);
    } else {
      printLog(`Job Name: ${jobName}, Created At: ${createdAt}`);
    }
  } catch (error) {
    printErrLog(`Error getting job info from Redis Hash: ${error}`);
  }
}

const getLastRun = async (name) => {
  const handle = new LastRunHandler(name);
  return await handle.getSyncStatus();
}

const getJobActiveStatus = async (name) => {
  const handler = new SyncActiveStatusHandler(name);
  const result = await handler.getSyncStatus();
  return result == SYNC_STATUS_TURN_ON;
}

const getSyncStatus = async(name) => {
  const handler = new SyncLiveStatusHandler(name);
  const result = await handler.getSyncStatus();
  return result == SYNC_STATUS_TURN_ON;
}

const getAllKeysAndValuesFromRedisHash = async () => {
  try {
    const result = await redisService.hgetall(DASH_BOARD_MAIN_KEY);
    const jobInfoArray = [];

    for (const key in result) {
      if (result.hasOwnProperty(key)) {
        const name = key;
        const createdAt = result[key];
        const lastRun = await getLastRun(name);
        const status = await getJobActiveStatus(name);
        const is_sync_live = await getSyncStatus(name);
        // const countEs = await countDocumentsByTikTokUidAndIndex(name);

        jobInfoArray.push({
          name: name,
          createdAt: createdAt,
          lastRun: lastRun,
          status: status,
          is_sync_live: is_sync_live,
          es_count: 0
        });
      }
    }

    return jobInfoArray;
  } catch (error) {
    console.error(error);
    printErrLog(`Error getting all keys and values from Redis Hash: ${error}`);
    return [];
  }
}


module.exports = {
  getJobInfoFromRedisHash,
  saveJobToRedisHash,
  getAllKeysAndValuesFromRedisHash,
  deleteJobByJobName,
  getSyncStatus
};