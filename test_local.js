import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/uploads/degreeCertificate-1780360426597-436717165.pdf',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
  process.exit(0);
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
  process.exit(1);
});

req.end();
