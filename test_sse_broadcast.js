import http from 'http';

// Start local server in background or assume it's available.
// We can start a child process of the server.
import { spawn } from 'child_process';

const server = spawn('node', ['src/server.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: 8081 }
});

server.stdout.on('data', (data) => {
  console.log('Server:', data.toString().trim());
});

// Wait for server to boot
setTimeout(() => {
  console.log('Connecting to stream...');
  const req = http.request({
    host: 'localhost',
    port: 8081,
    path: '/lego/v1/stream',
    method: 'GET'
  }, (res) => {
    res.on('data', (chunk) => {
      console.log('Received Event:', chunk.toString());
      
      // Once connected, send PATCH
      if (chunk.toString().includes('\"modelId\":\"car\"')) {
        console.log('Initial state received. Sending PATCH...');
        sendPatch();
      }
    });
  });
  req.end();
}, 2000);

function sendPatch() {
  const data = JSON.stringify({ buildingStep: 2 });
  const req = http.request({
    host: 'localhost',
    port: 8081,
    path: '/lego/v1/models/car/display',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }, (res) => {
    console.log('PATCH response status:', res.statusCode);
    res.on('data', (chunk) => {
       console.log('PATCH Response:', chunk.toString());
    });
  });
  req.write(data);
  req.end();
  
  // Wait and then shutdown
  setTimeout(() => {
    console.log('Test complete. Killing server.');
    server.kill();
    process.exit(0);
  }, 3000);
}
