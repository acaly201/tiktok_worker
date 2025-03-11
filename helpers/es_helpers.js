const { Client: Client8 } = require('es8')

const elasticClient = new Client8({
  node: 'http://192.168.1.5:9200',
  auth: {
    apiKey: "eENmTVZZMEJPaS1SUE96cWxHRTU6ZkJ2YU5GbXdSOS1CRkRkVWJqcXJDQQ=="
  },
  deadTimeout: 100000,
  maxRetries: 3
})

const {
  TIKTOK_INDEX_NAME,
} = require('./constants.js')

async function pushDataToElasticsearch(msg) {
  try {
    await elasticClient.index({
      index: TIKTOK_INDEX_NAME,
      body: msg,
    });
    console.log(`Data pushed to Elasticsearch: tid: ${msg.live_streamer_id} | ${msg.event_name}`);
  } catch (error) {
    console.error('Error pushing data to Elasticsearch:', error);
  }
}

async function countDocumentsByTikTokUidAndIndex(tiktok_uid) {
  try {
    const result = await elasticClient.search({
      index: TIKTOK_INDEX_NAME,
      query: {
        term: {
          live_streamer_id: tiktok_uid
        }
      },
      track_total_hits: true,
      size: 0
    });

    return result.hits.total.value;
  } catch (error) {
    console.error('Error counting documents:', error);
    throw error;
  }
}

module.exports = {
  pushDataToElasticsearch,
  countDocumentsByTikTokUidAndIndex
};
