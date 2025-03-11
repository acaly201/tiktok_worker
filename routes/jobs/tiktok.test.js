const request = require('supertest');
const express = require('express');
const app = express();
const Redis = require('ioredis');
const redisCon = new Redis()

const tiktok_router = require('./tiktok')
app.use('/jobs/tiktok', tiktok_router);

const SyncLiveStatusHandler = require('../../helpers/sync_live_status_handler');
const SyncActiveStatusHandler = require('../../helpers/sync_active_status_handler');

describe('DELETE /jobs/tiktok/:tiktok_uid', () => {
  let redisClient;

  beforeAll(() => {
    redisClient = new Redis({
      host: 'localhost',
      port: 6379,
    });
  });

  it('should delete a job with a valid tiktok_uid', async () => {
    const tiktok_uid = 'example_username';

    const liveStatusHandle = new SyncLiveStatusHandler(tiktok_uid)
    await liveStatusHandle.createSyncStatus()

    const activeStatusHandle = new SyncActiveStatusHandler(tiktok_uid)
    await activeStatusHandle.createSyncStatus()

    const response = await request(app).delete(`/jobs/tiktok/${tiktok_uid}`);

    expect(response.status).toBe(200);

    expect(await liveStatusHandle.checkIfKeyExists()).be(false)
    expect(await activeStatusHandle.checkIfKeyExists()).be(false)
  });

  it('should return an error if tiktok_uid is missing', async () => {
    const response = await request(app).delete('/jobs/tiktok');

    expect(response.status).toBe(404);
  });

  it('should return an error if job cannot be deleted', async () => {
    const tiktok_uid = 'non_existent_username';

    const response = await request(app).delete(`/jobs/tiktok/${tiktok_uid}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('can not delele job');
  });

  // Sử dụng afterEach để khôi phục trạng thái sau mỗi test
  afterEach(async () => {
    await redisClient.flushall();
  });
});
