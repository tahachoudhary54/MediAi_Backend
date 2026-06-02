import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const form = new FormData();
form.append('fullName', 'Test Doctor Final');
form.append('email', 'testdoc5@gmail.com');
form.append('password', 'password');
form.append('specialization', 'Cardiology');
form.append('licenseNumber', '12345');
form.append('yearsOfExperience', '5');
form.append('hospitalName', 'Hospital');
form.append('clinicAddress', 'Address');
form.append('phone', '1234567890');
form.append('degreeCertificate', fs.createReadStream('package.json'));
form.append('governmentId', fs.createReadStream('package.json'));
form.append('medicalLicenseProof', fs.createReadStream('package.json'));

axios.post('http://localhost:5000/api/auth/doctor/register', form, {
  headers: form.getHeaders()
}).then(res => {
  console.log('Success:', res.data);
}).catch(err => {
  console.error('Error:', err.response?.data || err.message);
});
