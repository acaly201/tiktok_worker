const IORedis = require('ioredis');
const {
  checkIfKeyExists,
  writeToRedis,
  deleteKey,
  buildLockKey,
  buildScheduledKey,
} = require('./redis_cache_helpers');

describe('Redis Cache Helpers', () => {
  let redisClient;

  beforeAll(() => {
    // Tạo một kết nối Redis đến Redis local
    redisClient = new IORedis({
      host: 'localhost',
      port: 6379,
    });
  });

  afterAll(async () => {
    // Đóng kết nối Redis sau khi hoàn thành các test
    await redisClient.quit();
  });

  beforeEach(async () => {
    // Xóa tất cả các keys trước mỗi test
    await redisClient.flushall();
  });

  test('checkIfKeyExists should return true if key exists', async () => {
    // Tạo một key trong Redis
    await redisClient.set('testKey', 'testValue');

    const keyExists = await checkIfKeyExists('testKey');

    expect(keyExists).toBe(true);
  });

  test('checkIfKeyExists should return false if key does not exist', async () => {
    const keyExists = await checkIfKeyExists('nonExistentKey');

    expect(keyExists).toBe(false);
  });

  test('writeToRedis should set key with value and expire time', async () => {
    const result = await writeToRedis('testKey', 'testValue', 3600);

    expect(result).toBe('OK');

    const value = await redisClient.get('testKey');
    const ttl = await redisClient.ttl('testKey');

    expect(value).toBe('testValue');
    expect(ttl).toBeGreaterThanOrEqual(3550); // TTL sẽ giảm đi sau một khoảng thời gian
  });

  test('deleteKey should delete key if it exists', async () => {
    // Tạo một key trong Redis
    await redisClient.set('testKey', 'testValue');

    await deleteKey('testKey');

    const keyExists = await redisClient.exists('testKey');
    expect(keyExists).toBe(0);
  });

  test('deleteKey should not delete key if it does not exist', async () => {
    const keyExistsBeforeDelete = await redisClient.exists('nonExistentKey');

    await deleteKey('nonExistentKey');

    const keyExistsAfterDelete = await redisClient.exists('nonExistentKey');
    expect(keyExistsBeforeDelete).toBe(0);
    expect(keyExistsAfterDelete).toBe(0);
  });

  test('buildLockKey should return a lock key based on tiktok_uid', () => {
    const lockKey = buildLockKey('test_uid');

    expect(lockKey).toBe('lockKey:addCrawJob:test_uid');
  });

  test('buildScheduledKey should return a scheduled key based on tiktok_uid', () => {
    const scheduledKey = buildScheduledKey('test_uid');

    expect(scheduledKey).toBe('scheduledKey:addCrawJob:test_uid');
  });
});
