const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server)
//require('./chess-bot');

let pullOfGames = [];
let count = 0;


const jsonParser = express.json();
const urlencodedParser = express.urlencoded({extended: false});

app.use(express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
});

app.post('/playGame',urlencodedParser, (req, res) => {
    res.sendFile(__dirname + '/gamePage.html');
});

app.post('/board',jsonParser, (req, res) => {
    let player = req.body;
     let flag = true;

    if(pullOfGames.length !== 0){
      for(let i = 0; i < pullOfGames.length; i++){
          console.log(i)
          if(pullOfGames[i].firstPlayer !== null && pullOfGames[i].secondPlayer !== null){
              if (pullOfGames[i].firstPlayer.id === player.id ||
                  pullOfGames[i].secondPlayer.id === player.id) {
                  console.log('pull- ' + i)
                  flag = false;
                  res.json(i);
              }
          }
    }
    }

     if(flag) {
         if (count > 1) {
             count = 0;
         }
         if (count === 0) {
             pullOfGames[pullOfGames.length] = {
                 firstPlayer: player,
                 secondPlayer: null,
                 fen: null
             }
         } else {
             pullOfGames[pullOfGames.length - 1].secondPlayer = player;
         }
         count++;
         res.json(pullOfGames.length - 1);
     }})


io.on('connection', (socket) => {

    socket.on('move', (mv) => {
        let move = JSON.parse(mv);
        pullOfGames[parseInt(move.room)].fen = move.fen;
        io.to(move.room).emit('move', move.fen);
    });

    socket.on('room',(room) =>{
        let rm = JSON.parse(room);
        socket.join(rm.room);
        for (let i = 0; i < pullOfGames.length; i++){
            if(i === parseInt(rm.room)){
                if(pullOfGames[i].firstPlayer.id === rm.id){
                    pullOfGames[i].firstPlayer.socketId = socket.id;
                }
                else if(pullOfGames[i].secondPlayer.id === rm.id){
                    pullOfGames[i].secondPlayer.socketId = socket.id;
                }

                io.to(rm.room).emit('players',JSON.stringify(pullOfGames[i]));
            }
        }
    })
});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});
module.exports = app;


