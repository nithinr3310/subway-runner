import checkCollision from "./Collision.js";

export default class CoinManager {

constructor(game){

this.game = game;

this.coins = [];

this.spawnTimer = 0;

}

spawnCoin(){

const lane = Math.floor(Math.random() * 3);

const coin = {

x: this.game.player.lanes[lane],

y: -20,

radius: 10

};

this.coins.push(coin);

}

update(){

this.spawnTimer++;

if(this.spawnTimer > 90){

this.spawnCoin();

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

});

}

draw(ctx){

ctx.fillStyle="yellow";

this.coins.forEach(coin=>{

ctx.beginPath();

ctx.arc(coin.x,coin.y,coin.radius,0,Math.PI*2);

ctx.fill();

});

}

}