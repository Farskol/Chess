const fs = require("fs");
const {json} = require("express");

let conf = JSON.parse(fs.readFileSync("assets/config.json", "utf8"));

module.exports.dbUrl = conf.dbUrl;
module.exports.TOKEN = conf.TOKEN;
module.exports.gameUrl = conf.gameUrl;
module.exports.gifUrl = conf.gifUrl;