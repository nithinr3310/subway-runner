import Game from "./game/Game.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 500;

const game = new Game(canvas, ctx);

let lastTime = 0;

function gameLoop(timeStamp){

const deltaTime = timeStamp - lastTime;
lastTime = timeStamp;

game.update(deltaTime);
game.draw();

requestAnimationFrame(gameLoop);

}

requestAnimationFrame(gameLoop);