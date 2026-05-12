try {
    require('../node_modules/@vladmandic/face-api/dist/face-api.node-wasm.js');
    console.log('OK');
} catch (e) {
    const fs = require('fs');
    fs.writeFileSync('err_full.txt', 'MESSAGE:\n' + e.message + '\n\nSTACK:\n' + e.stack, 'utf8');
    console.log('Error written to err_full.txt');
}
