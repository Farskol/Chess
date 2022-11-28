const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('move', (mv) => {
        io.emit('move', mv);
    });
});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});