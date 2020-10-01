type GameParams = {
    width: number,
    height: number
}
type GameResourceItemTypes = 'img' | 'sound' | 'font'
interface GameResourceItem extends Object {
    type: GameResourceItemTypes
    name: string
    path: string
    isLoad?: boolean
    src?: HTMLImageElement | HTMLAudioElement
}
type GameResources = GameResourceItem[]
type AvailableKeyboardKeys = 'UP' | 'LEFT' | 'RIGHT' | 'SPACE' | 'DEMON' | 'R'
type BodyDimensions = {
    width: number
    height: number
}
type BodyPosition = {
    x: number
    y: number
}
type BodySkin = {
    src: HTMLImageElement
    frameNumber: number
    frames: [number, number][]
}
interface BodiesParams {
    size: BodyDimensions
    position?: BodyPosition
    skin: BodySkin
}
interface PlayerParams extends BodiesParams {
    update: () => void
}
interface EnemyParams extends BodiesParams {

}
interface BulletParams extends BodiesParams {
    playerBullet: boolean
    update: () => void
}
type Bodies = {
    player?: PlayerParams
    enemies?: EnemyParams[]
    bullets?: BulletParams[]
}
type ShootFX = {
    canShoot?: boolean
    speed?: number
    velocity?: number
    angle?: () => number
}
type EnemyType = {
    width: number
    height: number
    speedX: number
    frames: [number, number][]
    shootFx?: ShootFX
}


/** Игра */
class CrealaxianGame {
    container: HTMLElement | null;
    screen: CanvasRenderingContext2D | null;
    resources: Resources;
    bodies: Bodies
    kbd: Keyboard
    sprite: HTMLImageElement | undefined
    level: Level = new Level()
    enemies: Enemies = new Enemies()

    constructor(public id: string, public params: GameParams) {
        this.bodies = {
            bullets: []
        }
        this.container = document.getElementById(id)
        let canvas = document.createElement('canvas')
            canvas.width = params.width
            canvas.height = params.height
        this.container?.appendChild(canvas)
        this.container?.setAttribute('tabIndex', '1');
        this.screen = canvas.getContext('2d')
        // Список ресурсов
        this.resources = new Resources([
            { type: 'img', name: 'sprite', path: 'assets/img/sprites2.png'},
            { type: 'sound', name:'shoot', path:'assets/sound/cc-shoot-laser.wav'},
            { type: 'sound', name:'enemyShoot', path:'assets/sound/sfx_weapon_singleshot5.wav'},
            { type: 'sound', name:'gameOver', path:'assets/sound/gameover.mp3'},
            { type: 'sound', name:'hitPlayer', path:'assets/sound/1.mp3'},
            { type: 'sound', name:'hitEnemy', path:'assets/sound/sfx_deathscream_alien3.wav'},
            { type: 'sound', name:'hitBullet', path:'assets/sound/sfx_weapon_singleshot5.wav'}
        ])
        // Обработчик клавиатуры
        this.kbd = new Keyboard(this.container!)
        // Загрузка ресурсов
        this.resources.load().then((data) => {
            if (data === true) {
                this.start()
            }
        })
    }
    /** Создание игрока */
    createPlayer(): void {
        this.bodies.player = new Player(this, 
            {
                src: this.sprite!,
                frameNumber: 0,
                frames: [[0,0],[24,0],[48,0]]
            }
        )
    }
    /** Создание врагов на основе матрицы уровней */
    createEnemies(level: number[][]) {
        console.log(level);
        console.log(this.enemies.types[1]);
    }
    /** Создание врага */
    createEnemy(body: Player, playerBullet: boolean = false): void {
        
    }
    /** Создание пули */
    createBullet(body: Player, playerBullet: boolean = false): void {
        this.bodies.bullets?.push(new Bullet(this, body, {
            src: this.sprite!,
            frameNumber: 0,
            frames: [[0,49],[4,49]]
        }, playerBullet))
    }
    /** Запуск игры после загрузки ресурсов */
    start(): void {
        // Вспомогательная переменная СПРАЙТ
        this.sprite = (this.resources.getSrc('img', 'sprite') as HTMLImageElement)
        // Создание игрока
        this.createPlayer()
        // Создание врагов
        this.createEnemies(this.level.current)
        // Запуск цикла проверки
        this.loop()
    }
    /** Обновление элементов */
    update(): void {
        this.bodies.player!.update()
        this.bodies.bullets?.forEach((bullet, index) => {
            bullet.update()
            this.deleteExternalBullet(bullet, index)
        })
    }
    /** Проверка нахождения пули в пределах холста */
    deleteExternalBullet(bullet: BulletParams, index: number): void {
        if (bullet.position!.y < 0 || bullet.position!.y > this.params.height) {
            this.bodies.bullets?.splice(index, 1)
        }
        if (bullet.position!.x < 0 || bullet.position!.x > this.params.width) {
            this.bodies.bullets?.splice(index, 1)
        }
    }
    /** Отрисовка элементов */
    draw(): void {
        this.screen?.clearRect(0, 0, this.params.width, this.params.height)
        this.renderBody(this.bodies.player!)
        this.bodies.bullets?.forEach((bullet) => {
            this.renderBody(bullet)
        })
    }
    /** Цикл, обновляющий canvas N раз в секунду*/
    loop(): void {
        let fps = 60
        this.update()
        this.draw()
        window.setTimeout(() => {
            this.loop()
        }, 1000 / fps);
    }
    /** Рендеринг объекта */
    renderBody(body: PlayerParams | EnemyParams | BulletParams): void {
        this.screen?.drawImage(body.skin.src, ...body.skin.frames[body.skin.frameNumber], 
            body.size.width, body.size.height, body.position?.x!, body.position?.y!, 
            body.size.width, body.size.height);
    }
}

/** Враги */
class Enemies {
    types: {[key: number]: EnemyType}
    constructor() {
        this.types = {
            1: {
                width: 26,
                height: 17,
                speedX: 0.5,
                frames: [[0,32], [26,32], [52,32], [26,32], [0,32]],
                shootFx: {

                }
            },
            2: {
                width: 26,
                height: 17,
                speedX: 0.5,
                frames: [[78,32], [104,32], [130,32], [104,32], [78,32]],
                shootFx: {
                    velocity: 2,
                    speed: 0.007
                }
            },
            3: {
                width: 26,
                height: 17,
                speedX: 0.5,
                frames: [[156,32], [182,32], [208,32], [182,32], [156,32]],
                shootFx: {
                    velocity: 3,
                    speed: 0.008
                }
            },
            4: {
                width: 22,
                height: 25,
                speedX: 0.5,
                frames: [[234,32]],
                shootFx: {
                    velocity: 6,
                    speed: 0.02
                }
            },
            5: {
                width: 20,
                height: 26,
                speedX: 0.5,
                frames: [[256,32]],
                shootFx: {
                    velocity: 6,
                    speed: 0.2,
                    angle: () => {
                        let ritems = [2, -2, 1.5, -1.5, 1, -1, 0.5, -0.5, 0.25, -0.25];
                        return (Math.random()*ritems[Math.floor(Math.random()*ritems.length)])
                    }
                }
            }
        }
    }
}
/** Враг */
class Enemy {
    position: BodyPosition

    constructor() {
        this.position = {
            x: 0,
            y: 0
        }
    }
    
}
/** Пули */
class Bullet {
    position: BodyPosition
    
    constructor(public game: CrealaxianGame, body: Player, public skin: BodySkin, 
        public playerBullet: boolean = false,
        public size: BodyDimensions = {width: 4, height: 12}, 
        public velocity: {x: number, y: number} = {x: 0, y: -6}) {
        this.position = {
            x: body.position.x + (body.size.width / 2) - (this.size.width / 2),
            y: body.position.y - (this.size.height / 2)
        }
    }

    update() {
        this.position.y += this.velocity.y;
        this.position.x += this.velocity.x;
    }

}
/** Игрок */
class Player {
    position: BodyPosition

    constructor(public game: CrealaxianGame, public skin: BodySkin, public size: BodyDimensions = {width: 24, height: 32}) {
        this.position = {
            x: (game.params.width - this.size.width) / 2,
            y: game.params.height - this.size.height
        }
    }

    update(): void {
        if(this.game.kbd.is('LEFT') && this.position.x > 0) {
            this.position.x -= 2;
            this.skin.frameNumber = 1;
        } else if (this.game.kbd.is('RIGHT') && this.position.x < (this.game.params.width-this.size.width)) {
            this.position.x += 2;
            this.skin.frameNumber = 2;
        } else {
            this.skin.frameNumber = 0;
        }

        if (this.game.kbd.is('SPACE')) {
            this.shoot()
        }
    }
    /** Выстрел  */
    shoot(): void {
        this.game.resources.play('shoot')
        this.game.createBullet(this, true)
    }
}
/** Обработка эвентов от клавиатуры */
class Keyboard {
    state: {[key: number]: boolean} = {}
    KEYS: {[key: string]: number} = {
        UP:38,
        LEFT: 37,
        RIGHT: 39,
        SPACE: 32,
        DEMON: 68,
        R: 82
    }

    constructor(public container: HTMLElement) {
        container.addEventListener('keydown', (e) => {
            if (Object.values(this.KEYS).includes(e.keyCode)) {
                this.state[e.keyCode] = true;
                e.preventDefault();
            }
		});
		container.addEventListener('keyup', (e) => {
            if (Object.values(this.KEYS).includes(e.keyCode)) {
                this.state[e.keyCode] = false;
            }
		});
    }

    is(key: AvailableKeyboardKeys): boolean {
        return (this.state[this.KEYS[key]] === true)
    }
}
/** Уровни */
class Level {
	list: number[][][] = [
		[
			[25, 0,0,0,0,1,1,0,1,1,0,0,1,1,1,0,0,1,0],
			[25, 0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,1],
			[25, 0,0,0,1,0,0,0,1,1,0,0,1,1,0,0,1,0,1],
			[25, 0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,1,1],
			[25, 0,0,0,0,1,1,0,1,0,1,0,1,1,1,0,1,0,1],
			[25, 0],
			[25, 2,0,0,0,2,0,0,2,0,2,0,2,0,0,2,0,0,2,0,0,2],
			[25, 2,0,0,2,0,2,0,0,2,0,0,0,0,2,0,2,0,2,2,0,2],
			[25, 2,0,0,2,2,2,0,2,0,2,0,2,0,2,2,2,0,2,0,2,2],
			[25, 2,2,0,2,0,2,0,2,0,2,0,2,0,2,0,2,0,2,0,0,2]
		],
		[
			[33, 0,0,0,4,0,0,4,0,0,0],
			[25, 0,0,3,3,3,3,3,3,0,0],
			[25, 0,2,2,2,2,2,2,2,2,0],
			[25, 1,2,1,1,1,1,1,1,2,1],
			[25, 1,1,1,1,1,1,1,1,1,1],
			[25, 1,1,0,0,0,0,0,0,1,1]
		],
		[
			[25, 4,4,4],
			[25, 4,4,4],
			[25, 2,2,2,2,2,2,2,2,2,3,3,3],
			[25, 0,0,2,2,2,2,2,2,2,3,3,3],
			[25, 1,1,1,1,1,1,1,1,1,3,3,3],
			[25, 1,1,1],
			[25, 1,1,1]
		],
		[
			[40, 4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
			[25, 0,3,3,3,0,3,3,3,0,3,3,3,0,3,3,3],
			[25, 0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,3],
			[25, 0,3,0,0,0,3,0,0,0,3,0,0,0,3,3,3],
			[40, 0,3,3,3,0,3,3,3,0,3,3,3,0,3,0,0],
			[40, 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
		],
		[
			[26, 5]
		],
    ]
    current: number[][]
    index: number = 0
    
    constructor() {
        this.current = this.list[this.index]
    }

    /** Новый уровень */
    new(levelNumber?: number) {
        if (levelNumber) {
            this.index = (levelNumber-1)
        } else {
            this.index++
        }
        this.current = this.list[this.index]
    }
}
/** Работа с ресурсами */
class Resources {
    progress: number = 0
    
    constructor(public list: GameResources) {

    }
    /** Загрузка ресурсов */
    load(): Promise<boolean | string> {
        return new Promise((resolve) => {
            this.list.forEach((item) => {
                if (item.type === 'img') {
                    let img = new Image();
                    img.src = item.path;
                    img.onload = () => {
                        item.isLoad = true
                        item.src = img
                        let curProgress = this.checkReady()
                        if (typeof curProgress !== "boolean") {
                            this.progress = curProgress
                        } else {
                            resolve(curProgress)
                        }
                    };
                }
                if (item.type === 'sound') {
                    let loadFunc = () => {
                        sound.removeEventListener('canplaythrough', loadFunc);
                        item.isLoad = true
                        item.src = sound
                        let curProgress = this.checkReady()
                        if (typeof curProgress !== "boolean") {
                            this.progress = curProgress
                        } else {
                            resolve(curProgress)
                        }
                    }
                    let sound = new Audio(item.path);
                    sound.addEventListener('canplaythrough', loadFunc, false);
                    sound.load();
                }
            })
        })
    }
    /** Проверка прогресса загрузки ресурсов */
    checkReady(): boolean | number {
        let loaded = this.list.filter(i => (i.hasOwnProperty('isLoad') ? (i.isLoad === true ? true : false) : false))
        if (loaded.length === this.list.length) {
            return true
        }
        return parseInt((loaded.length / this.list.length * 100).toFixed())
    }
    /** Получение ресурса по имени и типу */
    getSrc(type: GameResourceItemTypes, name: string) {
        return this.list.filter((item) => (item.type === type && item.name === name))[0].src
    }
    /** Воспроизведение звука по названию ресурса */
    play(name: string): void {
        (this.getSrc('sound', name) as HTMLAudioElement).currentTime = 0;
        (this.getSrc('sound', name) as HTMLAudioElement).play()
    }
}