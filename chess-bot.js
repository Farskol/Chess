const http = require('https');
const fs = require('fs');
const log = require('./assets/logs');

const TelegramBot = require("node-telegram-bot-api");
const chess_db = require("./chess-db");
const conf = require("./assets/conf");
const TOKEN = conf.TOKEN;
const gameUrl = conf.gameUrl
const gifUrl = conf.gifUrl;
const botLink = conf.botLink;

const bot = new TelegramBot(TOKEN, {
    polling: true
});

bot.on('new_chat_members', async (msg) =>{
    try{
        await chess_db.add_player_in_db(msg.new_chat_participant);
    }catch (err){
        log.logger.log('error',err);
    }
})

bot.on('left_chat_member', async (msg) =>{
    try{
        await chess_db.delete_player_in_db(msg.left_chat_participant);
    }catch (err){
        log.logger.log('error',err);
    }
})

bot.onText(/help/, async (msg) => {
    try{
        bot.sendMessage(msg.from.id, "This bot implements a chess game. Say /game or /start if you want to play.")
    }
    catch (err){
        log.logger.log('error',err);
    }
});

bot.onText(/start|game/, async function (msg) {
    try{
        let options = {}
        if (msg.chat.type !== 'private') {
            options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Play in chess', url: botLink},
                            {text: 'Play with friend', switch_inline_query: ''}
                        ]
                    ]
                }
            }
        } else {
            options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Play in chess', web_app: {url: gameUrl}},
                            {text: 'Play with friend', switch_inline_query: ''}
                        ]
                    ]
                }
            }
        }

        bot.sendAnimation(msg.chat.id, gifUrl, options)
    }catch (err){
        log.logger.log('error',err);
    }
});

bot.on("inline_query", function (iq) {
    try{
        let result = [];
            result.push({
                type: "gif",
                id: 0,
                title: "play in chess",
                gif_url: gifUrl,
                thumb_url: gifUrl,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Play in chess', url: botLink}
                        ]
                    ]
                }
            })
        bot.answerInlineQuery(iq.id, result);
    }catch (err){
        log.logger.log('error',err);
    }
});

bot.onText(/statistic/, async (msg) => {
    try{
        let players = [];
        let players_string = "";

        players = await chess_db.take_players_sort_win_rate();

        for (let i = 0; (i < players.length && i < 10); i++) {
            players_string += (i + 1) + ". " + players[i].first_name + " --> win rate: " + (players[i].winRate * 100).toFixed(1) + "%\n";
        }
        bot.sendMessage(msg.chat.id, players_string)
    }catch (err){
        log.logger.log('error',err);
    }
})

// bot.onText(/chat/, async (msg) => {
//     try{
//         await chat_database_check(msg);
//     }catch (err){
//         log.logger.log('error',err);
//     }
// })

module.exports.take_photo_by_id = async function run (id) {
    let dPhoto;
    try{
        let photo = await bot.getUserProfilePhotos(parseInt(id));
        if (photo.total_count !== 0) {
            photo = photo.photos[0][0].file_id;
            photo = await bot.getFile(photo);
            dPhoto = "https://api.telegram.org/file/bot";
            dPhoto += TOKEN + "/";
            dPhoto += photo.file_path;
            return dPhoto;

            //function for uploading photos and future storage in the database
            //download_file(dPhoto, id);
        } else {
            dPhoto = null;
            return dPhoto
        }
    }catch (err){
        dPhoto = null;
        log.logger.log('error',err);
        return dPhoto
    }
}

//------FUNCTION FOR DOWNLOADING PHOTO FROM THE TRANSMITTED LINK ------
function download_file(link, id){
    const file = fs.createWriteStream("photo/"+id.toString() + ".jpg");
    const request = http.get(link, function(response) {
        response.pipe(file);

        file.on("finish", () => {
            file.close();
        });
    });
}

async function chat_database_check(msg){
    try{
        let chat = await bot.getChat(msg.chat.id);
        if (chat.type === 'supergroup') {
            let ch = await chess_db.take_chat_by_Id(chat.id);
            if (ch === null) {
                await chess_db.add_chat_in_db(chat);
                await chess_db.add_player_in_chat(chat.id, [msg.from.id])
            } else {
                if (ch.players === null) {
                    console.log(ch.players)
                    await chess_db.add_player_in_chat(ch._id, [msg.from.id])
                } else {
                    let players = ch.players;
                    let flag = true;
                    for (let i = 0; i < players.length; i++) {
                        if (players[i] === msg.from.id) {
                            flag = false;
                        }
                    }
                    if (flag) {
                        players.push(msg.from.id);
                        await chess_db.add_player_in_chat(ch._id, players);
                    }
                }
            }
        }
    }catch (err){
        log.logger.log('error',err);
    }
}