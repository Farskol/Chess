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
const lang = require("./assets/language/lang-chess-bot");

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
    let help;
    if(msg.from.language_code !== 'ru'){
        help = lang.help.en;
    }else {
        help = lang.help.ru;
    }
    try{
        bot.sendMessage(msg.from.id, help)
    }
    catch (err){
        log.logger.log('error',err);
    }
});

bot.onText(/start|game/, async function (msg) {
    let start_play;
    let start_friend;
    if(msg.from.language_code !== 'ru'){
        start_play = lang.start_play.en;
        start_friend = lang.start_friend.en;
    }else {
        start_play = lang.start_play.ru;
        start_friend = lang.start_friend.ru;
    }
    try{
        chess_db.add_player_in_db({
            id:msg.from.id,
            first_name: msg.from.first_name,
            username: msg.from.username,
            chat:msg.chat.id,
            winRate:null
        })

        let options = {}
        if (msg.chat.type !== 'private') {
            options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: start_play, url: botLink},
                            {text: start_friend, switch_inline_query: ''}
                        ]
                    ]
                }
            }
        } else {
            options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: start_play, web_app: {url: gameUrl}},
                            {text: start_friend, switch_inline_query: ''}
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
    let start_play;
    if(iq.from.language_code !== 'ru'){
        start_play = lang.start_play.en;
    }else {
        start_play = lang.start_play.ru;
    }
    try{
        let result = [];
            result.push({
                type: "gif",
                id: 0,
                title: start_play,
                gif_url: gifUrl,
                thumb_url: gifUrl,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: start_play, url: botLink}
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
    let statistic;
    if(msg.from.language_code !== 'ru'){
        statistic = lang.statistic.en;
    }else {
        statistic = lang.statistic.ru;
    }
    try{
        let players = [];
        let players_string = "";

        players = await chess_db.take_players_sort_win_rate();

        for (let i = 0; (i < players.length && i < 10); i++) {
            players_string += (i + 1) + ". " + players[i].first_name + " --> " + statistic + ": "
                + (players[i].winRate * 100).toFixed(1) + "%\n";
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

module.exports.sendMessege = async function run (firstPlayer,secondPlayer){
    let send = lang.send.ru;
    // if(msg.from.language_code !== 'ru'){
    //     send = lang.send.en;
    // }else {
    //     send = lang.send.ru;
    // }
    try{
        let options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: firstPlayer.first_name + " " + send, web_app: {url: gameUrl}},
                        ]
                    ]
                }
            }

        bot.sendAnimation(secondPlayer.chat, gifUrl, options)
    }catch (err){
        log.logger.log('error',err);
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