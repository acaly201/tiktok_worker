const express = require('express')

const dash_board = express.Router();

const {
  getAllKeysAndValuesFromRedisHash,
  saveJobToRedisHash,
  deleteJobByJobName,
  updateSyncStatus
} = require('../helpers/dashboard_helpers');

dash_board.get('/', async (req, res) => {
  const jobList = await getAllKeysAndValuesFromRedisHash();

  res.render('dashboard', { jobList });
});

module.exports = dash_board;