const SyncLiveStatusHandler = require('./sync_live_status_handler');

class LastRunHandler extends SyncLiveStatusHandler {
  buildSyncKey(tiktok_uid) {
    return `lastRunKey:${tiktok_uid}`;
  }

  async getSyncStatus() {
    const result = await this.redis.get(this.buildSyncKey());
    if (result) {
      return result;
    } else {
      return null;
    }
  }
}

module.exports = LastRunHandler;
