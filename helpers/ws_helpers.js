const WebSocket = require('ws');

// Tạo kết nối WebSocket từ worker đến máy chủ WebSocket
function createWebSocketConnection() {
  const ws = new WebSocket('ws://localhost:3000');

  ws.on('open', () => {
    console.log('Worker connected to WebSocket server');
  });

  return ws;
}

function sendEventToServer(ws, event) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(event));
  } else {
    console.error('WebSocket connection is not open.');
  }
}

module.exports = { createWebSocketConnection, sendEventToServer };
