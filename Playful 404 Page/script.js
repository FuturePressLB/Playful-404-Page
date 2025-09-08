const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');

let gameStarted = false;
let currentLevel = 0;

// Player physics
const gravity = 0.7;
const jumpStrength = -15;
let canDoubleJump = false;
const player = {
  x: 100,
  y: canvas.height - 150,
  width: 30,
  height: 60,
  color: '#ff4444',
  dy: 0,
  onGround: false
};

// Levels
const levels = [
  {
    platforms: [
      {x:0, y: canvas.height - 50, width: canvas.width, height:50, color:'#555'},
      {x:300, y: canvas.height - 150, width: 200, height:20, color:'#555'},
      {x:600, y: canvas.height - 200, width:200, height:20, color:'#555'},
      {x:900, y: canvas.height - 250, width:200, height:20, color:'#555'}
    ],
    keys: [
      {x:320, y: canvas.height - 180, size: 20},
      {x:650, y: canvas.height - 230, size:20}
    ],
    obstacles: [
      {platformIndex:1, xOffset:80, width:40, color:'#444444'},
      {platformIndex:2, xOffset:120, width:40, color:'#444444'}
    ],
    door: {platformIndex:3, width:40, height:80, color:'#00ff00'}
  },
  {
    platforms: [
      {x:0, y: canvas.height - 50, width: canvas.width, height:50, color:'#555'},
      {x:300, y: canvas.height - 180, width: 200, height:20, color:'#555'},
      {x:650, y: canvas.height - 250, width:200, height:20, color:'#555'},
      {x:1000, y: canvas.height - 200, width:250, height:20, color:'#555'}
    ],
    keys: [
      {x:370, y: canvas.height - 210, size:20},
      {x:650, y: canvas.height - 280, size:20},
      {x:1080, y: canvas.height - 230, size:20}
    ],
    obstacles: [
      {platformIndex:1, xOffset:150, width:40, color:'#ff4444'},
      {platformIndex:2, xOffset:50, width:40, color:'#ff4444'},
      {platformIndex:3, xOffset:150, width:40, color:'#ff4444'}
    ],
    door: {platformIndex:3, width:40, height:80, color:'#00ff00'}
  },
  {
    platforms: [
      {x:0, y: canvas.height - 50, width: canvas.width, height:50, color:'#555'},
      {x:250, y: canvas.height - 200, width: 200, height:20, color:'#555'},
      {x:500, y: canvas.height - 250, width:200, height:20, color:'#555'},
      {x:750, y: canvas.height - 180, width:250, height:20, color:'#555'},
      {x:1050, y: canvas.height - 230, width:200, height:20, color:'#555'}
    ],
    keys: [
      {x:280, y: canvas.height - 230, size:20},
      {x:530, y: canvas.height - 280, size:20},
      {x:770, y: canvas.height - 210, size:20},
      {x:1080, y: canvas.height - 260, size:20}
    ],
    obstacles: [
      {platformIndex:1, xOffset:60, width:40, color:'#8800ff'},
      {platformIndex:2, xOffset:100, width:40, color:'#8800ff'},
      {platformIndex:3, xOffset:90, width:40, color:'#8800ff'},
      {platformIndex:4, xOffset:60, width:40, color:'#8800ff'}
    ],
    door: {platformIndex:4, width:40, height:80, color:'#00ff00'}
  }
];

let platforms = [];
let keys = [];
let obstacles = [];
let door = null;
let score = 0;
let doorOpen = false;

// Controls
const keysPressed = {};
document.addEventListener('keydown', e => keysPressed[e.key] = true);
document.addEventListener('keyup', e => keysPressed[e.key] = false);

// Start game
startBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
  gameStarted = true;
  currentLevel = 0;
  loadLevel(currentLevel);
});

// Load level (reset state fully)
function loadLevel(levelIndex){
  const lvl = levels[levelIndex];
  platforms = lvl.platforms.map(p => ({...p}));
  keys = lvl.keys.map(k => ({...k, collected:false}));
  obstacles = lvl.obstacles.map(o=>{
    const plat = platforms[o.platformIndex];
    return {
      x: plat.x + o.xOffset,
      y: plat.y,
      width: o.width,
      color: o.color
    };
  });
  const plat = platforms[lvl.door.platformIndex];
  door = {
    x: plat.x + plat.width - lvl.door.width,
    y: plat.y - lvl.door.height,
    width: lvl.door.width,
    height: lvl.door.height,
    color: lvl.door.color
  };
  score = 0;
  doorOpen = false;
  player.x = 100;
  player.y = canvas.height - 150;
  player.dy = 0;
  player.onGround = false;
  canDoubleJump = false;
  updateUI();
}

// Update UI
function updateUI(){
  scoreDisplay.textContent = `Keys: ${score} / ${keys.length}`;
  levelDisplay.textContent = `Level: ${currentLevel+1}`;
}

// Draw functions
function drawPlayer(){
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawPlatforms(){
  platforms.forEach(p=>{
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x,p.y,p.width,p.height);
  });
}

// Draw key shapes (non-rotating)
function drawKeys(){
  keys.forEach(k=>{
    if(!k.collected){
      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.fillStyle='gold';

      // Key head (circle)
      ctx.beginPath();
      ctx.arc(k.size/2, k.size/2, k.size/2, 0, Math.PI*2);
      ctx.fill();

      // Shaft (rectangle)
      ctx.fillRect(k.size, k.size/3, k.size, k.size/3);

      // Teeth (two small rectangles)
      ctx.fillRect(k.size*1.75, k.size/3, k.size/4, k.size/6);
      ctx.fillRect(k.size*1.75, k.size/2, k.size/4, k.size/6);

      ctx.restore();
    }
  });
}

function drawObstacles(){
  obstacles.forEach(o=>{
    const spikeHeight = o.width;
    ctx.fillStyle=o.color;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(o.x + o.width/2, o.y - spikeHeight);
    ctx.lineTo(o.x + o.width, o.y);
    ctx.closePath();
    ctx.fill();
  });
}

function drawDoor(){
  ctx.fillStyle = doorOpen ? '#00ffcc' : door.color;
  ctx.fillRect(door.x, door.y, door.width, door.height);
}

// Main loop
function animate(){
  if(!gameStarted) return requestAnimationFrame(animate);

  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(keysPressed['ArrowLeft']) player.x -= 6;
  if(keysPressed['ArrowRight']) player.x += 6;

  if(keysPressed['ArrowUp']){
    if(player.onGround){
      player.dy = jumpStrength;
      player.onGround = false;
      canDoubleJump = true;
    } else if(canDoubleJump){
      player.dy = jumpStrength;
      canDoubleJump = false;
    }
    keysPressed['ArrowUp']=false;
  }

  player.dy += gravity;
  player.y += player.dy;

  player.onGround=false;
  platforms.forEach(p=>{
    if(player.x + player.width > p.x &&
       player.x < p.x + p.width &&
       player.y + player.height > p.y &&
       player.y + player.height < p.y + player.dy + 10){
         player.y = p.y - player.height;
         player.dy=0;
         player.onGround=true;
         canDoubleJump=true;
    }
  });

  drawPlatforms();
  drawKeys();
  drawObstacles();
  drawDoor();
  drawPlayer();

  // Key collection
  keys.forEach(k=>{
    if(!k.collected &&
       player.x < k.x + k.size &&
       player.x + player.width > k.x &&
       player.y < k.y + k.size &&
       player.y + player.height > k.y){
         k.collected=true;
         score++;
         updateUI();
    }
  });

  // Door check
  if(score === keys.length &&
     player.x + player.width > door.x &&
     player.x < door.x + door.width &&
     player.y + player.height > door.y &&
     player.y < door.y + door.height &&
     !doorOpen){
       
       doorOpen = true;
       currentLevel++;

       if(currentLevel >= levels.length){
         overlay.style.display='block';
         overlay.querySelector('p').textContent='🎉 You completed all levels! Click Start to play again.';
         currentLevel = 0; 
         gameStarted = false; 
       } else {
         setTimeout(()=>{
           loadLevel(currentLevel);
         },500);
       }
  }

  // Obstacle collision
  obstacles.forEach(o=>{
    const spikeHeight = o.width;
    if(player.x + player.width > o.x &&
       player.x < o.x + o.width &&
       player.y + player.height > o.y - spikeHeight &&
       player.y < o.y){
         gameStarted=false;
         overlay.style.display='block';
         overlay.querySelector('p').textContent='You hit a spike! Click Start to retry.';
         loadLevel(currentLevel);
    }
  });

  // Fall off
  if(player.y > canvas.height){
    gameStarted=false;
    overlay.style.display='block';
    overlay.querySelector('p').textContent='You fell! Click Start to retry.';
    loadLevel(currentLevel);
  }

  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize',()=>{
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
});
