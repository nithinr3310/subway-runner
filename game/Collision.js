export default function checkCollision(a, b) {

return (

a.x - a.width/2 < b.x + b.width/2 &&
a.x + a.width/2 > b.x - b.width/2 &&
a.y - a.height < b.y + b.height &&
a.y > b.y

);

}