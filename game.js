kaboom({
    global: true,
    fullscreen: true,
    scale: 1,
    debug: true,
    clearColor: [0,0,0,1]
})

const PAC_SPEED = 200;
const GHOST_SPEED = 120;
let GAME_PAUSED = false;
let pauseMessage;
let playMessage;
let pacState = 0
let berries;

layers(['game', 'ui'], 'game')

loadSprite('pacRight', 'sprites/pacRight.png')
loadSprite('pacLeft', 'sprites/pacLeft.png')
loadSprite('pacUp', 'sprites/pacUp.png')
loadSprite('pacDown', 'sprites/pacDown.png')
loadSprite('pacCloseRight', 'sprites/pacCloseRight.png')
loadSprite('pacCloseLeft', 'sprites/pacCloseLeft.png')
loadSprite('pacCloseUp', 'sprites/pacCloseUp.png')
loadSprite('pacCloseDown', 'sprites/pacCloseDown.png')
loadSprite('pacOpenRight', 'sprites/pacOpenRight.png')
loadSprite('pacOpenLeft', 'sprites/pacOpenLeft.png')
loadSprite('pacOpenUp', 'sprites/pacOpenUp.png')
loadSprite('pacOpenDown', 'sprites/pacOpenDown.png')
loadSprite('ghost1', 'sprites/ghost1.png')
loadSprite('ghost2', 'sprites/ghost2.png')
loadSprite('ghost3', 'sprites/ghost3.png')
loadSprite('berry', 'sprites/berry.png')
loadSprite('wallRight', 'sprites/wallRight.png')
loadSprite('wallLeft', 'sprites/wallLeft.png')
loadSprite('wallUp', 'sprites/wallUp.png')
loadSprite('wallDown', 'sprites/wallDown.png')
loadSprite('wallMid', 'sprites/wallMid.png')
loadSprite('wallCBL', 'sprites/wallCBL.png')
loadSprite('wallCBR', 'sprites/wallCBR.png')
loadSprite('wallCTL', 'sprites/wallCTL.png')
loadSprite('wallCTR', 'sprites/wallCTR.png')

scene('game', ({ level, score }) => {
    const maps = [
        [
        '-------------------------',
        'auuuuuuuuuuuuuuuuuuuuuuup',
        'l                       r',
        'l MMMMMM MMMMMMM MMMMMM r',
        'l M   ]            [  M r',
        'l M MMMMM MMMMM MMMMM M r',
        'l M M               M M r',
        'l M   MMMMMM MMMMMM   M r',
        'l M M M  /        M M M r',
        'l   M M MMMM MMMM M M   r',
        'l M M M       [   M M M r',
        'l M   MMMMMM MMMMMM   M r',
        'l M M               M M r',
        'l M MMMMM MMMMM MMMMM M r',
        'l M         /         M r',
        'l MMMMMM MMMMMMM MMMMMM r',
        'l    ]                  r',
        'qdddddddddddddddddddddddm',
        ]
    ]

    const levelConfig = {
        height: 40,
        width: 40,
        'a' : [sprite('wallCTL'), solid(), 'wall'],
        'p' : [sprite('wallCTR'), solid(), 'wall'],
        'q' : [sprite('wallCBL'), solid(), 'wall'],
        'm' : [sprite('wallCBR'), solid(), 'wall'],
        'u' : [sprite('wallUp'), solid(), 'wall'],
        'd' : [sprite('wallDown'), solid(), 'wall'],
        'l' : [sprite('wallLeft'), solid(), 'wall'],
        'r' : [sprite('wallRight'), solid(), 'wall'],
        'M' : [sprite('wallMid'), solid(), 'wall'],
        '/' : [sprite('ghost1'), 'ghost', 'otherGhost', solid(), {timer: 0, dirH: 1, dirV: 1, cooldown: 0}],
        '[' : [sprite('ghost2'), 'ghost', 'otherGhost', solid(), {timer: 0, dirH: 1, dirV: 1, cooldown: 0}],
        ']' : [sprite('ghost3'), 'ghost', 'otherGhost', solid(), {timer: 0, dirH: 1, dirV: 1, cooldown: 0}],
        ' ' : [sprite('berry'), 'berry'],
    }

    addLevel(maps[level], levelConfig)
    add([
        text(`Countdown :`),
        pos(40,10),
        layer('ui'),
        scale(2)
    ])
    add([
        text(`Level :`),
        pos(400,10),
        layer('ui'),
        scale(2)
    ])

    function killer() {
        let timer = 0
        return {
            update() {
                timer -= dt()
                if(timer <= 0) {
                    player.killer = false;
                    pacState = 0;
                }
            },
            getAngry(time) {
                player.killer = true;
                timer = time;
            }
        }
    }

    function chooseDirection() {
        let random = parseInt(rand(1,4));
        switch (random) {
            case 1 :
                return {x: -1, y: -1};
            case 2 :
                return {x: 1, y: 1};
            case 3 :
                return {x: 1, y: -1};
            case 4 :
                return {x: -1, y: 1};
            default :
                console.log('SWITCH DEFAULT');
        }
    }

    function randTime() {
        let random = rand(10);
        return random;
    }
    
    const player = add([sprite('pacRight'), pos(45,85), solid(), {killer: false}, 'player', killer()])
    player.action(() => {
        player.resolve()
    })
    const scoreBoard = add([
        text('50'),
        pos(240,10),
        layer('ui'),
        {
            value: score
        },
        scale(2)
    ])
    const levelBoard = add([
        text('0'),
        pos(560,10),
        layer('ui'),
        {
            value: level
        },
        scale(2)
    ])
    player.overlaps('berry', (b) => {
        destroy(b)
        scoreBoard.value = parseInt(scoreBoard.value) - 1;
        scoreBoard.text = scoreBoard.value;
    })
    collides('player', 'ghost', (p, g) => {
        if(p.killer) {
            destroy(g);
        } else {
            camShake(3)
            destroy(p)
            wait(1, () => {
                go('gameLost', {level: levelBoard.value})
            })    
        }
    })
    collides('ghost', 'otherGhost', (g,_o) => {
        g.dirH = -g.dirH;
        g.dirV = -g.dirV;
    })
    collides('ghost', 'wall', (g,_w) => {
        let {x, y} = chooseDirection();
        g.dirH = x;
        g.dirV = y;
        g.timer = randTime();
    })

    action(() => {
        if(scoreBoard.value <= 0) {
            player.getAngry(6);
            scoreBoard.value = 50;
            scoreBoard.text = scoreBoard.value;
        }
        berries = get('berry');
        if(berries.length === 0) {
            wait(1, () => {
                go('nextStage', {level, check : maps.length})
            })           
        }
    })
    action('ghost', (g) => {
        if(GAME_PAUSED === false) {
            g.resolve();
            g.move(g.dirH * GHOST_SPEED, g.dirV * GHOST_SPEED)
            g.timer -= dt();
            if(g.timer <= 0) {
                let {x, y} = chooseDirection();
                g.dirH = x;
                g.dirV = y;
                g.timer = randTime();
            }
        }
    })

    keyDown('left', () => {
        if(player.killer) {
            pacState += dt()
            if(
                pacState < 0.3 || 
                (pacState > 0.6 && pacState < 0.9) || 
                (pacState > 1.2 && pacState < 1.5) ||
                (pacState > 1.8 && pacState < 2.1) ||
                (pacState > 2.4 && pacState < 2.7) ||
                (pacState > 3 && pacState < 3.3) ||
                (pacState > 3.6 && pacState < 3.9) ||
                (pacState > 4.2 && pacState < 4.5) ||
                (pacState > 4.8 && pacState < 5.1) ||
                (pacState > 5.4 && pacState < 5.7) 
            ) {
                player.changeSprite('pacOpenLeft');
            } else {
                player.changeSprite('pacCloseLeft');
            }
        } else {
            player.changeSprite('pacLeft')
        }
        player.move( -PAC_SPEED, 0)
    })
    keyDown('right', () => {
        if(player.killer) {
            pacState += dt()
            if(
                pacState < 0.3 || 
                (pacState > 0.6 && pacState < 0.9) || 
                (pacState > 1.2 && pacState < 1.5) ||
                (pacState > 1.8 && pacState < 2.1) ||
                (pacState > 2.4 && pacState < 2.7) ||
                (pacState > 3 && pacState < 3.3) ||
                (pacState > 3.6 && pacState < 3.9) ||
                (pacState > 4.2 && pacState < 4.5) ||
                (pacState > 4.8 && pacState < 5.1) ||
                (pacState > 5.4 && pacState < 5.7) 
            ) {
                player.changeSprite('pacOpenRight');
            } else {
                player.changeSprite('pacCloseRight');
            }
        } else {
            player.changeSprite('pacRight')
        }
        player.move( PAC_SPEED, 0)
    })
    keyDown('up', () => {
        if(player.killer) {
            pacState += dt()
            if(
                pacState < 0.3 || 
                (pacState > 0.6 && pacState < 0.9) || 
                (pacState > 1.2 && pacState < 1.5) ||
                (pacState > 1.8 && pacState < 2.1) ||
                (pacState > 2.4 && pacState < 2.7) ||
                (pacState > 3 && pacState < 3.3) ||
                (pacState > 3.6 && pacState < 3.9) ||
                (pacState > 4.2 && pacState < 4.5) ||
                (pacState > 4.8 && pacState < 5.1) ||
                (pacState > 5.4 && pacState < 5.7) 
            ) {
                player.changeSprite('pacOpenUp');
            } else {
                player.changeSprite('pacCloseUp');
            }
        } else {
            player.changeSprite('pacUp')
        }
        player.move( 0, -PAC_SPEED)
    })
    keyDown('down', () => {
        if(player.killer) {
            pacState += dt()
            if(
                pacState < 0.3 || 
                (pacState > 0.6 && pacState < 0.9) || 
                (pacState > 1.2 && pacState < 1.5) ||
                (pacState > 1.8 && pacState < 2.1) ||
                (pacState > 2.4 && pacState < 2.7) ||
                (pacState > 3 && pacState < 3.3) ||
                (pacState > 3.6 && pacState < 3.9) ||
                (pacState > 4.2 && pacState < 4.5) ||
                (pacState > 4.8 && pacState < 5.1) ||
                (pacState > 5.4 && pacState < 5.7) 
            ) {
                player.changeSprite('pacOpenDown');
            } else {
                player.changeSprite('pacCloseDown');
            }
        } else {
            player.changeSprite('pacDown')
        }
        player.move( 0, PAC_SPEED)
    })
    keyDown("p", () => {
        GAME_PAUSED = true;
        let ghosts = get('ghost');
        ghosts.forEach(g => {
            g.dirH = 0;
            g.dirV = 0;                
        });
        pauseMessage = add([
            text('PAUSED'),
            pos(330,350),
            layer('ui'),
            scale(5),
            'message'
        ])
        playMessage = add([
            text('Press g to go on'),
            pos(330,500),
            layer('ui'),
            scale(3),
            'message'
        ])
    })
    keyDown('g', () => {
        GAME_PAUSED = false;
        let mess = get('message')
        mess.forEach(e => {
            destroy(e);
        });
        let ghosts = get('ghost');
        let {x, y} = chooseDirection();
        ghosts.forEach(g => {
            g.dirH = x;
            g.dirV = y;
            g.timer = randTime();               
        });     
    })
})

scene('gameLost', ({level}) => {
    add([
        text(`You lost at level ${level}`),
        pos(300,300),
        layer('ui'),
        scale(4)
    ])
    add([
        text(`Press SPACE to try again !`),
        pos(300,500),
        layer('ui'),
        scale(1.5)
    ])
    add([
        text(`Press ENTER to restart the game !`),
        pos(300,600),
        layer('ui'),
        scale(1.5)
    ])
    keyDown('space', () => {
        go('game', {level: level, score : 50})
    })
    keyDown('enter', () => {
        go('game', {level: 0 , score: 50})
    })
})

scene('nextStage', ({level, check}) => {
    add([
        text(`You nailed the level ${level}`),
        pos(300,300),
        layer('ui'),
        scale(4)
    ])
    add([
        text(`Press space to move on to level ${level+1} !`),
        pos(300,500),
        layer('ui'),
        scale(2)
    ])
    keyDown('space', () => {
        go('game', {level: (level+1) % check, score : 50})
    })
})

start('game', { level: 0, score: 50 })