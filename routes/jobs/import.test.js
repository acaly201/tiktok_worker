const request = require('supertest');
const fs = require('fs');
const express = require('express');
const app = express();

const tiktok_import_router = require('./import')
app.use('/jobs/import', tiktok_import_router);

const jsonData = {
  key1: { value1: 'data1' },
  key2: { value2: 'data2' },
};

describe('TikTok Import Router', () => {
  let filePath;

  beforeEach(() => {
    filePath = 'uploads/test.json';
    fs.writeFileSync(filePath, JSON.stringify(jsonData));
  });

  it('should upload a JSON file and import its data to Redis', async () => {
    const response = await request(app)
      .post('/jobs/import')
      .attach('file', filePath);

    expect(response.status).toBe(200);
    expect(response.text).toBe('Import successful');
  });

  it('should handle requests to upload a JSON file without a file', async () => {
    // Gửi yêu cầu POST mà không có tệp được gửi đi
    const response = await request(app).post('/import');

    // Kiểm tra phản hồi
    expect(response.status).toBe(400);
    expect(response.text).toBe('No file uploaded');
  });

  // Xóa tệp tạm sau mỗi bài kiểm tra
  afterEach(() => {
    fs.unlinkSync(filePath);
  });
});
