export default class ObstacleManager {

constructor(game){

this.game = game;

this.obstacles = [];

this.spawnTimer = 0;
this.patterns = [
[1,0,1],
[0,1,0],
[1,0,0],
[0,0,1],
[1,1,0],
[0,1,1]
];
}

spawnObstacle(){

const pattern =
this.patterns[Math.floor(Math.random()*this.patterns.length)];

for(let lane=0; lane<3; lane++){

if(pattern[lane] === 1){

const obstacle = {

width:50,
height:50,

x:this.game.player.lanes[lane],

y:-50

};

this.obstacles.push(obstacle);

}

}

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

ctx.fillStyle = "#ff0066";
ctx.shadowColor = "#ff0066";
ctx.shadowBlur = 15;
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