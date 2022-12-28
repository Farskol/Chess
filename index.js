const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const chess_db = require('./chess-db');
const chess_bot = require('./chess-bot');

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

app.post('/tableHighScore',urlencodedParser, (req, res) => {
    res.sendFile(__dirname + '/pages/high-score-table.html');
});

app.post("/highScore",jsonParser, async (req, res) => {
    let users = await chess_db.take_players(10);
    res.json(users);
})

app.post("/searchInDb",jsonParser, async (req, res) =>{
    await chess_db.add_player_in_db(req.body)
})

app.post('/board',jsonParser, (req, res) => {
    let player = req.body;
     let flag = true;

    if(pullOfGames.length !== 0){
      for(let i = 0; i < pullOfGames.length; i++){
          if(pullOfGames[i] !== null) {
              if (pullOfGames[i].firstPlayer !== null) {
                  if (pullOfGames[i].firstPlayer.id === player.id) {
                      flag = false;
                      res.json(i);
                  }
              }
              if (pullOfGames[i].secondPlayer !== null) {
                  if (pullOfGames[i].secondPlayer.id === player.id) {
                      flag = false;
                      res.json(i);
                  }
              }
          }
    }
    }

     if(flag) {
         if (count.count > 1) {
             count.count = 0;
             count.room = null;
         }

         if (count.room === null) {
             count.room = pullOfGames.length;
             for (let i = 0; i < pullOfGames.length; i++) {
                 if (pullOfGames[i] === null) {
                     count.room = i;
                 }
             }
         }

         if (count.count === 0) {
             pullOfGames[count.room] = {
                 firstPlayer: player,
                 secondPlayer: null,
                 fen: null
             }
         } else {
             pullOfGames[count.room].secondPlayer = player;
         }

         count.count++;
         res.json(count.room);
     }
})


io.on('connection', (socket) => {

    app.post('/photo',jsonParser, async (req, res) => {
        console.log(req.body.id);
        let photo = await chess_bot.take_photo_by_id(req.body.id);
        console.log(photo)
        res.json(photo);
    });

    socket.on("loadPhoto", async (photo) =>{
        let p = JSON.parse(photo);
        console.log(p.id)
        let ph = await chess_bot.take_photo_by_id(p.id);
        console.log(ph);
        let photoAndId = {id:p.id, photo:ph}
        io.to(JSON.parse(photo).room).emit("photo", JSON.stringify(photoAndId));
    })

    socket.on("gameEnd", async(players) => {
        await chess_db.add_game_statistic(JSON.parse(players));
    })

    socket.on("disconnect", (reason) =>{

        for(let i = 0; i < pullOfGames.length; i++){
            if (pullOfGames[i].firstPlayer.socketId === socket.id){
                console.log(pullOfGames[i].firstPlayer.first_name + " disconnected by ->" + reason.toString())
            }

            if (pullOfGames[i].secondPlayer !== null){
                if (pullOfGames[i].secondPlayer.socketId === socket.id) {
                    console.log(pullOfGames[i].secondPlayer.first_name + " disconnected by ->" + reason.toString())
                }
            }
        }

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
                    pullOfGames[i].secondPlayer.socketId = null;
                    break;
                }
            }
        }
    })

    socket.on('move', (mv) => {
        log("move 132")
        let move = JSON.parse(mv);
        pullOfGames[parseInt(move.room)].fen = move.fen;
        io.to(move.room).emit('changeBoard', move.fen);
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
                break;
            }
        }
    })
});

function log(where){
    let pull = " ";
    for (let i = 0; i < pullOfGames.length; i++){
        pull += "pull->"+i+": ";
        if(pullOfGames[i] !== null)
        {
            if (pullOfGames[i].firstPlayer !== null) {
                pull += pullOfGames[i].firstPlayer.username + ", ";
            }
            if (pullOfGames[i].secondPlayer !== null) {
                pull += pullOfGames[i].secondPlayer.username + ", ";
            }
        }

        pull += "/"

    }
    console.log(where + "<- " + pull)
}

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});
module.exports = app;


