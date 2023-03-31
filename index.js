const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 5040;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const chess_db = require('./chess-db');
const chess_bot = require("./chess-bot");
const log = require("./assets/logs");

let pullOfGames = [];
let count = {count:0, room:null};

const jsonParser = express.json();
const urlencodedParser = express.urlencoded({extended: false});

app.use(express.static(__dirname + '/assets'));
app.use(express.static(__dirname + '/node_modules'));

app.get('/', (req, res) => {
    try{
        res.sendFile(__dirname + '/pages/index.html');
    }catch (err){
        log.logger.log('error',err);
    }
});

app.post('/playGame',urlencodedParser, (req, res) => {
    try{
        res.sendFile(__dirname + '/gamePage.html');
    }catch (err){
        log.logger.log('error',err);
    }
});

app.post('/playWith',urlencodedParser, (req,res) =>{
    try{
        let firstPlayer = JSON.parse(req.body.player_first);
        let secondPlayer = JSON.parse(req.body.player_second);
        let id = secondPlayer._id;
        delete secondPlayer._id;
        secondPlayer.id = id;

        for(let i = 0; i < pullOfGames.length; i++){
            if(pullOfGames[i].firstPlayer !== null){
                if(pullOfGames[i].firstPlayer.id === firstPlayer.id){
                    pullOfGames[i] = null;
                }
            }
            if(pullOfGames[i].secondPlayer !== null){
                console.log(pullOfGames[i].secondPlayer)
               if(pullOfGames[i].secondPlayer.id === firstPlayer.id){
                   console.log(secondPlayer)
                   pullOfGames[i] = null;
               }
            }
        }

        let flag = true;
        for(let i = 0; i < pullOfGames.length; i++){
            if(pullOfGames[i] === null){
                flag = false;
                pullOfGames[i] = {
                    firstPlayer,
                    secondPlayer,
                    fen: null
                }
                break;
            }
        }

        if(flag){
            pullOfGames.push({
                firstPlayer,
                secondPlayer,
                fen: null
            })
        }

        res.sendFile(__dirname + '/gamePage.html');
    }catch (err){
        log.logger.log('error',err);
    }
})

app.post('/returnedToTheMenu',urlencodedParser, (req, res) => {
    try{
        res.sendFile(__dirname + '/pages/index.html');
    }catch (err){
        log.logger.log('error',err);
    }
});

app.post('/players',urlencodedParser, (req, res) => {
    try{
        res.sendFile(__dirname + '/pages/players.html');
    }catch (err){
        log.logger.log('error',err);
    }
})

app.post('/tableHighScore',urlencodedParser, (req, res) => {
    try{
        res.sendFile(__dirname + '/pages/high-score-table.html');
    }catch (err){
        log.logger.log('error',err);
    }
});

app.post('/stream',urlencodedParser, (req, res) => {
    try{
        res.sendFile(__dirname + '/pages/stream-rooms.html');
    }catch (err){
        log.logger.log('error',err);
    }
})

app.post("/getGames", jsonParser, (req, res) => {
    try{
        res.json(pullOfGames);
    }catch (err){
        log.logger.log('error',err);
    }
})

app.post("/watchGame",urlencodedParser, jsonParser, (req, res) => {
    try{
        res.sendFile(__dirname + '/pages/stream.html');
    }catch (err){
        log.logger.log('error',err);
    }
})

app.post('/getStream',jsonParser, async (req, res) => {
    try{
        let photos = {
            firstPlayer: await chess_bot.take_photo_by_id(pullOfGames[parseInt(req.body.room)].firstPlayer.id),
            secondPlayer: await chess_bot.take_photo_by_id(pullOfGames[parseInt(req.body.room)].secondPlayer.id)
        }
        res.json({game: pullOfGames[parseInt(req.body.room)], photos: photos});
    }catch (err){
        log.logger.log('error',err);
    }
});

app.post("/highScore",jsonParser, async (req, res) => {
    try{
        let users = await chess_db.take_players(10,0);
        res.json(users);
    }catch (err){
        log.logger.log('error',err);
    }
})

app.post("/chessPlayers",jsonParser, async (req, res) => {
    try{
        let users = await chess_db.take_players(10,req.body.page);
        res.json(users);
    }catch (err){
        log.logger.log('error',err);
    }
})

app.post("/findByName", jsonParser, async (req, res) => {
    try{
        let users = await chess_db.take_player_by_first_name(req.body.first_name);
        res.json(users);
    }catch (err){
        log.logger.log('error',err);
    }
})

app.post("/searchInDb",jsonParser, async (req, res) =>{
    try{
        await chess_db.add_player_in_db(req.body)
    }catch (err){
        log.logger.log('error',err);
    }
})

app.post('/board',jsonParser, (req, res) => {
    try{
        let player = req.body;
        let flag = true;

        if (pullOfGames.length !== 0) {
            for (let i = 0; i < pullOfGames.length; i++) {
                if (pullOfGames[i] !== null) {
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

        if (flag) {
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
    }catch (err){
        log.logger.log('error',err);
    }
})


io.on('connection', (socket) => {
    console.log("hello")

    socket.on("stream", (room) =>{
        try{
            socket.join(room);
        }catch (err){
            log.logger.log('error',err);
        }
    })

    socket.on("loadPhoto", async (photo) =>{
        try{
            let p = JSON.parse(photo);
            let photoAndId;
            let ph = await chess_bot.take_photo_by_id(p.id);
            if (ph !== null) {
                photoAndId = {id: p.id, photo: ph};
            } else {
                photoAndId = {id: p.id, photo: null};
            }
            io.to(p.room).emit("photo", JSON.stringify(photoAndId));
        }catch (err){
            log.logger.log('error',err);
        }
    })

    socket.on("gameEnd", async(players) => {
        try{
            await chess_db.add_game_statistic(JSON.parse(players));
        }catch (err){
            log.logger.log('error',err);
        }
    })

    socket.on("disconnect", (reason) =>{

        try{
            for (let i = 0; i < pullOfGames.length; i++) {
                if (pullOfGames[i].firstPlayer !== null) {
                    if (pullOfGames[i].firstPlayer.socketId === socket.id) {
                        log.logger.log('info',pullOfGames[i].firstPlayer.first_name + " disconnected by ->" + reason.toString())
                    }
                }

                if (pullOfGames[i].secondPlayer !== null) {
                    if (pullOfGames[i].secondPlayer.socketId === socket.id) {
                        log.logger.log('info', pullOfGames[i].secondPlayer.first_name + " disconnected by ->" + reason.toString())
                    }
                }
            }

            for (let i = 0; i < pullOfGames.length; i++) {
                if(pullOfGames[i].firstPlayer !== null){
                    if (pullOfGames[i].firstPlayer.socketId === socket.id) {
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
                    } else if (pullOfGames[i].firstPlayer.socketId === null) {
                        if (pullOfGames[i].secondPlayer.socketId === null || pullOfGames[i].secondPlayer.socketId === socket.id) {
                            io.of("/").adapter.rooms.delete(i.toString());
                            pullOfGames[i] = null;
                            break;
                        }
                    } else if (pullOfGames[i].secondPlayer !== null) {
                        if (pullOfGames[i].secondPlayer.socketId === socket.id) {
                            pullOfGames[i].secondPlayer.socketId = null;
                            break;
                        }
                    }
                }
            }
        }catch (err){
            log.logger.log('error',err);
        }
    })

    socket.on('move', (mv) => {
        try{
            let move = JSON.parse(mv);
            pullOfGames[parseInt(move.room)].fen = move.fen;
            io.to(move.room).emit('changeBoard', JSON.stringify(move));
        }catch (err){
            log.logger.log('error',err);
        }
    });

    socket.on('room',(room) =>{
        try{
            let rm = JSON.parse(room);
            socket.join(rm.room);
            for (let i = 0; i < pullOfGames.length; i++) {
                if (i === parseInt(rm.room)) {
                    if (pullOfGames[i].firstPlayer.id === rm.id) {
                        pullOfGames[i].firstPlayer.socketId = socket.id;
                    } else if (pullOfGames[i].secondPlayer.id === rm.id) {
                        pullOfGames[i].secondPlayer.socketId = socket.id;
                    }
                    io.to(rm.room).emit('players', JSON.stringify(pullOfGames[i]));
                    break;
                }
            }
        }catch (err){
            log.logger.log('error',err);
        }
    })
});

//-----------log Pull-----------------------
function logPul(where){
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


