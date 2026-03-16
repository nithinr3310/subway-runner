import checkCollision from "./Collision.js";

export default class PowerUpManager{

constructor(game){

this.game = game;

this.powerUps = [];

this.spawnTimer = 0;

}

spawnMagnet(){

const lane = Math.floor(Math.random()*3);

const magnet = {

x:this.game.player.lanes[lane],

y:-40,

size:25,

type:"magnet"

};

this.powerUps.push(magnet);

}

update(){

this.spawnTimer++;

if(this.spawnTimer > 600){

this.spawnMagnet();

this.spawnTimer = 0;

}

this.powerUps.forEach((power,index)=>{

power.y += this.game.speed;

if(checkCollision(this.game.player,{
x:power.x,
y:power.y,
width:power.size,
height:power.size
})){

if(power.type === "magnet"){

this.game.magnetActive = true;

this.game.magnetTimer = 300;

}

this.powerUps.splice(index,1);

}

});

}

draw(ctx){

ctx.fillStyle = "#00ff88";

this.powerUps.forEach(power=>{

ctx.beginPath();

ctx.arc(power.x,power.y,power.size,0,Math.PI*2);

ctx.fill();

});

}

}