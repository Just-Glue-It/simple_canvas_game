// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

var loadImage = function (src) {
  var image = {
    ready: false,
		img: new Image()
  };
  image.img.onload = function() {
    image.ready = true;
  };
  image.img.src = src;
  return image;
};

var loadAudio = function (src) {
  return new Audio(src);
};

var bgImage = loadImage("images/background.jpg");
var heroImage = loadImage("images/hero.gif");
var monsterImage = loadImage("images/monster.gif");

var bgAudio = loadAudio();
var catchSound = loadAudio();
var escSound = loadAudio(); // STILL NEEDS AUDIO FILE

// Game objects
var hero = {
  x: canvas.width / 16,
  y: canvas.height / 2,
  w: 32,
  h: 32
};
var monsters = [];
var bullets = [];

// Handle keyboard controls
var keysDown = {};
var bulletSpeed = 2;

// clicking shoots towards the mouse
canvas.onclick = function (e) {
  shoot(e.pageX, e.pageY);
};

addEventListener("keydown", function (e) {
  keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
  delete keysDown[e.keyCode];
}, false);

setInterval(function () {addMonster();}, 3000);

var addMonster = function () {
  var monster = {
    x: canvas.width,
    y: 32 + (Math.random() * (canvas.height - 64)),
    vx: -1,
    vy: 0,
    w: 32, // image size
    h: 32
  };
  monsters.push(monster);
};

var shoot = function (x, y) {
  if (x > hero.x && x < hero.x + hero.w && y > hero.y && y < hero.y + hero.h) {
    return;
  }
  var dx = x - hero.x;
  var dy = y - hero.y;
  var d = Math.sqrt(dx * dx + dy * dy);

  var vx = dx / d * bulletSpeed;
  var vy = dy / d * bulletSpeed;

  bullets.push({
    x: hero.x + hero.w / 2,
    y: hero.y + hero.h / 2,
    vx: vx,
    vy: vy,
    r: 10
  });
}

var reset = function () {
  monsters = [];
};  // DEPRECATED - as we dont need to eliminate all monsters from screen and hero isn't moving -- soon

var catchMonster = function (monster) {
  localStorage.monstersCaught = Number(localStorage.monstersCaught) + 1;
  catchSound.play();
  console.log('caught a monster', monster);
};

var monsterEscape = function (monster) {
  localStorage.monstersEscaped = Number(localStorage.monstersEscaped) + 1;
  escSound.play();
  console.log('a monster escaped', monster);
};

// Update game objects
var update = function (modifier) {
  var monstersToRemove = [];
  var killedBullets = [];

  // check if bullets are touching monsters
  bullets.forEach(function (bullet) {
    monsters.forEach(function (monster) {
      if (bullet.x + bullet.r >= monster.x
	  && bullet.x <= monster.x + monster.w
	  && bullet.y + bullet.r >= monster.y
	  && bullet.y <= monster.y + monster.h) {
    	// we've hit him
    	catchMonster(monster);
    	monstersToRemove.push(monster);
    	killedBullets.push(bullet);
      }
    });

    if (bullet.x < 0
    || bullet.x > canvas.width
    || bullet.y < 0
    || bullet.y > canvas.height) {
      killedBullets.push(bullet);
    }
  });

  // update bullets
  for (var bullet of bullets) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
  }

  // Are they touching?
  for (var monster of monsters) {
    if (hero.x <= (monster.x + monster.w)
      	&& monster.x <= (hero.x + hero.w)
      	&& hero.y <= (monster.y + hero.h)
      	&& monster.y <= (hero.y + hero.h)) {
      reset();
    }
    monster.x += monster.vx;
    monster.y += monster.vy;
  }

  monsters.forEach(function (monster) {
    if (monster.x <= 0) {
      monsterEscape(monster);
      monstersToRemove.push(monster);
    }
  });

  monstersToRemove.forEach(function (monster) {
    monsters.splice(monsters.indexOf(monster), 1);
  });

  killedBullets.forEach(function (bullet) {
    bullets.splice(bullets.indexOf(bullet), 1);
  });
};

// Draw everything
var render = function () {
  if (bgImage.ready) {
    ctx.drawImage(bgImage.img, 0, 0);
  }

  if (heroImage.ready) {
    ctx.drawImage(heroImage.img, hero.x, hero.y);
  }

  if (monsterImage.ready) {
    for (var monster of monsters) {
      ctx.drawImage(monsterImage.img, monster.x, monster.y);
    }
  }

  for (var bullet of bullets) {
    ctx.fillStyle = "Orange";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.r, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  if (!localStorage.monstersCaught) {
    localStorage.monstersCaught = 0;
  }

  if (!localStorage.monstersEscaped) {
    localStorage.monstersEscaped = 0;
  }

  // Score
  ctx.fillStyle = "rgb(250, 250, 250)";
  ctx.font = "24px Helvetica";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Goblins caught: " + localStorage.monstersCaught + "    escaped: " + localStorage.monstersEscaped, 32, 32);
};

// The main game loop
var main = function () {
  var now = Date.now();
  var delta = now - then;

  update(delta / 1000);
  render();

  then = now;

  // Request to do this again ASAP
  requestAnimationFrame(main);
  bgAudio.play();
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();
reset();
main();
