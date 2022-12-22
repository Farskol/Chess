const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const chess_db = require('./chess-db');
//require('./chess-bot');

let pullOfGames = [];
let count = {count:0, room:null};


const jsonParser = express.json();
const urlencodedParser = express.urlencoded({extended: false});

app.use(express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
});

app.post('/playGame',urlencodedParser, (req, res) => {
    res.sendFile(__dirname + '/gamePage.html');
});

app.post("/searchInDb",jsonParser, async (req, res) =>{
    await chess_db.add_player_in_db(req.body)
})

app.post('/board',jsonParser, (req, res) => {
    let player = req.body;
     let flag = true;

    log("board 36")
    if(pullOfGames.length !== 0){
      for(let i = 0; i < pullOfGames.length; i++){
          log("board 39")
          if(pullOfGames[i].firstPlayer !== null){
              console.log("first != null")
              log("board 42")
              if (pullOfGames[i].firstPlayer.id === player.id){
                  flag = false;
                  res.json(i);
              }
          }
          if(pullOfGames[i].secondPlayer !== null){
              console.log("second != null")
              if(pullOfGames[i].secondPlayer.id === player.id){
                  flag = false;
                  res.json(i);
              }
          }
    }
    }

     if(flag) {
         if (count.count > 1) {
             count.count = 0;
             count.room = null;
             log("board 62")
         }

         if (count.room === null) {
             count.room = pullOfGames.length;
             for (let i = 0; i < pullOfGames.length; i++) {
                 if (pullOfGames[i] === null) {
                     count.room = i;
                 }
             }
             log("board 72")
         }

         if (count.count === 0) {
             pullOfGames[count.room] = {
                 firstPlayer: player,
                 secondPlayer: null,
                 fen: null
             }
             log("board 81")
         } else {
             pullOfGames[count.room].secondPlayer = player;
         }

         log("board 86")
         count.count++;
         res.json(count.room);
     }
})


io.on('connection', (socket) => {

    socket.on("disconnect", (reason) =>{
        for (let i=0; i < pullOfGames.length; i++){
            if (pullOfGames[i].firstPlayer.socketId === socket.id){
                if (pullOfGames[i].secondPlayer !== null) {
                    if (pullOfGames[i].secondPlayer.socketId === null) {
                        io.of("/").adapter.rooms.delete(i.toString());
                        pullOfGames[i] = null;
                        break;
                    } else {
                        pullOfGames[i].firstPlayer.socketId = null;
                        break;
                    }
                }
            }
            else if (pullOfGames[i].firstPlayer.socketId === null){
                if(pullOfGames[i].secondPlayer.socketId === null || pullOfGames[i].secondPlayer.socketId === socket.id){
                    io.of("/").adapter.rooms.delete(i.toString());
                    pullOfGames[i] = null;
                    break;
                }
            }
            else if (pullOfGames[i].secondPlayer !== null) {
                if(pullOfGames[i].secondPlayer.socketId === socket.id){
                    pullOfGames[i].secondPlayer = null;
                    break;
                }
            }
        }
    })

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
                    log("socket 141")
                }
                io.to(rm.room).emit('players',JSON.stringify(pullOfGames[i]));
                break;
            }
        }
    })
});

function log(where){
    for (let i = 0; i < pullOfGames.length; i++){
        let pull = "null, ";
        if (pullOfGames[i].firstPlayer !== null){
            pull += pullOfGames[i].firstPlayer.username + ", ";
        }
        if (pullOfGames[i].secondPlayer !== null){
            pull += pullOfGames[i].secondPlayer.username + ", ";
        }
        console.log(where + "<- " + pull)
    }
}

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});
module.exports = app;


