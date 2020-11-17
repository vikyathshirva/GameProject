const io = require('../servers').io

const checkForOrbCollisions = require('./checkCollisions').checkForOrbCollisions
const checkForPlayerCollisions = require('./checkCollisions').checkForPlayerCollisions

const Player = require('./classes/Player')
const PlayerData = require('./classes/PlayerData')
const PlayerConfig = require('./classes/PlayerConfig')
const Orb = require('./classes/Orb')
let orbs = []
let players = []
let settings = {
    defaultOrbs : 500,
    defaultSpeed : 10,
    defaultRadius: 6,
    defaultZoom: 1.5,
    worldWidth: 500,
    worldHeight: 500
}


initGame()

io.sockets.on('connect',(socket)=>{

    let player = {}
    
    
    socket.on('init',(data)=>{
    socket.join('game');
    let playerConfig = new PlayerConfig(settings);
    let playerData = new PlayerData(data.playerName, settings);
    player = new Player(socket.id, playerConfig, playerData);   

    
    
        
        setInterval(()=>{
        io.to('game').emit('tock',{
            players,
            playerX : player.playerData.locX,
            playerY : player.playerData.locY,

        });
    },33);

    socket.emit('initReturn',{
        orbs
    });
    players.push(playerData)
    });

    socket.on('tick',(data)=>{

            speed = player.playerConfig.speed
            xV = player.playerConfig.xVector = data.xVector
            yV = player.playerConfig.yVector = data.yVector

            if((player.playerData.locX < 5 && player.playerData.xVector < 0) || (player.playerData.locX > 500) && (xV > 0)){
                player.playerData.locY -= speed * yV;
            }else if((player.playerData.locY < 5 && yV > 0) || (player.playerData.locY > 500) && (yV < 0)){
                player.playerData.locX += speed * xV;
            }else{
                player.playerData.locX += speed * xV;
                player.playerData.locY -= speed * yV;
            }  
    })

    
})

function initGame(){

    for(let i = 0; i <settings.defaultOrbs; i++){
        orbs.push(new Orb(settings))
    }

}

module.exports = io