let handPose;
let video;
let hands = [];
let debug = false;  // Toggle for showing hand tracking points

// Game objects
const puck = {
  x: 300,
  y: 200,
  r: 10,
  speedx: 2,
  speedy: 3,
  maxSpeed: 8,
  speedIncrease: 1.1
};

const paddle = {
  ly: 200,
  ry: 200,
  chunk: 20,
  tall: 80,
  speed: 6
};

const score = {
  left: 0,
  right: 0,
  winScore: 5
};

let gameState = 'playing';

function preload() {
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(640, 480);
  
  // Setup video capture
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  
  // Start hand detection
  handPose.detectStart(video, gotHands);
  
  textAlign(CENTER, CENTER);
  resetPuck();
}

function gotHands(results) {
  hands = results;
}

function draw() {
  // Draw video feed if in debug mode
  if (debug) {
    image(video, 0, 0, width, height);
  } else {
    background(0);
  }
  
  drawField();
  drawPaddles();
  
  if (gameState === 'playing') {
    handleHandControl();
    updateGame();
  }
  
  drawScore();
  
  if (gameState === 'gameover') {
    drawGameOver();
  }
  
  // Draw hand tracking points in debug mode
  if (debug) {
    drawHandPoints();
  }
}

function handleHandControl() {
  for (let hand of hands) {
    // Get index finger tip position
    const indexTip = hand.keypoints[8];  // Index fingertip keypoint
    
    // Determine if this is the left or right hand using x position
    if (indexTip.x < width/2) {
      // Left hand controls left paddle
      paddle.ly = constrain(indexTip.y - paddle.tall/2, 0, height - paddle.tall);
    } else {
      // Right hand controls right paddle
      paddle.ry = constrain(indexTip.y - paddle.tall/2, 0, height - paddle.tall);
    }
  }
  
  // Keyboard controls as fallback
  if (keyIsDown(UP_ARROW)) paddle.ry = max(0, paddle.ry - paddle.speed);
  if (keyIsDown(DOWN_ARROW)) paddle.ry = min(height - paddle.tall, paddle.ry + paddle.speed);
  if (keyIsDown(87)) paddle.ly = max(0, paddle.ly - paddle.speed);  // 'W'
  if (keyIsDown(83)) paddle.ly = min(height - paddle.tall, paddle.ly + paddle.speed);  // 'S'
}

function drawHandPoints() {
  for (let hand of hands) {
    for (let keypoint of hand.keypoints) {
      fill(0, 255, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 10);
    }
  }
}

function drawField() {
  stroke(255, 255, 255, 100);
  setLineDash([5, 15]);
  line(width/2, 0, width/2, height);
  setLineDash([]);
  
  noFill();
  circle(width/2, height/2, 100);
}

function drawPaddles() {
  fill(255);
  rect(0, paddle.ly, paddle.chunk, paddle.tall);
  rect(width - paddle.chunk, paddle.ry, paddle.chunk, paddle.tall);
}

function updateGame() {
  puck.x += puck.speedx;
  puck.y += puck.speedy;
  
  // Wall collisions
  if (puck.y - puck.r < 0 || puck.y + puck.r > height) {
    puck.speedy *= -1;
  }
  
  // Paddle collisions
  if (puck.x + puck.r >= width - paddle.chunk && 
      puck.y >= paddle.ry && 
      puck.y <= paddle.ry + paddle.tall) {
    handlePaddleHit('right');
  }
  
  if (puck.x - puck.r <= paddle.chunk && 
      puck.y >= paddle.ly && 
      puck.y <= paddle.ly + paddle.tall) {
    handlePaddleHit('left');
  }
  
  // Scoring
  if (puck.x < 0) {
    score.right++;
    handleScore('right');
  }
  if (puck.x > width) {
    score.left++;
    handleScore('left');
  }
  
  // Draw puck
  fill(255);
  circle(puck.x, puck.y, puck.r * 2);
}

function handlePaddleHit(side) {
  puck.speedx *= -1;
  
  puck.speedx = min(puck.speedx * puck.speedIncrease, puck.maxSpeed);
  puck.speedy = min(puck.speedy * puck.speedIncrease, puck.maxSpeed);
  
  const paddleY = side === 'right' ? paddle.ry : paddle.ly;
  const relativeIntersectY = (paddleY + (paddle.tall/2)) - puck.y;
  const normalizedIntersectY = relativeIntersectY / (paddle.tall/2);
  const bounceAngle = normalizedIntersectY * 0.75;
  
  puck.speedy = -bounceAngle * Math.abs(puck.speedx);
}

function handleScore(side) {
  if (score[side] >= score.winScore) {
    gameState = 'gameover';
  } else {
    resetPuck();
  }
}

function drawScore() {
  textSize(32);
  fill(255);
  text(score.left, width/4, 50);
  text(score.right, (width/4) * 3, 50);
}

function drawGameOver() {
  fill(255, 255, 0);
  textSize(32);
  text(
    `${score.left > score.right ? 'Left' : 'Right'} player wins!`,
    width/2,
    height/2
  );
  
  textSize(16);
  text('Press SPACE to play again', width/2, height/2 + 40);
  
  if (keyIsDown(32)) {
    score.left = 0;
    score.right = 0;
    resetPuck();
    gameState = 'playing';
  }
}

function resetPuck() {
  puck.x = width/2;
  puck.y = height/2;
  puck.speedx = (Math.random() > 0.5 ? 1 : -1) * 2;
  puck.speedy = (Math.random() * 2 - 1) * 3;
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}

// Toggle debug mode with 'D' key
function keyPressed() {
  if (key === 'd' || key === 'D') {
    debug = !debug;
  }
}  