const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testUpload() {
  const filePath = path.join(__dirname, 'PEDIDOS', 'pedido_19729.pdf');
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  try {
    console.log('--- TESTE MANUAL DE UPLOAD ---');
    console.log(`Enviando arquivo: ${filePath}`);
    
    const response = await axios.post('http://localhost:3333/ai/extract-products', form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    console.log('Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Erro no teste:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testUpload();
