// ===== Player 1 only mini-fighter =====
// Sprite sheet: 256x256 grid, 8 cols x 5 rows
// Path must be: assets/Spritesheetgrim.png
const SHEET = "assets/Spritesheetgrim.png";
const FW=256, FH=256, MG=0, SP=0;

// Animation ranges (by index)
const A = {
  idle:  { s:  0, e:  7, f: 6,  r: -1 },
  walk:  { s:  8, e: 15, f: 10, r: -1 },
  punch: { s: 16, e: 20, f: 14, r:  0 },
  kick:  { s: 24, e: 28, f: 12, r:  0 },
  hurt:  { s: 32, e: 33, f: 10, r:  0 }
};

let S, G, p1;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",                   // <div id="game"></div> on arcade.html
  backgroundColor: "#0d0d0f",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 920, height: 520 },
  physics: { default: "arcade", arcade: { gravity: { y: 1000 }, debug: false } },
  scene: { preload, create, update }
});

function preload(){
  S = this;

  // simple stage
  this.textures.generate('bg',{data:[
    '........................................................................................',
    '........................................................................................',
    '................1111111111111111111111111111111111111111111111111111...................',
    '................1111111111111111111111111111111111111111111111111111...................',
    '........................................................................................'
  ],pixelWidth:4,pixelHeight:4,palette:{'.':'#0d0d0f','1':'#131521'}});
  this.textures.generate('platform',{data:['111111111111111111111111111111111111111'],pixelWidth:18,pixelHeight:4,palette:{'1':'#242733'}});

  // load player sheet
  this.load.spritesheet('p1', SHEET, { frameWidth: FW, frameHeight: FH, margin: MG, spacing: SP });
}

function create(){
  this.add.image(460,260,'bg').setDisplaySize(920,520);
  G = this.physics.add.staticImage(460, 520-36, 'platform').setScale(2,1).refreshBody();

  // controls (A/D move, W jump, J punch, K kick)
  const k = this.input.keyboard.addKeys({ A:'A', D:'D', W:'W', J:'J', K:'K' });
  S.k = k;

  // animations for p1
  makeAnims('p1', A);

  // spawn p1
  p1 = this.physics.add.sprite(240, 520-140, 'p1').setCollideWorldBounds(true);
  this.physics.add.collider(p1, G);
  p1.setScale(0.75).setOrigin(0.5, 1.0); // anchor at feet
  placeOnFloor(p1);
  p1.anims.play('p1_idle', true);

  // keep feet on floor on resize
  this.scale.on('resize', ()=>placeOnFloor(p1));
}

function update(){
  if (!p1) return;

  const sp=230, j=-520, k=S.k;

  // horizontal movement
  let vx=0;
  if (k.A.isDown) vx -= sp;
  if (k.D.isDown) vx += sp;
  p1.setVelocityX(vx);

  // jump
  if (k.W.isDown && p1.body.onFloor()) p1.setVelocityY(j);

  // face direction
  p1.setFlipX(p1.body.velocity.x < 0);

  // auto idle/walk unless doing an attack
  const cur = p1.anims.currentAnim?.key || '';
  const attacking = cur==='p1_punch' || cur==='p1_kick';
  if (!attacking){
    const moving = Math.abs(p1.body.velocity.x) > 5;
    p1.anims.play(moving ? 'p1_walk' : 'p1_idle', true);
  }

  // attacks (animation only)
  if (Phaser.Input.Keyboard.JustDown(S.k.J)) p1.anims.play('p1_punch', true);
  if (Phaser.Input.Keyboard.JustDown(S.k.K)) p1.anims.play('p1_kick',  true);
}

/* ---------- helpers ---------- */

function makeAnims(key, defs){
  const mk = (name, d)=>{
    const k = `${key}_${name}`;
    if (S.anims.exists(k)) S.anims.remove(k);
    S.anims.create({
      key: k,
      frames: S.anims.generateFrameNumbers(key, { start: d.s, end: d.e }),
      frameRate: d.f,
      repeat: d.r
    });
  };
  mk('idle',  defs.idle);
  mk('walk',  defs.walk);
  mk('punch', defs.punch);
  mk('kick',  defs.kick);
  mk('hurt',  defs.hurt);
}

function floorY(){ return G.y - G.displayHeight/2; }
function placeOnFloor(s){
  const footOffset = s.displayHeight * (1 - s.originY);
  s.y = floorY() - footOffset - 1;
}
