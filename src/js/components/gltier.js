// Shared 3D budget helpers.
// softGL: true when WebGL runs on the CPU (no usable GPU, e.g. SwiftShader / llvmpipe). Animating a scene there blocks the
//   main thread for whole seconds, so such devices get one still frame instead of a loop.
// PHONE: small screens draw at 30 fps and only boot their 3D once the section is close.
export const PHONE = matchMedia('(max-width: 819px)').matches;
export function softGL(renderer) {
  try { if (localStorage.getItem('naturik.forcegl')) return false; } catch {}
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(name));
  } catch { return false; }
}
// frame gate: returns true when a frame should be drawn at the given rate
export function gate(fps) {
  const step = 1000 / fps; let next = 0;
  return (now) => { if (now + 1 < next) return false; next = Math.max(next + step, now); return true; };
}
