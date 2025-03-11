const { TikTokEvent } = require('./tiktok_helpers') 

function publishToChannel(connection, channel, message) {
  connection.publish(channel, JSON.stringify(message));
}

const MAIN_CHANNEL = 'notification';

module.exports = { publishToChannel, MAIN_CHANNEL };
