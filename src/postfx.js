import * as THREE from 'three';

export const MythicGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    tint: { value: new THREE.Color(0xffe2b0) },
    saturation: { value: 1.12 },
    contrast: { value: 1.08 },
    vignette: { value: .24 },
    pulse: { value: 0 }
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec3 tint; uniform float saturation, contrast, vignette, pulse; varying vec2 vUv;
    void main(){
      vec4 tex=texture2D(tDiffuse,vUv);
      float luma=dot(tex.rgb,vec3(.299,.587,.114));
      vec3 color=mix(vec3(luma),tex.rgb,saturation);
      color=(color-.5)*contrast+.5;
      color*=mix(vec3(1.),tint,.055+pulse*.06);
      float edge=smoothstep(.78,.12,length(vUv-.5));
      color*=1.-(1.-edge)*vignette;
      gl_FragColor=vec4(color,tex.a);
    }`
};
