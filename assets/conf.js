const fs = require("fs");
const {json} = require("express");
const log = require("./logs");

try{
    let conf = JSON.parse(fs.readFileSync("assets/config.json", "utf8"));
    module.exports.dbUrl = conf.dbUrl;
    module.exports.TOKEN = conf.TOKEN;
    module.exports.gameUrl = conf.gameUrl;
    module.exports.gifUrl = conf.gifUrl;
}catch (err){
    log.logger.log('error',err);
}
