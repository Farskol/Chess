const http = require('https');
const fs = require('fs');

const TelegramBot = require("node-telegram-bot-api");
const chess_db = require("./chess-db");
const TOKEN = "5760900885:AAHJDaPFAEUPupjOmuewlkHncClXq2tRul0";
//const gameUrl = "https://chess-hwrt.onrender.com/"
const gameUrl = "https://chess-test.onrender.com"
const gifUrl = 'https://media.tenor.com/qMcB37_W5eYAAAAM/limusa-cat-playing-chess.gif';

const bot = new TelegramBot(TOKEN, {
    polling: true
});


bot.onText(/help/, async (msg) => {
    await chat_database_check(msg);
    bot.sendMessage(msg.from.id, "This bot implements a chess game. Say /game or /start if you want to play.")
});
bot.onText(/start|game/, async function (msg) {
    await chat_database_check(msg);

    console.log(msg)
    let options = {}
    if(msg.chat.type !== 'private') {
        options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Play in chess', url: gameUrl}
                    ]
                ]
            }
        }
    }
    else
        {
            options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Play in chess', web_app: {url: gameUrl}}
                        ]
                    ]
                }
            }
        }

    bot.sendAnimation(msg.chat.id, gifUrl,options)});

bot.on("inline_query", function (iq) {
    let result = [];
    for (let i = 0; i < 3; i++){
        result.push({
            type: "gif",
            id: `${i}`,
            title: "play in chess",
            gif_url:gifUrl,
            thumb_url: gifUrl,
            reply_markup:{
                inline_keyboard:[
                    [
                        {text: 'Play in chess', web_app: {url: gameUrl}}
                    ]
                ]
            }
        })
    }
    bot.answerInlineQuery(iq.id,result);
});

bot.onText(/statistic/, async (msg) => {
    await chat_database_check(msg);

    let chat = await chess_db.take_chat_by_Id(msg.chat.id);
    let players = [];
    let players_string = "";
    if (msg.chat.type ==='supergroup') {
        for (let i = 0; i < chat.players.length; i++) {
            let player = await chess_db.take_player_by_id(chat.players[i].toString());
            players.push(player);
        }
    }else {
        players = await chess_db.take_players(10);
    }

    for (let i = 0; i < players.length; i++){
        players_string += (i+1) + ". " + players[i].first_name + " --> win rate: " + (players[i].winRate*100) + "%\n";
    }
    bot.sendMessage(msg.chat.id, players_string)
})

bot.onText(/chat/, async (msg) => {
    await chat_database_check(msg);
})

module.exports.take_photo_by_id = async function run (id) {
    let photo = await bot.getUserProfilePhotos(id);
    if(photo.total_count !== 0) {
        photo = photo.photos[0][0].file_id;
        photo = await bot.getFile(photo);
        let dPhoto = "https://api.telegram.org/file/bot";
        dPhoto += TOKEN+"/";
        dPhoto += photo.file_path;
        return dPhoto;
        //download_file(dPhoto, id);
    }
}

function download_file(link, id){
    const file = fs.createWriteStream("photo/"+id.toString() + ".jpg");
    const request = http.get(link, function(response) {
        response.pipe(file);

        // after download completed close filestream
        file.on("finish", () => {
            file.close();
            console.log("Download Completed");
        });
    });
}

async function chat_database_check(msg){
        let chat = await bot.getChat(msg.chat.id);
        if(chat.type ==='supergroup') {
            let ch = await chess_db.take_chat_by_Id(chat.id);
            if (ch === null) {
                await chess_db.add_chat_in_db(chat);
                await chess_db.add_player_in_chat(chat.id, [msg.from.id])
            }
            else {
                if(ch.players === null){
                    console.log(ch.players)
                    await chess_db.add_player_in_chat(ch._id, [msg.from.id])
                }
                else {
                    let players = ch.players;
                    let flag = true;
                    for (let i = 0; i < players.length; i++){
                        if(players[i] === msg.from.id){
                            flag = false;
                        }
                    }
                    if(flag){
                        players.push(msg.from.id);
                        await chess_db.add_player_in_chat(ch._id, players);
                    }
                }
            }
        }
    }