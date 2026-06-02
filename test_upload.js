import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

async function testUpload() {
  const form = new FormData();
  form.append('fullName', 'Test Doc');
  form.append('email', 'testdoc4@gmail.com');
  form.append('password', 'password');
  form.append('specialization', 'Cardio');
  form.append('licenseNumber', '123');
  form.append('yearsOfExperience', '5');
  form.append('hospitalName', 'Hos');
  form.append('clinicAddress', 'Addr');
  form.append('phone', '123');
  
  form.append('degreeCertificate', fs.createReadStream('package.json'));
  form.append('governmentId', fs.createReadStream('package.json'));

  try {
    const res = await axios.post('http://localhost:5000/api/auth/doctor/register', form, {
      headers: form.getHeaders()
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}
testUpload();
