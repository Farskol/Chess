const MongoClient = require("mongodb").MongoClient;
const chess_db = require('./chess-db');
const conf = require("./assets/conf");
const log = require("./assets/logs");
const dbUrl = conf.dbUrl;
const mongoClient = new MongoClient(dbUrl);

module.exports.take_player_by_id = async function run(id) {
    try {
        await mongoClient.connect();
        const db = mongoClient.db("chessdb");
        const collection = db.collection("players");
        let result = await collection.find({_id: id}).toArray();
        if (result.length === 0){
            result[0] = null;
        }
        return result[0];
    }catch(err) {
        log.logger.log('error',err);
    } finally {
        await mongoClient.close();
    }
}

module.exports.add_player_in_db = async function run(player){
    try {
        if (await chess_db.take_player_by_id(player.id) === null){
            await mongoClient.connect();
            const db = mongoClient.db("chessdb");
            const collection = db.collection("players");
            await collection.insertOne({_id:player.id, first_name: player.first_name, username: player.username, winRate:null})
            return true;
        }else {
            return false;
        }
    }catch (err){
        log.logger.log('error',err);
    }finally {
        await mongoClient.close();
    }
}

module.exports.delete_player_in_db = async function run(player){
    try {
        if (await chess_db.take_player_by_id(player.id) !== null){
            await mongoClient.connect();
            const db = mongoClient.db("chessdb");
            const collection = db.collection("players");
            await collection.deleteOne({_id: player.id});
            return true;
        }else {
            return false;
        }
    }catch (err){
        log.logger.log('error',err);
    }finally {
        await mongoClient.close();
    }
}

module.exports.take_players = async function run(numbers){
    try {
        await mongoClient.connect();
        const db = mongoClient.db("chessdb");
        const collection = db.collection("players");
        let players = await collection.find().limit(numbers).toArray();

        return players;
    }catch (err){
        log.logger.log('error',err);
    }finally {
        await mongoClient.close();
    }
}

module.exports.add_game_statistic = async function run(players = []){
    try{
        await mongoClient.connect();
        const db = mongoClient.db("chessdb");
        const collection = db.collection("players");

        for (let i = 0; i < 2; i++) {
            let player = await collection.findOne({_id: players[i].id});

            if (player.winRate === null || player.winRate === undefined) {
                if (players[i].lose) {
                    player.win = 0;
                    player.lose = 1;
                    player.winRate = player.win / (player.win + player.lose);
                } else {
                    player.win = 1;
                    player.lose = 0;
                    player.winRate = player.win / (player.win + player.lose);
                }
            }
            else {
                if (players[i].lose) {
                    player.lose++;
                    player.winRate = player.win / (player.win + player.lose);
                } else {
                    player.win++
                    player.winRate = player.win / (player.win + player.lose);
                }
            }
            await collection.updateOne({_id: player._id}, { $set: {
                    win:player.win,
                    lose:player.lose,
                    winRate:player.winRate
                }
            })
        }
    }catch (err){
        log.logger.log('error',err);
    }finally {
        await mongoClient.close();
    }

}

module.exports.take_chat_by_Id = async function run(chatId){
    try {
        await mongoClient.connect();
        const db = mongoClient.db("chessdb");
        const collection = db.collection("chess_chats");
        let players = await collection.findOne({_id:chatId});
        return players;
    }catch (err){
        log.logger.log('error',err);
    }finally {
        await mongoClient.close();
    }
}

module.exports.add_chat_in_db = async function run(chat){
    try {
        await mongoClient.connect();
        const db = mongoClient.db("chessdb");
        const collection = db.collection("chess_chats");
        let players = await collection.insertOne({_id:chat.id, title:chat.title, username:chat.username, invite_link:chat.invite_link, players:null});
        return players;
    }catch (err){
        log.logger.log('error',err);
    }finally {
        await mongoClient.close();
    }
}

module.exports.add_player_in_chat = async function run(chatId, players){
    try {
        await mongoClient.connect();
        const db = mongoClient.db("chessdb");
        const collection = db.collection("chess_chats");
        await collection.updateOne({_id: chatId}, { $set: { players:players}});
    }catch (err){
        log.logger.log('error',err);
    }finally {
        await mongoClient.close();
    }
}


