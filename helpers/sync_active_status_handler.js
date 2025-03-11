const SyncLiveStatusHandler = require('./sync_live_status_handler');

class SyncActiveStatusHandler extends SyncLiveStatusHandler {
  buildSyncKey() {
    return `syncActiveStatus:${this.tiktok_uid}`;
  }
}

module.exports = SyncActiveStatusHandler;
