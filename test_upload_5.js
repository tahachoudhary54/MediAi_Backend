import fs from 'fs';
import FormData from 'form-data';
import http from 'http';

const form = new FormData();
form.append('fullName', 'Brand New Doc');
form.append('email', 'brandnewdoc@gmail.com');
form.append('password', 'password');
form.append('specialization', 'Cardio');
form.append('licenseNumber', '123');
form.append('yearsOfExperience', '5');
form.append('hospitalName', 'Hos');
form.append('clinicAddress', 'Addr');
form.append('phone', '123');
form.append('degreeCertificate', fs.createReadStream('package.json'));

const request = http.request({
  method: 'POST',
  host: 'localhost',
  port: 5001,
  path: '/api/auth/doctor/register',
  headers: form.getHeaders()
});

form.pipe(request);

request.on('response', function(res) {
  let str = '';
  res.on('data', function(chunk) { str += chunk; });
  res.on('end', function() { console.log('Response:', str); });
});
