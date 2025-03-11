const express = require('express');
const tiktok_router = express.Router();

const { Worker, Queue, QueueEvents } = require('bullmq');

const { addCrawJob, addCrawJobCron } = require('../../helpers/job_helpers');
const { printLog, printErrLog, getCurrentTimeAsString } = require('../../helpers/utils');

const reindex = new Queue('reindex'); // if you have a special connection to redis.
const crawQueue = new Queue('craw');

const SyncLiveStatusHandler = require('../../helpers/sync_live_status_handler');
const SyncActiveStatusHandler = require('../../helpers/sync_active_status_handler');

const {
  SYNC_STATUS_TURN_ON,
  SYNC_STATUS_TURN_OFF,
  DEFAULT_SYNC_STATUS
} = require('../../helpers/constants.js')

const {
  getAllKeysAndValuesFromRedisHash,
  saveJobToRedisHash,
  deleteJobByJobName,
  updateSyncStatus
} = require('../../helpers/dashboard_helpers');


tiktok_router.get('/live', function(req, res){
  res.render("jobs/tiktok/live")
});

tiktok_router.post('/:tiktok_uid', async (req, res) => {
  const tiktok_uid = req.params.tiktok_uid;
  if (tiktok_uid) {
    printLog(`Username: ${tiktok_uid}`);
    await addCrawJobCron(tiktok_uid);
  } else {
    printLog(`tiktok_uid is undefined`);
  }
  res.redirect('/');
});

tiktok_router.post('', async (req, res) => {
  const errorMessage = null;
  const tiktok_uid = req.body.tiktok_uid;

  if (tiktok_uid) {
    printLog(`Username: ${tiktok_uid}`);
    await saveJobToRedisHash(tiktok_uid, getCurrentTimeAsString());
    await addCrawJobCron(tiktok_uid);
  } else {
    errorMessage = `tiktok_uid is missing`;
    printLog(errorMessage);
  }

  res.redirect(`/dashboard?error=${errorMessage}`);
});

tiktok_router.delete('/:tiktok_uid', async (req, res) => {
  const tiktok_uid = req.params.tiktok_uid;

  if (tiktok_uid) {
    printLog(`Username: ${tiktok_uid}`);
    const result = await deleteJobByJobName(tiktok_uid);

    if (result) {
      res.status(200).send();
    } else {
      res.status(500).send({ error: "can not delele job" });
    }
  } else {
    errorMessage = `tiktok_uid is missing`;
    printLog(errorMessage);

    res.status(500).send({ error: errorMessage });
  }
});

tiktok_router.post('/sync_live_status/:tiktok_uid', async (req, res) => {
  let errorMessage = null;
  const tiktok_uid = req.params.tiktok_uid;
  const status = req.body.is_sync_live

  if (tiktok_uid && status) {
    printLog(`tiktok_uid: ${tiktok_uid} | status: ${status}`);

    const handler = new SyncLiveStatusHandler(tiktok_uid)

    await handler.updateStatus(status)

    res.status(200).send();
  } else {
    errorMessage = `tiktok_uid is missing or status missing | status: ${status}`;
    printLog(errorMessage);
    res.status(500).send({ error: errorMessage });
  }
});

tiktok_router.post('/sync_status/:tiktok_uid', async (req, res) => {
  let errorMessage = null;
  const tiktok_uid = req.params.tiktok_uid;
  const status = req.body.status

  if (tiktok_uid && status) {
    printLog(`tiktok_uid: ${tiktok_uid} | status: ${status}`);

    const handler = new SyncActiveStatusHandler(tiktok_uid)

    await handler.updateStatus(status)

    res.status(200).send();
  } else {
    errorMessage = `tiktok_uid is missing or status missing | status: ${status}`;
    printLog(errorMessage);
    res.status(500).send({ error: errorMessage });
  }
});

module.exports = tiktok_router
