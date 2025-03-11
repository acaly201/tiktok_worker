class WebSocketManager {
  constructor(url) {
    this.socket = io(url);
    this.connectionProgress = $('#connection-progress');
    this.connectionStatusElement = document.getElementById('connection-label');
    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    this.connectionProgress.progress({
      percent: 0
    });

    this.socket.on('connect', () => {
      this.connectionProgress.progress({
        percent: 100
      });
      this.connectionStatusElement.textContent = 'WS Connected';
      this.connectionStatusElement.classList.add('teal');
    });

    this.socket.on('disconnect', () => {
      this.connectionProgress.progress({
        percent: 0
      });
      this.connectionStatusElement.textContent = 'WS Disconnected';
      this.connectionStatusElement.classList.remove('teal');
    });
  }

  onNotification(callback) {
    this.socket.on('notification', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

class ChatManager {
  constructor() {
    this.MAX_CHAT_MESSAGES = 50;
    this.MAX_ADMIN_MESSAGES = 50;
    this.chatMessageQueue = [];
    this.adminMessageQueue = [];
    this.chatMessages = document.getElementById('chat-messages');
    this.adminMessages = document.getElementById('admin-messages');
  }

  createAvatarLink(avatarSrc) {
    const avatarLink = document.createElement('a');
    avatarLink.classList.add('avatar');
    avatarLink.appendChild(this.createAvatarImage(avatarSrc));
    return avatarLink;
  }

  createAvatarImage(avatarSrc) {
    const avatarImage = document.createElement('img');
    avatarImage.src = avatarSrc;
    return avatarImage;
  }

  createAuthorLink(tiktokUID) {
    const authorLink = document.createElement('a');
    authorLink.classList.add('author');
    authorLink.href = `https://www.tiktok.com/@${tiktokUID}`;
    authorLink.target = '_blank';
    authorLink.textContent = `@${tiktokUID}`;
    return authorLink;
  }

  createReply(live_streamer_id) {
    const replyLink = document.createElement('a');
    replyLink.classList.add('reply');
    replyLink.textContent = `streamer - @${live_streamer_id}`;
    return replyLink;
  }

  createDateSpan(created_at) {
    const dateSpan = document.createElement('span');
    dateSpan.classList.add('date');
    dateSpan.textContent = created_at;
    return dateSpan;
  }

  createMetaData(created_at) {
    const metadataDiv = document.createElement('div');
    metadataDiv.classList.add('metadata');
    metadataDiv.appendChild(this.createDateSpan(created_at));
    return metadataDiv;
  }

  createTextDiv(text) {
    const textDiv = document.createElement('div');
    textDiv.classList.add('text');
    textDiv.textContent = text;
    return textDiv;
  }

  createAction(live_streamer_id) {
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('actions');
    actionsDiv.appendChild(this.createReply(live_streamer_id));
    return actionsDiv;
  }

  createContentDiv(tiktokUID, created_at, comment, live_streamer_id) {
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content');
    contentDiv.appendChild(this.createAuthorLink(tiktokUID));
    contentDiv.appendChild(this.createMetaData(created_at));
    contentDiv.appendChild(this.createTextDiv(comment));
    contentDiv.appendChild(this.createAction(live_streamer_id));
    return contentDiv;
  }

  createFullComment(avatar, tiktokUID, created_at, comment, live_streamer_id) {
    const commentDiv = document.createElement('div');
    commentDiv.classList.add('comment');
    commentDiv.appendChild(this.createAvatarLink(avatar));
    commentDiv.appendChild(this.createContentDiv(tiktokUID, created_at, comment, live_streamer_id));
    return commentDiv;
  }

  addChatMessage(commentDiv) {
    this.chatMessageQueue.push(commentDiv);
    if (this.chatMessageQueue.length > this.MAX_CHAT_MESSAGES) {
      this.chatMessageQueue.shift();
    }
    this.renderChatMessages();
  }

  addAdminMessage(commentDiv) {
    this.adminMessageQueue.push(commentDiv);
    if (this.adminMessageQueue.length > this.MAX_ADMIN_MESSAGES) {
      this.adminMessageQueue.shift();
    }
    this.renderAdminMessages();
  }

  renderChatMessages() {
    this.chatMessages.innerHTML = '';
    this.chatMessageQueue.forEach((commentDiv) => {
      this.chatMessages.appendChild(commentDiv);
    });
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  renderAdminMessages() {
    this.adminMessages.innerHTML = '';
    this.adminMessageQueue.forEach((commentDiv) => {
      this.adminMessages.appendChild(commentDiv);
    });
  }

  handleNotification(message) {
    const msg = JSON.parse(message);

    switch(msg.event_name) {
      case 'chat':
      case 'social':
        this.handleChatMessage(msg);
        break;
      case 'like':
      case 'member':
        this.handleLikeOrMemberMessage(msg);
        break;
      case 'gift':
        this.handleGiftMessage(msg);
        break;
      case 'roomUser':
        // Handle room user event if needed
        break;
      default:
        console.log(`Unhandled event_name: ${msg.event_name}`);
    }
  }

  handleChatMessage(msg) {
    const commentDiv = this.createFullComment(
      msg.profilePictureUrl,
      msg.uniqueId,
      msg.created_at,
      msg.comment || msg.label,
      msg.live_streamer_id
    );
    this.addChatMessage(commentDiv);
  }

  handleLikeOrMemberMessage(msg) {
    const commentDiv = this.createFullComment(
      msg.profilePictureUrl,
      msg.uniqueId,
      msg.created_at,
      'Liked',
      msg.live_streamer_id
    );
    this.addAdminMessage(commentDiv);
  }

  handleGiftMessage(msg) {
    const commentDiv = this.createFullComment(
      msg.giftPictureUrl,
      msg.uniqueId,
      msg.created_at,
      `${msg.describe} | diamondCount: ${msg.diamondCount}`,
      msg.live_streamer_id
    );
    this.addAdminMessage(commentDiv);
  }
}

window.WebSocketManager = WebSocketManager;
window.ChatManager = ChatManager;