const express = require("express");
const http = require("http");
const app = express();
app.use(express.json());
app.post("/test", (req, res) => {
  console.log("Received body:", JSON.stringify(req.body));
  res.end();
});
const server = app.listen(0, () => {
  const port = server.address().port;
  const req = http.request({
    hostname: "localhost",
    port: port,
    path: "/test",
    method: "POST",
    // NO CONTENT-TYPE, or WRONG ONE
    headers: { "Content-Type": "text/plain" }
  }, (res) => {
    process.exit(0);
  });
  req.end(JSON.stringify({ buildingStep: 42 }));
});
