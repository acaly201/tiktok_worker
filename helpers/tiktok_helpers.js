const { WebcastPushConnection } = require('tiktok-live-connector');
const { pushDataToElasticsearch } = require('./es_helpers');
const { addReindexJob } = require('./job_helpers');
const { writeToRedis, deleteKey, buildLockKey } = require('./redis_cache_helpers');
const { getCurrentTimeAsString, printLog, printErrLog } = require('./utils');
const { publishToChannel, MAIN_CHANNEL } = require('./realtime_notification_helpers');
const SyncActiveStatusHandler = require('./sync_active_status_handler');

const TikTokEvent = {
  member: 'member',
  roomUser: 'roomUser',
  gift: 'gift',
  like: 'like',
  chat: 'chat',
  social: 'social', // share,follow
  subscribe: 'subscribe',
  streamEnd: 'streamEnd',
  questionNew: 'questionNew',
  linkMicBattle: 'linkMicBattle',
  linkMicArmies: 'linkMicArmies',
  liveIntro: 'liveIntro',
  emote: 'emote',
  envelope: 'envelope'
};

const {
  getSyncStatus
} = require('./dashboard_helpers');

const {
  SYNC_STATUS_TURN_ON,
  SYNC_STATUS_TURN_OFF,
  DEFAULT_SYNC_STATUS
} = require('./constants.js')


const listenToTikTokEvent = async (redisConnection, tiktokUsername, eventName, msg) => {
  printLog(`listenToTikTokEvent .. | tiktokUsername: ${tiktokUsername} | event_name: ${eventName}`);

  addReindexJob(tiktokUsername, eventName, msg)

  const handler = new SyncActiveStatusHandler(tiktokUsername);
  const result = await handler.getSyncStatus();

  if (result == SYNC_STATUS_TURN_ON) {
    publishToChannel(redisConnection, MAIN_CHANNEL, msg)
  }else{
    printLog(`NOT PUBLISH | result: ${result}`);
  }
}

async function listenToTikTokLikeEvents(tiktokUsername, redisConnection) {
  try {
    const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

    await tiktokLiveConnection.connect().then(state => {
      console.info(`Connected to roomId ${state.roomId}`);
    }).catch(async(err) => {
      const lock_key = buildLockKey(tiktokUsername);
      await deleteKey(lock_key);
      printErrLog('Failed to connect', err);
    })

    tiktokLiveConnection.on(TikTokEvent.social, async data => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.social, data);
    })

    tiktokLiveConnection.on(TikTokEvent.questionNew, async data => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.questionNew, data);
    })

    tiktokLiveConnection.on(TikTokEvent.linkMicBattle, async data => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.linkMicBattle, data);
    })

    tiktokLiveConnection.on(TikTokEvent.linkMicArmies, async data => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.linkMicArmies, data);
    })

    tiktokLiveConnection.on(TikTokEvent.liveIntro, async data => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.liveIntro, data);
    })

    tiktokLiveConnection.on(TikTokEvent.emote, async data => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.emote, data);
    })

    tiktokLiveConnection.on(TikTokEvent.envelope, async data => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.envelope, data);
    })

    tiktokLiveConnection.on(TikTokEvent.gift, async data => {
      printLog(`${data.uniqueId} (userId:${data.userId}) sends ${data.giftId}`);
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.gift, data);
    })

    tiktokLiveConnection.on(TikTokEvent.like, async eventData => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.like, eventData);
    });

    tiktokLiveConnection.on(TikTokEvent.roomUser, async eventData => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.roomUser, eventData);
    });

    tiktokLiveConnection.on(TikTokEvent.member, async eventData => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.member, eventData);
    });

    tiktokLiveConnection.on(TikTokEvent.chat, async eventData => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.chat, eventData);
    });

    tiktokLiveConnection.on(TikTokEvent.subscribe, async eventData => {
      listenToTikTokEvent(redisConnection, tiktokUsername, TikTokEvent.subscribe, eventData);
    });

    tiktokLiveConnection.on(TikTokEvent.streamEnd, async () => {
      printLog(`Stream for ${tiktokUsername} ended.`);
      const lock_key = buildLockKey(tiktokUsername);
      await deleteKey(lock_key);

      return getCurrentTimeAsString();
    });
  } catch(error) {
    const lock_key = buildLockKey(tiktokUsername);
    await deleteKey(lock_key);
    printErrLog(`err: ${error} | deleted lock_key: ${lock_key}`)
  }
}

module.exports = {
  listenToTikTokLikeEvents, TikTokEvent
};
