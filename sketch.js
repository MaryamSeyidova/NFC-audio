let particles = [];
let particleCount = 6000;
let t = 0;

let pmx = 0;
let pmy = 0;

// ===== p5.sound oscillator =====
let osc;  
let filter;
let soundStarted = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // background(255, 0, 0);

  // create oscillator (will start on first click)
  osc = new p5.Oscillator('triangle');
  osc.amp(0); // start silent

  // warm, softer sound by filtering the oscillator
  filter = new p5.LowPass();
  osc.disconnect();
  osc.connect(filter);
  filter.connect();
  filter.freq(900);
  filter.res(0.25);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: 0,
      vy: 0
    });
  }

  pmx = mouseX;
  pmy = mouseY;

  // optional instruction
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text("Click anywhere to enable sound", width / 2, height / 2);
}

function draw() {
  noStroke();
  fill(35, 0, 0); // color bg
  rect(0, 0, width, height);

  let flowScale = map(mouseY, 0, height, 0.0006, 0.004);
  let chaos = map(mouseX, 0, width, 0.8, 3.2);

  let mouseSpeed = dist(mouseX, mouseY, pmx, pmy);
  let thickness = constrain(mouseSpeed * 0.05, 0.5, 2.5);

  stroke(255, 70);
  strokeWeight(thickness);

  for (let p of particles) {
    let angle =
      noise(p.x * flowScale, p.y * flowScale, t) *
      TWO_PI *
      chaos;

    let fx = cos(angle);
    let fy = sin(angle);

    let dx = mouseX - p.x;
    let dy = mouseY - p.y;
    let d = sqrt(dx * dx + dy * dy) + 0.001;

    if (d < 200) {
      let force = (200 - d) / 200;
      fx += dx / d * force * 0.4;
      fy += dy / d * force * 0.4;
    }

    p.vx = p.vx * 0.85 + fx * 0.5;
    p.vy = p.vy * 0.85 + fy * 0.5;

    let px = p.x;
    let py = p.y;

    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;

    // line trail
    line(px, py, p.x, p.y);

    // emergent shapes
    let speed = sqrt(p.vx * p.vx + p.vy * p.vy);

    if (speed > 1.5 && random() < 0.02 * chaos) {
      push();
      translate(p.x, p.y);
      rotate(angle);
      noFill();
      stroke(255, 120);
      strokeWeight(1);

      let s = speed * 4;
      beginShape();
      vertex(-s, 0);
      vertex(0, -s);
      vertex(s, 0);
      vertex(0, s);
      endShape(CLOSE);
      pop();
    }
  }

  pmx = mouseX;
  pmy = mouseY;
  t += 0.003;

  // handle generative sound
  handleSound();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// =======================================
//  center shape reacting X & Y mouse movement
// =======================================

let lastMouseSpeed = 0;
let centerAlpha = 0;

function mouseMoved() {
  lastMouseSpeed = dist(mouseX, mouseY, pmouseX, pmouseY);
}

p5.prototype.registerMethod("post", () => {
  // fade in/out
  if (lastMouseSpeed > 0.5) {
    centerAlpha += 8;
  } else {
    centerAlpha -= 4;
  }
  centerAlpha = constrain(centerAlpha, 0, 255);

  if (centerAlpha <= 0) return;

  push();
  translate(width / 2, height / 2);

  // vertical movement → size
  let dy = mouseY - pmouseY;
  let baseSize = map(abs(dy), 0, 50, 60, 260, true);

  // horizontal movement → color
  let dx = mouseX - pmouseX;
  let palette = [
    color(0, 120, 255),    // bright blue
    color(255, 255, 255),  // white
    color(255, 220, 0),    // yellow
    color(0, 200, 255),    // cyan
    color(255, 0, 255),    // magenta
    color(230, 40, 40),    // red
    color(255, 140, 0)     // orange
  ];
  let idx = floor(map(dx, -width/2, width/2, 0, palette.length)) % palette.length;
  if(idx < 0) idx += palette.length;
  let nextIdx = (idx + 1) % palette.length;
  let mix = (sin(frameCount * 0.03) + 1) * 0.5;
  let col = lerpColor(palette[idx], palette[nextIdx], mix);

  stroke(col.levels[0], col.levels[1], col.levels[2], centerAlpha);
  strokeWeight(50);

  // rotation grows with overall speed
  let spd = constrain(lastMouseSpeed, 0, 40);
  rotate(frameCount * map(spd, 0, 40, 0.002, 0.03));

  rectMode(CENTER);
  rect(0, 0, baseSize, baseSize);

  pop();
});

// =======================================
//   SOUND FUNCTION
// =======================================

function handleSound() {
  if (!soundStarted) return; // wait for click

  // speed → volume, reduced significantly for a much quieter sound
  let speed = lastMouseSpeed;
  let vol = map(speed, 0, 40, 0, 0.06, true);

  // vertical movement → lower, warmer frequency range
  let freq = map(mouseY, 0, height, 240, 80);

  // horizontal movement → panning
  let pan = map(mouseX, 0, width, -1, 1);

  // warm the tone by rolling off higher frequencies
  filter.freq(map(mouseY, 0, height, 1200, 350));
  filter.res(0.35);

  if (speed > 0.10) {
    osc.freq(freq);
    osc.amp(vol, 0.08); // gentler fade in
    osc.pan(pan);
  } else {
    osc.amp(0, 0.15); // smoother fade out
  }
}

// 🎵 SOUND: unlock audio on first click
function mousePressed() {
  if (!soundStarted) {
    userStartAudio(); // unlock audio in browser
    osc.start();      // start oscillator
    osc.amp(0);       // start silent
    soundStarted = true;
  }
}
