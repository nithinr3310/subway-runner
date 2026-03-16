export default class Player{

constructor(game){

this.game = game;

this.width = 50;
this.height = 80;

this.lanes = [300,450,600];

this.currentLane = 1;

this.x = this.lanes[this.currentLane];

this.y = 400;

this.velocityY = 0;

this.gravity = 0.6;

this.isJumping = false;

this.isSliding = false;

}

moveLeft(){

if(this.currentLane > 0){

this.currentLane--;

this.x = this.lanes[this.currentLane];

}

}

moveRight(){

if(this.currentLane < 2){

this.currentLane++;

this.x = this.lanes[this.currentLane];

}

}

jump(){

if(!this.isJumping){

this.velocityY = -12;

this.isJumping = true;

}

}

slide(){

this.isSliding = true;

setTimeout(()=>{

this.isSliding = false;

},600);

}

update(){

this.y += this.velocityY;

this.velocityY += this.gravity;

if(this.y >= 400){

this.y = 400;

this.velocityY = 0;

this.isJumping = false;

}

}

draw(ctx){

ctx.fillStyle = "cyan";

ctx.fillRect(

this.x - this.width/2,

this.y - this.height,

this.width,

this.height

);

}

}