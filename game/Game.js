import Player from "./Player.js";
import InputHandler from "./InputHandler.js";

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

this.score += 0.1;

this.player.update();

document.getElementById("score").innerText =
"Score: " + Math.floor(this.score);

}

draw(){

this.ctx.clearRect(0,0,this.width,this.height);

if(!this.running) return;

this.player.draw(this.ctx);

}

}