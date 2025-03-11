const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const express = require('express');
const tiktok_import_router = express.Router();
const fs = require('fs');

tiktok_import_router.post('/', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send('No file uploaded');
    }

    const jsonData = JSON.parse(fs.readFileSync(file.path, 'utf-8'));

    // Lưu dữ liệu vào Redis
    Object.entries(jsonData).forEach(([key, value]) => {
      client.set(key, JSON.stringify(value));
    });

    // Xóa tệp đã tải lên sau khi lưu vào Redis
    fs.unlinkSync(file.path);

    res.status(200).send('Import successful');
  } catch (error) {
    console.error('Error importing JSON:', error);
    res.status(500).send('Error importing JSON');
  }
});

tiktok_import_router.get('/', function(req, res){
  res.render("jobs/import")
});

module.exports = tiktok_import_router