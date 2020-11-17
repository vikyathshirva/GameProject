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
    defaultOrbs : 50,
    defaultSpeed : 6,
    defaultRadius: 10,
    defaultZoom: 0.5,
    worldWidth: 500,
    worldHeight: 500
}


initGame()

       setInterval(()=>{
        if (players.length > 0){

            io.to('game').emit('tock',{
            players,
        });
        }
        
    },33);

io.sockets.on('connect',(socket)=>{

    let player = {}
    
    
    socket.on('init',(data)=>{
    socket.join('game');
    let playerConfig = new PlayerConfig(settings);
    let playerData = new PlayerData(data.playerName, settings);
    player = new Player(socket.id, playerConfig, playerData);   

    
    
        
        setInterval(()=>{
        socket.emit('ticktok',{

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

            if((player.playerData.locX < 5 && player.playerData.xVector < 0) || (player.playerData.locX > settings.worldWidth) && (xV > 0)){
                player.playerData.locY -= speed * yV;
            }else if((player.playerData.locY < 5 && yV > 0) || (player.playerData.locY > settings.worldHeight) && (yV < 0)){
                player.playerData.locX += speed * xV;
            }else{
                player.playerData.locX += speed * xV;
                player.playerData.locY -= speed * yV;
            }  

            let capturedOrb = checkForOrbCollisions(player.playerData,player.playerConfig, orbs, settings)

            capturedOrb.then((data)=>{

                const orbData = {
                    orbIndex : data,
                    newOrb: orbs[data]
                }
                //Collision code
                //console.log(orbData)

                io.sockets.emit('updateLeaderBoard',getLeaderBoard())
                io.sockets.emit('orbSwitch',orbData)


            }).catch(()=>{
                //No Collision code
                //console.log("No Orb collision")
                

            })

            let playerDeath = checkForPlayerCollisions(player.playerData,player.PlayerConfig,players,player.socketId)

            playerDeath.then((data)=>{
                //console.log("player collision!!")
                 io.sockets.emit('updateLeaderBoard',getLeaderBoard())
                 io.sockets.emit('playerDeath',data)

            }).catch(()=>{

            })  


    })
    socket.on('disconnect',(data)=>{

        if(player.playerData){
            players.forEach((curPlayer, i)=>{
                        if(curPlayer.uid == player.playerData.uid){
                                players.splice(i,1);
                                io.sockets.emit('updateLeaderBoard',getLeaderBoard())
                        }


                    })

        }
        
        
    })

    
})


function getLeaderBoard(){
    players.sort((a,b)=>{
        return b.score-a.score
    })
    let leaderBoard = players.map((curPlayer)=>{
        return {
            name : curPlayer.name,
            score : curPlayer.score
        }
    })
    return leaderBoard
}

function initGame(){

    for(let i = 0; i <settings.defaultOrbs; i++){
        orbs.push(new Orb(settings))
    }

}

module.exports = io