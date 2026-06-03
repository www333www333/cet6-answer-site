const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.argv[2] || 8088);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
    const requested = urlPath === "/" ? "/index.html" : urlPath;
    const filePath = path.normalize(path.join(root, requested));

    if (!filePath.startsWith(root)) {
      send(res, 403, "Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        send(res, 404, "Not found");
        return;
      }
      send(res, 200, data, types[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    });
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`CET6 site running at http://0.0.0.0:${port}`);
  });
