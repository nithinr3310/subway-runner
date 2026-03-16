import checkCollision from "./Collision.js";

export default class CoinManager {

constructor(game){

this.game = game;

this.coins = [];

this.spawnTimer = 0;
this.trailLength = 6;

}

spawnCoinTrail(){

const lane = Math.floor(Math.random()*3);

for(let i=0;i<this.trailLength;i++){

const coin = {

x:this.game.player.lanes[lane],

y: -i * 60,

radius:10

};

this.coins.push(coin);

}

}

update(){

this.spawnTimer++;

if(this.spawnTimer > 150){

this.spawnCoinTrail();

this.spawnTimer = 0;

}

this.coins.forEach((coin,index)=>{

coin.y += this.game.speed;

if(checkCollision(this.game.player,{
x:coin.x,
y:coin.y,
width:coin.radius*2,
height:coin.radius*2
})){

this.game.coinCount++;

this.coins.splice(index,1);

}
this.coins = this.coins.filter(
coin => coin.y < this.game.height + 50
);

});

}

draw(ctx){

ctx.fillStyle="yellow";

ctx.shadowColor = "yellow";
ctx.shadowBlur = 15;

this.coins.forEach(coin=>{

ctx.beginPath();

ctx.arc(coin.x,coin.y,coin.radius,0,Math.PI*2);

ctx.fill();

});

}

}