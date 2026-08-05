/**
 * Animation bridge for Boss visuals.
 *
 * The current production path uses generated multi-frame Sprite atlases. The
 * class deliberately keeps the same lifecycle that a licensed Spine runtime
 * adapter will use later, so Planck/AI code never depends on a renderer.
 */
export class SpineActorBridge {
  constructor(entity) {
    this.entity = entity;
    this.mode = entity?.data?.frames ? 'sprite-atlas' : 'sprite-fallback';
    this.animation = 'idle';
    this.mix = 0.12;
    this.timeScale = 1;
    this.rootOffset = { x: 0, y: 0 };
    this.intentStartedAt = 0;
  }

  setAnimation(name, mix = this.mix) {
    if (!name || this.animation === name) return;
    this.animation = name;
    this.mix = mix;
    this.intentStartedAt = this.entity?.stateTime || 0;
  }

  setIntent(state, action = 0, moving = false) {
    let intent = state || 'idle';
    if (moving && intent === 'idle') intent = 'move';
    if (intent === 'attack') intent = `attack${Math.max(0, action)}`;
    this.setAnimation(intent);
    return intent;
  }

  frameAt(elapsed = 0, duration = 0, loop = false) {
    const frames = this.entity?.data?.frames?.[this.animation];
    if (!Array.isArray(frames) || !frames.length) return this.entity?.data?.cell || 0;
    const fps = Math.max(1, this.entity?.data?.fps || 8) * this.timeScale;
    if (loop) return frames[Math.floor(elapsed * fps) % frames.length];
    const normalized = duration > 0 ? Math.min(0.999, elapsed / duration) : Math.min(0.999, elapsed * fps / frames.length);
    return frames[Math.min(frames.length - 1, Math.floor(normalized * frames.length))];
  }

  flash() {
    const uniforms = this.entity?.mat?.uniforms;
    if (uniforms?.flash) uniforms.flash.value = 1;
  }

  sync(dt) {
    const actor = this.entity;
    const body = actor?.body;
    if (!actor || !body || !actor.mesh) return;
    const pos = body.getPosition();
    this.rootOffset.x = pos.x;
    this.rootOffset.y = pos.y;
    actor.mesh.userData.spineBridge = {
      mode: this.mode,
      animation: this.animation,
      mix: this.mix,
      timeScale: this.timeScale,
      physicsPosition: [pos.x, pos.y],
      renderStep: dt
    };
  }

  dispose() {
    this.entity = null;
  }
}

export const SPINE_INTEGRATION_NOTE = {
  currentRenderer: 'multi-frame sprite atlas',
  plannedRuntime: 'spine-threejs after licensed assets are re-exported to a compatible version',
  coordinateRule: 'Planck meters are authoritative; 1 world unit maps to 1 orthographic render unit.',
  fallback: 'Legacy static boss atlas and procedural texture remain available when an animated atlas fails.'
};
