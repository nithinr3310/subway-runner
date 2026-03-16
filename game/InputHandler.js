export default class InputHandler{

constructor(game){

window.addEventListener("keydown",(e)=>{

switch(e.key){

case "ArrowLeft":
game.player.moveLeft();
break;

case "ArrowRight":
game.player.moveRight();
break;

case "ArrowUp":
game.player.jump();
break;

case "ArrowDown":
game.player.slide();
break;

}

});

}

}