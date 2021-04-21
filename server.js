// import dependencies
const http = require("http");
const fs = require("fs");
const path = require("path");
const io = require("socket.io");
const open = require("open");
const os = require("os");

// Create a simple web server for both pages (deck and table)
const server = http.createServer(function (request, response) {
  // Serve different pages for Phone (deck) and Desktop/Tablet (table)
  let filePath = "." + request.url;

  if (request.url === "/" || request.url.startsWith("/?")) {
    filePath =
      "./" + (request.url.startsWith("/?") ? "deck.html" : "table.html");
  }

  // Handle different file requests
  const extname = path.extname(filePath);
  let contentType = "text/html";

  switch (extname) {
    case ".js":
      contentType = "text/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".svg":
      contentType = "image/svg+xml";
      break;
  }

  fs.readFile(filePath, function (error, content) {
    if (error) {
      console.log(
        "Resource not found: " + filePath + " from request: " + request.url
      );
      response.writeHead(404);
      response.end();
    } else {
      response.writeHead(200, { "Content-Type": contentType });
      response.end(content, "utf-8");
    }
  });
});

// http server will listen on port 3000
server.listen(3000, () => console.log("Server listening on port 3000..."));

// create a WebSocket listener for the same server
const realtimeListener = io.listen(server);

// object to store table sockets
const tableSockets = {};

realtimeListener.on("connection", function (socket) {
  // receives a connect message from the card table
  socket.on("table-connect", function (tableId) {
    // ...  and stores the card table socket
    tableSockets[tableId] = socket;
    socket.tableId = tableId;
  });

  // receives a connect message from a phone
  socket.on("phone-connect", function (tableId) {
    const tableSocket = tableSockets[tableId];
    if (tableSocket) {
      // ... informs table that a phone has connected
      tableSocket.emit("phone-connect");
    }
  });

  // receives a move from a phone
  socket.on("phone-move", function (data) {
    const tableSocket = tableSockets[data.tableId];
    if (tableSocket) {
      // ... and forwards the current angle to the card table
      tableSocket.emit("phone-move", data.angle);
    }
  });

  // receives a throw card message from a phone
  socket.on("phone-throw-card", function (data) {
    const tableSocket = tableSockets[data.tableId];
    if (tableSocket) {
      // ... and forwards the data to the card table
      tableSocket.emit("phone-throw-card", data);
    }
  });

  // device disconnected
  socket.on("disconnect", function () {
    // if it's a table
    if (socket.tableId) {
      // remove table socket
      delete tableSockets[socket.tableId];
    }
  });
});

// Get all internal IP addresses and open locally with that IP

const interfaces = os.networkInterfaces();
const addresses = [];
for (let k in interfaces) {
  for (let k2 in interfaces[k]) {
    let address = interfaces[k][k2];
    if (address.family === "IPv4" && !address.internal) {
      addresses.push(address.address);
      console.log("Found internal IP address: " + address.address);
    }
  }
}

console.log("Opening: http://" + addresses.sort()[0] + ":3000");

// Open locally on default browser:

open("http://" + addresses.sort()[0] + ":3000");
