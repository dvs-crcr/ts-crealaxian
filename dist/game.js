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
        this.level = new Level();
        this.enemies = new Enemies();
        this.bodies = {
            bullets: []
        };
        this.container = document.getElementById(id);
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
                _this.start();
            }
        });
    }
    CrealaxianGame.prototype.createPlayer = function () {
        this.bodies.player = new Player(this, {
            src: this.sprite,
            frameNumber: 0,
            frames: [[0, 0], [24, 0], [48, 0]]
        });
    };
    CrealaxianGame.prototype.createEnemies = function (level) {
        console.log(level);
        console.log(this.enemies.types[1]);
    };
    CrealaxianGame.prototype.createEnemy = function (body, playerBullet) {
        if (playerBullet === void 0) { playerBullet = false; }
    };
    CrealaxianGame.prototype.createBullet = function (body, playerBullet) {
        var _a;
        if (playerBullet === void 0) { playerBullet = false; }
        (_a = this.bodies.bullets) === null || _a === void 0 ? void 0 : _a.push(new Bullet(this, body, {
            src: this.sprite,
            frameNumber: 0,
            frames: [[0, 49], [4, 49]]
        }, playerBullet));
    };
    CrealaxianGame.prototype.start = function () {
        this.sprite = this.resources.getSrc('img', 'sprite');
        this.createPlayer();
        this.createEnemies(this.level.current);
        this.loop();
    };
    CrealaxianGame.prototype.update = function () {
        var _this = this;
        var _a;
        this.bodies.player.update();
        (_a = this.bodies.bullets) === null || _a === void 0 ? void 0 : _a.forEach(function (bullet, index) {
            bullet.update();
            _this.deleteExternalBullet(bullet, index);
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
        var _a, _b;
        (_a = this.screen) === null || _a === void 0 ? void 0 : _a.clearRect(0, 0, this.params.width, this.params.height);
        this.renderBody(this.bodies.player);
        (_b = this.bodies.bullets) === null || _b === void 0 ? void 0 : _b.forEach(function (bullet) {
            _this.renderBody(bullet);
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
        (_a = this.screen) === null || _a === void 0 ? void 0 : _a.drawImage.apply(_a, __spreadArrays([body.skin.src], body.skin.frames[body.skin.frameNumber], [body.size.width, body.size.height, (_b = body.position) === null || _b === void 0 ? void 0 : _b.x, (_c = body.position) === null || _c === void 0 ? void 0 : _c.y, body.size.width, body.size.height]));
    };
    return CrealaxianGame;
}());
var Enemies = (function () {
    function Enemies() {
        this.types = {
            1: {
                width: 26,
                height: 17,
                speedX: 0.5,
                frames: [[0, 32], [26, 32], [52, 32], [26, 32], [0, 32]],
                shootFx: {}
            },
            2: {
                width: 26,
                height: 17,
                speedX: 0.5,
                frames: [[78, 32], [104, 32], [130, 32], [104, 32], [78, 32]],
                shootFx: {
                    velocity: 2,
                    speed: 0.007
                }
            },
            3: {
                width: 26,
                height: 17,
                speedX: 0.5,
                frames: [[156, 32], [182, 32], [208, 32], [182, 32], [156, 32]],
                shootFx: {
                    velocity: 3,
                    speed: 0.008
                }
            },
            4: {
                width: 22,
                height: 25,
                speedX: 0.5,
                frames: [[234, 32]],
                shootFx: {
                    velocity: 6,
                    speed: 0.02
                }
            },
            5: {
                width: 20,
                height: 26,
                speedX: 0.5,
                frames: [[256, 32]],
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
    return Enemies;
}());
var Enemy = (function () {
    function Enemy() {
        this.position = {
            x: 0,
            y: 0
        };
    }
    return Enemy;
}());
var Bullet = (function () {
    function Bullet(game, body, skin, playerBullet, size, velocity) {
        if (playerBullet === void 0) { playerBullet = false; }
        if (size === void 0) { size = { width: 4, height: 12 }; }
        if (velocity === void 0) { velocity = { x: 0, y: -6 }; }
        this.game = game;
        this.skin = skin;
        this.playerBullet = playerBullet;
        this.size = size;
        this.velocity = velocity;
        this.position = {
            x: body.position.x + (body.size.width / 2) - (this.size.width / 2),
            y: body.position.y - (this.size.height / 2)
        };
    }
    Bullet.prototype.update = function () {
        this.position.y += this.velocity.y;
        this.position.x += this.velocity.x;
    };
    return Bullet;
}());
var Player = (function () {
    function Player(game, skin, size) {
        if (size === void 0) { size = { width: 24, height: 32 }; }
        this.game = game;
        this.skin = skin;
        this.size = size;
        this.position = {
            x: (game.params.width - this.size.width) / 2,
            y: game.params.height - this.size.height
        };
    }
    Player.prototype.update = function () {
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
        if (this.game.kbd.is('SPACE')) {
            this.shoot();
        }
    };
    Player.prototype.shoot = function () {
        this.game.resources.play('shoot');
        this.game.createBullet(this, true);
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
                [25, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0],
                [25, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
                [25, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1],
                [25, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1],
                [25, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
                [25, 0],
                [25, 2, 0, 0, 0, 2, 0, 0, 2, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 2],
                [25, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 0, 0, 2, 0, 2, 0, 2, 2, 0, 2],
                [25, 2, 0, 0, 2, 2, 2, 0, 2, 0, 2, 0, 2, 0, 2, 2, 2, 0, 2, 0, 2, 2],
                [25, 2, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 0, 2]
            ],
            [
                [33, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0],
                [25, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0],
                [25, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0],
                [25, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
                [25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [25, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1]
            ],
            [
                [25, 4, 4, 4],
                [25, 4, 4, 4],
                [25, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3],
                [25, 0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3],
                [25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3],
                [25, 1, 1, 1],
                [25, 1, 1, 1]
            ],
            [
                [40, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
                [25, 0, 3, 3, 3, 0, 3, 3, 3, 0, 3, 3, 3, 0, 3, 3, 3],
                [25, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 3],
                [25, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 3, 3],
                [40, 0, 3, 3, 3, 0, 3, 3, 3, 0, 3, 3, 3, 0, 3, 0, 0],
                [40, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ],
            [
                [26, 5]
            ],
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