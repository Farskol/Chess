const MongoClient = require("mongodb").MongoClient;
const chess_db = require('./chess-db');
const dbUrl =  "mongodb+srv://Farskol:e1137ca1@chess.yuv9adc.mongodb.net/test";
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
        console.log(err);
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
            await collection.insertOne({_id:player.id, first_name: player.first_name, username: player.username})
        }else {
            return false;
        }
    }catch (err){
        console.log(err);
    }finally {
        await mongoClient.close();
    }
}
