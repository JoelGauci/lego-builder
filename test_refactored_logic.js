import http from 'http';
import { spawn } from 'child_process';

const server = spawn('node', ['src/server.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: 8082 }
});

server.stdout.on('data', (data) => {
  console.log('Server Log:', data.toString().trim());
});

setTimeout(() => {
  console.log('>>> Phase 1: Testing POST Activation with buildingStep override...');
  const data = JSON.stringify({ buildingStep: 3 });
  const req = http.request({
    host: 'localhost',
    port: 8082,
    path: '/lego/v1/models/car/display',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }, (res) => {
    console.log('POST status:', res.statusCode);
    let resBody = '';
    res.on('data', (chunk) => { resBody += chunk; });
    res.on('end', () => {
       const parsed = JSON.parse(resBody);
       console.log('POST Response Saved State:', parsed.state);
       if (parsed.state.buildingStep === 3) {
          console.log('[PASS] POST buildingStep override successfully registered!');
       } else {
          console.error('[FAIL] POST buildingStep was overridden:', parsed.state.buildingStep);
       }
       verifySSE();
    });
  });
  req.write(data);
  req.end();
}, 2000);

function verifySSE() {
  console.log('>>> Phase 2: Connecting to EventSource...');
  const req = http.request({
    host: 'localhost',
    port: 8082,
    path: '/lego/v1/stream',
    method: 'GET'
  }, (res) => {
    console.log('SSE Response headers received. Status code:', res.statusCode);
    res.on('data', (chunk) => {
      const output = chunk.toString();
      console.log('SSE Incoming Payload:', output);
      if (output.includes('\"buildingStep\":3')) {
          console.log('[PASS] Initial connection delivered overridden step via SSE stream.');
          server.kill();
          process.exit(0);
      }
    });
  });
  req.end();
  
  setTimeout(() => {
     console.error('[TIMEOUT] Did not receive expected broadcast.');
     server.kill();
     process.exit(1);
  }, 4000);
}
