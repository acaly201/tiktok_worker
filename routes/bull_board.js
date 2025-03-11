const express = require('express');
const { Worker, Queue, QueueEvents } = require('bullmq');

const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const reindex = new Queue('reindex'); // if you have a special connection to redis.
const crawQueue = new Queue('craw');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullAdapter(reindex), new BullAdapter(crawQueue), new BullMQAdapter(reindex)],
  serverAdapter: serverAdapter,
});

module.exports = serverAdapter;