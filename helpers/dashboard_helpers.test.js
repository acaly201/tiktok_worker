const {
  saveJobToRedisHash,
  deleteJobByJobName,
  getJobInfoFromRedisHash,
  getAllKeysAndValuesFromRedisHash,
  createSyncStatus,
  getSyncStatus
} = require('./dashboard_helpers');
const { buildLockKey,buildSyncedToLiveKey } = require('./redis_cache_helpers');
const Redis = require('ioredis');

const SyncLiveStatusHandler = require('./sync_live_status_handler');

const {
  SYNC_STATUS_TURN_ON,
  SYNC_STATUS_TURN_OFF
} = require('./constants.js')

const DASH_BOARD_MAIN_KEY = 'jobHash';

describe('Dashboard Helpers', () => {
  let redis;

  beforeAll(() => {
    // Kết nối đến Redis trước khi chạy bài kiểm tra
    redis = new Redis({
      host: 'localhost',
      port: 6379,
    });
  });

  afterAll(async () => {
    // Đóng kết nối Redis sau khi chạy bài kiểm tra
    await redis.quit();
  });

  beforeEach(async () => {
    // Xóa toàn bộ dữ liệu trước và sau mỗi bài kiểm tra
    await redis.flushdb();
  });

  test('saveJobToRedisHash should save a job to Redis Hash', async () => {
    const jobName = 'testJob';
    const createdAt = '2022-02-02 12:00:00';

    await saveJobToRedisHash(jobName, createdAt);

    const result = await redis.hget(DASH_BOARD_MAIN_KEY, jobName);
    expect(result).toBe(createdAt);
  });

  test('createSyncStatus should save SYNC_STATUS_TURN_ON', async () => {
    const jobName = 'testJob';
    const liveHandler = new SyncLiveStatusHandler();
    await liveHandler.createSyncStatus();

    const result = await liveHandler.checkIfKeyExists();
    expect(result).toBe(true);
  });

  test('getSyncStatus of user', async () => {
    let jobName = 'testJob';
    let result = await getSyncStatus(jobName);
    expect(result).toBe(true);

    jobName = 'not_found_testJob';
    result = await getSyncStatus(jobName);
    expect(result).toBe(true);
  });
});
