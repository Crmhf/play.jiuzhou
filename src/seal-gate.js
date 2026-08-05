import * as THREE from 'three';

const gold = (color, emissive = 0x000000) => new THREE.MeshStandardMaterial({
  color, metalness: .68, roughness: .26, emissive, emissiveIntensity: .35
});

/**
 * A deliberately stylized, procedural gateway built from the img2threejs
 * blockout/form/material workflow. It is a gameplay prop, not a claim of an
 * exact reconstruction from the hero sprite reference.
 */
export function buildSealGate(level) {
  const root = new THREE.Group();
  const jade = gold(0x3ad6bf, 0x073f40);
  const gild = gold(0xeec35f, 0x5b2b05);
  const dark = gold(0x1e2540, 0x02040d);
  const aura = new THREE.MeshBasicMaterial({
    color: level.palette[2], transparent: true, opacity: .42,
    blending: THREE.AdditiveBlending, depthWrite: false
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 2.15, .44, 10), dark);
  base.scale.y = .42; base.position.y = -.66; root.add(base);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(1.18, .105, 8, 48), jade);
  inner.position.z = .08; root.add(inner);
  const outer = new THREE.Mesh(new THREE.TorusGeometry(1.55, .13, 8, 48), gild);
  outer.position.z = .03; root.add(outer);
  const veil = new THREE.Mesh(new THREE.CircleGeometry(1.12, 48), aura);
  veil.position.z = -.04; root.add(veil);

  for (let i = 0; i < 8; i++) {
    const a = Math.PI * 2 * i / 8;
    const rune = new THREE.Mesh(new THREE.OctahedronGeometry(.125, 0), gild);
    rune.position.set(Math.cos(a) * 1.53, Math.sin(a) * 1.53, .16);
    root.add(rune);
  }
  for (let i = 0; i < 3; i++) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(.42 - i * .06, 10, 8), jade);
    cloud.position.set(-.72 + i * .62, -.44 + (i % 2) * .11, .12);
    cloud.scale.y = .5; root.add(cloud);
  }

  root.userData.sculptRuntime = {
    approximation: 'stylized procedural mythic seal gate; blockout-to-material construction inspired by img2threejs workflow',
    qualityContract: {
      silhouette: 'circular rune seal, cloud pedestal and openable aura',
      materials: 'jade, gold, dark stone, additive magical veil',
      interaction: 'opens after the final wave clears',
      performance: '15 meshes, no texture fetches'
    },
    pivots: ['root', 'outerRing', 'innerSeal'],
    sockets: ['arrival', 'departure'],
    open: false,
    openAmount: 0,
    setOpen(open) { this.open = Boolean(open); },
    tick(dt, time) {
      this.openAmount += ((this.open ? 1 : 0) - this.openAmount) * Math.min(1, dt * 3.2);
      veil.material.opacity = .14 + (1 - this.openAmount) * .35 + Math.sin(time * 2.8) * .035;
      veil.scale.setScalar(1 + this.openAmount * .24 + Math.sin(time * 2.2) * .025);
      outer.rotation.z += dt * (.28 + this.openAmount * .8);
      inner.rotation.z -= dt * (.17 + this.openAmount * .45);
      root.position.y = Math.sin(time * 1.6) * .045;
    }
  };
  root.userData.outer = outer;
  root.userData.inner = inner;
  root.userData.veil = veil;
  return root;
}
