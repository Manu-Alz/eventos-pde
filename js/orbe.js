/* orbe.js · esfera cromada flotante con anillo de color (WebGL, sin librerías)
   Se dibuja entera en un shader: una esfera de cromo que refleja un estudio y el propio anillo,
   y un anillo luminoso que gira. Flota, se inclina con el dedo/mouse y se mueve un poco al hacer scroll.
   Cuida la batería: se pausa fuera de pantalla o con la pestaña oculta, y si el usuario pidió menos movimiento queda quieta.
   Índice: 1 Shader · 2 Inicio · 3 Animación
   Requiere: un <section id="orbe"> con un <canvas> adentro (index.html) y los colores de css/orbe.css */

(() => {
  const box = document.getElementById("orbe");
  const cv = box && box.querySelector("canvas");
  if (!cv) return;

  /* ============ 1. Shader ============ */
  const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uTilt; uniform float uScroll;
uniform vec3 uC1, uC2, uC3;                     // colores del anillo

const float RING_R = 1.62;                      // radio del anillo
const float RING_T = 0.055;                     // grosor del anillo

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

/* Anillo inclinado hacia la cámara */
vec3 ringSpace(vec3 p){ p.yz *= rot(1.05); p.xy *= rot(-0.38); return p; }
float sdRing(vec3 p){ vec3 q = ringSpace(p); vec2 t = vec2(length(q.xz) - RING_R, q.y); return length(t) - RING_T; }

/* Color del anillo: recorre los tres colores y tiene un punto más brillante que gira */
vec3 ringColor(vec3 p){
  vec3 q = ringSpace(p);
  float a = atan(q.z, q.x) + uTime * 0.55;
  float k = 0.5 + 0.5 * sin(a);
  vec3 c = mix(mix(uC1, uC2, smoothstep(0.0, 0.5, k)), uC3, smoothstep(0.5, 1.0, k));
  float hot = 0.7 + 0.9 * pow(0.5 + 0.5 * sin(a * 2.0 - 1.0), 3.0);
  return c * hot;
}

/* Estudio que se refleja en el cromo: cielo claro, horizonte nítido, suelo oscuro, una luz grande y dos de color */
vec3 env(vec3 d){
  d.xz *= rot(uTime * 0.16 + uScroll * 1.4);
  float h = d.y;
  vec3 sky    = mix(vec3(1.25, 1.30, 1.45), vec3(0.10, 0.12, 0.20), smoothstep(0.0, 0.9, h));   // claro junto al horizonte, oscuro arriba
  vec3 ground = mix(vec3(0.0), vec3(0.20, 0.21, 0.27), smoothstep(-1.0, -0.02, h));
  vec3 c = mix(ground, sky, smoothstep(-0.01, 0.025, h));              // horizonte bien cortado
  c += vec3(1.0, 0.95, 0.9) * smoothstep(0.012, 0.0, abs(h - 0.075)) * 1.6;   // línea fina de luz sobre el horizonte
  float box1 = smoothstep(0.22, 0.05, abs(d.x - 0.30)) * smoothstep(0.40, 0.10, abs(h - 0.42)) * smoothstep(-0.2, 0.3, d.z);
  float box2 = smoothstep(0.10, 0.02, abs(d.x + 0.55)) * smoothstep(0.30, 0.08, abs(h - 0.25)) * smoothstep(-0.4, 0.2, d.z);
  c += vec3(1.0) * (box1 * 3.2 + box2 * 2.4);                           // cajas de luz de estudio
  c += uC3 * pow(max(dot(d, normalize(vec3(-0.9, 0.10, 0.4))), 0.0), 9.0)  * 1.6;
  c += uC1 * pow(max(dot(d, normalize(vec3( 0.9, 0.25, 0.3))), 0.0), 11.0) * 1.4;
  return c;
}

float sdScene(vec3 p){ return min(length(p) - 1.0, sdRing(p)); }

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  /* Cámara: se mueve apenas con el puntero y flota */
  vec3 ro = vec3(0.0, -sin(uTime * 0.9) * 0.05, -4.7);
  vec3 rd = normalize(vec3(uv, 1.28));
  float ay = uTilt.x * 0.45, ax = uTilt.y * 0.25;
  ro.xz *= rot(ay); rd.xz *= rot(ay);
  ro.yz *= rot(ax); rd.yz *= rot(ax);

  /* Avance del rayo */
  float t = 0.0, glow = 0.0, hit = 0.0;
  vec3 p = ro;
  for (int i = 0; i < 64; i++){
    p = ro + rd * t;
    float dr = sdRing(p);
    float d = min(length(p) - 1.0, dr);
    glow += exp(-dr * 4.5) * clamp(d, 0.02, 0.35) * 0.075;
    if (d < 0.0015){ hit = 1.0; break; }
    t += d;
    if (t > 9.0) break;
  }

  vec3 col = vec3(0.0);
  vec3 halo = ringColor(p);

  if (hit > 0.5){
    bool onRing = sdRing(p) < length(p) - 1.0;
    if (onRing){
      col = ringColor(p) * 2.1;                                   // el anillo emite luz
    } else {
      vec3 n = normalize(p);
      vec3 r = reflect(rd, n);
      float fres = 0.12 + 0.88 * pow(1.0 - max(dot(n, -rd), 0.0), 4.0);
      vec3 refl = env(r);

      /* La esfera también refleja el anillo */
      float rt = 0.02, rg = 0.0, rhit = 0.0; vec3 rp = p;
      for (int j = 0; j < 36; j++){
        rp = p + n * 0.01 + r * rt;
        float dd = sdRing(rp);
        rg += exp(-dd * 5.0) * clamp(dd, 0.02, 0.3) * 0.12;
        if (dd < 0.004){ rhit = 1.0; break; }
        rt += dd;
        if (rt > 6.0) break;
      }
      refl += ringColor(rp) * (rhit > 0.5 ? 2.4 : rg);
      col = refl * mix(0.82, 1.15, fres);
      col += uC2 * pow(1.0 - max(dot(n, -rd), 0.0), 3.0) * 0.18;   // borde con un toque de color
    }
  }
  col += halo * glow * 0.9;

  col = 1.0 - exp(-col * 1.15);                                    // tono suave: sin blancos quemados
  col = pow(col, vec3(0.92));
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * (2.0 / 255.0);   // evita las bandas
  gl_FragColor = vec4(col, 1.0);
}`;

  /* ============ 2. Inicio ============ */
  const gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return;                                       // sin WebGL queda el dibujo de respaldo (css/orbe.css)

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn("[orbe]", gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = n => gl.getUniformLocation(prog, n);
  const uRes = U("uRes"), uTime = U("uTime"), uTilt = U("uTilt"), uScroll = U("uScroll");

  /* Colores del anillo: salen de css/orbe.css (--orb-ring-1/2/3) */
  const hex = v => { const m = /#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(v.trim()); return m ? [1, 2, 3].map(i => parseInt(m[i], 16) / 255) : [1, 1, 1]; };
  const css = getComputedStyle(document.documentElement);
  [["uC1", "--orb-ring-1"], ["uC2", "--orb-ring-2"], ["uC3", "--orb-ring-3"]].forEach(([u, v]) => gl.uniform3fv(U(u), hex(css.getPropertyValue(v))));

  /* ============ 3. Animación ============ */
  const REDUCED = matchMedia("(prefers-reduced-motion:reduce)");
  let tilt = [0, 0], goal = [0, 0], visible = true, running = false, t0 = performance.now();

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(cv.clientWidth * dpr);
    if (w && (cv.width !== w || cv.height !== w)) { cv.width = cv.height = w; gl.viewport(0, 0, w, w); }
  }

  function draw(now) {
    resize();
    const time = REDUCED.matches ? 2.4 : (now - t0) / 1000;
    tilt[0] += (goal[0] - tilt[0]) * 0.06; tilt[1] += (goal[1] - tilt[1]) * 0.06;   // movimiento suave
    gl.uniform2f(uRes, cv.width, cv.height);
    gl.uniform1f(uTime, time);
    gl.uniform2f(uTilt, tilt[0], tilt[1]);
    gl.uniform1f(uScroll, scrollY / 1400);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    box.classList.add("ready");
  }

  function loop(now) {
    if (!running) return;
    draw(now);
    requestAnimationFrame(loop);
  }
  function start() { if (running || REDUCED.matches || !visible || document.hidden) return; running = true; requestAnimationFrame(loop); }
  function stop() { running = false; }

  /* Se inclina hacia donde está el dedo o el mouse */
  addEventListener("pointermove", e => { goal = [(e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2]; }, { passive: true });

  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }, { rootMargin: "80px" }).observe(box);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  addEventListener("resize", () => draw(performance.now()));
  REDUCED.addEventListener && REDUCED.addEventListener("change", () => (REDUCED.matches ? (stop(), draw(performance.now())) : start()));

  draw(performance.now());                               // primer cuadro ya, para que no haya parpadeo
  start();
})();
