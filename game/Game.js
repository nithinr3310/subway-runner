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

this.player.update();

this.obstacles.update();

this.coins.update();

this.checkCollisions();

this.speed = 4 + Math.floor(this.score / 200);

document.getElementById("score").innerText =
"Score: " + Math.floor(this.score);

document.getElementById("coins").innerText =
"Coins: " + this.coinCount;

}

draw(){

this.ctx.clearRect(0,0,this.width,this.height);

if(!this.running) return;

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
}