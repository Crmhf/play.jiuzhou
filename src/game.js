import './styles.css';
import * as THREE from 'three';
import planck from 'planck';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { HEROES, MONSTERS, BOSSES } from './actors.js';
import { LEVELS } from './levels.js';
import { buildHeroRelic } from './relics.js';
import { SpineActorBridge } from './spine-bridge.js';
import { MythicGradeShader } from './postfx.js';
import { AudioEngine } from './audio.js';

const $ = s => document.querySelector(s);
const root = $('#game-root');
const ui = {
  loading:$('#loading'), menu:$('#menu'), select:$('#select'), story:$('#story'), pause:$('#pause'), result:$('#result'),
  cards:$('#hero-cards'), detail:$('#hero-detail'), begin:$('#begin'), hudName:$('#hud-name'), avatar:$('#hud-avatar'),
  hp:$('#hp-bar'), hpText:$('#hp-text'), energy:$('#energy-bar'), levelName:$('#level-name'), levelNo:$('#level-no'), progress:$('#progress-bar'),
  enemyCount:$('#enemy-count'), bossHud:$('#boss-hud'), bossName:$('#boss-name'), bossBar:$('#boss-bar'), combo:$('#combo'), toast:$('#toast'), callout:$('#combat-callout'),
  k:$('#skill-k'), l:$('#skill-l'), flash:$('#flash')
};
const screens = [ui.loading,ui.menu,ui.select,ui.story,ui.pause,ui.result];
const showScreen = el => { screens.forEach(s=>s.classList.remove('active')); if(el)el.classList.add('active'); };
const cnNums=['一','二','三','四','五','六','七','八','九','十'];
const approach=(value,target,step)=>value<target?Math.min(value+step,target):Math.max(value-step,target);

// Renderer + post-processing: Orthographic 2D gameplay in a genuine 3D scene.
const mount=$('#webgl');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth<850?1.4:1.8));
renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.06;
mount.appendChild(renderer.domElement);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x070912); scene.fog=new THREE.FogExp2(0x111326,.013);
const camera=new THREE.OrthographicCamera(-12,12,6.75,-6.75,.1,100); camera.position.set(0,4.0,12); camera.lookAt(0,4.0,0);
const composer=new EffectComposer(renderer); composer.setPixelRatio(renderer.getPixelRatio()); composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.72,.58,.7); composer.addPass(bloom);
const gradePass=new ShaderPass(MythicGradeShader); composer.addPass(gradePass);
const fxaaPass=new ShaderPass(FXAAShader); composer.addPass(fxaaPass);
// Afterimage is only activated during very fast motion on pointer-fine devices. This is a low-cost motion-blur substitute.
const motionBlurPass=new AfterimagePass(.82); motionBlurPass.enabled=false; composer.addPass(motionBlurPass);
composer.addPass(new OutputPass());
const bgGroup=new THREE.Group(), worldGroup=new THREE.Group(), fxGroup=new THREE.Group(), decorGroup=new THREE.Group(), relicGroup=new THREE.Group(); scene.add(bgGroup,decorGroup,worldGroup,fxGroup,relicGroup);relicGroup.position.set(7.5,2.6,2);relicGroup.visible=false;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
scene.add(new THREE.HemisphereLight(0xcfe7ff,0x301315,1.25)); const sun=new THREE.DirectionalLight(0xffdb9b,1.8); sun.position.set(-5,12,8);sun.castShadow=true;scene.add(sun);
const canUseMotionBlur=matchMedia('(pointer:fine)').matches&&innerWidth>900;
function resizeRenderer(){const dpr=Math.min(devicePixelRatio,innerWidth<850?1.4:1.8);renderer.setPixelRatio(dpr);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(dpr);composer.setSize(innerWidth,innerHeight);bloom.setSize(innerWidth,innerHeight);fxaaPass.material.uniforms.resolution.value.set(1/(innerWidth*dpr),1/(innerHeight*dpr));const aspect=innerWidth/innerHeight;const view=13.5;camera.left=-view*aspect/2;camera.right=view*aspect/2;camera.top=view/2;camera.bottom=-view/2;camera.updateProjectionMatrix();}
resizeRenderer();addEventListener('resize',resizeRenderer);

const textureLoader=new THREE.TextureLoader();
const textures=new Map();
function proceduralTexture(label='兵', color='#d74d35'){
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
  const g=x.createRadialGradient(256,220,20,256,256,250);g.addColorStop(0,color);g.addColorStop(1,'#10121d');x.fillStyle=g;x.fillRect(0,0,512,512);
  x.strokeStyle='#f6d47c';x.lineWidth=12;x.strokeRect(28,28,456,456);x.fillStyle='#fff3ca';x.font='900 180px serif';x.textAlign='center';x.textBaseline='middle';x.fillText(label,256,258);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function loadTexture(url, fallbackLabel='景', fallbackUrl=''){
  const key=`${url}|${fallbackUrl}`;if(textures.has(key))return textures.get(key);
  const prepare=t=>{t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;return t};
  const p=new Promise(resolve=>{const fail=()=>fallbackUrl?textureLoader.load(fallbackUrl,t=>resolve(prepare(t)),undefined,()=>resolve(proceduralTexture(fallbackLabel))):resolve(proceduralTexture(fallbackLabel));textureLoader.load(url,t=>resolve(prepare(t)),undefined,fail)});
  textures.set(key,p);return p;
}
function chromaMaterial(texture, cols=1, rows=1, cell=0, tint=0xffffff){
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{
    map:{value:texture},grid:{value:new THREE.Vector2(cols,rows)},cell:{value:new THREE.Vector2(cell%cols,Math.floor(cell/cols))},tint:{value:new THREE.Color(tint)},
    flash:{value:0},opacity:{value:1},rimColor:{value:new THREE.Color(tint)},rimStrength:{value:.25},emission:{value:0}
  },
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      uniform sampler2D map;uniform vec2 grid,cell;uniform vec3 tint,rimColor;uniform float flash,opacity,rimStrength,emission;varying vec2 vUv;
      vec4 sampleSprite(vec2 coord){vec2 uv=vec2((coord.x+cell.x)/grid.x,1.-((1.-coord.y)+cell.y)/grid.y);vec2 keyUv=vec2((.035+cell.x)/grid.x,1.-((.035)+cell.y)/grid.y);vec4 c=texture2D(map,uv);vec3 bg=texture2D(map,keyUv).rgb;float green=c.g-max(c.r,c.b);float bgLum=(bg.r+bg.g+bg.b)/3.;float adaptive=1.-smoothstep(.045,.21,distance(c.rgb,bg));float chroma=smoothstep(.09,.22,green)*smoothstep(.40,.72,c.g)*step(bgLum*1.6,c.g)*step(0.10,(c.r+c.g+c.b)/3.);float key=max(adaptive,chroma*0.9);c.a*=1.-key;return c;}
      void main(){vec4 c=sampleSprite(vUv);float edge=0.;edge=max(edge,c.a-sampleSprite(vUv+vec2(.012,0.)).a);edge=max(edge,c.a-sampleSprite(vUv-vec2(.012,0.)).a);edge=max(edge,c.a-sampleSprite(vUv+vec2(0.,.012)).a);edge=max(edge,c.a-sampleSprite(vUv-vec2(0.,.012)).a);c.rgb+=rimColor*edge*rimStrength;c.rgb+=tint*emission;c.rgb=mix(c.rgb,vec3(1.),flash);c.a*=opacity;if(c.a<.06)discard;gl_FragColor=c;}`});
  return mat;
}

let bgMesh=null, cloudField=null, starField=null;
async function buildBackdrop(level=LEVELS[0]){
  bgGroup.clear(); decorGroup.clear();
  const tex=await loadTexture(level.background,'山');
  bgMesh=new THREE.Mesh(new THREE.PlaneGeometry(27,18),new THREE.MeshBasicMaterial({map:tex,depthWrite:false})); bgMesh.position.set(camera.position.x,2,-12); bgGroup.add(bgMesh);
  // Three depth layers make the painted background feel volumetric without obscuring play.
  for(let layer=0;layer<3;layer++){
    const geo=new THREE.BufferGeometry(), count=layer===0?26:18, pos=[];
    for(let i=0;i<count;i++)pos.push((Math.random()-.5)*60,Math.random()*11-1,-8+layer*1.5);
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({color:level.palette[layer]||'#fff',size:.22+layer*.13,transparent:true,opacity:.18+layer*.1,blending:THREE.AdditiveBlending,depthWrite:false});
    const pts=new THREE.Points(geo,mat);pts.userData.layer=layer;decorGroup.add(pts);
  }
  const cloudGeo=new THREE.PlaneGeometry(3.8,1.05), cloudMat=new THREE.MeshBasicMaterial({map:makeCloudTexture(),transparent:true,opacity:.13,depthWrite:false});
  cloudField=new THREE.Group(); for(let i=0;i<10;i++){const m=new THREE.Mesh(cloudGeo,cloudMat.clone());m.position.set(i*7-15,Math.random()*7-1,-7);m.scale.setScalar(.7+Math.random());m.userData.speed=.12+Math.random()*.16;cloudField.add(m)} decorGroup.add(cloudField);
}
function makeCloudTexture(){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(256,64,5,256,64,240);g.addColorStop(0,'#fff');g.addColorStop(.45,'#ffffffbb');g.addColorStop(1,'#fff0');x.fillStyle=g;x.fillRect(0,0,512,128);return new THREE.CanvasTexture(c)}

// Runtime state
let state='loading', selectedHero='guanyu', levelIndex=0, level=LEVELS[0], world=null, player=null, entities=[], particles=[], projectiles=[], platforms=[], waveIndex=0, pendingSpawns=0, activeBoss=null, exitGate=null;
let cameraX=0, cameraLead=1.6, shake=0, hitStop=0, hazardTimer=3.5, accumulator=0, lastTime=performance.now(), levelStart=0;
let stats={kills:0,hits:0,damage:0,maxCombo:0};
let debugBossHpRatio=1;
const DEV_RUNTIME=import.meta.env.DEV||location.hostname==='127.0.0.1'||location.hostname==='localhost';
const upgrades={hp:0,attack:0,cooldown:0};
const input={up:false,down:false,jump:false,attack:false,skill:false,ultimate:false,dash:false};
const keyboardMove={left:false,right:false};
const pressed=new Set();
let lastMoveDirection=1, joystickAxisX=0;
const keyMap={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',Space:'jump',KeyJ:'attack',KeyK:'skill',KeyL:'ultimate',ShiftLeft:'dash',ShiftRight:'dash'};
function horizontalAxis(){
  if(Math.abs(joystickAxisX)>.12)return joystickAxisX;
  if(keyboardMove.left&&keyboardMove.right)return lastMoveDirection;
  if(keyboardMove.left)return -1;
  if(keyboardMove.right)return 1;
  return 0;
}
function clearControls(){keyboardMove.left=keyboardMove.right=false;joystickAxisX=0;Object.keys(input).forEach(k=>input[k]=false);pressed.clear()}
addEventListener('keydown',e=>{const action=keyMap[e.code];if(action){e.preventDefault();if(action==='left'||action==='right'){keyboardMove[action]=true;lastMoveDirection=action==='right'?1:-1}else{if(!input[action])pressed.add(action);input[action]=true}}if(e.code==='Escape')togglePause()});
addEventListener('keyup',e=>{const action=keyMap[e.code];if(action==='left'||action==='right')keyboardMove[action]=false;else if(action)input[action]=false});
addEventListener('blur',clearControls);

const audio=new AudioEngine();

function makePlatform(p,level){
  const body=world.createBody({type:'static',position:planck.Vec2(p.x,p.y)});body.createFixture(planck.Box(p.w/2,p.h/2),{friction:.75,userData:{type:'platform'}});
  const geo=new THREE.BoxGeometry(p.w,p.h,.85), mat=new THREE.MeshStandardMaterial({color:p.type==='ground'?level.palette[1]:level.palette[0],roughness:.8,metalness:.08,emissive:new THREE.Color(level.palette[0]),emissiveIntensity:.08,transparent:true,opacity:p.type==='ground'?.22:.82});
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(p.x,p.y,-.2);worldGroup.add(mesh);platforms.push({body,mesh,...p});
  // glowing edge to improve terrain readability
  const edge=new THREE.Mesh(new THREE.PlaneGeometry(p.w,.045),new THREE.MeshBasicMaterial({color:level.palette[2],transparent:true,opacity:.55,blending:THREE.AdditiveBlending}));edge.position.set(p.x,p.y+p.h/2+.025,.25);worldGroup.add(edge);
}
async function makeActor(kind,data,x,y){
  const isPlayer=kind==='player', isBoss=kind==='boss';
  const body=world.createDynamicBody({position:planck.Vec2(x,y),fixedRotation:true,allowSleep:false,bullet:isPlayer});
  const width=isBoss?1.15:(isPlayer?.72:.65), height=isBoss?2.25:(isPlayer?1.55:1.25);
  body.createFixture(planck.Box(width/2,height/2),{density:1,friction:.15,restitution:0,filterCategoryBits:isPlayer?0x2:0x4,filterMaskBits:0x1});
  const foot=body.createFixture(planck.Box(width*.32,.08,planck.Vec2(0,-height/2-.07),0),{isSensor:true,userData:{type:'foot'},filterCategoryBits:0x8,filterMaskBits:0x1});
  const tex=await loadTexture(data.atlas,data.name[0],data.fallbackAtlas||''); const grid=isPlayer?[data.atlasCols||3,data.atlasRows||3]:(isBoss?[data.atlasCols||5,data.atlasRows||1]:[4,3]); const cell=isPlayer?0:data.cell;
  const mat=chromaMaterial(tex,grid[0],grid[1],cell,data.color||0xffffff); const isHero=isPlayer; const baseScale=isHero?2.7:(isBoss?data.scale:Math.min(data.scale||1.45,2.05)); const geo=new THREE.PlaneGeometry(baseScale,baseScale*(isHero?1.18:1.05)*(isBoss?1.15:1)); const mesh=new THREE.Mesh(geo,mat);mesh.position.z=.7+(isBoss?.2:0);worldGroup.add(mesh);
  let shadow=null;if(isBoss){shadow=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshBasicMaterial({color:'#050207',transparent:true,opacity:.34,depthWrite:false}));shadow.scale.set(1.45,.32,1);shadow.position.z=.42;worldGroup.add(shadow)}
  const e={kind,data,body,foot,mesh,shadow,mat,grid,hp:data.hp+(isPlayer?upgrades.hp:0),maxHp:data.hp+(isPlayer?upgrades.hp:0),energy:isPlayer?20:0,shield:0,alive:true,dying:false,destroyed:false,ground:0,facing:isPlayer?1:-1,state:'idle',stateTime:0,deathTime:0,deathDuration:isBoss?1.05:.34,attackCd:0,skillCd:0,dashCd:0,moveLock:0,invuln:0,combo:0,comboTimer:0,attackStep:0,aiTimer:Math.random(),spawnX:x,activeAttack:false,lastFrame:-1,motionPhase:0,motionBlend:0,lastStep:-1,bossPhase:1,bossAction:isBoss?-1:0,bossTrailTimer:0,bossHit:false,phaseImpactDone:false,shadowGroundY:y-1.02,actionPhase:'idle',actionDuration:0,actionSerial:0,actionTrailTimer:0,actionImpactDone:false};
  e.spine=new SpineActorBridge(e);body.setUserData(e);entities.push(e);return e;
}
function destroyEntity(e){if(!e||e.destroyed)return;e.destroyed=true;e.alive=false;e.spine?.dispose();if(e.body&&world)world.destroyBody(e.body);worldGroup.remove(e.mesh);if(e.shadow)worldGroup.remove(e.shadow);if(e===activeBoss){activeBoss=null;ui.bossHud.classList.remove('show')} }

function setupContacts(){world.on('begin-contact',c=>{for(const f of [c.getFixtureA(),c.getFixtureB()]){if(f.getUserData()?.type==='foot'){const e=f.getBody().getUserData();if(e)e.ground++}}});world.on('end-contact',c=>{for(const f of [c.getFixtureA(),c.getFixtureB()]){if(f.getUserData()?.type==='foot'){const e=f.getBody().getUserData();if(e)e.ground=Math.max(0,e.ground-1)}}})}

async function startLevel(index){
  levelIndex=index;level=LEVELS[index];state='story';audio.setBoss(false);audio.setScene('story');root.classList.remove('playing');showScreen(ui.story);
  $('#story-kicker').textContent=`第${cnNums[index]}战`;$('#story-title').textContent=level.story[0];$('#story-objective').textContent=level.story[1];$('#story-quote').textContent=level.story[2];
  await buildBackdrop(level);camera.position.x=0;cameraX=0;if(bgMesh)bgMesh.position.x=0;
}
async function enterCombat(){
  relicGroup.visible=false;showScreen(null);root.classList.add('playing');state='preparing';audio.setBoss(false);audio.start('combat');
  worldGroup.clear();fxGroup.clear();entities=[];particles=[];projectiles=[];platforms=[];waveIndex=0;pendingSpawns=0;activeBoss=null;stats={kills:0,hits:0,damage:0,maxCombo:0};
  world=new planck.World(planck.Vec2(0,-30));setupContacts();level.platforms.forEach(p=>makePlatform(p,level));
  player=await makeActor('player',HEROES[selectedHero],-7,.8);player.hp=Math.min(player.maxHp,player.maxHp);player.jumps=0;player.coyote=0;player.jumpBuffer=0;
  camera.position.x=0;camera.position.y=4.0;cameraX=0;hazardTimer=Math.max(2.8,level.hazardInterval*.72);levelStart=performance.now();state='playing';lastTime=performance.now();
  ui.hudName.textContent=player.data.name;ui.avatar.textContent=player.data.name[0];ui.levelName.textContent=`${level.name} · ${level.difficulty}`;ui.levelNo.textContent=`第${cnNums[levelIndex]}战`;
  ui.k.querySelector('span').textContent=player.data.skill;ui.l.querySelector('span').textContent=player.data.ultimate;ui.bossHud.classList.remove('show');toast(level.objective);
}

async function spawnWave(wave){
  pendingSpawns++;
  try{
    if(wave.boss!==undefined){const d=BOSSES[wave.boss],m=level.enemyScale;await spawnBoss({...d,hp:Math.round(d.hp*m.hp),attack:Number((d.attack*m.attack).toFixed(1)),speed:d.speed*m.speed},wave.at+5);return}
    const m=level.enemyScale;await Promise.all(wave.enemies.map((id,i)=>{const d=MONSTERS[id];return makeActor('enemy',{...d,hp:Math.round(d.hp*m.hp),attack:Number((d.attack*m.attack).toFixed(1)),speed:d.speed*m.speed},wave.at+6+i*1.7+(i%2)*1.2,.8+Math.random()*1.8)}));
    toast(`${wave.title || '敌阵来袭'} · ${wave.enemies.length} 名敌军`);audio.skill();
  }finally{pendingSpawns=Math.max(0,pendingSpawns-1)}
}
async function spawnBoss(data,x){activeBoss=await makeActor('boss',data,x,1.3);if(DEV_RUNTIME&&debugBossHpRatio<1)activeBoss.hp=activeBoss.maxHp*debugBossHpRatio;activeBoss.arenaMin=Math.max(-6,x-12);activeBoss.arenaMax=Math.min(level.length+3,x+7);activeBoss.state='intro';activeBoss.stateTime=0;activeBoss.activeAttack=true;activeBoss.invuln=.95;activeBoss.body.setLinearVelocity(planck.Vec2(0,4.8));ui.bossName.textContent=`BOSS · ${data.name}`;ui.bossHud.classList.add('show');toast(`${data.name} · 破阵登场`);shake=1.2;ringFx(x,1.1,data.color,3.8);burst(x,2.3,data.color,50,9);audio.setBoss(true);audio.ultimate('boss');}
function aliveEnemies(){return entities.filter(e=>e.alive&&e.kind!=='player')}

const HERO_COMBAT_CALLS={
  guanyu:{skill:['拖刀偃月 · 青龙回首','刀光过处，万军失色'],ultimate:['武圣·青龙降世','青龙破阵，万军避锋']},
  zhangfei:{skill:['当阳怒吼 · 百骑震岳','一声断喝，敌胆俱裂'],ultimate:['燕人·雷霆万军','雷霆一喝，百战皆惊']},
  zhaoyun:{skill:['七探盘蛇 · 龙胆穿云','银枪七进，破阵如风'],ultimate:['常胜·龙魂千影','龙魂七进，百战无归']},
  huangzhong:{skill:['百步穿杨 · 破军点将','箭出如星，穿云夺魄'],ultimate:['定军·落日箭阵','落日穿云，箭雨定军']}
};
function showCombatCallout(type,title,subtitle,accent='#f7c85c'){
  if(!ui.callout)return;const [small,strong,span]=ui.callout.children;
  small.textContent=type==='ultimate'?'ULTIMATE · 绝世奥义':type==='skill'?'SKILL · 武将绝学':'COMBO · 连环出招';strong.textContent=title;span.textContent=subtitle;ui.callout.style.setProperty('--callout-accent',accent);ui.callout.dataset.type=type;ui.callout.classList.remove('show');void ui.callout.offsetWidth;ui.callout.classList.add('show');clearTimeout(showCombatCallout.timer);showCombatCallout.timer=setTimeout(()=>ui.callout.classList.remove('show'),type==='ultimate'?1900:1200);
}
function beginPlayerAction(kind,duration,phase=kind){
  player.state=kind;player.stateTime=0;player.actionPhase=phase;player.actionDuration=duration;player.actionSerial++;player.actionTrailTimer=0;player.actionImpactDone=false;return player.actionSerial;
}
function actionFrames(frames,phase){const value=frames?.[phase];return Array.isArray(value)?value:[value??frames?.attack??frames?.idle??0]}
function heroAfterimage(e,opacity=.2){
  if(!canUseMotionBlur&&innerWidth<800)return;const mat=e.mat.clone();mat.uniforms.opacity.value=opacity;mat.uniforms.flash.value=.08;const ghost=new THREE.Mesh(e.mesh.geometry,mat);ghost.position.copy(e.mesh.position);ghost.rotation.copy(e.mesh.rotation);ghost.scale.copy(e.mesh.scale);ghost.renderOrder=2;fxGroup.add(ghost);particles.push({mesh:ghost,vx:-e.facing*.35,vy:.05,life:.16,max:.16,heroGhost:true});
}
function impactFx(x,y,color,dir=1,strength=1){
  const s=Math.min(2.2,strength);ringFx(x,y,color,.55*s,.24);slashFx(x+dir*.12,y+.18,color,dir,.62*s);burst(x+dir*.22,y,color,Math.round(10+8*s),4.5+2*s);
}
function damage(target,amount,source,force=5){
  if(!target?.alive||target.dying||target.invuln>0)return false;
  if(target.kind==='player'&&target.shield>0){const used=Math.min(target.shield,amount*.65);target.shield-=used;amount-=used}
  target.hp-=amount;target.invuln=target.kind==='player'?.55:.16;
  const bossArmored=target.kind==='boss'&&['intro','windup','attack','recover','phase'].includes(target.state);
  if(!bossArmored){target.state='hurt';target.stateTime=0}target.spine?.flash();
  const tp=target.body.getPosition(), dir=source?.body?Math.sign(tp.x-source.body.getPosition().x):1, impact=target.kind==='boss'?.18:1;
  target.body.applyLinearImpulse(planck.Vec2(dir*force*impact,2.2*impact),target.body.getWorldCenter(),true);
  target.mat.uniforms.flash.value=Math.max(target.mat.uniforms.flash.value,.58);burst(tp.x,tp.y,target.kind==='player'?'#ff3c4f':'#ffd267',target.kind==='boss'?28:14,target.kind==='boss'?7:4);if(target.kind!=='player')impactFx(tp.x,tp.y,target.data.color||'#ffd267',dir,target.kind==='boss'?1.55:1);if(source===player){hitStop=Math.max(hitStop,target.kind==='boss'?.105:.055);if(target.kind==='boss')showCombatCallout('impact',`${target.data.name} · 破绽`,amount>player.data.attack*1.3?'重击贯体':'刀锋入骨',target.data.color||player.data.accent)}if(target.kind==='player')audio.hurt();else audio.hit(target.kind==='boss'?1.55:1,target.kind==='boss'||Boolean(target.data.heavy));shake=Math.min(1.2,shake+.18);
  if(source===player){stats.hits++;stats.damage+=Math.round(amount);player.combo++;player.comboTimer=2.1;player.energy=Math.min(100,player.energy+5+(target.kind==='boss'?2:0));stats.maxCombo=Math.max(stats.maxCombo,player.combo);if(selectedHero==='guanyu'&&player.combo>10)player.shield=Math.min(24,player.shield+1.1);if(selectedHero==='zhangfei'&&player.hp/player.maxHp<.35)player.invuln=Math.max(player.invuln,.22)}
  if(target.hp<=0){kill(target,source)} return true;
}
function kill(target,source){
  if(target.kind==='player'){target.hp=0;target.alive=false;setTimeout(()=>finish(false),700);return}
  if(target.dying)return;target.dying=true;target.state='death';target.stateTime=0;target.deathTime=0;target.activeAttack=false;target.hp=0;
  const p=target.body.getPosition();stats.kills++;if(source===player)player.energy=Math.min(100,player.energy+10);burst(p.x,p.y,target.data.color||'#fff',target.kind==='boss'?56:40,target.kind==='boss'?12:10);ringFx(p.x,p.y-.4,target.data.color||'#fff',target.kind==='boss'?3.8:1.8,target.deathDuration);
  target.body.setLinearVelocity(planck.Vec2(0,target.kind==='boss'?2.1:1));for(let f=target.body.getFixtureList();f;f=f.getNext())f.setSensor(true);if(target.kind==='boss')audio.setBoss(false);audio.bossImpact();setTimeout(()=>destroyEntity(target),target.deathDuration*1000);
}
function hitArea(x,y,range,amount,force=7,filter=()=>true){
  let hits=0;entities.forEach(e=>{if(e.alive&&e.kind!=='player'&&filter(e)){const p=e.body.getPosition(),dx=p.x-x,dy=p.y-y;if(Math.abs(dx)<range&&Math.abs(dy)<range*.75){if(damage(e,amount,player,force))hits++}}});return hits;
}
function attack(){
  if(player.attackCd>0||!player.alive)return;
  player.attackStep=(player.attackStep%3)+1;
  const step=player.attackStep,cadence=player.data.motion?.attack?.[step-1]??(step===3?.42:.25);
  player.attackCd=cadence;const serial=beginPlayerAction('attack',cadence,'attack');
  const p=player.body.getPosition(),mult=1+upgrades.attack*.08+(player.combo>12?.18:0),frames=actionFrames(player.data.frames,`attack${step}`);
  player.actionFrames=frames;audio.weaponSwing(selectedHero,step);
  if(step===3)showCombatCallout('combo',`${player.data.name} · ${['起手','连破','终式'][step-1]}击`,`${player.data.weapon} · 破阵重击`,player.data.accent);
  const activeAt=Math.min(cadence*.62,.16);
  setTimeout(()=>{
    if(state!=='playing'||!player?.alive||player.actionSerial!==serial)return;
    const q=player.body.getPosition(),power=player.data.attack*mult*(step===3?1.55:1);
    if(selectedHero==='huangzhong'){
      spawnProjectile(q.x+player.facing*.9,q.y+.45,'#ffd45f',player.facing*(15+step*1.5),step===3?1.4:.3,power,player,'arrow');
      slashFx(q.x+player.facing*.9,q.y+.4,'#ffc956',player.facing,step===3?1.05:.72);impactFx(q.x+player.facing*1.05,q.y+.4,'#ffc956',player.facing,step===3?1.3:.8);
      if(step===3){hitStop=.08;shake=.72}
      return;
    }
    const range=step===3?3.1:2.25,hits=hitArea(q.x+player.facing*1.2,q.y,range,power,step===3?11:6);
    slashFx(q.x+player.facing*1.3,q.y+.25,player.data.color,player.facing,step===3?1.5:1);if(hits){hitStop=Math.max(hitStop,step===3?.1:.055);shake=Math.min(1.4,shake+(step===3?.42:.18));}else audio.tone(180,.06,'sawtooth',.03,2);
  },activeAt*1000);
}
function skill(){
  if(player.skillCd>0||!player.alive)return;
  const p=player.body.getPosition(),cd=player.data.skillCd*(1-upgrades.cooldown*.06);player.skillCd=cd;const serial=beginPlayerAction('skill',player.data.motion?.skill??.8,'skill');player.actionFrames=actionFrames(player.data.frames,'skill');audio.skill(selectedHero);
  const call=HERO_COMBAT_CALLS[selectedHero]?.skill;showCombatCallout('skill',call?.[0]||player.data.skill,call?.[1]||'绝学出鞘，破阵夺魄',player.data.accent);shake=.55;
  if(selectedHero==='guanyu'){
    player.invuln=.45;player.body.setLinearVelocity(planck.Vec2(player.facing*11,2));
    for(let n=0;n<3;n++)setTimeout(()=>{if(player.actionSerial!==serial||state!=='playing')return;const q=player.body.getPosition();const hits=hitArea(q.x+player.facing*1.6,q.y,4.1,player.data.attack*.9,10+n*2);slashFx(q.x+player.facing*1.2,q.y+.3,'#71e784',player.facing,1.2+n*.18);if(hits){hitStop=.065;impactFx(q.x+player.facing*1.6,q.y,'#71e784',player.facing,1.05)}},n*115);
  }
  if(selectedHero==='zhangfei'){
    ringFx(p.x,p.y,'#ff9a55',3.4);shake=1.1;hitStop=.08;
    entities.forEach(e=>{if(e.alive&&e.kind!=='player'&&Math.abs(e.body.getPosition().x-p.x)<7){damage(e,player.data.attack*1.35,player,15);e.attackCd+=1.1}});
  }
  if(selectedHero==='zhaoyun'){
    player.invuln=.72;player.body.setTransform(planck.Vec2(Math.min(level.length,p.x+player.facing*5.8),p.y+1),0);
    for(let n=0;n<4;n++)setTimeout(()=>{if(player.actionSerial!==serial||state!=='playing')return;const q=player.body.getPosition();const hits=hitArea(q.x+player.facing*(n*.55),q.y,4.7,player.data.attack*.72,8);burst(q.x,q.y,'#8bdcff',22,10);if(hits){hitStop=.05;impactFx(q.x,q.y,'#8bdcff',player.facing,.9)}},n*70);
  }
  if(selectedHero==='huangzhong'){
    for(let n=-2;n<=2;n++)spawnProjectile(p.x+player.facing,p.y+.55,'#ffb23e',player.facing*(16+Math.abs(n)),n*1.2,player.data.attack*1.25,player,'arrow');
    shake=.72;ringFx(p.x+player.facing*1.2,p.y+.4,'#ffd55d',2.2);
  }
}
function ultimate(){
  if(player.energy<100||!player.alive)return;
  player.energy=0;const serial=beginPlayerAction('ultimate',player.data.motion?.ultimate??1.2,'ultimate');player.actionFrames=actionFrames(player.data.frames,'ultimate');hitStop=.18;shake=1.55;ui.flash.style.background=player.data.color;ui.flash.style.opacity=.52;setTimeout(()=>ui.flash.style.opacity=0,90);audio.ultimate(selectedHero);
  const call=HERO_COMBAT_CALLS[selectedHero]?.ultimate;showCombatCallout('ultimate',call?.[0]||player.data.ultimate,call?.[1]||'绝技降世，万军退避',player.data.accent);
  const p=player.body.getPosition();
  if(selectedHero==='guanyu')for(let i=0;i<7;i++)setTimeout(()=>{if(state!=='playing'||player.actionSerial!==serial)return;const x=p.x+(i-3)*2.2;hitArea(x,p.y,2.8,player.data.attack*1.42,14);burst(x,p.y,'#63e582',32,13);slashFx(x,p.y+.35,'#c4ff95',i<3?-1:1,1.5);impactFx(x,p.y,'#c4ff95',i<3?-1:1,1.15)},i*80);
  if(selectedHero==='zhangfei'){ringFx(p.x,p.y,'#ffbd53',6);hitArea(p.x,p.y,10,player.data.attack*5.2,24);for(let i=0;i<8;i++)setTimeout(()=>{if(state!=='playing'||player.actionSerial!==serial)return;ringFx(p.x,p.y,'#ff6a42',1+i*.7)},i*45)}
  if(selectedHero==='zhaoyun'){for(let i=0;i<70;i++){const a=Math.random()*Math.PI*2,r=Math.random()*9;spawnParticle(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,'#a9edff',13)}for(let i=0;i<6;i++)setTimeout(()=>{if(state!=='playing'||player.actionSerial!==serial)return;hitArea(p.x+(i-2.5)*2.6,p.y,3.4,player.data.attack*1.25,15);slashFx(p.x+(i-2.5)*2.6,p.y+.4,'#d7f5ff',i%2?1:-1,1.3);impactFx(p.x+(i-2.5)*2.6,p.y,'#d7f5ff',i%2?1:-1,1.15)},i*70)}
  if(selectedHero==='huangzhong')for(let i=0;i<28;i++)setTimeout(()=>{if(state!=='playing'||player.actionSerial!==serial)return;const x=p.x-8+Math.random()*18;spawnProjectile(x,p.y+8,'#ffd04e',(Math.random()-.5)*2,-14-Math.random()*4,player.data.attack*.78,player,'arrow');if(i%4===0){ringFx(x,p.y,'#ff8c39',1.3);impactFx(x,p.y,'#ffca52',Math.random()<.5?-1:1,.8)}},i*38);
}
function dash(){
  if(player.dashCd>0||!player.alive)return;const p=player.body.getPosition();player.dashCd=.78;player.invuln=.28;player.moveLock=.18;beginPlayerAction('skill',.28,'dash');player.actionFrames=actionFrames(player.data.frames,'skill');player.body.setLinearVelocity(planck.Vec2(player.facing*15,Math.max(1.2,player.body.getLinearVelocity().y)));slashFx(p.x+player.facing*.8,p.y+.15,'#fff0b5',player.facing,.9);burst(p.x,p.y,'#e8d083',16,7);audio.dash();
}

function updatePlayer(dt){
  if(!player?.alive)return;const b=player.body,v=b.getLinearVelocity();player.attackCd=Math.max(0,player.attackCd-dt);player.skillCd=Math.max(0,player.skillCd-dt);player.dashCd=Math.max(0,player.dashCd-dt);player.moveLock=Math.max(0,(player.moveLock||0)-dt);player.invuln=Math.max(0,player.invuln-dt);
  player.coyote=player.ground>0?.11:Math.max(0,player.coyote-dt);if(player.ground>0)player.jumps=0;if(pressed.has('jump')||pressed.has('up'))player.jumpBuffer=.13;else player.jumpBuffer=Math.max(0,(player.jumpBuffer||0)-dt);
  const axis=horizontalAxis(),dir=Math.abs(axis)>.08?axis:0;if(dir)player.facing=Math.sign(dir);const speed=player.data.speed*(1+Math.min(player.combo,30)*.006);const desired=dir*speed;let vx=v.x;
  if(player.moveLock<=0){if(dir){const turning=v.x*dir<-.15,groundAccel=player.data.accel||38,accel=player.ground?(turning?groundAccel*2.05:groundAccel):(turning?44:25);vx=approach(v.x,desired,accel*dt)}else{vx=approach(v.x,0,(player.ground?(player.data.brake||54):3)*dt);if(Math.abs(vx)<.04)vx=0}}
  if(player.jumpBuffer>0&&(player.coyote>0||player.jumps<2)){b.setLinearVelocity(planck.Vec2(vx,player.data.jump*(player.jumps? .88:1)));player.jumps++;player.jumpBuffer=0;player.coyote=0;audio.jump();player.state='jump'}else{const fall=input.down&&!player.ground?Math.min(v.y,-11):Math.max(v.y,-17);b.setLinearVelocity(planck.Vec2(vx,fall))}
  if(pressed.has('attack'))attack();if(pressed.has('skill'))skill();if(pressed.has('ultimate'))ultimate();if(pressed.has('dash'))dash();
  if(player.comboTimer>0){player.comboTimer-=dt;if(player.comboTimer<=0)player.combo=0}
  const pos=b.getPosition();if(pos.y<-6)damage(player,999,null);if(pos.x<-8)b.setTransform(planck.Vec2(-8,pos.y),0);if(pos.x>level.length+4)b.setTransform(planck.Vec2(level.length+4,pos.y),0);
  if(!['attack','skill','ultimate','hurt'].includes(player.state)){
    const moveRatio=Math.abs(vx)/Math.max(.1,speed);
    player.state=player.ground?(moveRatio>.68?'run':moveRatio>.08?'walk':'idle'):'jump';
  }
}
const BOSS_ACTION_NAMES={
  slam:['裂阵重斩','黄天震地','乱石飞芒'],charge:['西凉重斩','铁骑冲阵','飞刃破关'],wind:['无双重斩','方天罡风','无双飞戟'],poison:['独目重斩','毒雾爆发','毒矢连环'],gourd:['曹军重斩','虎豹冲阵','铁壁飞矛'],fire:['虎痴重斩','烈焰震地','火石崩阵'],web:['锦帆重斩','锁链冲阵','水刃飞袭'],roar:['定军重斩','虎啸震地','落日箭雨'],bell:['业火重斩','烽火震地','烈焰飞袭'],lotus:['鬼谋重斩','星莲秘术','星落莲阵']
};
function bossActionLabel(e){return BOSS_ACTION_NAMES[e.data.pattern]?.[Math.max(0,e.bossAction)]||['裂阵重斩','秘术爆发','乱军飞芒'][Math.max(0,e.bossAction)]}
function clampBossArena(e){
  if(!Number.isFinite(e.arenaMin)||!Number.isFinite(e.arenaMax))return false;
  const p=e.body.getPosition();if(p.x<e.arenaMin||p.x>e.arenaMax){const x=THREE.MathUtils.clamp(p.x,e.arenaMin,e.arenaMax),v=e.body.getLinearVelocity();e.body.setTransform(planck.Vec2(x,p.y),0);e.body.setLinearVelocity(planck.Vec2(0,Math.max(v.y,-14)));return true}return false
}
function beginBossPhase(e,phase){
  e.bossPhase=phase;e.state='phase';e.stateTime=0;e.activeAttack=true;e.attackCd=1.05;e.invuln=Math.max(e.invuln,1.05);e.phaseImpactDone=false;
  const p=e.body.getPosition();e.body.setLinearVelocity(planck.Vec2(0,4.8+phase*.35));ringFx(p.x,p.y,e.data.color,3.2+phase*.7);burst(p.x,p.y+1,e.data.color,32+phase*12,9+phase);shake=1.05;
  toast(`${e.data.name} · ${phase===2?'战意爆发':'绝境狂怒'}`);audio.ultimate('boss');
}
function beginBossAttack(e){
  const p=e.body.getPosition(),pp=player.body.getPosition();e.activeAttack=true;e.state='windup';e.stateTime=0;e.attackTargetX=pp.x;e.attackOriginX=p.x;e.attackFacing=Math.sign(pp.x-p.x)||e.facing;e.facing=e.attackFacing;e.bossAction=(e.bossAction+1)%3;e.bossHit=false;e.bossTrailTimer=0;e.bossPatternFired=false;
  const pat=e.data.pattern,isHeavy=e.bossAction===1&&['slam','roar','bell','fire'].includes(pat),isCharge=e.bossAction===1&&['charge','gourd','web'].includes(pat);
  e.windupDuration=Math.max(.32,(e.bossAction===2?.7:isHeavy?.66:isCharge?.56:.46)-e.bossPhase*.055);e.activeDuration=isCharge?.5:e.bossAction===0?.3:.36;e.recoverDuration=isHeavy?.46:isCharge?.4:e.bossAction===2?.42:.32;e.attackCd=Math.max(.72,1.55-e.bossPhase*.17);
  e.body.setLinearVelocity(planck.Vec2(isCharge?-e.facing*1.8:0,Math.max(0,e.body.getLinearVelocity().y)));
  const tellScale=e.bossAction===2?2.15:isHeavy?2.7:isCharge?1.65:1.25;ringFx(p.x+e.facing*(isCharge?2.2:1.1),p.y-.45,e.data.color,tellScale,e.windupDuration+.14);burst(p.x+e.facing*.65,p.y+.3,e.data.color,10+e.bossPhase*3,4);audio.enemyWindup(true);
}
function executeBossAttack(e){
  if(!e.alive||state!=='playing')return;e.state='attack';e.stateTime=0;e.facing=e.attackFacing||e.facing;const p=e.body.getPosition(),pat=e.data.pattern,isCharge=e.bossAction===1&&['charge','gourd','web'].includes(pat),isHeavy=e.bossAction===1&&['slam','roar','bell','fire'].includes(pat);
  const lunge=isCharge?12.5+e.bossPhase*2.1:isHeavy?2.4:e.bossAction===2?1.25:8.1+e.bossPhase*1.45;
  e.body.setLinearVelocity(planck.Vec2(e.facing*lunge,isHeavy?5.2:Math.max(.8,e.body.getLinearVelocity().y)));audio.enemyAttack(true);shake=Math.min(1.5,shake+(isHeavy?.75:.5));
}
function updateBossAction(e,dt,p,pp){
  const boundaryHit=clampBossArena(e);p=e.body.getPosition();const desiredPhase=e.hp/e.maxHp<=.3?3:e.hp/e.maxHp<=.65?2:1,nextPhase=Math.min(desiredPhase,e.bossPhase+1);
  if(nextPhase>e.bossPhase&&!['intro','phase','windup','attack'].includes(e.state)){beginBossPhase(e,nextPhase);return true}
  if(e.state==='intro'){
    const v=e.body.getLinearVelocity();e.body.setLinearVelocity(planck.Vec2(v.x*.8,Math.max(v.y,-12)));
    if(e.stateTime>.35&&e.ground>0&&!e.phaseImpactDone){e.phaseImpactDone=true;ringFx(p.x,p.y-.6,e.data.color,4.2);burst(p.x,p.y-.35,e.data.color,34,9);audio.bossImpact();shake=1.15}
    if(e.stateTime>.9){e.state='idle';e.stateTime=0;e.activeAttack=false;e.attackCd=.55}return true;
  }
  if(e.state==='phase'){
    const v=e.body.getLinearVelocity();e.body.setLinearVelocity(planck.Vec2(v.x*.84,Math.max(v.y,-12)));
    if(e.stateTime>.32&&e.ground>0&&!e.phaseImpactDone){e.phaseImpactDone=true;ringFx(p.x,p.y-.55,e.data.color,4.6+e.bossPhase*.55);burst(p.x,p.y,e.data.color,38+e.bossPhase*8,10);audio.bossImpact();shake=1.3}
    if(e.stateTime>.88){e.state='idle';e.stateTime=0;e.activeAttack=false}return true;
  }
  if(e.state==='windup'){
    const v=e.body.getLinearVelocity();e.body.setLinearVelocity(planck.Vec2(v.x*.72,Math.max(v.y,-12)));
    if(e.stateTime>=e.windupDuration)executeBossAttack(e);return true;
  }
  if(e.state==='attack'){
    e.facing=e.attackFacing||e.facing;const isCharge=e.bossAction===1&&['charge','gourd','web'].includes(e.data.pattern),isHeavy=e.bossAction===1&&['slam','roar','bell','fire'].includes(e.data.pattern),hitAt=e.activeDuration*(isCharge?.06:isHeavy?.48:e.bossAction===0?.36:.22);
    if(!e.bossPatternFired&&e.stateTime>=hitAt){e.bossPatternFired=true;bossPattern(e,e.bossAction,e.bossPhase)}
    if(isCharge){e.bossTrailTimer-=dt;if(e.bossTrailTimer<=0){e.bossTrailTimer=.07;footstepFx(p.x-e.facing*.7,p.y-1.05,e.facing,true);burst(p.x-e.facing*.65,p.y-.45,e.data.color,4,4)}if(!e.bossHit&&Math.abs(pp.x-p.x)<1.75&&Math.abs(pp.y-p.y)<2.5){e.bossHit=damage(player,e.data.attack*(.78+e.bossPhase*.08),e,15+e.bossPhase*2)}if(boundaryHit){e.state='recover';e.stateTime=0;e.recoverDuration=Math.max(e.recoverDuration,.52);e.body.setLinearVelocity(planck.Vec2(-e.facing*1.25,1.4));ringFx(p.x,p.y-.55,e.data.color,2.4);burst(p.x,p.y-.2,e.data.color,24,7);audio.bossImpact();shake=1.05;return true}}
    if(e.stateTime>e.activeDuration){e.state='recover';e.stateTime=0}return true;
  }
  if(e.state==='recover'){
    const v=e.body.getLinearVelocity();e.body.setLinearVelocity(planck.Vec2(v.x*.76,Math.max(v.y,-14)));
    if(e.stateTime>e.recoverDuration){e.state='idle';e.stateTime=0;e.activeAttack=false}return true;
  }
  return false;
}
function updateEnemies(dt){
  if(!player?.body)return;
  const living=aliveEnemies().filter(e=>!e.dying);let attacking=living.filter(e=>e.activeAttack).length;
  living.forEach(e=>{e.invuln=Math.max(0,e.invuln-dt);e.attackCd=Math.max(0,e.attackCd-dt);e.stateTime+=dt;const p=e.body.getPosition(),pp=player.body.getPosition(),dx=pp.x-p.x,dist=Math.abs(dx),boss=e.kind==='boss';if(!boss||!['windup','attack'].includes(e.state))e.facing=Math.sign(dx)||-1;
    if(e.state==='hurt'&&e.stateTime<.22)return;if(e.state==='hurt'){e.state='idle';e.stateTime=0;e.activeAttack=false}
    if(boss&&updateBossAction(e,dt,p,pp))return;
    const ideal=e.data.ranged?5.2:(boss?3.15:1.6);let targetV=0;
    if(e.state==='attack'){/* attack animation still in progress: small forward lunge */
      targetV=e.facing*(e.data.heavy?4.2:2.4);
    }else if(dist>ideal){
      targetV=Math.sign(dx)*e.data.speed*(boss?1+.08*e.bossPhase:1);
    }else if(e.data.ranged&&dist<3.5){
      targetV=-Math.sign(dx)*e.data.speed*.8;
    }else if(!e.data.ranged){
      // close the gap lightly so melee enemies keep pressuring the player
      targetV=Math.sign(dx)*e.data.speed*.5;
    }
    const v=e.body.getLinearVelocity();e.body.setLinearVelocity(planck.Vec2(THREE.MathUtils.lerp(v.x,targetV,dt*(boss?5.5:4)),Math.max(v.y,-16)));
    const attackRange=boss?7.4:(e.data.ranged?8.5:ideal+1.4);
    if(dist<attackRange&&Math.abs(pp.y-p.y)<2.6&&e.attackCd<=0&&attacking<4){
      if(boss){beginBossAttack(e);attacking++;return}
      e.activeAttack=true;attacking++;audio.enemyWindup(false);e.attackCd=Math.max(.9,1.1+Math.random()*.6-(e.data.heavy?.4:0));e.state='attack';e.stateTime=0;
      if(e.data.ranged){
        // ranged enemy fires a projectile at the player's chest from a slight lead
        const lead=Math.max(0,Math.min(.35,dist/14));
        const tx=pp.x+player.body.getLinearVelocity().x*lead;
        const vy=Math.max(0,(pp.y+.35-p.y))*0.6;
        setTimeout(()=>{if(!e.alive||state!=='playing')return;const a=e.body.getPosition(),b=player.body.getPosition();audio.enemyAttack(false);const dir=Math.sign(b.x-a.x)||1;const speed=7.2+level.enemyScale.speed*0.5;spawnProjectile(a.x+dir*0.55,a.y+.5,e.data.color||'#ffd267',dir*speed,vy,e.data.attack*.7,e,'orb');e.activeAttack=false;e.state='idle';e.stateTime=0},280);
      }else{
        const delay=300-(e.data.heavy?40:0);
        setTimeout(()=>{if(!e.alive||state!=='playing')return;const a=e.body.getPosition(),b=player.body.getPosition();audio.enemyAttack(false);if(Math.abs(a.x-b.x)<ideal+1.6&&Math.abs(a.y-b.y)<2.6)damage(player,e.data.attack,e,6);e.activeAttack=false;e.state='idle';e.stateTime=0},delay);
      }
    }
  })
}
function bossPattern(e,action=0,phase=1){const p=e.body.getPosition(),pp=player.body.getPosition(),pat=e.data.pattern,col=e.data.color;shake+=.35;
  if(action===0){
    slashFx(p.x+e.facing*1.75,p.y+.35,col,e.facing,1.65+phase*.18);burst(p.x+e.facing*1.4,p.y+.35,col,20+phase*5,8);
    if(Math.abs(pp.x-p.x)<4.1+phase*.35&&Math.abs(pp.y-p.y)<2.8)damage(player,e.data.attack*(.82+phase*.1),e,12+phase*2);
  }else if(action===1&&['slam','roar','bell','fire'].includes(pat)){
    ringFx(p.x,p.y,col,3.5+phase*.55);if(Math.abs(pp.x-p.x)<5.4+phase*.55)damage(player,e.data.attack*(.55+phase*.1),e,11+phase);
  }else if(action===1&&['charge','gourd','web'].includes(pat)){
    slashFx(p.x+e.facing*1.1,p.y+.15,col,e.facing,1.05+phase*.12);burst(p.x,p.y,col,26+phase*4,9);
  }else{
    const shots=5+phase*2;for(let i=0;i<shots;i++){const spread=i-(shots-1)/2;spawnProjectile(p.x+e.facing*.8,p.y+1,col,e.facing*(5.5+phase)+spread*.85,3.2+Math.abs(spread)*.28,e.data.attack*(.28+phase*.055),e)}
    ringFx(p.x,p.y,col,2.2+phase*.35);
  }
}
function updateHazard(dt){
  hazardTimer-=dt;if(hazardTimer>0||!player?.alive)return;hazardTimer=level.hazardInterval+Math.random()*2.4;const p=player.body.getPosition(),h=level.hazard,col=level.palette[0];
  if(h==='rockfall'){
    toast('落石预警！');for(let i=0;i<5;i++)spawnProjectile(p.x-4+i*2,p.y+7,'#e4a75e',(Math.random()-.5)*2,-3,7,null)
  }else if(h==='battle-fog'){
    toast('战雾蔽目');scene.fog.density=.06;setTimeout(()=>scene.fog.density=.013,1800)
  }else if(h==='gale'){
    toast('方天戟风');player.body.applyLinearImpulse(planck.Vec2(-15,3),player.body.getWorldCenter(),true);burst(p.x,p.y,col,28,9)
  }else if(h==='pursuit'){
    toast('追兵冲阵 · 跃起闪避');for(let i=0;i<6;i++)spawnProjectile(p.x+10+i*1.5,p.y+.25,'#55e6bd',-11-i*.45,.6,7,null)
  }else if(h==='fire-arrows'){
    toast('火箭雨 · 留意落点');for(let i=0;i<7;i++)spawnProjectile(p.x-6+i*2,p.y+8+Math.random()*2,'#ff8b39',(Math.random()-.5)*1.4,-5-Math.random()*2,8,null,'arrow')
  }else if(h==='rolling-logs'){
    toast('峡谷滚木！');for(let i=0;i<4;i++)setTimeout(()=>{if(state==='playing'&&player?.alive)spawnProjectile(player.body.getPosition().x+11,player.body.getPosition().y+.25,'#b56b32',-9-i*.7,1.1,9,null)},i*180)
  }else if(h==='chain-trap'){
    toast('锁链刀阵 · 速度受限');const v=player.body.getLinearVelocity();player.body.setLinearVelocity(planck.Vec2(v.x*.2,v.y*.35));ringFx(p.x,p.y,'#d467ff',2)
  }else if(h==='cavalry-charge'){
    toast('西凉铁骑冲阵');for(let i=0;i<7;i++)spawnProjectile(p.x+11+i*1.25,p.y+.3,'#7ee27d',-12-i*.4,1,8,null)
  }else if(h==='wildfire'){
    toast('夷陵火势蔓延 · 离开火点');for(let i=-3;i<=3;i++){const x=p.x+i*1.9;ringFx(x,p.y-.4,'#ff8a35',.8);setTimeout(()=>{if(state==='playing')spawnProjectile(x,p.y-1,'#ff4b2f',0,8+Math.random()*2,8,null)},420)}
  }else if(h==='formation-barrage'){
    toast('八阵图 · 星落箭阵');const marks=Array.from({length:7},(_,i)=>p.x-6+i*2);marks.forEach(x=>ringFx(x,p.y-.4,'#b54cff',.75));setTimeout(()=>{if(state!=='playing')return;marks.forEach(x=>spawnProjectile(x,p.y+8,'#c57aff',(Math.random()-.5)*1.2,-7,9,null,'arrow'))},520)
  }
}
function updateWaves(){if(waveIndex>=level.waves.length)return;const wave=level.waves[waveIndex],p=player.body.getPosition(),living=aliveEnemies();if(p.x>=wave.at&&living.length===0&&pendingSpawns===0){spawnWave(wave);waveIndex++}if((living.length||pendingSpawns>0)&&waveIndex>0){const gate=level.waves[waveIndex-1].at+8;if(p.x>gate)player.body.setTransform(planck.Vec2(gate,p.y),0)}}

function spawnProjectile(x,y,color,vx,vy,damageAmount,owner,shape='orb'){
  const geometry=shape==='arrow'?new THREE.ConeGeometry(.11,.75,5):new THREE.SphereGeometry(.16,8,8);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95,blending:THREE.AdditiveBlending}));
  mesh.position.set(x,y,1.2);if(shape==='arrow')mesh.rotation.z=-Math.PI/2*Math.sign(vx||1);fxGroup.add(mesh);projectiles.push({mesh,vx,vy,life:2,damage:damageAmount,owner,shape})
}
function updateProjectiles(dt){
  projectiles.forEach(p=>{
    p.life-=dt;p.vy-=p.shape==='arrow'?2.1:6;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;if(p.shape!=='arrow')p.mesh.rotation.z+=dt*8;
    if(p.owner===player){
      for(const e of entities){if(e.alive&&e.kind!=='player'){const q=e.body.getPosition();if(Math.abs(q.x-p.mesh.position.x)<.75&&Math.abs(q.y-p.mesh.position.y)<1.25){damage(e,p.damage,player,p.shape==='arrow'?9:6);p.life=0;break}}}
    }else{const q=player.body.getPosition();if(Math.abs(q.x-p.mesh.position.x)<.65&&Math.abs(q.y-p.mesh.position.y)<1.1){damage(player,p.damage,p.owner,5);p.life=0}}
  });
  projectiles=projectiles.filter(p=>{if(p.life<=0){fxGroup.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();return false}return true})
}

const particleGeo=new THREE.PlaneGeometry(.12,.12),dustGeo=new THREE.CircleGeometry(.065,8);
function spawnParticle(x,y,color,speed=5){const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});const mesh=new THREE.Mesh(particleGeo,mat);mesh.position.set(x,y,2);const a=Math.random()*Math.PI*2,s=speed*(.25+Math.random());mesh.scale.setScalar(.5+Math.random()*2.2);fxGroup.add(mesh);particles.push({mesh,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+Math.random()*.45,max:.8})}
function footstepFx(x,y,dir,run){for(let i=0;i<(run?4:2);i++){const mat=new THREE.MeshBasicMaterial({color:run?'#d7b078':'#b99568',transparent:true,opacity:.36,depthWrite:false});const mesh=new THREE.Mesh(dustGeo,mat);mesh.position.set(x-dir*(.08+i*.045),y,1.25);mesh.scale.set(1.3+Math.random(),.45+Math.random()*.35,1);fxGroup.add(mesh);particles.push({mesh,vx:-dir*(.35+Math.random()*.65),vy:.18+Math.random()*.42,life:.28+Math.random()*.14,max:.42})}}
function burst(x,y,color,count=18,speed=5){const budget=innerWidth<800?Math.ceil(count*.55):count;for(let i=0;i<budget;i++)spawnParticle(x,y,color,speed)}
function ringFx(x,y,color,scale=1,duration=.45){const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});const mesh=new THREE.Mesh(new THREE.RingGeometry(.75,.9,36),mat);mesh.position.set(x,y,1.8);mesh.scale.setScalar(scale*.2);fxGroup.add(mesh);particles.push({mesh,vx:0,vy:0,life:duration,max:duration,ring:true,target:scale})}
function slashFx(x,y,color,dir,scale=1){const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false});const mesh=new THREE.Mesh(new THREE.RingGeometry(.7,1.05,24,1,0,Math.PI*.9),mat);mesh.position.set(x,y,2);mesh.rotation.z=dir>0?-.4:Math.PI+.4;mesh.scale.set(scale*1.8,scale,1);fxGroup.add(mesh);particles.push({mesh,vx:dir*2,vy:.2,life:.22,max:.22,slash:true})}
function updateParticles(dt){particles.forEach(p=>{p.life-=dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.vy-=8*dt;if(p.heroGhost)p.mesh.material.uniforms.opacity.value=Math.max(0,p.life/p.max);else p.mesh.material.opacity=Math.max(0,p.life/p.max);if(p.ring)p.mesh.scale.addScalar(dt*p.target*5);else p.mesh.rotation.z+=dt*8});particles=particles.filter(p=>{if(p.life<=0){fxGroup.remove(p.mesh);p.mesh.material.dispose();return false}return true})}

function animateEntities(t,dt){entities.forEach(e=>{
    if((!e.alive&&e.kind==='player')||e.destroyed)return;
    const p=e.body.getPosition(),v=e.body.getLinearVelocity(),speed=Math.abs(v.x),grounded=e.ground>0;
    const moving=grounded&&speed>.35&&!['attack','skill','ultimate','hurt','windup','recover','phase'].includes(e.state);
    const targetBlend=moving?THREE.MathUtils.clamp(speed/Math.max(1,e.data.speed||4),0,1):0;
    e.motionBlend=THREE.MathUtils.lerp(e.motionBlend,targetBlend,1-Math.pow(.0008,dt));
    if(moving)e.motionPhase+=speed*dt*(e.kind==='player'&&e.state==='walk'?2.05:2.75);

    let bob=0,lean=0,scaleX=1,scaleY=1,forward=0;
    if(moving){
      const stride=Math.sin(e.motionPhase),lift=Math.abs(stride);bob=lift*(e.kind==='boss'?.11:e.kind==='player'?.085:.055)*e.motionBlend;
      lean=-e.facing*(e.kind==='boss'?.035:.055)*e.motionBlend;scaleY=1+Math.sin(e.motionPhase*2)*.025*e.motionBlend;scaleX=2-scaleY;forward=e.facing*.05*e.motionBlend;
      const step=Math.floor(e.motionPhase/Math.PI);if(step!==e.lastStep){e.lastStep=step;if(e.kind==='player'){footstepFx(p.x-e.facing*.2,p.y-.72,e.facing,e.state==='run');audio.step(e.state==='run')}else if(e.kind==='boss'){footstepFx(p.x-e.facing*.35,p.y-1.02,e.facing,true);audio.bossStep();shake=Math.min(.28,shake+.035)}}
    }else if(e.state==='idle'){
      const wobble=Math.sin(t*(2.1+e.kind==='boss'?.6:0));
      bob=wobble*(e.kind==='boss'?.025:.012);scaleY=1+wobble*(e.kind==='boss'?.012:.005);scaleX=2-scaleY;
    }
    if(e.kind==='player'&&e.state==='jump'){lean=-THREE.MathUtils.clamp(v.x*.012,-.1,.1);scaleY=1.045;scaleX=.96;bob=.05}
    if(e.kind==='player'&&['attack','skill','ultimate'].includes(e.state)){
      const duration=Math.max(.16,e.actionDuration||.5),k=THREE.MathUtils.clamp(e.stateTime/duration,0,1),pulse=Math.sin(k*Math.PI),facing=e.facing;
      if(e.state==='attack'){
        const wind=THREE.MathUtils.clamp(k/.28,0,1),snap=THREE.MathUtils.clamp((k-.24)/.38,0,1),recover=THREE.MathUtils.clamp((k-.64)/.36,0,1);
        forward-=facing*.18*(1-wind);lean+=facing*.16*(1-wind);scaleX*=1-.08*(1-wind);scaleY*=1+.1*(1-wind);
        forward+=facing*.24*snap;lean-=facing*.3*snap;scaleX*=1+.2*snap;scaleY*=1-.15*snap;
        forward-=facing*.1*recover;lean+=facing*.18*recover;scaleX*=1-.06*recover;scaleY*=1+.06*recover;
      }else if(e.state==='skill'){
        const dash=e.actionPhase==='dash';forward+=facing*(dash?.28:.1)*pulse;lean-=facing*(dash?.16:.08)*pulse;scaleX*=1+(dash?.2:.1)*pulse;scaleY*=1-(dash?.12:.06)*pulse;bob+=Math.sin(k*Math.PI*2)*.06;
      }else{
        forward+=facing*.22*pulse;lean-=facing*.24*pulse;scaleX*=1+.2*pulse;scaleY*=1-.12*pulse;bob+=Math.sin(k*Math.PI*2)*.11;
      }
      e.actionTrailTimer-=dt;
      if(e.actionTrailTimer<=0){e.actionTrailTimer=e.state==='ultimate'?.075:.11;heroAfterimage(e,e.state==='ultimate'?.16:.12);if(e.state==='ultimate')burst(p.x+facing*.45,p.y+.2,e.data.accent||e.data.color,innerWidth<800?2:4,3.5)}
    }
    if(e.kind==='boss'){
      const pulse=Math.sin(t*(2.2+e.bossPhase*.45));e.mat.uniforms.emission.value=.07+e.bossPhase*.025;
      if(e.state==='intro'){const k=THREE.MathUtils.clamp(e.stateTime/.9,0,1),land=e.phaseImpactDone?Math.sin(Math.min(1,(e.stateTime-.35)*7)*Math.PI):0;scaleX*=1+.13*land;scaleY*=1-.12*land;bob+=Math.sin(k*Math.PI)*.2;e.mat.uniforms.rimStrength.value=1.45;e.mat.uniforms.emission.value=.22}
      else if(e.state==='windup'){
        const k=THREE.MathUtils.clamp(e.stateTime/Math.max(.1,e.windupDuration),0,1),charge=e.bossAction===1&&['charge','gourd','web'].includes(e.data.pattern),heavy=e.bossAction===1&&['slam','roar','bell','fire'].includes(e.data.pattern);
        if(e.bossAction===2){bob+=k*.34+Math.sin(e.stateTime*20)*.025;scaleX*=1-.05*k;scaleY*=1+.08*k;lean+=e.facing*.04*k}
        else if(charge){bob-=k*.12;forward-=e.facing*.22*k;scaleX*=1+.08*k;scaleY*=1-.13*k;lean+=e.facing*.12*k}
        else if(heavy){bob+=k*.3;scaleX*=1-.11*k;scaleY*=1+.18*k;lean+=-e.facing*.055*k}
        else{bob-=k*.07;forward-=e.facing*.12*k;scaleX*=1-.1*k;scaleY*=1+.13*k;lean+=e.facing*.11*k}
        e.mat.uniforms.rimStrength.value=.7+k*1.6;e.mat.uniforms.emission.value=.12+k*.3;
      }
      else if(e.state==='attack'){
        const k=THREE.MathUtils.clamp(e.stateTime/Math.max(.1,e.activeDuration),0,1),snap=Math.sin(k*Math.PI),charge=e.bossAction===1&&['charge','gourd','web'].includes(e.data.pattern),heavy=e.bossAction===1&&['slam','roar','bell','fire'].includes(e.data.pattern);
        if(charge){scaleX*=1.2+.08*snap;scaleY*=.86;forward+=e.facing*.32;lean+=-e.facing*.16}
        else if(heavy){scaleX*=1+.18*snap;scaleY*=1-.2*snap;bob-=.12*snap;lean+=-e.facing*.08*snap}
        else if(e.bossAction===2){scaleX*=1+.12*snap;scaleY*=1+.08*snap;bob+=.18*snap;lean+=-e.facing*.035}
        else{scaleX*=1+.22*snap;scaleY*=1-.16*snap;forward+=e.facing*.3*snap;lean+=-e.facing*.17*snap}
        e.mat.uniforms.rimStrength.value=1.45;e.mat.uniforms.emission.value=.22;
      }
      else if(e.state==='recover'){const k=THREE.MathUtils.clamp(e.stateTime/Math.max(.1,e.recoverDuration),0,1),settle=Math.sin(k*Math.PI);scaleX*=1-.07*settle;scaleY*=1+.09*settle;lean+=e.facing*.075*(1-k);forward-=e.facing*.08*settle;e.mat.uniforms.rimStrength.value=.82}
      else if(e.state==='phase'){const surge=1+Math.sin(e.stateTime*24)*.07;scaleX*=surge;scaleY*=surge;bob+=Math.abs(pulse)*.16;e.mat.uniforms.rimStrength.value=1.8;e.mat.uniforms.emission.value=.32}
      else if(e.state==='death'){const k=THREE.MathUtils.clamp(e.deathTime/e.deathDuration,0,1),fall=k*k*(3-2*k);lean+=-e.facing*fall*1.18;bob-=fall*.62;forward-=e.facing*fall*.25;scaleY*=1-.14*fall;scaleX*=1+.1*fall;e.mat.uniforms.rimStrength.value=.35;e.mat.uniforms.emission.value=.04;e.mat.uniforms.opacity.value=1-THREE.MathUtils.smoothstep(k,.78,1)*.9}
      else{bob+=pulse*.025;e.mat.uniforms.rimStrength.value=.62+e.bossPhase*.12}
      if(e.shadow){if(grounded)e.shadowGroundY=p.y-1.02;const air=THREE.MathUtils.clamp((p.y-1.02-e.shadowGroundY)*.2,0,.5);e.shadow.position.set(p.x,e.shadowGroundY,.43);e.shadow.scale.set(1.45-air,.32-air*.12,1);e.shadow.material.opacity=.34-air*.32}
    }

    e.mesh.position.x=p.x+forward;e.mesh.position.y=p.y+(e.kind==='boss'?.35:.2)+bob;e.mesh.rotation.z=lean;
    e.mat.uniforms.flash.value=Math.max(0,e.mat.uniforms.flash.value-dt*8);
    let frame=e.kind==='player'?0:e.data.cell;
    if(e.kind==='boss'){
      if(e.dying)e.deathTime=Math.min(e.deathDuration,e.deathTime+dt);
      const visualState=e.dying?'death':e.state, visualTime=e.dying?e.deathTime:e.stateTime;
      const duration=visualState==='intro'?.9:visualState==='phase'?.88:visualState==='windup'?(e.windupDuration||.5):visualState==='attack'?(e.activeDuration||.5):visualState==='recover'?(e.recoverDuration||.35):visualState==='hurt'?.22:visualState==='death'?e.deathDuration:0;
      const intent=e.spine?.setIntent(visualState,e.bossAction,moving)||visualState;frame=e.spine?.frameAt(visualTime,duration,intent==='idle'||intent==='move')??e.data.cell;e.spine?.sync(dt);
    }
    if(e.kind==='player'){
      const f=e.data.frames;
      if(e.state==='run'||e.state==='walk'){const frames=f[e.state]||f.run;frame=frames[Math.floor(e.motionPhase/Math.PI)%frames.length]}
      else if(e.state==='jump')frame=f.jump;
      else if(e.state==='attack'){const frames=e.actionFrames||actionFrames(f,`attack${e.attackStep}`);frame=frames[Math.min(frames.length-1,Math.floor(THREE.MathUtils.clamp(e.stateTime/Math.max(.16,e.actionDuration||.4),0,1)*frames.length))]}
      else if(e.state==='skill'||e.state==='ultimate'){const frames=e.actionFrames||actionFrames(f,e.state);frame=frames[Math.min(frames.length-1,Math.floor(THREE.MathUtils.clamp(e.stateTime/Math.max(.16,e.actionDuration||.8),0,1)*frames.length))]}
      else if(e.state==='hurt')frame=f.hurt;else frame=f.idle;
      if(['attack','skill','ultimate','hurt'].includes(e.state)){e.stateTime+=dt;const duration=e.state==='hurt'?.22:(e.actionDuration||.42);if(e.stateTime>duration){e.state='idle';e.stateTime=0;e.actionPhase='idle';e.actionFrames=null}}
    }
    const artFacing=e.kind==='player'?(e.data.frameFacing?.[frame]??e.data.artFacing??1):(e.data.artFacing??-1);
    e.mesh.scale.set(e.facing*artFacing*scaleX,scaleY,1);
    e.mat.uniforms.cell.value.set(frame%e.grid[0],Math.floor(frame/e.grid[0]));
  })}
function updateHUD(){if(!player)return;if(DEV_RUNTIME)root.dataset.qaState=JSON.stringify({state,level:level?.id,length:level?.length,waveIndex,pendingSpawns,x:Number(player.body.getPosition().x.toFixed(2)),y:Number(player.body.getPosition().y.toFixed(2)),facing:player.facing,moveState:player.state,alive:aliveEnemies().length,boss:activeBoss?.data?.name||'',bossState:activeBoss?.state||'',bossPhase:activeBoss?.bossPhase||0,bossAction:activeBoss?bossActionLabel(activeBoss):'',bossX:activeBoss?Number(activeBoss.body.getPosition().x.toFixed(2)):0,bossAt:level?.waves?.at(-1)?.at||0});ui.hp.style.width=`${Math.max(0,player.hp/player.maxHp*100)}%`;ui.hpText.textContent=`${Math.ceil(Math.max(0,player.hp))} / ${player.maxHp}${player.shield>0?` + ${Math.ceil(player.shield)}盾`:''}`;ui.energy.style.width=`${player.energy}%`;ui.progress.style.width=`${THREE.MathUtils.clamp((player.body.getPosition().x+7)/(level.length+11)*100,0,100)}%`;const n=aliveEnemies().length;ui.enemyCount.textContent=n?`敌军 ${n}`:'战场已清';ui.combo.querySelector('b').textContent=player.combo;ui.combo.classList.toggle('show',player.combo>1);ui.k.querySelector('i').style.height=`${player.skillCd/Math.max(.1,player.data.skillCd)*100}%`;ui.l.querySelector('i').style.height=`${100-player.energy}%`;if(activeBoss){ui.bossBar.style.width=`${Math.max(0,activeBoss.hp/activeBoss.maxHp*100)}%`;const tell=['windup','attack'].includes(activeBoss.state)?` · ${bossActionLabel(activeBoss)}`:'';ui.bossName.textContent=`BOSS · ${activeBoss.data.name}${tell}`}}
function updateCamera(dt,t){if(!player)return;const px=player.body.getPosition().x,vx=player.body.getLinearVelocity().x,targetLead=Math.abs(vx)>.25?THREE.MathUtils.clamp(vx*.38,-3,3):player.facing*1.15;cameraLead=THREE.MathUtils.lerp(cameraLead,targetLead,1-Math.pow(.015,dt));cameraX=THREE.MathUtils.lerp(cameraX,THREE.MathUtils.clamp(px+cameraLead,-1,level.length-4),1-Math.pow(.0002,dt));const s=shake>0?(Math.random()-.5)*shake:0;camera.position.x=cameraX+s;camera.position.y=4.0+s*.35;shake=Math.max(0,shake-dt*2.8);if(bgMesh)bgMesh.position.x=cameraX*.98;if(cloudField)cloudField.children.forEach(c=>{c.position.x+=c.userData.speed*dt;if(c.position.x-cameraX>18)c.position.x-=65});decorGroup.children.forEach((d,i)=>{if(d.isPoints)d.position.x=cameraX*(.04+i*.025);d.rotation.z=Math.sin(t*.08+i)*.01})}

function fixedUpdate(dt){if(state!=='playing'||hitStop>0)return;updatePlayer(dt);updateEnemies(dt);updateWaves();updateHazard(dt);world.step(dt);updateProjectiles(dt);pressed.clear();if(player?.alive&&waveIndex===level.waves.length&&pendingSpawns===0&&aliveEnemies().length===0&&!entities.some(e=>e.dying&&!e.destroyed)){finish(true)}}
function renderLoop(now){const raw=Math.min(.05,(now-lastTime)/1000);lastTime=now;audio.update(raw);const t=now/1000;if(hitStop>0)hitStop=Math.max(0,hitStop-raw);else if(state==='playing'){accumulator+=raw;while(accumulator>=1/60){fixedUpdate(1/60);accumulator-=1/60}updateParticles(raw);animateEntities(t,raw);updateCamera(raw,t);updateHUD()}else{if(cloudField)cloudField.rotation.z=Math.sin(t*.2)*.01;if(bgMesh)bgMesh.position.x=Math.sin(t*.08)*.2;if(relicGroup.visible){relicGroup.rotation.y=t*.42;relicGroup.position.y=2.6+Math.sin(t*1.4)*.18}}composer.render();requestAnimationFrame(renderLoop)}

function toast(text){ui.toast.textContent=text;ui.toast.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>ui.toast.classList.remove('show'),2200)}
function togglePause(){if(state==='playing'){state='paused';showScreen(ui.pause);audio.setScene('paused')}else if(state==='paused')resume()}
function resume(){showScreen(null);state='playing';audio.setScene('combat');audio.start('combat');lastTime=performance.now()}
function finish(win){if(state!=='playing')return;state=win?'levelComplete':'gameOver';root.classList.remove('playing');showScreen(ui.result);audio.setBoss(false);audio.setScene('result');const sec=Math.max(1,Math.round((performance.now()-levelStart)/1000));$('#result-kicker').textContent=win?(levelIndex===9?'十战皆捷 · 天下留名':'敌将已破 · 战旗归阵'):'此战未捷';$('#result-title').textContent=win?(levelIndex===9?'星落五丈原，英名照千秋':'再赴下一场战役'):'整军再战，重返沙场';$('#result-stats').innerHTML=`<div><b>${stats.kills}</b><span>击破</span></div><div><b>${stats.maxCombo}</b><span>最高连击</span></div><div><b>${sec}s</b><span>用时</span></div>`;
  const bs=$('#blessings');bs.innerHTML='';bs.className='blessings';if(win&&levelIndex<9){[['hp','军医救治','生命 +20'],['attack','破阵军略','攻击 +8%'],['cooldown','疾风号令','冷却 -6%']].forEach(([k,n,d])=>{const b=document.createElement('button');b.className='blessing';b.innerHTML=`<b>${n}</b><small>${d}</small>`;b.onclick=()=>{bs.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');bs.dataset.pick=k};bs.appendChild(b)})}
  const next=$('#next-level');next.textContent=win?(levelIndex===9?'再战十役':'选择军略，继续征战'):'重试本关';next.onclick=()=>{if(win&&levelIndex<9){const k=bs.dataset.pick||'attack';upgrades[k]++;startLevel(levelIndex+1)}else if(win&&levelIndex===9)showMenu();else startLevel(levelIndex)}
}
function showMenu(){relicGroup.visible=false;state='menu';audio.setBoss(false);audio.setScene('menu');root.classList.remove('playing');showScreen(ui.menu);buildBackdrop(LEVELS[0]);}

if(DEV_RUNTIME){
  globalThis.__SANGUO_DEBUG__={
    snapshot:()=>({
      state, level:level?.id, levelName:level?.name, levelLength:level?.length, waveIndex, pendingSpawns,
      player:player?.body?{x:Number(player.body.getPosition().x.toFixed(2)),y:Number(player.body.getPosition().y.toFixed(2)),hp:player.hp,energy:player.energy,state:player.state,actionPhase:player.actionPhase}:null,
      alive:aliveEnemies().map(e=>({kind:e.kind,name:e.data.name,x:Number(e.body.getPosition().x.toFixed(2)),hp:Math.round(e.hp)})),
      bossAt:level?.waves?.at(-1)?.at, cameraX:Number(cameraX.toFixed(2))
    }),
    warp:(x)=>{if(player?.body){const p=player.body.getPosition();player.body.setTransform(planck.Vec2(THREE.MathUtils.clamp(x,-7,level.length+3),Math.max(.8,p.y)),0)}},
    clearWave:()=>aliveEnemies().forEach(destroyEntity),
    setBossHpRatio:(ratio)=>{if(activeBoss?.alive)activeBoss.hp=activeBoss.maxHp*THREE.MathUtils.clamp(Number(ratio)||0,.01,1);return activeBoss?{hp:activeBoss.hp,phase:activeBoss.bossPhase,state:activeBoss.state}:null},
    setEnergy:(value=100)=>{if(player)player.energy=THREE.MathUtils.clamp(Number(value)||0,0,100);updateHUD();return player?.energy??0},
    start:async(index,hero='guanyu')=>{selectedHero=HEROES[hero]?hero:'guanyu';await startLevel(THREE.MathUtils.clamp(index,0,LEVELS.length-1));await enterCombat();return globalThis.__SANGUO_DEBUG__.snapshot()},
    introspect:()=>entities.map(e=>({kind:e.kind,name:e.data?.name,pos:e.body?.getPosition(),scale:{x:e.mesh.scale.x,y:e.mesh.scale.y},cell:[e.mat?.uniforms?.cell?.value?.x,e.mat?.uniforms?.cell?.value?.y],frame:e.mat?.uniforms?.cell?.value?.x+(e.mat?.uniforms?.cell?.value?.y*(e.grid?.[0]||3)),state:e.state,opacity:e.mat?.uniforms?.opacity?.value,scaleXZ:e.data?.scale}))
  };
}

// Character selection UI
Object.entries(HEROES).forEach(([id,h])=>{const card=document.createElement('article');card.className='hero-card';card.dataset.id=id;card.style.setProperty('--hero-color',h.color);card.style.setProperty('--img',`url(${new URL(h.atlas,document.baseURI).href})`);card.innerHTML=`<i class="check">✓</i><div class="card-copy"><small>${h.title}</small><h3>${h.name}</h3><p>${h.weapon} · ${h.skill}</p></div>`;card.onclick=()=>{selectedHero=id;relicGroup.clear();relicGroup.add(buildHeroRelic(id));relicGroup.visible=true;document.querySelectorAll('.hero-card').forEach(x=>x.classList.toggle('selected',x===card));ui.detail.textContent=`${h.passive} ｜ 生命 ${h.hp} · 速度 ${h.speed} · 攻击 ${h.attack}`;ui.begin.disabled=false;audio.ui()};ui.cards.appendChild(card)});
$('#start-select').onclick=()=>{audio.start('select');audio.setScene('select');showScreen(ui.select);state='select'};ui.begin.onclick=()=>startLevel(0);$('#story-go').onclick=enterCombat;$('#resume').onclick=resume;$('#restart').onclick=()=>startLevel(levelIndex);$('#pause-btn').onclick=togglePause;$('#sound-toggle').onclick=e=>{e.currentTarget.textContent=audio.toggle()?'♫':'×'};

// Touch controls: analog movement plus simultaneous action buttons.
const joy=$('#joystick'),knob=joy.querySelector('i');let joyPointer=null;
function moveJoy(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy)||1,max=r.width*.34,x=dx/len*Math.min(len,max),y=dy/len*Math.min(len,max);knob.style.transform=`translate(${x}px,${y}px)`;joystickAxisX=Math.abs(x/max)>.12?x/max:0;input.up=y<-12;input.down=y>12}
joy.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);moveJoy(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)moveJoy(e)});function endJoy(e){if(e.pointerId!==joyPointer)return;joyPointer=null;joystickAxisX=0;knob.style.transform='';input.up=input.down=false}joy.addEventListener('pointerup',endJoy);joy.addEventListener('pointercancel',endJoy);
document.querySelectorAll('.mobile-actions button').forEach(btn=>{const k=btn.dataset.key;btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);if(!input[k])pressed.add(k);input[k]=true;btn.classList.add('pressed')});const up=()=>{input[k]=false;btn.classList.remove('pressed')};btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up)});

function resize(){const aspect=innerWidth/innerHeight,viewH=13.5,viewW=viewH*aspect;camera.left=-viewW/2;camera.right=viewW/2;camera.top=viewH/2;camera.bottom=-viewH/2;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<850?1.35:1.8));renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);bloom.strength=innerWidth<700?.48:.68}addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearControls();if(state==='playing')togglePause()}});

async function boot(){
  await buildBackdrop(LEVELS[0]);ui.loading.classList.remove('active');showScreen(ui.menu);state='menu';requestAnimationFrame(renderLoop);
  if(DEV_RUNTIME){
    const qa=new URLSearchParams(location.search),requested=Number(qa.get('qa')),bossHp=Number(qa.get('bossHp')),energy=Number(qa.get('energy'));
    if(Number.isFinite(bossHp)&&bossHp>0)debugBossHpRatio=THREE.MathUtils.clamp(bossHp,.01,1);
    if(requested>=1&&requested<=LEVELS.length){
      selectedHero=HEROES[qa.get('hero')]?qa.get('hero'):'guanyu';
      await startLevel(requested-1);await enterCombat();
      const skip=Number(qa.get('wave'));
      if(Number.isFinite(skip))waveIndex=THREE.MathUtils.clamp(Math.floor(skip),0,level.waves.length-1);
      const warp=Number(qa.get('warp'));
      if(Number.isFinite(warp)){const p=player.body.getPosition();player.body.setTransform(planck.Vec2(THREE.MathUtils.clamp(warp,-7,level.length+3),Math.max(.8,p.y)),0)}
      if(Number.isFinite(energy))player.energy=THREE.MathUtils.clamp(energy,0,100);
      if(qa.get('god')==='1')player.invuln=Number.POSITIVE_INFINITY;
      const autoWalk=Number(qa.get('autowalk'));if(Number.isFinite(autoWalk)&&autoWalk!==0)joystickAxisX=THREE.MathUtils.clamp(autoWalk,-1,1);
    }
  }
}
boot();
