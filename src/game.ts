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

type Bodies = {
    player?: Player
    enemies?: Enemy[]
    bullets?: Bullet[]
    explosions?: Explosion[]
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
    lives: number
    shootFx: ShootFX
}

/** Игра */
class CrealaxianGame {
    scores: number = 0
    container: HTMLElement | null;
    screen: CanvasRenderingContext2D | null;
    resources: Resources;
    bodies: Bodies
    kbd: Keyboard
    sprite: HTMLImageElement | undefined
    level: Level = new Level()
    enemies: Enemies = new Enemies()
    interfaces: Interfaces | undefined

    constructor(public id: string, public params: GameParams) {
        this.bodies = {
            explosions: [],
            bullets: [],
            enemies: []
        }
        this.container = document.getElementById(id)
        this.container!.style.width = (params.width).toFixed()+'px'
        this.container!.style.height = (params.height).toFixed()+'px'
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
                this.init()
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
        this.interfaces?.updateLives()
    }
    /** Создание врагов на основе матрицы уровней */
    createEnemies(level: number[][]) {
        // Отступы от элементов
        let marginXY = [8, 4]
        // Длина спрайта врага
        let defaultLength = this.enemies.maxWidth + marginXY[1]
        // Вычисляем максимальную высоту для каждого ряда
        let maxEnemyRowHeight = level.map(enemyTypeRow => {
            return Math.max(...enemyTypeRow.map(enemyType => (enemyType !== 0 ? this.enemies.types[enemyType.toFixed()].height : 0)))
        })
        // Максимальное количество врагов в ряду
        let maxEnemiesInRow = Math.max(...level.map(i => (i.length)))
        // Длина врагов 
        let enemiesLength = defaultLength * maxEnemiesInRow
        let startY = 50
        if (enemiesLength > this.params.width) {
            console.warn('Game width must be more than '+enemiesLength);
        }
        for (let row = 0; row < level.length; row++) {
            // Смещение рядов по вертикали
            startY += (row === 0 ? 0 : maxEnemyRowHeight[row] + marginXY[0])
            // Расчет началной координаты
            let startX = (this.params.width - enemiesLength ) / 2
            for (let el = 0; el < level[row].length; el++) {
                let type = level[row][el].toFixed();
                if (type !== '0') {
                    this.bodies.enemies?.push(this.createEnemy([row, el], this.enemies.types[type], {
                        x: startX,
                        y: startY
                    }, defaultLength))
                }
                startX += defaultLength
            }
        }
    }
    /** Создание врага */
    createEnemy(matrix: [number, number], enemyType: EnemyType, position: BodyPosition, defaultLength: number) {
        return new Enemy(matrix, this, {
            src: this.sprite!,
            frameNumber: 0,
            frames: enemyType.frames
        }, {
            width: enemyType.width,
            height: enemyType.height
        }, position, enemyType.speedX, defaultLength, enemyType.shootFx.canShoot,
        enemyType.shootFx.velocity, enemyType.shootFx.speed, enemyType.shootFx.angle)
    }
    /** Получение крайних координат */
    getExtremes(): [number, number] {
        let xArray = this.bodies.enemies?.map(i => i.position.x)
        return [Math.min(...xArray!), Math.max(...xArray!)]
    }
    /** Проверка есть ли под врагом еще один */
    enemiesBelow(enemy: Enemy) {
        return this.bodies.enemies!.filter((b) => {
            return b.matrix[0] > enemy.matrix[0] && b.matrix[1] == enemy.matrix[1]
        }).length > 0;
    }
    /** Создание пули */
    createBullet(body: Player | Enemy, playerBullet: boolean = false, frameNumber: number = 0, angle: number): void {
        this.bodies.bullets?.push(new Bullet(this, body, {
            src: this.sprite!,
            frameNumber: frameNumber,
            frames: [[0,49],[4,49],[8,49]]
        }, playerBullet, undefined, undefined, angle))
    }
    /** Инициализация игры */
    init() {
        // Инициализация элементов интерфейса
        this.interfaces = new Interfaces(this)
        // Вспомогательная переменная СПРАЙТ
        this.sprite = (this.resources.getSrc('img', 'sprite') as HTMLImageElement)
        // Создание контейнера для жизней и очков
        this.interfaces.createLives()
        // Создание врагов
        this.createEnemies(this.level.list[6])
        // Запуск цикла
        this.loop()
    }
    /** Запуск игры после загрузки ресурсов */
    start(): void {
        this.interfaces!.createScores()
        this.bodies.enemies = []
        this.createEnemies(this.level.current)
        // Создание игрока
        this.createPlayer()
        this.interfaces?.deleteStart()
    }
    /** Кнопка рестарт */
    restart(): void {
        this.scores = 0
        this.level.index = 0
        this.bodies.enemies = []
        this.createEnemies(this.level.current)
        this.createPlayer()
        this.interfaces?.deleteRestart()
    }
    /** Обновление элементов */
    update(): void {
        // Обновление контейнера с жизнями
        this.colliding()
        this.bodies.player?.update()
        this.bodies.bullets?.forEach((bullet, index) => {
            bullet.update()
            this.deleteExternalBullet(bullet, index)
        })
        this.bodies.enemies?.forEach((enemy) => {
            enemy.update()
        })
        this.bodies.explosions?.forEach((explode, index) => {
            explode.update(index)
        })

        if ((this.bodies.enemies?.length === 0) && (this.bodies.bullets?.filter(i => (i.playerBullet === false)).length === 0) && this.bodies.player) {
            this.bodies.player.win()
            this.createEnemies(this.level.nextLevel())
        }
    }
    /** Обработка коллизий */
    colliding(): void {
        // Столкновение пуль с врагами и игроком
        this.bodies.enemies = this.bodies.enemies?.filter((enemy) => {
            let enemyAlive = true
            this.bodies.bullets = this.bodies.bullets?.filter((bullet) => {
                // Если пуля игрока врезалась во врага
                if (bullet.playerBullet === true &&
                    enemy.position.x < bullet.position.x + bullet.size.width &&
                    enemy.position.x + enemy.size.width  > bullet.position.x &&
					enemy.position.y < bullet.position.y + bullet.size.height && 
					enemy.position.y + enemy.size.height > bullet.position.y) {
                    enemy.hit()
                    enemyAlive = false
                    this.interfaces?.updateScores(100)
                    return false
                }
                // Если пуля врага врезалась в игрока
                if (this.bodies.player) {
                    let player = this.bodies.player
                    if (bullet.playerBullet === false &&
                        player.position.x < bullet.position.x + bullet.size.width  && 
                        player.position.x + player.size.width  > bullet.position.x &&
                        player.position.y < bullet.position.y + bullet.size.height && 
                        player.position.y + player.size.height > bullet.position.y) {
                        player.hit()
                        this.interfaces?.updateScores(-1000)
                        return false
                    }
                }
                return true
            })
            return enemyAlive
        })
        // Столкновение пуль
        this.bodies.bullets = this.bodies.bullets?.filter((b1) => {
            let bulletAlive = true
            this.bodies.bullets?.forEach((b2) => {
                if ((b1.playerBullet === true || b2.playerBullet === true) &&
                    ((b1.playerBullet === true && b2.playerBullet === false) ||
                    (b1.playerBullet === false && b2.playerBullet === true)) &&
                    (b1.position.x < b2.position.x + b2.size.width  && 
					b1.position.x + b1.size.width  > b2.position.x &&
					b1.position.y < b2.position.y + b2.size.height && 
					b1.position.y + b1.size.height > b2.position.y)) {
                    b1.hit()
                    bulletAlive = false
                    this.interfaces?.updateScores(200)
                }
            })
            return bulletAlive
        });
    }
    /** Проверка нахождения пули в пределах холста */
    deleteExternalBullet(bullet: Bullet, index: number): void {
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
        if (this.bodies.player) {
            this.renderBody(this.bodies.player)
        }
        this.bodies.bullets?.forEach((bullet) => {
            this.renderBody(bullet)
        })
        this.bodies.enemies?.forEach((enemy) => {
            this.renderBody(enemy)
        })
        this.bodies.explosions?.forEach((explode) => {
            this.renderBody(explode)
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
    renderBody(body: Player | Enemy | Bullet | Explosion): void {
        this.screen!.globalAlpha = body.alpha
        this.screen?.drawImage(body.skin.src, ...body.skin.frames[body.skin.frameNumber], 
            body.size.width, body.size.height, body.position?.x!, body.position?.y!, 
            body.size.width, body.size.height);
        this.screen!.globalAlpha = 1
    }
    /** Получение рандомного числа в диапазоне */
    getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
    /** Конец */
    over() {
        this.interfaces?.createGameOver()
        this.interfaces?.createRestart()
        this.resources.play('gameOver')
    }
}
/** Интерфейс */
class Interfaces {
    startButton: HTMLElement | undefined 
    restartButton: HTMLElement | undefined 
    gameover: HTMLElement | undefined 
    livesContainer: HTMLElement | undefined 
    scoresContainer: HTMLElement | undefined 

    constructor(public game: CrealaxianGame) {
        this.createStart('PLAY')
    }

    /** Создание кнопки старт */
    createStart(text: string) {
        this.startButton = document.createElement('start_button');
        this.startButton.innerHTML = text
        this.startButton.onclick = () => {
            this.game.start()
        }
        this.game.container?.appendChild(this.startButton);
    }
    /** Удаление кнопки старт */
    deleteStart = () => this.startButton?.parentNode?.removeChild(this.startButton)
    /** Создание надписи GameOver */
    createGameOver() {
        this.gameover = document.createElement('gameover');
        this.gameover.innerHTML = 'GAME OVER'
        this.game.container?.appendChild(this.gameover);
    }
    /** Удаление надписи GameOver */
    deleteGameOver = () => this.gameover?.parentNode?.removeChild(this.gameover)
    /** Создание кнопки рестарт */
    createRestart() {
        this.restartButton = document.createElement('restart_button');
        this.restartButton.innerHTML = 'RESTART'
        this.restartButton.onclick = () => {
            this.deleteGameOver()
            this.game.restart()
        }
        this.game.container?.appendChild(this.restartButton);
    }
    /** Удаление кнопки рестарт */
    deleteRestart = () => this.restartButton?.parentNode?.removeChild(this.restartButton)
    /** Создание контейнера с жизнями */
    createLives() {
        this.livesContainer = document.createElement('lives');
        this.game.container?.appendChild(this.livesContainer);
    }
    /** Обновление жизней */
    updateLives() {
        if (this.game.bodies.player) {
            this.livesContainer!.innerHTML = ''
            for (let i = 0; i < this.game.bodies.player.lives; i++) {
                this.livesContainer?.appendChild(document.createElement('span'))
            }
        } else {
            this.livesContainer!.innerHTML = ''
        }
    }
    /** Создани конейнера с очками */
    createScores() {
        this.scoresContainer = document.createElement('score');
        this.game.container?.appendChild(this.scoresContainer);   
    }
    /** Обновление очков */
    updateScores(n: number) {
        this.game.scores += n
        this.scoresContainer!.innerHTML = this.game.scores.toFixed()
    }
}
/** Враги */
class Enemies {
    types: {[key: string]: EnemyType}
    constructor() {
        this.types = {
            '1': {
                width: 26,
                height: 17,
                speedX: 0.5,
                frames: [[0,32], [26,32], [52,32], [26,32]],
                lives: 1,
                shootFx: {

                }
            },
            '2': {
                width: 26,
                height: 17,
                speedX: 0.5,
                frames: [[78,32], [104,32], [130,32], [104,32]],
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
                frames: [[156,32], [182,32], [208,32], [182,32]],
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
                frames: [[234,32]],
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
                frames: [[256,32]],
                lives: 1,
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
    get maxWidth(): number {
        return Math.max(...Object.keys(this.types).map((i) => this.types[i].width))
    }
    get maxHeight(): number {
        return Math.max(...Object.keys(this.types).map((i) => this.types[i].height))
    }
}
/** Враг */
class Enemy {
    timer: number
    alpha: number = 1
    
    constructor(public matrix: [number, number], public game: CrealaxianGame, public skin: BodySkin, public size: BodyDimensions, 
        public position: BodyPosition, public speedX: number, 
        public defaultLength: number,
        public canShoot: boolean = true,
        public velocity: number = 2,
        public speed: number = 0.005,
        public angle: Function = () => Math.random() - 0.5
        ) {
        this.timer = game.getRandomInt(0, 48)

    }
    /** Обновление врага */
    update() {
        // Обновление фрейма
        this.timer++
        if (this.timer % 24 === 0) this.nextFrame()
        // Смена направления после удара о борт
        let extermes = this.game.getExtremes()
        if (extermes[0] < 0 || (extermes[1]+this.defaultLength) > this.game.params.width) {
            this.speedX = -this.speedX
            // Смещение по Y после удара о борт
            // if (this.game.bodies.player) {
                // this.position.y += this.game.enemies.maxHeight
            // }
        }
        this.position.x += this.speedX;
        // Изменение координаты Y ()
        // this.position.y += this.fx(this.position.x);
        if (Math.random() < this.speed && !this.game.enemiesBelow(this) && this.canShoot) {
            this.shoot(this.angle())
        }
    }
    /** Враг стреляет */
    shoot(angle: number) {
        if (this.game.bodies.player) {
            this.game.resources.play('enemyShoot')
            this.game.createBullet(this, false, 2, angle)
        }
    }
    /** Переключение на следующий фрейм */
    nextFrame(): void {
        let curFrame = this.skin.frameNumber + 1
        let allFramesLength = this.skin.frames.length
        if (curFrame === allFramesLength) {
            this.skin.frameNumber = 0
        } else {
            this.skin.frameNumber++
        }
    }
    /** Попадание патроном */
    hit() {
        this.game.resources.play('hitEnemy')
        this.game.bodies.explosions?.push(new Explosion(this.game, this, {
            src: this.game.sprite!,
            frameNumber: 0,
            frames: [[0,61],[32,61],[64,61],[32,61],[0,61]]
        }))
    }
    fx(x: number): number {
        return (Math.sin(x/4))/4;
    }
}
/** Взрывы */
class Explosion {
    position: BodyPosition
    timer: number = 0
    alpha: number = 1

    constructor(public game: CrealaxianGame, public body: Player | Enemy | Bullet, public skin: BodySkin, public size: BodyDimensions = {width: 32, height: 32}) {
        this.position = {
            x: body.position.x + (body.size.width / 2) - (this.size.width / 2),
            y: body.position.y + (body.size.height / 2) - (this.size.height / 2)
        }
    }

    update(index: number) {
        this.timer++
        if (this.timer % 6 === 0) this.nextFrame(index)
    }

    nextFrame(index: number): void {
        if ((this.skin.frameNumber + 1) === this.skin.frames.length) {
            this.game.bodies.explosions?.splice(index, 1)
        } else {
            this.skin.frameNumber++
        }
    }
}
/** Пули */
class Bullet {
    position: BodyPosition
    alpha: number = 1
    
    constructor(public game: CrealaxianGame, public body: Player | Enemy, public skin: BodySkin, 
        public playerBullet: boolean = false,
        public size: BodyDimensions = {width: 4, height: 12}, 
        public velocity: {x: number, y: number} = {x: 0, y: -6},
        public angle: number
        ) {
        this.position = {
            x: body.position.x + (body.size.width / 2) - (this.size.width / 2),
            y: (this.playerBullet ? body.position.y - (this.size.height / 2) : body.position.y + (this.size.height))
        }
    }

    update() {
        this.position.y += (this.playerBullet ? this.velocity.y : (this.body as Enemy).velocity)
        this.position.x += this.angle
    }

    hit() {
        this.game.bodies.explosions?.push(new Explosion(this.game, this, {
            src: this.game.sprite!,
            frameNumber: 0,
            frames: [[0,61],[32,61],[64,61],[32,61],[0,61]]
        }))
    }

}
/** Игрок */
class Player {
    lives: number = 3
    position: BodyPosition
    timer: number = 0
    canShoot: boolean = true
    alpha: number = 1
    deathcounter: number = 0

    constructor(public game: CrealaxianGame, public skin: BodySkin, public size: BodyDimensions = {width: 24, height: 32}) {
        this.position = {
            x: (game.params.width - this.size.width) / 2,
            y: game.params.height - this.size.height
        }
    }
    update(): void {
        if (this.deathcounter > 0) {
            this.alpha = Math.round(((Math.sin((Math.PI / 2)+(this.deathcounter/1.59151))/2)+0.5)*100)/100
            this.deathcounter--
        } else {
            this.alpha = 1
        }

        if(this.game.kbd.is('LEFT') && this.position.x > 0) {
            this.position.x -= 2;
            this.skin.frameNumber = 1;
        } else if (this.game.kbd.is('RIGHT') && this.position.x < (this.game.params.width-this.size.width)) {
            this.position.x += 2;
            this.skin.frameNumber = 2;
        } else {
            this.skin.frameNumber = 0;
        }
        let shootTimer = 48
        if (this.game.kbd.is('SPACE')) {
            if (this.canShoot) this.shoot(0)
        }
        if (this.game.kbd.is('DEMON')) {
            shootTimer = 8
            if (this.canShoot) this.shoot(0)
        }
        if (this.timer % shootTimer === 0) this.canShoot = true
        this.timer++
    }
    /** Попадание патроном */
    hit() {
        if (this.deathcounter === 0) {
            this.deathcounter = 120
            this.lives -= 1
            this.game.interfaces?.updateLives()
            this.game.resources.play('hitPlayer')
            this.game.bodies.explosions?.push(new Explosion(this.game, this, {
                src: this.game.sprite!,
                frameNumber: 0,
                frames: [[0,61],[32,61],[64,61],[32,61],[0,61]]
            }))
        }
        if (this.lives === 0) {
            this.game.over()
            delete this.game.bodies.player
            this.game.interfaces?.updateLives()
        }
    }
    /** Выстрел  */
    shoot(angle: number): void {
        this.canShoot = false
        this.game.resources.play('shoot')
        this.game.createBullet(this, true, 0, angle)
    }
    /** Победа */
    win() {
        this.lives += 1
        this.game.interfaces?.updateLives()
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
			[0,0,0,3,3,3,3,0,0,0],
			[0,0,3,3,3,3,3,3,0,0],
			[0,2,2,2,2,2,2,2,2,0],
			[1,2,1,1,1,1,1,1,2,1],
			[1,1,1,1,1,1,1,1,1,1],
			[1,1,0,0,0,0,0,0,1,1]
        ],
        [
			[0,3,0,3,3,3,3,0,3,0],
            [0,0,3,3,3,3,3,3,0,0],
            [0,3,0,3,3,3,3,0,3,0],
			[0,0,3,3,3,3,3,3,0,0]
        ],
        [
			[0,4,0,4,0,4,0,4,0,4],
			[4,0,4,0,4,0,4,0,4]
        ],
		[
			[4,4,4],
			[4,4,4],
			[2,2,2,2,2,2,2,2,2,3,3,3],
			[0,0,2,2,2,2,2,2,2,3,3,3],
			[1,1,1,1,1,1,1,1,1,3,3,3],
			[1,1,1],
			[1,1,1]
		],
		[
			[4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
			[0,3,3,3,0,3,3,3,0,3,3,3,0,3,3,3],
			[0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,3],
			[0,3,0,0,0,3,0,0,0,3,0,0,0,3,3,3],
			[0,3,3,3,0,3,3,3,0,3,3,3,0,3,0,0],
			[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
		],
		[
			[5]
        ],
        [
			[0,0,0,0,1,1,0,1,1,0,0,1,1,1,0,0,1,0],
			[0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,1],
			[0,0,0,1,0,0,0,1,1,0,0,1,1,0,0,1,0,1],
			[0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,1,1],
			[0,0,0,0,1,1,0,1,0,1,0,1,1,1,0,1,0,1],
			[0],
			[2,0,0,0,2,0,0,2,0,2,0,2,0,0,2,0,0,2,0,0,2],
			[2,0,0,2,0,2,0,0,2,0,0,0,0,2,0,2,0,2,2,0,2],
			[2,0,0,2,2,2,0,2,0,2,0,2,0,2,2,2,0,2,0,2,2],
			[2,2,0,2,0,2,0,2,0,2,0,2,0,2,0,2,0,2,0,0,2]
        ]
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

    /** Следующий уровень */
    nextLevel(): number[][] {
        if ((this.index + 1) === this.list.length) {
            this.index = 0
        } else {
            this.index++
        }
        return this.list[this.index]
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