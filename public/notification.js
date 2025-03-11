const socket = io(`ws://localhost:3000`);
const connectionProgress = $('#connection-progress');
const connectionStatusElement = document.getElementById('connection-label');

connectionProgress.progress({
  percent: 0
});

const MAX_CHAT_MESSAGES = 50;
const MAX_ADMIN_MESSAGES = 50;

function createAvatarLink(avatarSrc) {
  const avatarLink = document.createElement('a');
  avatarLink.classList.add('avatar');
  avatarLink.appendChild(createAvatarImage(avatarSrc));

  return avatarLink
}

function createAvatarImage(avatarSrc) {
  const avatarImage = document.createElement('img');
  avatarImage.src = avatarSrc;
  return avatarImage;
}

function createAuthorLink(tiktokUID) {
  const authorLink = document.createElement('a');
  authorLink.classList.add('author');
  authorLink.href = `https://www.tiktok.com/@${tiktokUID}`;
  authorLink.target = '_blank';
  authorLink.textContent = `@${tiktokUID}`;

  return authorLink;
}

function createReply(live_streamer_id){
  const replyLink = document.createElement('a');
  replyLink.classList.add('reply');
  replyLink.textContent = `streamer - @${live_streamer_id}`;

  return replyLink
}

function createDateSpan(created_at){
  const dateSpan = document.createElement('span');
  dateSpan.classList.add('date');
  dateSpan.textContent = created_at;

  return dateSpan;
}

function createMetaData(created_at){
  const metadataDiv = document.createElement('div');
  metadataDiv.classList.add('metadata');

  const dateSpan = createDateSpan(created_at);
  metadataDiv.appendChild(dateSpan);

  return metadataDiv
}

function createTextDiv(text){
  const textDiv = document.createElement('div');
  textDiv.classList.add('text');
  textDiv.textContent = text;

  return textDiv;
}

function createAction(live_streamer_id){
  const actionsDiv = document.createElement('div');
  actionsDiv.classList.add('actions');

  actionsDiv.appendChild(createReply(live_streamer_id));

  return actionsDiv;
}

function createContentDiv(tiktokUID, created_at, comment, live_streamer_id){
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('content');

  contentDiv.appendChild(createAuthorLink(tiktokUID));
  contentDiv.appendChild(createMetaData(created_at));
  contentDiv.appendChild(createTextDiv(comment));
  contentDiv.appendChild(createAction(live_streamer_id));

  return contentDiv;
}

function createFullComment(avatar, tiktokUID, created_at, comment, live_streamer_id){
  const commentDiv = document.createElement('div');
  commentDiv.classList.add('comment');

  commentDiv.appendChild(createAvatarLink(avatar));
  commentDiv.appendChild(createContentDiv(tiktokUID, created_at, comment, live_streamer_id));

  return commentDiv;
}

const chatMessageQueue = [];

const adminMessageQueue = [];

socket.on('notification', (message) => {
  const msg = JSON.parse(message);
  const chatMessages = document.getElementById('chat-messages');
  const adminMessages = document.getElementById('admin-messages');

  if (msg.event_name === 'chat' || msg.event_name === 'social') {
    let tiktokUID = msg.uniqueId;
    let live_streamer_id = msg.live_streamer_id;
    let comment = msg.comment || msg.label;
    let avatar = msg.profilePictureUrl;
    let created_at = msg.created_at;

    const commentDiv = createFullComment(avatar, tiktokUID, created_at, comment, live_streamer_id);

    chatMessageQueue.push(commentDiv);
    if (chatMessageQueue.length > MAX_CHAT_MESSAGES) {
      chatMessageQueue.shift();
    }

    chatMessages.innerHTML = '';
    chatMessageQueue.forEach((commentDiv) => {
      chatMessages.appendChild(commentDiv);
    });
  } else if (msg.event_name == 'roomUser') {
    const viewers = msg.topViewers;
  } else if (msg.event_name == 'like' || msg.event_name == 'member') {
    let tiktokUID = msg.uniqueId;
    let live_streamer_id = msg.live_streamer_id;
    let comment = 'Liked';
    let avatar = msg.profilePictureUrl;
    let created_at = msg.created_at;

    const commentDiv = createFullComment(avatar, tiktokUID, created_at, comment, live_streamer_id);

    adminMessageQueue.push(commentDiv);

    if (adminMessageQueue.length > MAX_ADMIN_MESSAGES) {
      adminMessageQueue.shift();
    }

    adminMessages.innerHTML = '';
    adminMessageQueue.forEach((commentDiv) => {
      adminMessages.appendChild(commentDiv);
    });
  } else if(msg.event_name == 'gift') {
    let tiktokUID = msg.uniqueId;
    let live_streamer_id = msg.live_streamer_id;
    let comment = `${msg.describe} | diamondCount: ${msg.diamondCount}`;
    let avatar = msg.giftPictureUrl;
    let created_at = msg.created_at;

    const commentDiv = createFullComment(avatar, tiktokUID, created_at, comment, live_streamer_id);

    adminMessageQueue.push(commentDiv);

    if (adminMessageQueue.length > MAX_ADMIN_MESSAGES) {
      adminMessageQueue.shift();
    }

    adminMessages.innerHTML = '';
    adminMessageQueue.forEach((commentDiv) => {
      adminMessages.appendChild(commentDiv);
    });
  } else {
    console.log(`event_name: ${msg.event_name}`)
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('connect', () => {
  connectionProgress.progress({
    percent: 100
  });
  connectionStatusElement.textContent = 'WS Connected';
  connectionStatusElement.classList.add('teal');
});

socket.on('disconnect', () => {
  connectionProgress.progress({
    percent: 0
  });
  connectionStatusElement.textContent = 'WS Disconnected';
  connectionStatusElement.classList.remove('teal');
});
