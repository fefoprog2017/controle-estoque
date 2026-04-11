const http = require('http');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  const filePath = path.join(__dirname, 'PEDIDOS', 'pedido_19729.pdf');
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  const fileContent = fs.readFileSync(filePath);
  const filename = 'pedido_19729.pdf';

  let body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
    Buffer.from('Content-Type: application/pdf\r\n\r\n'),
    fileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const options = {
    hostname: 'localhost',
    port: 3333,
    path: '/ai/extract-products',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => { responseData += chunk; });
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log('Resposta:');
      try {
        console.log(JSON.stringify(JSON.parse(responseData), null, 2));
      } catch (e) {
        console.log(responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Erro: ${e.message}`);
  });

  req.write(body);
  req.end();
}

testUpload();
