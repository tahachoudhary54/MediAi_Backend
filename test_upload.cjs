const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  const form = new FormData();
  form.append('image', fs.createReadStream('server.js')); // Just sending a file to see if multer parses it

  try {
    const res = await axios.post('http://localhost:5001/api/ai/upload-symptom-image', form, {
      headers: form.getHeaders()
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Failed:", err.response?.status, err.response?.data || err.message);
  }
}
testUpload();
