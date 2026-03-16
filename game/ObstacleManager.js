export default class ObstacleManager {

constructor(game){

this.game = game;

this.obstacles = [];

this.spawnTimer = 0;

}

spawnObstacle(){

const lane = Math.floor(Math.random() * 3);

const obstacle = {

width:50,
height:50,

x:this.game.player.lanes[lane],

y:-50

};

this.obstacles.push(obstacle);

}

update(){

this.spawnTimer++;

if(this.spawnTimer > 120){

this.spawnObstacle();

this.spawnTimer = 0;

}

this.obstacles.forEach(obstacle =>{

obstacle.y += this.game.speed;

// remove obstacles that leave screen
this.obstacles = this.obstacles.filter(
obstacle => obstacle.y < this.game.height + 100
);

});

}

draw(ctx){

ctx.fillStyle = "red";

this.obstacles.forEach(obstacle =>{

ctx.fillRect(

obstacle.x - obstacle.width/2,
obstacle.y,
obstacle.width,
obstacle.height

);

});

}

}