const http = require('http');

const payload = {
  initialData: {
    companyName: "Test Corp",
    monthlyRevenue: 50000,
    retainedEarnings: 100000,
    desiredFundingAmount: 50000,
    purpose: ["Business Growth", "Developing New Products"],
    contactName: "Test",
    contactEmail: "test@test.com",
    contactPhone: "123456"
  }
};

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/v2/assessment/start',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      if (json.sessionId) {
        http.request({
          hostname: 'localhost',
          port: 3001,
          path: `/api/v2/assessment/${json.sessionId}/evaluate`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, (res2) => {
          let data2 = '';
          res2.on('data', chunk => data2 += chunk);
          res2.on('end', () => console.log('Evaluate Response:', JSON.stringify(JSON.parse(data2), null, 2)));
        }).end();
      }
    } catch (e) {}
  });
});

req.write(JSON.stringify({ userId: 'test_user', initialData: payload.initialData }));
req.end();
