import fs from 'fs';
import FormData from 'form-data';

async function test() {
  const form = new FormData();
  form.append('fullName', 'Test Doctor 55');
  form.append('email', 'testdoc55@gmail.com');
  form.append('password', 'password');
  form.append('specialization', 'Cardiology');
  form.append('licenseNumber', '12345');
  form.append('yearsOfExperience', '5');
  form.append('hospitalName', 'Hospital');
  form.append('clinicAddress', 'Address');
  form.append('phone', '1234567890');
  form.append('degreeCertificate', fs.createReadStream('package.json'));
  form.append('governmentId', fs.createReadStream('package.json'));

  try {
    const res = await fetch('http://localhost:5000/api/auth/doctor/register', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

test();
