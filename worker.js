const { Worker, Queue, QueueEvents } = require('bullmq');
const { pushDataToElasticsearch } = require('./helpers/es_helpers');
const { listenToTikTokLikeEvents } = require('./helpers/tiktok_helpers');
const { printLog, printErrLog } = require('./helpers/utils');

const SyncActiveStatusHandler = require('./helpers/sync_active_status_handler');

const IORedis = require('ioredis');
const connection = new IORedis({
  host: 'localhost', // Thay localhost bằng địa chỉ host Redis của bạn
  port: 6379, // Thay 6379 bằng cổng Redis của bạn
  maxRetriesPerRequest: null,
});

const queueEvents = new QueueEvents('craw', { connection });

const crawWorker = new Worker('craw', async job => {
  const tiktokUsername = job.data.tid;
  printLog(`Processing  | tiktokUsername: ${tiktokUsername}`);

  const controller = new SyncActiveStatusHandler(tiktokUsername);
  const is_turn_off = await controller.is_turn_off()
  if (is_turn_off){
    printLog(`Job is turn_off | ${tiktokUsername}`);
    return null;
  }

  await listenToTikTokLikeEvents(tiktokUsername, connection);
}, { connection });

const esWorker = new Worker('reindex', async job => {
  const { tiktokUsername, eventName, msg } = job.data;
  
  printLog(`Processing UpdateES | tiktokUsername: ${tiktokUsername} | Event Name: ${eventName}`);
  
  try {
    msg.created_at = new Date().toISOString().split('.')[0];
    msg.event_name = eventName;
    msg.live_streamer_id = tiktokUsername;

    await pushDataToElasticsearch(msg);
  } catch (error) {
    printErrLog('Error pushing data to Elasticsearch:', error);
  }
}, { connection });

crawWorker.on('completed', job => {
  printLog(`Job ${job.id} has completed`);
});

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  printLog(`completed | jobId: ${jobId}`)
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  printLog(`failed | jobId: ${jobId} | failedReason: ${failedReason}`)
});

queueEvents.on('progress', ({jobId, data}) => {
  printLog(`progress | jobId: ${jobId} ...`)
});

printLog('Worker is running...');
