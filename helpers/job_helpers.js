const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const Redlock = require('redlock');
const crawQueue = new Queue('craw');
const reIndexQueue = new Queue('reindex');
var cron = require('node-cron');
const { writeToRedis, buildLockKey, buildLastRunKey, buildScheduledKey } = require('./redis_cache_helpers');
const { printLog,printErrLog,getCurrentTimeAsString } = require('./utils');

const LastRunHandler = require('./last_run_handler.js');

const connection = new IORedis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

const redlock = new Redlock([connection]);

async function addCrawJob(tiktok_uid) {
  try {
    const lock_key = buildLockKey(tiktok_uid)
    printLog(`lock_key: ${lock_key}`)

    await connection.exists(lock_key, async (err, result) => {
      if (err) {
        printErrLog(`err: ${err}`)
      } else {
        if (result === 1) {
          printErrLog(`duplicate job | lock_key: ${lock_key}`)
        } else {
          await writeToRedis(lock_key, getCurrentTimeAsString(), -1);

          const lastRun = new LastRunHandler(tiktok_uid);
          await lastRun.writeToRedis(getCurrentTimeAsString(), -1)

          printLog(`starting job... ${tiktok_uid}`);
          await crawQueue.add('crawWorker', { tid: tiktok_uid }, { removeOnComplete: 1000, removeOnFail: 5000 });
        }
      }
    })
  } catch (error) {
    printErrLog(`to acquire lock for ${tiktok_uid}: ${error}`);
  }
}

async function addCrawJobCron(tiktok_uid) {
  const lockResource = `[INFO] addCrawJobCron:${tiktok_uid}`;

  try {
    const lock = await redlock.lock(lockResource, 10000);
    const scheduledKey = buildScheduledKey(tiktok_uid)

    await connection.exists(scheduledKey, async (err, result) => {
      if (err) {
        printErrLog(`err: ${err}`)
      } else {
        if (result === 1) {
          printErrLog(`duplicate scheduledKey | scheduledKey: ${scheduledKey}`)
        } else {
          // store key in 365 days
          await writeToRedis(scheduledKey, getCurrentTimeAsString(), 60 * 60 * 24 * 365);

          printLog(`created cron job for ${tiktok_uid}`);
          cron.schedule('* * * * *', async () => {
            await addCrawJob(tiktok_uid);
          });
        }
      }
    })

    lock.unlock()
      .then(() => {
        printLog(`Craw job for ${tiktok_uid} completed and lock released`);
      })
      .catch((err) => {
        printErrLog(`Failed to release lock: ${err}`);
      });
  } catch (error) {
    printErrLog(`Failed to acquire lock for ${tiktok_uid}: ${error}`);
  }
}

async function addReindexJob(tiktokUsername, eventName, msg) {
  msg.created_at = new Date().toISOString().split('.')[0];
  msg.event_name = eventName;
  msg.live_streamer_id = tiktokUsername;

  await reIndexQueue.add('esWorker', {
    tiktokUsername: tiktokUsername,
    eventName: eventName,
    msg: msg
  }, { removeOnComplete: 1000, removeOnFail: 5000 });
}

module.exports = {
  addCrawJob, addReindexJob, addCrawJobCron
};
