const express = require("express");
const http = require("http");
const app = express();
app.use(express.json());
app.post("/test", (req, res) => {
  console.log("Req.body type:", typeof req.body);
  console.log("Req.body value:", req.body);
  res.end();
});
const server = app.listen(0, () => {
  const port = server.address().port;
  const req = http.request({
    hostname: "localhost",
    port: port,
    path: "/test",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, (res) => {
    process.exit(0);
  });
  req.end(); // No payload body
});
