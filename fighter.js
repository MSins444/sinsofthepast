const GAME_W = 960;
const GAME_H = 540;
const FLOOR_Y = 454;
const ROUND_SECONDS = 99;

const FIGHTERS = {
  p1: {
    name: 'Reaper',
    sheet: 'assets/Spritesheetgrim.png',
    frameWidth: 6,
    frameHeight: 12,
    scale: .78,
    tint: 0xffffff,
    startX: 260,
    facing: 1,
    controls: { left: 'A', right: 'D', up: 'W', block: 'S', punch: 'J', kick: 'K' }
  },
  p2: {
    name: 'Wraith',
    sheet: 'assets/Spritesheetgrim.png',
    frameWidth: 256,
    frameHeight: 256,
    scale: .78,
    tint: 0x9fc0ff,
    startX: 700,
    facing: -1,
    controls: { left: 'LEFT', right: 'RIGHT', up: 'UP', block: 'DOWN', punch: 'ONE', kick: 'TWO' }
  }
};

const ANIMS = {
  idle: { start: 0, end: 7, fps: 6, repeat: -1 },
  walk: { start: 8, end: 15, fps: 10, repeat: -1 },
  punch: { start: 16, end: 20, fps: 15, repeat: 0 },
  kick: { start: 24, end: 28, fps: 13, repeat: 0 },
  hurt: { start: 32, end: 33, fps: 10, repeat: 0 }
};

const MOVES = {
  punch: { damage: 7, stun: 260, activeAt: 105, reach: 78, height: 72, width: 70, knockback: 155 },
  kick: { damage: 11, stun: 360, activeAt: 145, reach: 104, height: 64, width: 86, knockback: 230 }
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
  this.load.spritesheet('p1', FIGHTERS.p1.sheet, {
    frameWidth: FIGHTERS.p1.frameWidth,
    frameHeight: FIGHTERS.p1.frameHeight
  });
  this.load.spritesheet('p2', FIGHTERS.p2.sheet, {
    frameWidth: FIGHTERS.p2.frameWidth,
    frameHeight: FIGHTERS.p2.frameHeight
  });
}

function create(){
  this.match = {
    active: true,
    timer: ROUND_SECONDS,
    lastTick: 0,
    roundTextUntil: 1600
  };

  makeStage(this);
  createHud(this);
  makeFighterAnims(this, 'p1');
  makeFighterAnims(this, 'p2');

  this.p1 = spawnFighter(this, 'p1', FIGHTERS.p1);
  this.p2 = spawnFighter(this, 'p2', FIGHTERS.p2);

  this.input.keyboard.addCapture([
    'A', 'D', 'W', 'S', 'J', 'K',
    'LEFT', 'RIGHT', 'UP', 'DOWN', 'ONE', 'TWO'
  ]);
}

function update(time, delta){
  const s = sceneRef;
  if (!s.match.active) return;

  tickTimer(s, time);
  updateFighter(s.p1, s.p2, delta);
  updateFighter(s.p2, s.p1, delta);
  keepFightersInArena(s.p1, s.p2);
  updateHud(s);
  checkRoundEnd(s);
}

function makeStage(scene){
  const g = scene.add.graphics();
  g.fillGradientStyle(0x13131a, 0x13131a, 0x07080b, 0x07080b, 1);
  g.fillRect(0, 0, GAME_W, GAME_H);
  g.fillStyle(0x1a1012, .95);
  g.fillRect(0, FLOOR_Y, GAME_W, GAME_H - FLOOR_Y);
  g.fillStyle(0xd94b4b, .24);
  for (let x = 40; x < GAME_W; x += 110) g.fillRect(x, FLOOR_Y + 14, 74, 3);
  g.lineStyle(2, 0xc9a24d, .18);
  g.strokeRect(34, 50, GAME_W - 68, FLOOR_Y - 70);

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
    timer: scene.add.text(GAME_W / 2, 21, String(ROUND_SECONDS), {
      fontFamily: 'Inter, Arial',
      fontSize: '30px',
      fontStyle: '800',
      color: '#f7f7fb'
    }).setOrigin(.5, 0),
    p1Name: scene.add.text(42, 17, FIGHTERS.p1.name.toUpperCase(), hudLabel()).setOrigin(0, 0),
    p2Name: scene.add.text(GAME_W - 42, 17, FIGHTERS.p2.name.toUpperCase(), hudLabel()).setOrigin(1, 0),
    center: scene.add.text(GAME_W / 2, 168, 'ROUND 1', {
      fontFamily: 'Cormorant Garamond, Georgia',
      fontSize: '58px',
      color: '#c9a24d'
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
  const keys = scene.input.keyboard.addKeys(cfg.controls);
  const fighter = scene.physics.add.sprite(cfg.startX, FLOOR_Y - 1, key)
    .setOrigin(.5, 1)
    .setScale(cfg.scale)
    .setTint(cfg.tint)
    .setCollideWorldBounds(false);

  scene.physics.add.collider(fighter, scene.floor);
  fighter.body.setSize(78, 176);
  fighter.body.setOffset(89, 70);
  fighter.state = 'idle';
  fighter.health = 100;
  fighter.facing = cfg.facing;
  fighter.keys = keys;
  fighter.keyName = key;
  fighter.stunUntil = 0;
  fighter.attack = null;
  fighter.blocking = false;
  fighter.hasLandedHit = false;
  fighter.anims.play(`${key}_idle`, true);
  fighter.setFlipX(cfg.facing < 0);
  return fighter;
}

function updateFighter(f, opponent, delta){
  const now = sceneRef.time.now;
  faceOpponent(f, opponent);

  if (now < f.stunUntil) {
    f.setVelocityX(Phaser.Math.Linear(f.body.velocity.x, 0, .08));
    return;
  }

  if (f.attack) {
    updateAttack(f, opponent, now);
    return;
  }

  const onFloor = f.body.onFloor();
  const k = f.keys;
  const move = (k.left.isDown ? -1 : 0) + (k.right.isDown ? 1 : 0);
  f.blocking = onFloor && k.block.isDown && Math.sign(move) !== f.facing;

  if (f.blocking) {
    f.setVelocityX(0);
    f.anims.play(`${f.keyName}_idle`, true);
    return;
  }

  f.setVelocityX(move * 255);
  if (Phaser.Input.Keyboard.JustDown(k.up) && onFloor) f.setVelocityY(-650);

  if (Phaser.Input.Keyboard.JustDown(k.punch)) return startAttack(f, 'punch');
  if (Phaser.Input.Keyboard.JustDown(k.kick)) return startAttack(f, 'kick');

  if (!onFloor) return;
  f.anims.play(`${f.keyName}_${move ? 'walk' : 'idle'}`, true);
}

function startAttack(f, moveName){
  f.attack = { name: moveName, startedAt: sceneRef.time.now, resolved: false };
  f.hasLandedHit = false;
  f.setVelocityX(0);
  f.anims.play(`${f.keyName}_${moveName}`, true);
  f.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    f.attack = null;
    if (f.body?.onFloor()) f.anims.play(`${f.keyName}_idle`, true);
  });
}

function updateAttack(f, opponent, now){
  const move = MOVES[f.attack.name];
  if (!f.attack.resolved && now - f.attack.startedAt >= move.activeAt) {
    f.attack.resolved = true;
    if (hitboxOverlaps(f, opponent, move)) applyHit(f, opponent, move);
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
  defender.stunUntil = sceneRef.time.now + (blocked ? 120 : move.stun);
  defender.setVelocityX(attacker.facing * (blocked ? 70 : move.knockback));
  defender.setVelocityY(blocked ? -40 : -130);
  defender.anims.play(`${defender.keyName}_hurt`, true);
  flash(defender, blocked ? 0x6ce6d3 : 0xff5a5a);
}

function flash(sprite, color){
  sprite.setTint(color);
  sceneRef.time.delayedCall(90, () => sprite.setTint(FIGHTERS[sprite.keyName].tint));
}

function faceOpponent(f, opponent){
  f.facing = opponent.x >= f.x ? 1 : -1;
  f.setFlipX(f.facing < 0);
}

function keepFightersInArena(a, b){
  [a, b].forEach(f => {
    f.x = Phaser.Math.Clamp(f.x, 54, GAME_W - 54);
    if (f.y > FLOOR_Y + 8) f.y = FLOOR_Y;
  });

  const minGap = 58;
  const gap = Math.abs(a.x - b.x);
  if (gap < minGap) {
    const mid = (a.x + b.x) / 2;
    a.x = mid - minGap / 2;
    b.x = mid + minGap / 2;
  }
}

function tickTimer(scene, time){
  if (!scene.match.lastTick) scene.match.lastTick = time;
  if (time - scene.match.lastTick >= 1000) {
    scene.match.timer = Math.max(0, scene.match.timer - 1);
    scene.match.lastTick = time;
  }
}

function updateHud(scene){
  scene.hud.p1Bar.displayWidth = 330 * (scene.p1.health / 100);
  scene.hud.p2Bar.displayWidth = 330 * (scene.p2.health / 100);
  scene.hud.timer.setText(String(scene.match.timer).padStart(2, '0'));
  scene.hud.center.setVisible(scene.time.now < scene.match.roundTextUntil);
}

function checkRoundEnd(scene){
  if (scene.p1.health > 0 && scene.p2.health > 0 && scene.match.timer > 0) return;
  scene.match.active = false;
  const winner = scene.p1.health === scene.p2.health
    ? 'DRAW'
    : scene.p1.health > scene.p2.health
      ? `${FIGHTERS.p1.name.toUpperCase()} WINS`
      : `${FIGHTERS.p2.name.toUpperCase()} WINS`;
  scene.hud.center.setText(winner).setVisible(true);
  scene.time.delayedCall(2600, () => resetRound(scene));
}

function resetRound(scene){
  scene.match = { active: true, timer: ROUND_SECONDS, lastTick: scene.time.now, roundTextUntil: scene.time.now + 1200 };
  resetFighter(scene.p1, FIGHTERS.p1);
  resetFighter(scene.p2, FIGHTERS.p2);
  scene.hud.center.setText('ROUND 1');
}

function resetFighter(f, cfg){
  f.health = 100;
  f.attack = null;
  f.stunUntil = 0;
  f.blocking = false;
  f.setPosition(cfg.startX, FLOOR_Y - 1);
  f.setVelocity(0, 0);
  f.anims.play(`${f.keyName}_idle`, true);
}
