/* const express = require('express')

var path = require('path');
var session = require('express-session');

const { printLog, printErrLog, getCurrentTimeAsString } = require('./helpers/utils');

const { MAIN_CHANNEL } = require('./helpers/realtime_notification_helpers');

const app = express()

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// middleware

app.use(express.urlencoded({ extended: false }))
app.use(express.json());

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'MS4wLjABAAAAnoB53Z9o3u62EnEfnZNXgAJyIn4twIgv24Je83CedpyxjOKU4QUSZ8eEAc98JgdJ'
}));

app.use(function(req, res, next){
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

app.use(express.static(__dirname + '/public'));


const requireLogin = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    console.log(`req.path: ${req.path}`);
    if (req.path !== '/login' && req.path !== '/notification.js') { // Add condition to skip redirection for notification.js
      res.redirect('/user/login');
    } else {
      next();
    }
  }
};

const tiktok_router = require('./routes/jobs/tiktok')
app.use('/jobs/tiktok', requireLogin, tiktok_router);

const adminQueueAdapter = require('./routes/bull_board')
app.use('/admin/queues', requireLogin, adminQueueAdapter.getRouter());

const dashboard_router = require('./routes/dashboard')
app.use('/dashboard', requireLogin, dashboard_router);

const user_router = require('./routes/user')
app.use('/user', requireLogin, user_router);

const import_router = require('./routes/jobs/import')
app.use('/jobs/import', requireLogin, import_router);

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*'
  }
});

const IORedis = require('ioredis');

const redisSubConnection = new IORedis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

io.on('connection', (socket) => {
  printLog('Client connected');
  redisSubConnection.subscribe(MAIN_CHANNEL, (err, count) => {
    if (err) {
      printErrLog("Failed to subscribe: %s", err.message);
    } else {
      printLog(`subscribed to ${MAIN_CHANNEL}`);
    }
  });

  redisSubConnection.on("message", (MAIN_CHANNEL, message) => {
    console.log(`Received ${JSON.stringify(message)} from channel_name: ${MAIN_CHANNEL}`);
    console.log("Message from channel " + MAIN_CHANNEL + ": " + message);

    socket.emit(MAIN_CHANNEL, message);
  });

  socket.on('disconnect', () => {
    printLog('Client disconnected');
  });
});

server.listen(3000, () => {
  printLog('Server is running on port http://localhost:3000');
  printLog('For the UI, open http://localhost:3000/admin/queues');
}); */

//Xoas login


/*const express = require('express');
const path = require('path');
const { printLog, printErrLog, getCurrentTimeAsString } = require('./helpers/utils');
const { MAIN_CHANNEL } = require('./helpers/realtime_notification_helpers');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Xóa middleware yêu cầu đăng nhập
const tiktok_router = require('./routes/jobs/tiktok');
app.use('/jobs/tiktok', tiktok_router);

const adminQueueAdapter = require('./routes/bull_board');
app.use('/admin/queues', adminQueueAdapter.getRouter());

const dashboard_router = require('./routes/dashboard');
app.use('/dashboard', dashboard_router);

const user_router = require('./routes/user');
app.use('/user', user_router);

const import_router = require('./routes/jobs/import');
app.use('/jobs/import', import_router);

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*'
  }
});

const IORedis = require('ioredis');
const redisSubConnection = new IORedis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

io.on('connection', (socket) => {
  printLog('Client connected');
  redisSubConnection.subscribe(MAIN_CHANNEL, (err, count) => {
    if (err) {
      printErrLog("Failed to subscribe: %s", err.message);
    } else {
      printLog(`subscribed to ${MAIN_CHANNEL}`);
    }
  });

  redisSubConnection.on("message", (MAIN_CHANNEL, message) => {
    console.log(`Received ${JSON.stringify(message)} from channel_name: ${MAIN_CHANNEL}`);
    socket.emit(MAIN_CHANNEL, message);
  });

  socket.on('disconnect', () => {
    printLog('Client disconnected');
  });
});

server.listen(3000, () => {
  printLog('Server is running on port http://localhost:3000');
  printLog('For the UI, open http://localhost:3000/admin/queues');
}); */

require("dotenv").config();

const express = require("express");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require("./connectionWrapper");
const { clientBlocked } = require("./limiter");
const { printLog, printErrLog, getCurrentTimeAsString } = require("./helpers/utils");
const { MAIN_CHANNEL } = require("./helpers/realtime_notification_helpers");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + "/public"));

// Routers
const tiktok_router = require("./routes/jobs/tiktok");
app.use("/jobs/tiktok", tiktok_router);

const adminQueueAdapter = require("./routes/bull_board");
app.use("/admin/queues", adminQueueAdapter.getRouter());

const dashboard_router = require("./routes/dashboard");
app.use("/dashboard", dashboard_router);

const user_router = require("./routes/user");
app.use("/user", user_router);

const import_router = require("./routes/jobs/import");
app.use("/jobs/import", import_router);

const IORedis = require("ioredis");
const redisSubConnection = new IORedis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

io.on("connection", (socket) => {
  printLog("Client connected");
  redisSubConnection.subscribe(MAIN_CHANNEL, (err, count) => {
    if (err) {
      printErrLog("Failed to subscribe: %s", err.message);
    } else {
      printLog(`Subscribed to ${MAIN_CHANNEL}`);
    }
  });

  redisSubConnection.on("message", (MAIN_CHANNEL, message) => {
    console.log(`Received ${JSON.stringify(message)} from channel_name: ${MAIN_CHANNEL}`);
    socket.emit(MAIN_CHANNEL, message);
  });

  let tiktokConnectionWrapper;

  socket.on("setUniqueId", (uniqueId, options) => {
    if (typeof options === "object" && options) {
      delete options.requestOptions;
      delete options.websocketOptions;
    } else {
      options = {};
    }

    if (process.env.SESSIONID) {
      options.sessionId = process.env.SESSIONID;
      console.info("Using SessionId");
    }

    if (process.env.ENABLE_RATE_LIMIT && clientBlocked(io, socket)) {
      socket.emit("tiktokDisconnected", "Rate limit exceeded.");
      return;
    }

    try {
      tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true);
      tiktokConnectionWrapper.connect();
    } catch (err) {
      socket.emit("tiktokDisconnected", err.toString());
      return;
    }

    tiktokConnectionWrapper.once("connected", (state) => socket.emit("tiktokConnected", state));
    tiktokConnectionWrapper.once("disconnected", (reason) => socket.emit("tiktokDisconnected", reason));
    tiktokConnectionWrapper.connection.on("streamEnd", () => socket.emit("streamEnd"));
    tiktokConnectionWrapper.connection.on("chat", (msg) => socket.emit("chat", msg));
    tiktokConnectionWrapper.connection.on("like", (msg) => socket.emit("like", msg));
    tiktokConnectionWrapper.connection.on("gift", (msg) => socket.emit("gift", msg));
  });

  socket.on("disconnect", () => {
    printLog("Client disconnected");
    if (tiktokConnectionWrapper) {
      tiktokConnectionWrapper.disconnect();
    }
  });
});

setInterval(() => {
  io.emit("statistic", { globalConnectionCount: getGlobalConnectionCount() });
}, 5000);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  printLog(`Server is running on http://localhost:${port}`);
  printLog("For the UI, open http://localhost:3000/admin/queues");
});



