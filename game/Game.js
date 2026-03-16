import ObstacleManager from "./ObstacleManager.js";
import checkCollision from "./Collision.js";
import Player from "./Player.js";
import InputHandler from "./InputHandler.js";
import CoinManager from "./CoinManager.js";

export default class Game{

constructor(canvas,ctx){

this.canvas = canvas;
this.ctx = ctx;

this.width = canvas.width;
this.height = canvas.height;

this.running = false;

this.score = 0;
this.coins = 0;

this.speed = 4;

this.player = new Player(this);
new InputHandler(this);

this.obstacles = new ObstacleManager(this);
this.coins = new CoinManager(this);
this.coinCount = 0;
this.setupStart();
this.trackOffset = 0;
document.getElementById("restartBtn")
.addEventListener("click", () => this.restartGame());

}
restartGame(){

this.score = 0;

this.coinCount = 0;

this.speed = 4;

this.obstacles.obstacles = [];

this.coins.coins = [];

this.running = true;

document.getElementById("gameOverScreen")
.classList.add("hidden");

}
setupStart(){

window.addEventListener("keydown",(e)=>{

if(e.code === "Space" && !this.running){

this.startGame();

}

});

}

startGame(){

this.running = true;

document.getElementById("startScreen").style.display="none";

}

update(deltaTime){

if(!this.running) return;

this.score += this.speed * 0.05;

this.speed = 4 + Math.floor(this.score / 200);

this.trackOffset += this.speed;

if(this.trackOffset > 40){
this.trackOffset = 0;
}

this.player.update();

this.obstacles.update();

this.coins.update();

this.checkCollisions();

document.getElementById("score").innerText =
"Score: " + Math.floor(this.score);

document.getElementById("coins").innerText =
"Coins: " + this.coinCount;

}

draw(){

this.ctx.clearRect(0,0,this.width,this.height);

if(!this.running) return;

this.drawTrack();


this.player.draw(this.ctx);

this.obstacles.draw(this.ctx);

this.coins.draw(this.ctx);

}
checkCollisions(){

this.obstacles.obstacles.forEach(obstacle => {

if(checkCollision(this.player, obstacle)){

this.running = false;

document.getElementById("gameOverScreen")
.classList.remove("hidden");

document.getElementById("finalScore")
.innerText = "Score: " + Math.floor(this.score);

}

});

}
drawTrack(){

const ctx = this.ctx;

ctx.fillStyle = "#333";

ctx.fillRect(0,0,this.width,this.height);


ctx.strokeStyle = "#555";
ctx.lineWidth = 4;

for(let i=-20;i<20;i++){

const y = i*40 + this.trackOffset;

ctx.beginPath();

ctx.moveTo(0,y);

ctx.lineTo(this.width,y);

ctx.stroke();

}

}
}