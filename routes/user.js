const express = require('express');
const user_router = express.Router();
const User = require('../models/User');

const user = new User();

user_router.get('/session', function(req, res, next) {
  if (req.session.views) {
    req.session.views++
    res.setHeader('Content-Type', 'text/html')
    res.write('<p>views: ' + req.session.views + '</p>')
    res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
    res.end()
  } else {
    req.session.views = 1
    res.end('welcome to the session demo. refresh!')
  }
});

user_router.get('/login', function(req, res, next) {
  res.render('users/login')
});

user_router.get('/register', function(req, res, next) {
  res.render('users/register');
});

user_router.post('/login', async function(req, res, next) {
  const { username, password } = req.body;
  try {
    const isAuthenticated = await user.authenticateUser(username, password);
    if (isAuthenticated) {
      req.session.userId = username;
      res.redirect('/dashboard');
    } else {
      res.status(401).send('Invalid username or password');
    }
  } catch (error) {
    res.status(500).send('Error authenticating user: ' + error.message);
  }
});

user_router.post('/register', async function(req, res, next) {
  const { username, password } = req.body;
  try {
    await user.createUser(username, password);
    req.session.userId = username;
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).send('Error creating user: ' + error.message);
  }
});

module.exports = user_router;