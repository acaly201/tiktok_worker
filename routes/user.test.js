const request = require('supertest');
const express = require('express');
const session = require('express-session');
const userRouter = require('../routes/user');
const User = require('../models/User')
const user = new User();

const app = express();
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use(express.json());
app.use('/user', userRouter);

describe('User routes', () => {
  describe('GET /user/login', () => {
    it('should render login form', async () => {
      const response = await request(app).get('/user/login');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /user/register', () => {
    it('should render register form', async () => {
      const response = await request(app).get('/user/register');
      expect(response.status).toBe(200);
    });
  });

  describe('POST /user/login', () => {
    beforeAll(async () => {
      await user.createUser('validUsername', 'validPassword');
    });

    it('should login user with valid credentials', async () => {
      const validUser = {
        username: 'validUsername',
        password: 'validPassword',
      };

      const response = await request(app)
        .post('/user/login')
        .send(validUser);

      expect(response.status).toBe(302);

      expect(response.header.location).toBe('/dashboard');
    });

    it('should not login user with invalid credentials', async () => {
      const invalidUser = {
        username: 'invalidUsername',
        password: 'invalidPassword',
      };

      const response = await request(app)
        .post('/user/login')
        .send(invalidUser);

      expect(response.status).toBe(401);
    });
  });

describe('POST /user/register', () => {
  beforeAll(async () => {
    await user.createUser('existingUser', 'validPassword');
  });

  it('should register user with valid credentials', async () => {
    const newUser = {
      username: 'newUser',
      password: 'newPassword',
    };

    const response = await request(app)
      .post('/user/register')
      .send(newUser);

    expect(response.status).toBe(302);
  });

  it('should not register user with existing username', async () => {
    const existingUser = {
      username: 'existingUser',
      password: 'existingPassword',
    };

    const response = await request(app)
      .post('/user/register')
      .send(existingUser);

    expect(response.status).toBe(500);
  });
});

});
