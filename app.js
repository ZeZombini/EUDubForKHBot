const Discord = require('discord.js');
const client  = new Discord.Client()
const rp      = require('request-promise')
const fs      = require("fs");
const path    = require("path")
const moment  = require("moment");

const prefix = require('./config/config.json').prefix;
const token = require('./config/config.json').token;
const TIME_INTERVAL = 1000 * 60 * 1 // 5 minutes

//--  CONFIG AND PERSISTENT DATA
var fileName = path.join(__dirname,'./data.db');
var channels = {};
var roles = {}
var oldCount = 0;
if (fs.existsSync(fileName)){
    tmpRoles    = (JSON.parse(fs.readFileSync(fileName, "utf8"))).roles;
    tmpChannels = (JSON.parse(fs.readFileSync(fileName, "utf8"))).channels;
    tmpOldCount = (JSON.parse(fs.readFileSync(fileName, "utf8"))).oldCount;

    if (tmpChannels) channels = tmpChannels;
    if (tmpRoles) roles = tmpRoles;
    if (tmpOldCount) oldCount = tmpOldCount;
}
//--

optionsRequest = {
    uri: "https://www.change.org/api-proxy/-/petitions/13281883/updates/recent",
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0',
        'DNT': '1',
    },
    json: true
}

client.on('ready', () =>  console.log(`I am logged as ${client.user.tag} and ready!`));

// let exempleStruct = {
//     id: null,
//     milestone: null,
//     start: null,
// }

// Crowl
setInterval(async () => {
    launchCrawl();
}, TIME_INTERVAL)

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    
    if(!isAllow(message)){
        return
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === "ping"){
        message.channel.send("Pong !")
    }
    // !kh_bot help
    if (command === "kh_bot" && args[0] === "help") {
        message.channel.send("Commande : !kh_bot start, !stop, !help, !milestone <int>")
        return
    }
    // !kh_bot start
    if (command === "kh_bot" && args[0] === "start") {
        if (!channels[message.channel.id]) channels[message.channel.id] = {milestone: 50}
        channels[message.channel.id].start = true;
        message.channel.send("Starting bot in this channel")
        // console.log(channels);
        
        saveConfig(channels)
        return
    }
    // !kh_bot stop
    if (command === "kh_bot" && args[0] === "stop") {
        if (!channels[message.channel.id]) channels[message.channel.id] = {milestone: 50}
        channels[message.channel.id].start = false;
        message.channel.send("Stoping bot in this channel")
        saveConfig(channels)
        return
    }
    // !kh_bot [milestone|ms] <num>
    if (command === "kh_bot" && (args[0] === "milestone" || args[0] === "ms")) {
        let ms = args[1];

        if (isNaN(parseInt(ms))) {
            message.channel.send("J'attends un nombre entier :/");
        } else {
            if (!channels[message.channel.id]) channels[message.channel.id] = {}
            channels[message.channel.id].milestone = parseInt(ms);
            message.channel.send("Changement pris en compte !");
        }
        saveConfig(channels)
        return
    }
    if (command === "kh_bot" && args[0] === "addRole"){
        if (onlyOneRole(message)){
            roles[message.mentions.roles.firstKey()] = {allow: true};
            saveConfig();
        }
        return;
    }
    if (command === "kh_bot" && args[0] === "removeRole"){
        if (onlyOneRole(message)){
            roles[message.mentions.roles.firstKey()] = {allow: false};
            saveConfig();
        }
        return;
    }
});

client.login(token);

// UTILS
var launchCrawl = async function(){
    console.log("--")
    console.log(moment().format() + " - Starting crawl")
    let newCount = await rp(optionsRequest).then((res) => {console.log("Response");return res[0].petition.total_signature_count;})
    console.log(moment().format() + " - NewCount: " + newCount + " (old: " + oldCount + ")")
    let key
    for (key in channels){
        let newFloor = Math.floor(newCount/channels[key].milestone)
        if (channels[key].start && (newFloor > Math.floor(oldCount/channels[key].milestone))){
            // client.channels.get(key).send(`:tada: :tada: Le cap des ${newFloor*channels[key].milestone} a été dépassé ! :tada: :tada: (${newCount} signatures)`);
            client.channels.get(key).send({
                embed: {
                    color: 52224,  //random color between one and 16777214 (dec)
                    title: `:tada: :tada: Le cap des ${numberWithSpaces(newFloor*channels[key].milestone)} a été dépassé ! :tada: :tada:`,
                    description: `*(${numberWithSpaces(newCount)} signatures)*`
                }
            })
        }
    }
    oldCount = newCount
    saveConfig();
}

// Role
var isAllow = function(message) {
    // Me c:
    if (message.author.username + "#" + message.author.discriminator === "ZeZombini#5482")
        return true;
    // Checkf if author is creator of guild/server
    if (message.guild.ownerID === message.author.id) // Me c:
        return true;
    // Check if author.role in array of authorized role
    let flag = false;
    for (key in roles){
        if (message.member.roles.has(key)){
            flag = true;
        }
    }

    return flag;
}

// Save
var saveConfig = function(){
    let db = {}
    db.channels = channels;
    db.roles = roles;
    db.oldCount = oldCount;

    fs.writeFileSync(fileName, JSON.stringify(db), 'utf-8')
}

// Correct input
var onlyOneRole = function(message){
    if (message.mentions.channels.keyArray().length > 0) {message.channel.send("Il me faut un rôle, pas un channel !"); return false;}
    if (message.mentions.members.keyArray().length > 0) {message.channel.send("Il me faut un rôle, pas un utilisateur !"); return false;}
    // if (message.mentions.users.keyArray().length > 0) {message.channel.send("Il me faut un rôle, pas un utilisateur !"); return false;}
    if (message.mentions.everyone) {message.channel.send("Ha bah non. Pas ce rôle."); return false;}
    if (message.mentions.roles.keyArray().length > 1) {message.channel.send("Un rôle à la fois !"); return false;}
    if (message.mentions.roles.keyArray().length < 1) {message.channel.send("Il me faut un rôle."); return false;}
    return true;
}

// Format input
var numberWithSpaces = function(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(".");
}