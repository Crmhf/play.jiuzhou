import * as THREE from 'three';

const metal=(color,emissive=0x000000)=>new THREE.MeshStandardMaterial({color,metalness:.72,roughness:.24,emissive,emissiveIntensity:.18});
const add=(g,geo,mat,pos=[0,0,0],rot=[0,0,0])=>{const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.rotation.set(...rot);g.add(m);return m};

/**
 * Stylized procedural weapon silhouettes reconstructed from the generated hero
 * concept sheets. They intentionally prioritize realtime readability over exact
 * hidden-side fidelity. Every build exposes the same action-ready runtime seam.
 */
export function buildHeroRelic(hero){
  const g=new THREE.Group(),gold=metal(0xe5a92f,0x6d3108),dark=metal(0x4d1b18),jade=metal(0x55b779,0x123c22),silver=metal(0xe7edf5,0x284c75),red=metal(0xa62b2c,0x3b0808);
  if(hero==='guanyu'){
    add(g,new THREE.CylinderGeometry(.075,.1,5.4,14),dark,[0,-.25,0],[0,0,.2]);
    add(g,new THREE.CylinderGeometry(.13,.13,.55,16),gold,[.55,2.2,0],[0,0,.2]);
    const blade=new THREE.Shape();blade.moveTo(-.12,-.55);blade.quadraticCurveTo(.75,-.18,.9,.48);blade.quadraticCurveTo(.18,.82,-.28,.42);blade.closePath();
    add(g,new THREE.ExtrudeGeometry(blade,{depth:.12,bevelEnabled:true,bevelSize:.035,bevelThickness:.035}),jade,[.72,2.48,-.06],[0,0,-.05]);
  }else if(hero==='zhangfei'){
    add(g,new THREE.CylinderGeometry(.075,.1,5.8,14),dark,[0,0,0],[0,0,-.18]);
    add(g,new THREE.ConeGeometry(.28,.95,7),silver,[-.6,2.65,0],[0,0,.18]);
    for(let i=0;i<3;i++)add(g,new THREE.TorusGeometry(.17+i*.035,.035,7,18),gold,[-.39+i*.13,2.1-i*.17,0],[0,0,-.1]);
    add(g,new THREE.ConeGeometry(.18,.62,7),red,[.48,-2.68,0],[0,0,.18]);
  }else if(hero==='zhaoyun'){
    add(g,new THREE.CylinderGeometry(.055,.08,5.8,14),silver,[0,-.1,0],[0,0,.16]);
    add(g,new THREE.ConeGeometry(.25,.95,5),silver,[.62,2.72,0],[0,0,-.16]);
    add(g,new THREE.TorusGeometry(.23,.045,8,24),gold,[.33,1.8,0],[0,0,.16]);
    for(let i=0;i<5;i++)add(g,new THREE.ConeGeometry(.035,.65,5),jade,[.2+i*.08,1.48-i*.04,.02],[0,0,.15+i*.04]);
  }else{
    const bow=new THREE.CurvePath();
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.2,-1.9,0),new THREE.Vector3(-.55,0,0),new THREE.Vector3(-1.2,1.9,0)]);
    add(g,new THREE.TubeGeometry(curve,30,.095,8,false),gold,[0,0,0],[0,0,-.08]);
    add(g,new THREE.CylinderGeometry(.018,.018,3.9,6),silver,[-1.18,0,0],[0,0,0]);
    add(g,new THREE.CylinderGeometry(.035,.045,4.7,8),dark,[.55,-.1,0],[0,0,.08]);
    add(g,new THREE.ConeGeometry(.14,.48,5),silver,[.73,2.22,0],[0,0,-.08]);
  }
  g.userData.sculptRuntime={
    approximation:'stylized procedural Three Kingdoms weapon reconstructed from generated concept art; hidden-side geometry is inferred',
    pivots:['root'],sockets:['handGrip','skillTrail'],clickableParts:g.children.map((_,i)=>`part-${i}`),explodeScale:1.8,
    qualityContract:{silhouette:'recognizable signature weapon at gameplay scale',materials:'metal, lacquered wood and emissive accents',interaction:'hand socket and skill trail anchor',performance:'under 18 meshes'}
  };
  g.rotation.z=-.55;g.rotation.x=.22;g.scale.setScalar(.75);return g;
}
