const GAME_W = 960;
const GAME_H = 540;
const FLOOR_Y = 454;
const ROUND_SECONDS = 99;
const PLACEHOLDER_SHEET = 'assets/Spritesheetgrim.png';
const CLEAN_GRIM4_SHEET = 'assets/grim4-clean.png';

// grim4-reference.png is the sketch/reference sheet. It is not used directly
// because it includes labels and uneven cell spacing. Export the cleaned art as
// assets/grim4-clean.png with 256x256 cells in the frame order below, then swap
// PLACEHOLDER_SHEET to CLEAN_GRIM4_SHEET in the fighter configs.

const FIGHTERS = {
  p1: {
    name: 'Reaper',
    sheet: PLACEHOLDER_SHEET,
    frameWidth: 256,
    frameHeight: 256,
    scale: .78,
    tint: 0xffffff,
    startX: 260,
    controls: {
      left: 'A', right: 'D', up: 'W', crouch: 'S', block: 'Q',
      light: 'J', strong: 'K', uppercut: 'U',
      special1: 'I', special2: 'O', special3: 'P', special4: 'L',
      dashForward: 'E', dashBack: 'R', charge: 'H'
    }
  },
  p2: {
    name: 'Wraith',
    sheet: PLACEHOLDER_SHEET,
    frameWidth: 256,
    frameHeight: 256,
    scale: .78,
    tint: 0x9fc0ff,
    startX: 700,
    cpu: true,
    controls: {
      left: 'LEFT', right: 'RIGHT', up: 'UP', crouch: 'DOWN', block: 'NUMPAD_ZERO',
      light: 'ONE', strong: 'TWO', uppercut: 'THREE',
      special1: 'FOUR', special2: 'FIVE', special3: 'SIX', special4: 'SEVEN',
      dashForward: 'EIGHT', dashBack: 'NINE', charge: 'NUMPAD_DECIMAL'
    }
  }
};

const ANIMS = {
  idle: { start: 0, end: 2, fps: 6, repeat: -1 },
  moveLeft: { start: 3, end: 5, fps: 10, repeat: -1 },
  moveRight: { start: 3, end: 5, fps: 10, repeat: -1 },
  jump: { start: 18, end: 19, fps: 10, repeat: 0 },
  crouch: { start: 21, end: 22, fps: 6, repeat: -1 },
  block: { start: 10, end: 10, fps: 6, repeat: -1 },
  light: { start: 6, end: 10, fps: 15, repeat: 0 },
  strong: { start: 12, end: 14, fps: 13, repeat: 0 },
  uppercut: { start: 14, end: 15, fps: 14, repeat: 0 },
  special1: { start: 11, end: 11, fps: 12, repeat: 0 },
  special2: { start: 15, end: 17, fps: 14, repeat: 0 },
  special3: { start: 20, end: 20, fps: 10, repeat: 0 },
  special4: { start: 23, end: 23, fps: 10, repeat: 0 },
  takeDamage: { start: 25, end: 29, fps: 10, repeat: 0 },
  dashForward: { start: 3, end: 5, fps: 16, repeat: 0 },
  dashBack: { start: 3, end: 5, fps: 16, repeat: 0 },
  staminaCharge: { start: 16, end: 17, fps: 9, repeat: -1 },
  winPose: { start: 23, end: 23, fps: 5, repeat: -1 },
  losePose: { start: 27, end: 29, fps: 6, repeat: -1 }
};

const MOVES = {
  light: { damage: 6, stamina: 0, stun: 190, startup: 90, recovery: 230, reach: 76, width: 72, height: 72, knockback: 115 },
  strong: { damage: 11, stamina: 7, stun: 310, startup: 135, recovery: 370, reach: 106, width: 92, height: 64, knockback: 205 },
  uppercut: { damage: 13, stamina: 12, stun: 420, startup: 165, recovery: 450, reach: 74, width: 78, height: 118, knockback: 120, launch: -360 },
  special1: { damage: 15, stamina: 18, stun: 360, startup: 180, recovery: 460, reach: 132, width: 122, height: 78, knockback: 250 },
  special2: { damage: 9, stamina: 16, stun: 300, startup: 125, recovery: 420, reach: 168, width: 84, height: 76, knockback: 170 },
  special3: { damage: 19, stamina: 28, stun: 520, startup: 240, recovery: 560, reach: 112, width: 116, height: 104, knockback: 280, launch: -260 },
  special4: { damage: 24, stamina: 38, stun: 620, startup: 310, recovery: 700, reach: 148, width: 140, height: 108, knockback: 360, launch: -320 }
};

let sceneRef;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'fighterGame',
  backgroundColor: '#090a0d',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GAME_W, height: GAME_H },
  physics: { default: 'arcade', arcade: { gravity: { y: 1450 }, debug: false } },
  scene: { preload, create, update }
});

function preload(){
  sceneRef = this;
  this.load.spritesheet('p1', FIGHTERS.p1.sheet, frameConfig(FIGHTERS.p1));
  this.load.spritesheet('p2', FIGHTERS.p2.sheet, frameConfig(FIGHTERS.p2));
}

function create(){
  makeStage(this);
  createHud(this);
  makeFighterAnims(this, 'p1');
  makeFighterAnims(this, 'p2');

  this.p1 = spawnFighter(this, 'p1', FIGHTERS.p1);
  this.p2 = spawnFighter(this, 'p2', FIGHTERS.p2);
  this.round = 1;

  this.input.keyboard.addCapture([
    'A', 'D', 'W', 'S', 'Q', 'E', 'R', 'H', 'J', 'K', 'U', 'I', 'O', 'P', 'L',
    'LEFT', 'RIGHT', 'UP', 'DOWN', 'NUMPAD_ZERO',
    'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'NUMPAD_DECIMAL'
  ]);

  beginRound(this);
}

function update(time, delta){
  const scene = sceneRef;
  updateRoundState(scene, time);
  updateHud(scene);

  if (scene.match.state !== 'fight') return;

  tickTimer(scene, time);
  updateFighter(scene, scene.p1, scene.p2, delta);
  updateFighter(scene, scene.p2, scene.p1, delta);
  keepFightersInArena(scene.p1, scene.p2);
  checkRoundEnd(scene);
}

function frameConfig(cfg){
  return { frameWidth: cfg.frameWidth, frameHeight: cfg.frameHeight };
}

function makeStage(scene){
  const g = scene.add.graphics();
  g.fillGradientStyle(0x15151d, 0x15151d, 0x07080b, 0x07080b, 1);
  g.fillRect(0, 0, GAME_W, GAME_H);
  g.fillStyle(0x090a0f, .65);
  g.fillRect(34, 70, GAME_W - 68, FLOOR_Y - 90);
  g.lineStyle(2, 0xc9a24d, .18);
  g.strokeRect(34, 70, GAME_W - 68, FLOOR_Y - 90);
  g.fillStyle(0x1a1012, .96);
  g.fillRect(0, FLOOR_Y, GAME_W, GAME_H - FLOOR_Y);
  g.fillStyle(0xd94b4b, .26);
  for (let x = 40; x < GAME_W; x += 108) g.fillRect(x, FLOOR_Y + 14, 72, 3);

  scene.floor = scene.physics.add.staticImage(GAME_W / 2, FLOOR_Y + 24, null)
    .setDisplaySize(GAME_W, 48)
    .setVisible(false)
    .refreshBody();
}

function createHud(scene){
  scene.hud = {
    p1Back: scene.add.rectangle(204, 34, 334, 22, 0x141821).setOrigin(0, .5),
    p2Back: scene.add.rectangle(756, 34, 334, 22, 0x141821).setOrigin(1, .5),
    p1Bar: scene.add.rectangle(206, 34, 330, 18, 0xd94b4b).setOrigin(0, .5),
    p2Bar: scene.add.rectangle(754, 34, 330, 18, 0xd94b4b).setOrigin(1, .5),
    p1StaminaBack: scene.add.rectangle(206, 53, 220, 7, 0x111722).setOrigin(0, .5),
    p2StaminaBack: scene.add.rectangle(754, 53, 220, 7, 0x111722).setOrigin(1, .5),
    p1Stamina: scene.add.rectangle(206, 53, 220, 5, 0x6ce6d3).setOrigin(0, .5),
    p2Stamina: scene.add.rectangle(754, 53, 220, 5, 0x6ce6d3).setOrigin(1, .5),
    timer: scene.add.text(GAME_W / 2, 20, String(ROUND_SECONDS), {
      fontFamily: 'Inter, Arial',
      fontSize: '30px',
      fontStyle: '800',
      color: '#f7f7fb'
    }).setOrigin(.5, 0),
    p1Name: scene.add.text(42, 17, FIGHTERS.p1.name.toUpperCase(), hudLabel()).setOrigin(0, 0),
    p2Name: scene.add.text(GAME_W - 42, 17, FIGHTERS.p2.name.toUpperCase(), hudLabel()).setOrigin(1, 0),
    center: scene.add.text(GAME_W / 2, 168, '', {
      fontFamily: 'Cormorant Garamond, Georgia',
      fontSize: '62px',
      color: '#c9a24d',
      align: 'center'
    }).setOrigin(.5)
  };
}

function hudLabel(){
  return { fontFamily: 'Inter, Arial', fontSize: '12px', fontStyle: '800', color: '#c9a24d' };
}

function makeFighterAnims(scene, key){
  Object.entries(ANIMS).forEach(([name, def]) => {
    const animKey = `${key}_${name}`;
    if (scene.anims.exists(animKey)) scene.anims.remove(animKey);
    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNumbers(key, { start: def.start, end: def.end }),
      frameRate: def.fps,
      repeat: def.repeat
    });
  });
}

function spawnFighter(scene, key, cfg){
  const fighter = scene.physics.add.sprite(cfg.startX, FLOOR_Y - 1, key)
    .setOrigin(.5, 1)
    .setScale(cfg.scale)
    .setTint(cfg.tint)
    .setCollideWorldBounds(false);

  scene.physics.add.collider(fighter, scene.floor);
  fighter.body.setSize(78, 176);
  fighter.body.setOffset(89, 70);
  fighter.cfg = cfg;
  fighter.keys = scene.input.keyboard.addKeys(cfg.controls);
  fighter.keyName = key;
  fighter.health = 100;
  fighter.stamina = 75;
  fighter.facing = key === 'p1' ? 1 : -1;
  fighter.attack = null;
  fighter.blocking = false;
  fighter.crouching = false;
  fighter.charging = false;
  fighter.stunUntil = 0;
  fighter.nextAttackAt = 0;
  fighter.dashUntil = 0;
  fighter.cpuPlanAt = 0;
  fighter.cpuMove = 0;
  fighter.cpuBlockUntil = 0;
  fighter.anims.play(`${key}_idle`, true);
  fighter.setFlipX(fighter.facing < 0);
  return fighter;
}

function beginRound(scene){
  scene.match = {
    state: 'intro',
    timer: ROUND_SECONDS,
    stateStartedAt: scene.time.now,
    fightStartedAt: 0,
    lastTick: 0
  };

  resetFighter(scene.p1, FIGHTERS.p1);
  resetFighter(scene.p2, FIGHTERS.p2);
  faceOpponent(scene.p1, scene.p2);
  faceOpponent(scene.p2, scene.p1);
  scene.hud.center.setText(`ROUND ${scene.round}`);
}

function updateRoundState(scene, time){
  if (scene.match.state === 'intro') {
    const elapsed = time - scene.match.stateStartedAt;
    if (elapsed < 950) scene.hud.center.setText(`ROUND ${scene.round}`);
    else if (elapsed < 1850) scene.hud.center.setText('READY');
    else if (elapsed < 2500) scene.hud.center.setText('FIGHT');
    else {
      scene.match.state = 'fight';
      scene.match.fightStartedAt = time;
      scene.match.lastTick = time;
      scene.hud.center.setText('');
    }
  }
}

function updateFighter(scene, fighter, opponent, delta){
  const now = scene.time.now;
  faceOpponent(fighter, opponent);
  fighter.stamina = Math.min(100, fighter.stamina + delta * .006);

  if (now < fighter.stunUntil) {
    fighter.blocking = false;
    fighter.crouching = false;
    fighter.charging = false;
    fighter.setVelocityX(Phaser.Math.Linear(fighter.body.velocity.x, 0, .09));
    return;
  }

  if (fighter.attack) {
    updateAttack(fighter, opponent, now);
    return;
  }

  const input = readInput(scene, fighter, opponent, now);
  const onFloor = fighter.body.onFloor();
  fighter.blocking = onFloor && input.block && !input.charge;
  fighter.crouching = onFloor && input.crouch && !fighter.blocking && !input.charge;
  fighter.charging = onFloor && input.charge && fighter.stamina < 100;

  if (fighter.blocking) {
    fighter.setVelocityX(0);
    playAnim(fighter, 'block');
    return;
  }

  if (fighter.charging) {
    fighter.stamina = Math.min(100, fighter.stamina + delta * .055);
    fighter.setVelocityX(0);
    playAnim(fighter, 'staminaCharge');
    return;
  }

  if (fighter.crouching) {
    fighter.setVelocityX(0);
    playAnim(fighter, 'crouch');
    return;
  }

  if (input.dash && now >= fighter.dashUntil && fighter.stamina >= 10) {
    startDash(fighter, input.dash);
    return;
  }

  if (now < fighter.dashUntil) return;

  fighter.setVelocityX(input.move * 250);
  if (input.jump && onFloor) fighter.setVelocityY(-650);

  if (input.attack && now >= fighter.nextAttackAt) {
    startAttack(fighter, input.attack);
    return;
  }

  if (!onFloor) {
    playAnim(fighter, 'jump');
    return;
  }

  if (input.move < 0) playAnim(fighter, 'moveLeft');
  else if (input.move > 0) playAnim(fighter, 'moveRight');
  else playAnim(fighter, 'idle');
}

function readInput(scene, fighter, opponent, now){
  const keys = fighter.keys;
  const human = {
    move: (keys.left.isDown ? -1 : 0) + (keys.right.isDown ? 1 : 0),
    jump: Phaser.Input.Keyboard.JustDown(keys.up),
    crouch: keys.crouch.isDown,
    block: keys.block.isDown,
    charge: keys.charge.isDown,
    dash: Phaser.Input.Keyboard.JustDown(keys.dashForward)
      ? 'dashForward'
      : Phaser.Input.Keyboard.JustDown(keys.dashBack)
        ? 'dashBack'
        : null,
    attack: readAttack(keys)
  };

  if (!fighter.cfg.cpu || human.move || human.jump || human.crouch || human.block || human.charge || human.dash || human.attack) return human;
  return cpuInput(scene, fighter, opponent, now);
}

function readAttack(keys){
  if (Phaser.Input.Keyboard.JustDown(keys.light)) return 'light';
  if (Phaser.Input.Keyboard.JustDown(keys.strong)) return 'strong';
  if (Phaser.Input.Keyboard.JustDown(keys.uppercut)) return 'uppercut';
  if (Phaser.Input.Keyboard.JustDown(keys.special1)) return 'special1';
  if (Phaser.Input.Keyboard.JustDown(keys.special2)) return 'special2';
  if (Phaser.Input.Keyboard.JustDown(keys.special3)) return 'special3';
  if (Phaser.Input.Keyboard.JustDown(keys.special4)) return 'special4';
  return null;
}

function cpuInput(scene, fighter, opponent, now){
  const distance = Math.abs(opponent.x - fighter.x);

  if (now >= fighter.cpuPlanAt) {
    fighter.cpuPlanAt = now + Phaser.Math.Between(180, 420);
    fighter.cpuMove = distance > 138 ? Math.sign(opponent.x - fighter.x) : Phaser.Math.Between(-1, 1);
  }

  const opponentIsAttacking = !!opponent.attack && distance < 130;
  if (opponentIsAttacking && now > fighter.cpuBlockUntil && Math.random() < .45) {
    fighter.cpuBlockUntil = now + Phaser.Math.Between(240, 520);
  }

  let attack = null;
  if (distance < 128 && now >= fighter.nextAttackAt && Math.random() < .035) {
    attack = distance < 88 ? 'light' : 'strong';
  } else if (distance < 156 && fighter.stamina > 35 && now >= fighter.nextAttackAt && Math.random() < .012) {
    attack = Phaser.Math.RND.pick(['uppercut', 'special1', 'special2']);
  }

  return {
    move: distance > 118 ? fighter.cpuMove : 0,
    jump: false,
    crouch: false,
    block: now < fighter.cpuBlockUntil,
    charge: distance > 230 && fighter.stamina < 45 && Math.random() < .35,
    dash: distance > 250 && fighter.stamina > 25 && Math.random() < .02 ? 'dashForward' : null,
    attack
  };
}

function startDash(fighter, dashName){
  const direction = dashName === 'dashForward' ? fighter.facing : -fighter.facing;
  fighter.stamina = Math.max(0, fighter.stamina - 10);
  fighter.dashUntil = sceneRef.time.now + 170;
  fighter.setVelocityX(direction * 520);
  playAnim(fighter, dashName, true);
}

function startAttack(fighter, moveName){
  const move = MOVES[moveName];
  if (!move || fighter.stamina < move.stamina) return;
  fighter.stamina = Math.max(0, fighter.stamina - move.stamina);
  fighter.attack = {
    name: moveName,
    startedAt: sceneRef.time.now,
    hitResolved: false,
    endsAt: sceneRef.time.now + move.startup + move.recovery
  };
  fighter.nextAttackAt = fighter.attack.endsAt + 80;
  fighter.blocking = false;
  fighter.setVelocityX(0);
  playAnim(fighter, moveName, true);
}

function updateAttack(fighter, opponent, now){
  const move = MOVES[fighter.attack.name];
  const age = now - fighter.attack.startedAt;

  if (!fighter.attack.hitResolved && age >= move.startup) {
    fighter.attack.hitResolved = true;
    if (hitboxOverlaps(fighter, opponent, move)) applyHit(fighter, opponent, move);
  }

  if (now >= fighter.attack.endsAt) {
    fighter.attack = null;
    if (fighter.body.onFloor()) playAnim(fighter, 'idle');
  }
}

function hitboxOverlaps(attacker, defender, move){
  const x = attacker.x + attacker.facing * move.reach;
  const y = attacker.y - 104;
  const hit = new Phaser.Geom.Rectangle(x - move.width / 2, y - move.height / 2, move.width, move.height);
  const hurt = new Phaser.Geom.Rectangle(defender.x - 36, defender.y - 158, 72, 150);
  return Phaser.Geom.Intersects.RectangleToRectangle(hit, hurt);
}

function applyHit(attacker, defender, move){
  const blocked = defender.blocking && defender.facing === -attacker.facing;
  const damage = blocked ? Math.ceil(move.damage * .25) : move.damage;
  defender.health = Math.max(0, defender.health - damage);
  defender.attack = null;
  defender.blocking = false;
  defender.stunUntil = sceneRef.time.now + (blocked ? 120 : move.stun);
  defender.setVelocityX(attacker.facing * (blocked ? 70 : move.knockback));
  defender.setVelocityY(blocked ? -40 : (move.launch || -130));
  playAnim(defender, 'takeDamage', true);
  flash(defender, blocked ? 0x6ce6d3 : 0xff5a5a);
}

function playAnim(fighter, name, restart = false){
  const key = `${fighter.keyName}_${name}`;
  if (fighter.anims.currentAnim?.key === key && !restart) return;
  fighter.anims.play(key, restart);
}

function flash(sprite, color){
  sprite.setTint(color);
  sceneRef.time.delayedCall(90, () => sprite.setTint(sprite.cfg.tint));
}

function faceOpponent(fighter, opponent){
  fighter.facing = opponent.x >= fighter.x ? 1 : -1;
  fighter.setFlipX(fighter.facing < 0);
}

function keepFightersInArena(a, b){
  [a, b].forEach(fighter => {
    fighter.x = Phaser.Math.Clamp(fighter.x, 54, GAME_W - 54);
    if (fighter.y > FLOOR_Y + 8) fighter.y = FLOOR_Y;
  });

  const minGap = 58;
  const gap = Math.abs(a.x - b.x);
  if (gap < minGap) {
    const mid = (a.x + b.x) / 2;
    a.x = Phaser.Math.Clamp(mid - minGap / 2, 54, GAME_W - 54);
    b.x = Phaser.Math.Clamp(mid + minGap / 2, 54, GAME_W - 54);
  }
}

function tickTimer(scene, time){
  if (time - scene.match.lastTick >= 1000) {
    scene.match.timer = Math.max(0, scene.match.timer - 1);
    scene.match.lastTick = time;
  }
}

function updateHud(scene){
  scene.hud.p1Bar.displayWidth = 330 * (scene.p1.health / 100);
  scene.hud.p2Bar.displayWidth = 330 * (scene.p2.health / 100);
  scene.hud.p1Stamina.displayWidth = 220 * (scene.p1.stamina / 100);
  scene.hud.p2Stamina.displayWidth = 220 * (scene.p2.stamina / 100);
  scene.hud.timer.setText(String(scene.match.timer).padStart(2, '0'));
}

function checkRoundEnd(scene){
  if (scene.p1.health > 0 && scene.p2.health > 0 && scene.match.timer > 0) return;

  scene.match.state = 'end';
  const winner = scene.p1.health === scene.p2.health
    ? 'DRAW'
    : scene.p1.health > scene.p2.health
      ? `${FIGHTERS.p1.name.toUpperCase()} WINS`
      : `${FIGHTERS.p2.name.toUpperCase()} WINS`;

  scene.hud.center.setText(winner);
  if (scene.p1.health >= scene.p2.health) {
    playAnim(scene.p1, 'winPose', true);
    playAnim(scene.p2, 'losePose', true);
  } else {
    playAnim(scene.p2, 'winPose', true);
    playAnim(scene.p1, 'losePose', true);
  }
  scene.round += 1;
  scene.time.delayedCall(2400, () => beginRound(scene));
}

function resetFighter(fighter, cfg){
  fighter.health = 100;
  fighter.stamina = 75;
  fighter.attack = null;
  fighter.blocking = false;
  fighter.crouching = false;
  fighter.charging = false;
  fighter.stunUntil = 0;
  fighter.nextAttackAt = 0;
  fighter.dashUntil = 0;
  fighter.cpuPlanAt = 0;
  fighter.cpuBlockUntil = 0;
  fighter.setTint(cfg.tint);
  fighter.setPosition(cfg.startX, FLOOR_Y - 1);
  fighter.setVelocity(0, 0);
  playAnim(fighter, 'idle', true);
}
