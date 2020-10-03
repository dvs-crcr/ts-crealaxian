"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var CrealaxianGame = (function () {
    function CrealaxianGame(id, params) {
        var _this = this;
        var _a, _b;
        this.id = id;
        this.params = params;
        this.scores = 0;
        this.level = new Level();
        this.enemies = new Enemies();
        this.getRandomInt = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };
        this.bodies = {
            explosions: [],
            bullets: [],
            enemies: []
        };
        this.container = document.getElementById(id);
        this.container.style.width = (params.width).toFixed() + 'px';
        this.container.style.height = (params.height).toFixed() + 'px';
        var canvas = document.createElement('canvas');
        canvas.width = params.width;
        canvas.height = params.height;
        (_a = this.container) === null || _a === void 0 ? void 0 : _a.appendChild(canvas);
        (_b = this.container) === null || _b === void 0 ? void 0 : _b.setAttribute('tabIndex', '1');
        this.screen = canvas.getContext('2d');
        this.resources = new Resources([
            { type: 'img', name: 'sprite', path: 'assets/img/sprites2.png' },
            { type: 'sound', name: 'shoot', path: 'assets/sound/cc-shoot-laser.wav' },
            { type: 'sound', name: 'enemyShoot', path: 'assets/sound/sfx_weapon_singleshot5.wav' },
            { type: 'sound', name: 'gameOver', path: 'assets/sound/gameover.mp3' },
            { type: 'sound', name: 'hitPlayer', path: 'assets/sound/1.mp3' },
            { type: 'sound', name: 'hitEnemy', path: 'assets/sound/sfx_deathscream_alien3.wav' },
            { type: 'sound', name: 'hitBullet', path: 'assets/sound/sfx_weapon_singleshot5.wav' }
        ]);
        this.kbd = new Keyboard(this.container);
        this.resources.load().then(function (data) {
            if (data === true) {
                _this.init();
            }
        });
    }
    CrealaxianGame.prototype.createPlayer = function () {
        var _a;
        this.bodies.player = new Player(this, {
            src: this.sprite,
            frameNumber: 0,
            frames: [[0, 0], [24, 0], [48, 0]]
        });
        (_a = this.interfaces) === null || _a === void 0 ? void 0 : _a.updateLives();
    };
    CrealaxianGame.prototype.createEnemies = function (level) {
        var _this = this;
        var _a;
        var marginXY = [8, 4];
        var defaultLength = this.enemies.maxWidth + marginXY[1];
        var maxEnemyRowHeight = level.map(function (enemyTypeRow) {
            return Math.max.apply(Math, enemyTypeRow.map(function (enemyType) { return (enemyType !== 0 ? _this.enemies.types[enemyType.toFixed()].height : 0); }));
        });
        var maxEnemiesInRow = Math.max.apply(Math, level.map(function (i) { return (i.length); }));
        var enemiesLength = defaultLength * maxEnemiesInRow;
        var startY = 50;
        if (enemiesLength > this.params.width) {
            console.warn('Game width must be more than ' + enemiesLength);
        }
        for (var row = 0; row < level.length; row++) {
            startY += (row === 0 ? 0 : maxEnemyRowHeight[row] + marginXY[0]);
            var startX = (this.params.width - enemiesLength) / 2;
            for (var el = 0; el < level[row].length; el++) {
                var type = level[row][el].toFixed();
                if (type !== '0') {
                    (_a = this.bodies.enemies) === null || _a === void 0 ? void 0 : _a.push(this.createEnemy([row, el], this.enemies.types[type], {
                        x: startX,
                        y: startY
                    }, defaultLength));
                }
                startX += defaultLength;
            }
        }
    };
    CrealaxianGame.prototype.createEnemy = function (matrix, enemyType, position, defaultLength) {
        return new Enemy(matrix, this, {
            src: this.sprite,
            frameNumber: 0,
            frames: enemyType.frames
        }, {
            width: enemyType.width,
            height: enemyType.height
        }, position, enemyType.speedX, defaultLength, enemyType.shootFx.canShoot, enemyType.shootFx.velocity, enemyType.shootFx.speed, enemyType.shootFx.angle);
    };
    CrealaxianGame.prototype.getExtremes = function () {
        var _a;
        var xArray = (_a = this.bodies.enemies) === null || _a === void 0 ? void 0 : _a.map(function (i) { return i.position.x; });
        return [Math.min.apply(Math, xArray), Math.max.apply(Math, xArray)];
    };
    CrealaxianGame.prototype.enemiesBelow = function (enemy) {
        return this.bodies.enemies.filter(function (b) {
            return b.matrix[0] > enemy.matrix[0] && b.matrix[1] == enemy.matrix[1];
        }).length > 0;
    };
    CrealaxianGame.prototype.createBullet = function (body, playerBullet, frameNumber, angle) {
        var _a;
        if (playerBullet === void 0) { playerBullet = false; }
        if (frameNumber === void 0) { frameNumber = 0; }
        (_a = this.bodies.bullets) === null || _a === void 0 ? void 0 : _a.push(new Bullet(this, body, {
            src: this.sprite,
            frameNumber: frameNumber,
            frames: [[0, 49], [4, 49], [8, 49]]
        }, playerBullet, undefined, undefined, angle));
    };
    CrealaxianGame.prototype.init = function () {
        this.interfaces = new Interfaces(this);
        this.sprite = this.resources.getSrc('img', 'sprite');
        this.interfaces.createLives();
        this.createEnemies(this.level.list[6]);
        this.loop();
    };
    CrealaxianGame.prototype.start = function () {
        var _a;
        this.interfaces.createScores();
        this.bodies.enemies = [];
        this.createEnemies(this.level.current);
        this.createPlayer();
        (_a = this.interfaces) === null || _a === void 0 ? void 0 : _a.deleteStart();
    };
    CrealaxianGame.prototype.restart = function () {
        var _a;
        this.scores = 0;
        this.level.index = 0;
        this.bodies.enemies = [];
        this.createEnemies(this.level.current);
        this.createPlayer();
        (_a = this.interfaces) === null || _a === void 0 ? void 0 : _a.deleteRestart();
    };
    CrealaxianGame.prototype.update = function () {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.colliding();
        (_a = this.bodies.player) === null || _a === void 0 ? void 0 : _a.update();
        (_b = this.bodies.bullets) === null || _b === void 0 ? void 0 : _b.forEach(function (bullet, index) {
            bullet.update();
            _this.deleteExternalBullet(bullet, index);
        });
        (_c = this.bodies.enemies) === null || _c === void 0 ? void 0 : _c.forEach(function (enemy) {
            enemy.update();
        });
        (_d = this.bodies.explosions) === null || _d === void 0 ? void 0 : _d.forEach(function (explode, index) {
            explode.update(index);
        });
        if ((((_e = this.bodies.enemies) === null || _e === void 0 ? void 0 : _e.length) === 0) && (((_f = this.bodies.bullets) === null || _f === void 0 ? void 0 : _f.filter(function (i) { return (i.playerBullet === false); }).length) === 0) && this.bodies.player) {
            this.bodies.player.win();
            this.createEnemies(this.level.nextLevel());
        }
    };
    CrealaxianGame.prototype.colliding = function () {
        var _this = this;
        var _a, _b;
        this.bodies.enemies = (_a = this.bodies.enemies) === null || _a === void 0 ? void 0 : _a.filter(function (enemy) {
            var _a;
            var enemyAlive = true;
            _this.bodies.bullets = (_a = _this.bodies.bullets) === null || _a === void 0 ? void 0 : _a.filter(function (bullet) {
                var _a, _b;
                if (bullet.playerBullet === true &&
                    enemy.position.x < bullet.position.x + bullet.size.width &&
                    enemy.position.x + enemy.size.width > bullet.position.x &&
                    enemy.position.y < bullet.position.y + bullet.size.height &&
                    enemy.position.y + enemy.size.height > bullet.position.y) {
                    enemy.hit();
                    enemyAlive = false;
                    (_a = _this.interfaces) === null || _a === void 0 ? void 0 : _a.updateScores(100);
                    return false;
                }
                if (_this.bodies.player) {
                    var player = _this.bodies.player;
                    if (bullet.playerBullet === false &&
                        player.position.x < bullet.position.x + bullet.size.width &&
                        player.position.x + player.size.width > bullet.position.x &&
                        player.position.y < bullet.position.y + bullet.size.height &&
                        player.position.y + player.size.height > bullet.position.y) {
                        player.hit();
                        (_b = _this.interfaces) === null || _b === void 0 ? void 0 : _b.updateScores(-1000);
                        return false;
                    }
                }
                return true;
            });
            return enemyAlive;
        });
        this.bodies.bullets = (_b = this.bodies.bullets) === null || _b === void 0 ? void 0 : _b.filter(function (b1) {
            var _a;
            var bulletAlive = true;
            (_a = _this.bodies.bullets) === null || _a === void 0 ? void 0 : _a.forEach(function (b2) {
                var _a;
                if ((b1.playerBullet === true || b2.playerBullet === true) &&
                    ((b1.playerBullet === true && b2.playerBullet === false) ||
                        (b1.playerBullet === false && b2.playerBullet === true)) &&
                    (b1.position.x < b2.position.x + b2.size.width &&
                        b1.position.x + b1.size.width > b2.position.x &&
                        b1.position.y < b2.position.y + b2.size.height &&
                        b1.position.y + b1.size.height > b2.position.y)) {
                    b1.hit();
                    bulletAlive = false;
                    (_a = _this.interfaces) === null || _a === void 0 ? void 0 : _a.updateScores(200);
                }
            });
            return bulletAlive;
        });
    };
    CrealaxianGame.prototype.deleteExternalBullet = function (bullet, index) {
        var _a, _b;
        if (bullet.position.y < 0 || bullet.position.y > this.params.height) {
            (_a = this.bodies.bullets) === null || _a === void 0 ? void 0 : _a.splice(index, 1);
        }
        if (bullet.position.x < 0 || bullet.position.x > this.params.width) {
            (_b = this.bodies.bullets) === null || _b === void 0 ? void 0 : _b.splice(index, 1);
        }
    };
    CrealaxianGame.prototype.draw = function () {
        var _this = this;
        var _a, _b, _c, _d;
        (_a = this.screen) === null || _a === void 0 ? void 0 : _a.clearRect(0, 0, this.params.width, this.params.height);
        if (this.bodies.player) {
            this.renderBody(this.bodies.player);
        }
        (_b = this.bodies.bullets) === null || _b === void 0 ? void 0 : _b.forEach(function (bullet) {
            _this.renderBody(bullet);
        });
        (_c = this.bodies.enemies) === null || _c === void 0 ? void 0 : _c.forEach(function (enemy) {
            _this.renderBody(enemy);
        });
        (_d = this.bodies.explosions) === null || _d === void 0 ? void 0 : _d.forEach(function (explode) {
            _this.renderBody(explode);
        });
    };
    CrealaxianGame.prototype.loop = function () {
        var _this = this;
        var fps = 60;
        this.update();
        this.draw();
        window.setTimeout(function () {
            _this.loop();
        }, 1000 / fps);
    };
    CrealaxianGame.prototype.renderBody = function (body) {
        var _a, _b, _c;
        this.screen.globalAlpha = body.alpha;
        (_a = this.screen) === null || _a === void 0 ? void 0 : _a.drawImage.apply(_a, __spreadArrays([body.skin.src], body.skin.frames[body.skin.frameNumber], [body.size.width, body.size.height, (_b = body.position) === null || _b === void 0 ? void 0 : _b.x, (_c = body.position) === null || _c === void 0 ? void 0 : _c.y, body.size.width, body.size.height]));
        this.screen.globalAlpha = 1;
    };
    CrealaxianGame.prototype.over = function () {
        var _a, _b;
        (_a = this.interfaces) === null || _a === void 0 ? void 0 : _a.createGameOver();
        (_b = this.interfaces) === null || _b === void 0 ? void 0 : _b.createRestart();
        this.resources.play('gameOver');
    };
    return CrealaxianGame;
}());
var Interfaces = (function () {
    function Interfaces(game) {
        var _this = this;
        this.game = game;
        this.deleteStart = function () { var _a, _b; return (_b = (_a = _this.startButton) === null || _a === void 0 ? void 0 : _a.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(_this.startButton); };
        this.deleteGameOver = function () { var _a, _b; return (_b = (_a = _this.gameover) === null || _a === void 0 ? void 0 : _a.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(_this.gameover); };
        this.deleteRestart = function () { var _a, _b; return (_b = (_a = _this.restartButton) === null || _a === void 0 ? void 0 : _a.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(_this.restartButton); };
        this.createStart('PLAY');
    }
    Interfaces.prototype.createStart = function (text) {
        var _this = this;
        var _a;
        this.startButton = document.createElement('start_button');
        this.startButton.innerHTML = text;
        this.startButton.onclick = function () {
            _this.game.start();
        };
        (_a = this.game.container) === null || _a === void 0 ? void 0 : _a.appendChild(this.startButton);
    };
    Interfaces.prototype.createGameOver = function () {
        var _a;
        this.gameover = document.createElement('gameover');
        this.gameover.innerHTML = 'GAME OVER';
        (_a = this.game.container) === null || _a === void 0 ? void 0 : _a.appendChild(this.gameover);
    };
    Interfaces.prototype.createRestart = function () {
        var _this = this;
        var _a;
        this.restartButton = document.createElement('restart_button');
        this.restartButton.innerHTML = 'RESTART';
        this.restartButton.onclick = function () {
            _this.deleteGameOver();
            _this.game.restart();
        };
        (_a = this.game.container) === null || _a === void 0 ? void 0 : _a.appendChild(this.restartButton);
    };
    Interfaces.prototype.createLives = function () {
        var _a;
        this.livesContainer = document.createElement('lives');
        (_a = this.game.container) === null || _a === void 0 ? void 0 : _a.appendChild(this.livesContainer);
    };
    Interfaces.prototype.updateLives = function () {
        var _a;
        if (this.game.bodies.player) {
            this.livesContainer.innerHTML = '';
            for (var i = 0; i < this.game.bodies.player.lives; i++) {
                (_a = this.livesContainer) === null || _a === void 0 ? void 0 : _a.appendChild(document.createElement('span'));
            }
        }
        else {
            this.livesContainer.innerHTML = '';
        }
    };
    Interfaces.prototype.createScores = function () {
        var _a;
        this.scoresContainer = document.createElement('score');
        (_a = this.game.container) === null || _a === void 0 ? void 0 : _a.appendChild(this.scoresContainer);
    };
    Interfaces.prototype.updateScores = function (n) {
        this.game.scores += n;
        this.scoresContainer.innerHTML = this.game.scores.toFixed();
    };
    return Interfaces;
}());
var Enemies = (function () {
    function Enemies() {
        this.types = {
            '1': {
                width: 26,
                height: 17,
                speedX: 0.5,
                frames: [[0, 32], [26, 32], [52, 32], [26, 32]],
                lives: 1,
                shootFx: {}
            },
            '2': {
                width: 26,
                height: 17,
                speedX: 0.5,
                frames: [[78, 32], [104, 32], [130, 32], [104, 32]],
                lives: 1,
                shootFx: {
                    velocity: 2,
                    speed: 0.007
                }
            },
            '3': {
                width: 26,
                height: 17,
                speedX: 0.5,
                frames: [[156, 32], [182, 32], [208, 32], [182, 32]],
                lives: 1,
                shootFx: {
                    velocity: 3,
                    speed: 0.008
                }
            },
            '4': {
                width: 22,
                height: 25,
                speedX: 0.5,
                frames: [[234, 32]],
                lives: 1,
                shootFx: {
                    velocity: 6,
                    speed: 0.02
                }
            },
            '5': {
                width: 20,
                height: 26,
                speedX: 0.5,
                frames: [[256, 32]],
                lives: 1,
                shootFx: {
                    velocity: 6,
                    speed: 0.2,
                    angle: function () {
                        var ritems = [2, -2, 1.5, -1.5, 1, -1, 0.5, -0.5, 0.25, -0.25];
                        return (Math.random() * ritems[Math.floor(Math.random() * ritems.length)]);
                    }
                }
            }
        };
    }
    Object.defineProperty(Enemies.prototype, "maxWidth", {
        get: function () {
            var _this = this;
            return Math.max.apply(Math, Object.keys(this.types).map(function (i) { return _this.types[i].width; }));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Enemies.prototype, "maxHeight", {
        get: function () {
            var _this = this;
            return Math.max.apply(Math, Object.keys(this.types).map(function (i) { return _this.types[i].height; }));
        },
        enumerable: false,
        configurable: true
    });
    return Enemies;
}());
var Enemy = (function () {
    function Enemy(matrix, game, skin, size, position, speedX, defaultLength, canShoot, velocity, speed, angle) {
        if (canShoot === void 0) { canShoot = true; }
        if (velocity === void 0) { velocity = 2; }
        if (speed === void 0) { speed = 0.005; }
        if (angle === void 0) { angle = function () { return Math.random() - 0.5; }; }
        this.matrix = matrix;
        this.game = game;
        this.skin = skin;
        this.size = size;
        this.position = position;
        this.speedX = speedX;
        this.defaultLength = defaultLength;
        this.canShoot = canShoot;
        this.velocity = velocity;
        this.speed = speed;
        this.angle = angle;
        this.alpha = 1;
        this.timer = game.getRandomInt(0, 48);
    }
    Enemy.prototype.update = function () {
        this.timer++;
        if (this.timer % 24 === 0)
            this.nextFrame();
        var extermes = this.game.getExtremes();
        if (extermes[0] < 0 || (extermes[1] + this.defaultLength) > this.game.params.width) {
            this.speedX = -this.speedX;
        }
        this.position.x += this.speedX;
        if (Math.random() < this.speed && !this.game.enemiesBelow(this) && this.canShoot) {
            this.shoot(this.angle());
        }
    };
    Enemy.prototype.shoot = function (angle) {
        if (this.game.bodies.player) {
            this.game.resources.play('enemyShoot');
            this.game.createBullet(this, false, 2, angle);
        }
    };
    Enemy.prototype.nextFrame = function () {
        var curFrame = this.skin.frameNumber + 1;
        var allFramesLength = this.skin.frames.length;
        if (curFrame === allFramesLength) {
            this.skin.frameNumber = 0;
        }
        else {
            this.skin.frameNumber++;
        }
    };
    Enemy.prototype.hit = function () {
        var _a;
        this.game.resources.play('hitEnemy');
        (_a = this.game.bodies.explosions) === null || _a === void 0 ? void 0 : _a.push(new Explosion(this.game, this, {
            src: this.game.sprite,
            frameNumber: 0,
            frames: [[0, 61], [32, 61], [64, 61], [32, 61], [0, 61]]
        }));
    };
    Enemy.prototype.fx = function (x) {
        return (Math.sin(x / 4)) / 4;
    };
    return Enemy;
}());
var Explosion = (function () {
    function Explosion(game, body, skin, size) {
        if (size === void 0) { size = { width: 32, height: 32 }; }
        this.game = game;
        this.body = body;
        this.skin = skin;
        this.size = size;
        this.timer = 0;
        this.alpha = 1;
        this.position = {
            x: body.position.x + (body.size.width / 2) - (this.size.width / 2),
            y: body.position.y + (body.size.height / 2) - (this.size.height / 2)
        };
    }
    Explosion.prototype.update = function (index) {
        this.timer++;
        if (this.timer % 6 === 0)
            this.nextFrame(index);
    };
    Explosion.prototype.nextFrame = function (index) {
        var _a;
        if ((this.skin.frameNumber + 1) === this.skin.frames.length) {
            (_a = this.game.bodies.explosions) === null || _a === void 0 ? void 0 : _a.splice(index, 1);
        }
        else {
            this.skin.frameNumber++;
        }
    };
    return Explosion;
}());
var Bullet = (function () {
    function Bullet(game, body, skin, playerBullet, size, velocity, angle) {
        if (playerBullet === void 0) { playerBullet = false; }
        if (size === void 0) { size = { width: 4, height: 12 }; }
        if (velocity === void 0) { velocity = { x: 0, y: -6 }; }
        this.game = game;
        this.body = body;
        this.skin = skin;
        this.playerBullet = playerBullet;
        this.size = size;
        this.velocity = velocity;
        this.angle = angle;
        this.alpha = 1;
        this.position = {
            x: body.position.x + (body.size.width / 2) - (this.size.width / 2),
            y: (this.playerBullet ? body.position.y - (this.size.height / 2) : body.position.y + (this.size.height))
        };
    }
    Bullet.prototype.update = function () {
        this.position.y += (this.playerBullet ? this.velocity.y : this.body.velocity);
        this.position.x += this.angle;
    };
    Bullet.prototype.hit = function () {
        var _a;
        (_a = this.game.bodies.explosions) === null || _a === void 0 ? void 0 : _a.push(new Explosion(this.game, this, {
            src: this.game.sprite,
            frameNumber: 0,
            frames: [[0, 61], [32, 61], [64, 61], [32, 61], [0, 61]]
        }));
    };
    return Bullet;
}());
var Player = (function () {
    function Player(game, skin, size) {
        if (size === void 0) { size = { width: 24, height: 32 }; }
        this.game = game;
        this.skin = skin;
        this.size = size;
        this.lives = 3;
        this.timer = 0;
        this.canShoot = true;
        this.alpha = 1;
        this.deathcounter = 0;
        this.position = {
            x: (game.params.width - this.size.width) / 2,
            y: game.params.height - this.size.height
        };
    }
    Player.prototype.update = function () {
        if (this.deathcounter > 0) {
            this.alpha = Math.round(((Math.sin((Math.PI / 2) + (this.deathcounter / 1.59151)) / 2) + 0.5) * 100) / 100;
            this.deathcounter--;
        }
        else {
            this.alpha = 1;
        }
        if (this.game.kbd.is('LEFT') && this.position.x > 0) {
            this.position.x -= 2;
            this.skin.frameNumber = 1;
        }
        else if (this.game.kbd.is('RIGHT') && this.position.x < (this.game.params.width - this.size.width)) {
            this.position.x += 2;
            this.skin.frameNumber = 2;
        }
        else {
            this.skin.frameNumber = 0;
        }
        var shootTimer = 48;
        if (this.game.kbd.is('SPACE')) {
            if (this.canShoot)
                this.shoot(0);
        }
        if (this.game.kbd.is('DEMON')) {
            shootTimer = 8;
            if (this.canShoot)
                this.shoot(0);
        }
        if (this.timer % shootTimer === 0)
            this.canShoot = true;
        this.timer++;
    };
    Player.prototype.hit = function () {
        var _a, _b, _c;
        if (this.deathcounter === 0) {
            this.deathcounter = 120;
            this.lives -= 1;
            (_a = this.game.interfaces) === null || _a === void 0 ? void 0 : _a.updateLives();
            this.game.resources.play('hitPlayer');
            (_b = this.game.bodies.explosions) === null || _b === void 0 ? void 0 : _b.push(new Explosion(this.game, this, {
                src: this.game.sprite,
                frameNumber: 0,
                frames: [[0, 61], [32, 61], [64, 61], [32, 61], [0, 61]]
            }));
        }
        if (this.lives === 0) {
            this.game.over();
            delete this.game.bodies.player;
            (_c = this.game.interfaces) === null || _c === void 0 ? void 0 : _c.updateLives();
        }
    };
    Player.prototype.shoot = function (angle) {
        this.canShoot = false;
        this.game.resources.play('shoot');
        this.game.createBullet(this, true, 0, angle);
    };
    Player.prototype.win = function () {
        var _a;
        this.lives += 1;
        (_a = this.game.interfaces) === null || _a === void 0 ? void 0 : _a.updateLives();
    };
    return Player;
}());
var Keyboard = (function () {
    function Keyboard(container) {
        var _this = this;
        this.container = container;
        this.state = {};
        this.KEYS = {
            UP: 38,
            LEFT: 37,
            RIGHT: 39,
            SPACE: 32,
            DEMON: 68,
            R: 82
        };
        container.addEventListener('keydown', function (e) {
            if (Object.values(_this.KEYS).includes(e.keyCode)) {
                _this.state[e.keyCode] = true;
                e.preventDefault();
            }
        });
        container.addEventListener('keyup', function (e) {
            if (Object.values(_this.KEYS).includes(e.keyCode)) {
                _this.state[e.keyCode] = false;
            }
        });
    }
    Keyboard.prototype.is = function (key) {
        return (this.state[this.KEYS[key]] === true);
    };
    return Keyboard;
}());
var Level = (function () {
    function Level() {
        this.list = [
            [
                [0, 0, 0, 3, 3, 3, 3, 0, 0, 0],
                [0, 0, 3, 3, 3, 3, 3, 3, 0, 0],
                [0, 2, 2, 2, 2, 2, 2, 2, 2, 0],
                [1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 1, 1]
            ],
            [
                [0, 3, 0, 3, 3, 3, 3, 0, 3, 0],
                [0, 0, 3, 3, 3, 3, 3, 3, 0, 0],
                [0, 3, 0, 3, 3, 3, 3, 0, 3, 0],
                [0, 0, 3, 3, 3, 3, 3, 3, 0, 0]
            ],
            [
                [0, 4, 0, 4, 0, 4, 0, 4, 0, 4],
                [4, 0, 4, 0, 4, 0, 4, 0, 4]
            ],
            [
                [4, 4, 4],
                [4, 4, 4],
                [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3],
                [0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3],
                [1, 1, 1],
                [1, 1, 1]
            ],
            [
                [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
                [0, 3, 3, 3, 0, 3, 3, 3, 0, 3, 3, 3, 0, 3, 3, 3],
                [0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 3],
                [0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 3, 3],
                [0, 3, 3, 3, 0, 3, 3, 3, 0, 3, 3, 3, 0, 3, 0, 0],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ],
            [
                [5]
            ],
            [
                [0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0],
                [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
                [0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1],
                [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1],
                [0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
                [0],
                [2, 0, 0, 0, 2, 0, 0, 2, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 2],
                [2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 0, 0, 2, 0, 2, 0, 2, 2, 0, 2],
                [2, 0, 0, 2, 2, 2, 0, 2, 0, 2, 0, 2, 0, 2, 2, 2, 0, 2, 0, 2, 2],
                [2, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 0, 2]
            ]
        ];
        this.index = 0;
        this.current = this.list[this.index];
    }
    Level.prototype.new = function (levelNumber) {
        if (levelNumber) {
            this.index = (levelNumber - 1);
        }
        else {
            this.index++;
        }
        this.current = this.list[this.index];
    };
    Level.prototype.nextLevel = function () {
        if ((this.index + 1) === this.list.length) {
            this.index = 0;
        }
        else {
            this.index++;
        }
        return this.list[this.index];
    };
    return Level;
}());
var Resources = (function () {
    function Resources(list) {
        this.list = list;
        this.progress = 0;
    }
    Resources.prototype.load = function () {
        var _this = this;
        return new Promise(function (resolve) {
            _this.list.forEach(function (item) {
                if (item.type === 'img') {
                    var img_1 = new Image();
                    img_1.src = item.path;
                    img_1.onload = function () {
                        item.isLoad = true;
                        item.src = img_1;
                        var curProgress = _this.checkReady();
                        if (typeof curProgress !== "boolean") {
                            _this.progress = curProgress;
                        }
                        else {
                            resolve(curProgress);
                        }
                    };
                }
                if (item.type === 'sound') {
                    var loadFunc_1 = function () {
                        sound_1.removeEventListener('canplaythrough', loadFunc_1);
                        item.isLoad = true;
                        item.src = sound_1;
                        var curProgress = _this.checkReady();
                        if (typeof curProgress !== "boolean") {
                            _this.progress = curProgress;
                        }
                        else {
                            resolve(curProgress);
                        }
                    };
                    var sound_1 = new Audio(item.path);
                    sound_1.addEventListener('canplaythrough', loadFunc_1, false);
                    sound_1.load();
                }
            });
        });
    };
    Resources.prototype.checkReady = function () {
        var loaded = this.list.filter(function (i) { return (i.hasOwnProperty('isLoad') ? (i.isLoad === true ? true : false) : false); });
        if (loaded.length === this.list.length) {
            return true;
        }
        return parseInt((loaded.length / this.list.length * 100).toFixed());
    };
    Resources.prototype.getSrc = function (type, name) {
        return this.list.filter(function (item) { return (item.type === type && item.name === name); })[0].src;
    };
    Resources.prototype.play = function (name) {
        this.getSrc('sound', name).currentTime = 0;
        this.getSrc('sound', name).play();
    };
    return Resources;
}());
//# sourceMappingURL=game.js.map