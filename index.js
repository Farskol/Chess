const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server)
//require('./chess-bot');

var users = 0;
var players = [];
var fen;
// var players = [{
//     id:1,
//     first_name:'Nikita',
//     username:'Farskol',
//     number:0
// },{
//     id:2,
//     first_name:'Mikita',
//     username: 'Fresh',
//     number:1
// }
// ];

const jsonParser = express.json();

app.use(express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
});

app.post('/user',jsonParser, (req, res) => {
    let user = req.body;
    user.number = users;
    if (users < 2){
        if (users === 0){
            players[0] = user;
        }
        else {
            players[1] = user;
        }
        users++;
    }
});

app.post("/restart", jsonParser, (req,res)=>{
    users = 0;
    players = [];
})

io.on('connection', (socket) => {
    io.emit('players', JSON.stringify(players))
    io.emit('move', fen);

    socket.on('move', (mv) => {
        fen = mv
        io.emit('move', mv);
    });
});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});
module.exports = app;


