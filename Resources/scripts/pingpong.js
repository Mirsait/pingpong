'use strict';

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame   ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback, element){
                window.setTimeout(callback, 1000 / 60);
            };
})();

window.cancelAnimFrame = (function () {
    return  window.cancelAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            window.oCancelAnimationFrame ||
            window.msCancelAnimationFrame ||
            function (callback) {
        window.clearTimeout(callback);
    };
})();

var Game = {
    playerName: 'user',
    players: [2],
    playerScore: 0, // current player score
    overScore: 0, //score after gameover
    ball: {},
    playerLevel: 0,
    overLevel: 0,
    score: {},
    isPlay: false,
    isGameOver: false,
    startMenu: {},
    particles: [],
    particlesCount: 20,
    particlej: {},
    isEmit: false
};
Game.reset = function () {
    this.ball.x = GameArea.canvas.width/2;
    this.ball.y = GameArea.canvas.height/2;
    this.ball.speedX = 5 ;
    this.ball.speedY = 5;
    this.playerScore = 0;
    this.playerLevel = 0;
    this.ball.color = 'white';
};


function startGame() {
    GameArea.start();

    //load images
    Cache.load('logo_1000_1000.png');
    //Cache.load('field_1000_1000.png');
    Cache.load('gameover_1000_1000.png');

    //create games elements
    Game.players[0] = new Player(3, 120, 10, GameArea.canvas.width/7, "#f11");
    Game.players[1] = new Player(GameArea.canvas.width - 13, 120, 10, GameArea.canvas.width/7,"#1f1");
    Game.ball = new Ball(200, 200, 5, 5, "white");
    Game.score = new Score(15, 30, "20px", "Rotonda", "darkorange");
    Game.startMenu = new Menu();

    updateGameArea();
};

var Cache = {
    bgi: [],
    load: function ( file) {
        let ctx = GameArea.context;
        let img = new Image();
        img.src = 'Resources/images/' + file;
        this.bgi.push(img);
    }
};
function drawCacheImg(img, ctx) {
    ctx.drawImage(img, (Math.floor(GameArea.canvas.width - GameArea.canvas.height)/2),-70 , GameArea.canvas.height, GameArea.canvas.height);
};


var GameArea = {
    canvas: document.getElementById('game_canvas'),
    collision: document.getElementById('collide'),
    collideWall: document.getElementById('collideWall'),
    gameOverSound: document.getElementById('game_over'),
    btnClickSound: document.getElementById('btnClick'),
    background: '#232',
    startBackground: '#fff',
    gameOverBackground: '#fff',

    start: function () {
        this.canvas.width = 650;
        this.canvas.height = Math.floor(this.canvas.width*2/3);
        this.context = this.canvas.getContext('2d');

        window.addEventListener('keydown', function (e) {
            GameArea.key = e.keyCode;
        });
        window.addEventListener('keyup', function (e) {
            GameArea.key = false;
        });
        this.canvas.addEventListener("mousedown", btnClick, true);
    },

    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    draw: function () {
        let ctx = this.context;
        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.canvas.width/2-1, 0, 2, this.canvas.height);
    }
};


function updateGameArea() {

    if (Game.isPlay) {
        GameArea.clear();
        GameArea.draw();
        Game.ball.move();

        for (let j = 0; j < Game.players.length; j += 1){
            if (GameArea.key && GameArea.key == 40) {
                Game.players[j].y += 11;
            };
            if (GameArea.key && GameArea.key == 38) {
                Game.players[j].y -= 11;
            };
            Game.players[j].move();

            if(collision(Game.ball, Game.players[j])){
                Game.isEmit = true;
                Game.particlej.x = Game.ball.x;
                Game.particlej.y = Game.ball.y;
                Game.particlej.color = Game.players[j].color;
                Game.ball.color = Game.players[j].color;
                Game.playerScore +=1;
                if(Game.playerScore % 4 == 0){
                  Game.ball.speedX *= 1 + Math.random() * 0.2;
                  Game.ball.speedY *= 1 + Math.random() * 0.2;
                  Game.playerLevel +=1;
                };
                //audio collide
                GameArea.collision.currentTime = 0;
                GameArea.collision.play();
                Game.ball.speedX = - Game.ball.speedX;
            };
            Game.players[j].draw();
        };

        if (Game.isEmit) {
            let m = (Game.particlej.x > GameArea.canvas.width/2) ? -1 : 1;
            Game.particles = createParticles(Game.particlej.x, Game.particlej.y, Game.particlesCount, m, Game.particlej.color);
        };

        Game.score.update(Game.playerScore, Game.playerLevel);
        emitParticles(Game.particles);
        Game.isEmit = false;
        Game.ball.draw();
        Game.score.draw();

        if(Game.isGameOver){
            GameArea.gameOverSound.currentTime = 0;
            GameArea.gameOverSound.play();
        };
    }
    else {
        Game.startMenu.draw();
        goEnter();
    };

    requestAnimFrame(updateGameArea);
};



function Ball(x, y, v, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.speedX = v;
    this.speedY = v;
};
Ball.prototype.draw = function () {
    let ctx = GameArea.context;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.shadowBlur = 0;
};
Ball.prototype.move = function () {
    this.x += this.speedX;
    this.y += this.speedY;
    if(this.y - this.radius < 0 || this.y+this.radius > GameArea.canvas.height){
        this.speedY = -this.speedY;
    GameArea.collideWall.currentTime = 0;
    GameArea.collideWall.play();
    };

    if (this.x - this.radius < 0 || this.x+this.radius > GameArea.canvas.width) {
        this.speedX = -this.speedX;
        Game.isPlay = false;
        Game.isGameOver = true;
        Game.overScore = Game.playerScore;
        Game.overLevel = Game.playerLevel;
        Game.reset();
    };
};



function Player(x, y, width, height, color) {
    this.color = color;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
};
Player.prototype.draw = function () {
    let ctx = GameArea.context;
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.arc( this.x + this.width/2, this.y, this.width/2, 0, Math.PI, true);
    ctx.arc( this.x + this.width/2, this.y + this.height, this.width/2, Math.PI, 0, true);
    ctx.fill();
    ctx.shadowBlur = 0;
};
Player.prototype.move =function () {
    if (this.y < 0) {
        this.y = 0;
    }
    if (this.y + this.height > GameArea.canvas.height){
        this.y = GameArea.canvas.height - this.height;
    }
};



function Particle(x, y, m, color){
    this.x = x || 0;
    this.y = y || 0;
    this.color = color || 'white';
    this.radius = 3;
    this.speedX = m * Math.random() * 2;
    this.speedY = -1.5 + Math.random() * 3;
};
function createParticles(x, y, count, m, color){
    let particles = [];
    for (let i = 0; i < count; i+=1) {
        particles.push(new Particle(x, y, m, color));
    };
    return particles;
};
function emitParticles(particles) {
    let p;
    for (let i=0, count = particles.length; i<count; i+=1) {
        p = particles[i];
        let ctx = GameArea.context;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        if(p.radius > 0){
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2, false);
        };
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;
        p.radius = Math.max(p.radius - 0.05, 0.0);
    }
};


function Score(x, y, size, font, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.font = font;
    this.text = '1';
};
Score.prototype.update = function(score, level) {
    this.text = 'Очки: ' + score + '    Уровень: '+ level;
};
Score.prototype.draw = function () {
    let ctx = GameArea.context;
    ctx.font = this.size + " " + this.font;
    ctx.textAlign = 'left';
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x + 20, this.y);
    ctx.restore();
};


function collision(ball, obj) {
    if(ball.x + ball.radius > obj.x && ball.x - ball.radius < obj.x+obj.width &&
        ball.y+ball.radius>obj.y && ball.y < obj.y+obj.height){
        return true;
    };
    return false;
};


function Menu() {
    this.btnStart = new Button(
        GameArea.canvas.width/2, GameArea.canvas.height/2+100, 40,
            '   СТАРТ   ', 'orange', 'orange', '#fff'
    );
    this.btnRestart = new Button(
        GameArea.canvas.width/2, GameArea.canvas.height/2+100, 40,
            'ПЕРЕИГРАТЬ', '#fff', 'red', '#f00'
    );
    this.btnAuthor = new Button(
        GameArea.canvas.width/2, GameArea.canvas.height/2+50, 40,
            'Автор', 'orange', 'orange', '#111'
    );
};
Menu.prototype.draw = function() {
    let ctx = GameArea.context;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, GameArea.canvas.width, GameArea.canvas.height);
    if (Game.isGameOver){
        gameOverMenu();
        this.btnRestart.draw();
    }
    else {
        gameStartMenu();
        this.btnStart.draw();
    };
};



function Button(x, y, height, text, colorT, colorS, bgcolor) {
    this.width = text.length*20 + 40;
    this.height = height;
    this.x = x - this.width/2;
    this.y = y - this.height/2;
    this.text = text;
    this.colorT = colorT;
    this.colorS = colorS;
    this.bgcolor = bgcolor;
};
Button.prototype.draw = function () {
    let ctx = GameArea.context;
    ctx.lineWidth = "6";
    ctx.strokeStyle = this.colorS;
    ctx.fillStyle = this.bgcolor;
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = this.colorT;
    ctx.font = "22px Rotonda";
    ctx.fillText(this.text, this.x+this.width/2, this.y+22)
};

function btnClick(e) {
  // Variables for storing mouse position on click
    let mx = e.pageX,
        my = e.pageY;

  // Click start button
    if(mx >= Game.startMenu.btnStart.x &&
        mx <= Game.startMenu.btnStart.x + Game.startMenu.btnStart.width) {

    GameArea.btnClickSound.currentTime = 0;
    GameArea.btnClickSound.play();

    Game.isPlay = true;
    Game.isGameOver = false;
  }
};

function goEnter() {
    if (GameArea.key && GameArea.key == 13) {
        GameArea.btnClickSound.currentTime = 0;
        GameArea.btnClickSound.play();
        Game.isPlay = true;
        Game.isGameOver = false;
    }
};

function gameOverMenu() {
    let ctx = GameArea.context;
    //clear
    ctx.fillStyle = GameArea.gameOverBackground;
    ctx.fillRect(0, 0, GameArea.canvas.width, GameArea.canvas.height);
    //DrawImage Background
    drawCacheImg(Cache.bgi[1], ctx);

    ctx.fillStyle = "#333";
    ctx.font = "24px Rotonda";
    ctx.textAlign = "center";
    ctx.fillText("Игра окончена на "+ Game.overLevel+" уровне. " +
        "Вы набрали "+ Game.overScore +" очков!", GameArea.canvas.width/2, 120 );
    cancelAnimFrame(updateGameArea);
};

function gameStartMenu() {
    let ctx = GameArea.context;
    //clear
    ctx.fillStyle = GameArea.startBackground;
    ctx.fillRect(0, 0, GameArea.canvas.width, GameArea.canvas.height);
    //DrawImage Background
    drawCacheImg(Cache.bgi[0], ctx);

    ctx.fillStyle = "green";
    ctx.font = "12px Rotonda";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let text = 'Enter - старт/рестарт, клавиши Up/Down - движение вверх/вниз';
    ctx.fillText(text, GameArea.canvas.width/2, GameArea.canvas.height - 50);
};


startGame();
