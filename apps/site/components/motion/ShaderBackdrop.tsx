"use client";

import { useEffect, useRef } from "react";

// «Видео» без видеофайла: ночной город в расфокусе за мокрым стеклом. Фрагментный шейдер на чистом WebGL,
// ~3 КБ, останавливается вне экрана. На уровне basic остаётся CSS-градиент.
const FRAG = `precision highp float;
uniform vec2 uRes; uniform float uT;
float h(vec2 p){ return fract(sin(dot(p, vec2(41.3,289.1)))*45758.5); }
vec3 bokeh(vec2 uv, float t){
  vec3 c = vec3(0.);
  for (int i=0;i<30;i++){
    float fi = float(i);
    vec2 p = vec2(h(vec2(fi,1.3)), h(vec2(fi,7.1)));
    p.x = fract(p.x + t*(.004 + .01*h(vec2(fi,3.))));
    p.y = .25 + p.y*.55 + sin(t*.3+fi)*.01;
    float r = .02 + .05*h(vec2(fi,9.));
    float d = length((uv - p)*vec2(uRes.x/uRes.y,1.));
    float disk = smoothstep(r, r*.82, d) * (.55 + .45*smoothstep(r*.5, r, d));
    vec3 col = mix(vec3(1.,.66,.15), vec3(.27,.6,.81), step(.6, h(vec2(fi,5.))));
    col = mix(col, vec3(1.,.2,.18), step(.9, h(vec2(fi,11.))));
    c += col * disk * (.12 + .28*h(vec2(fi,2.)));
  }
  return c;
}
float rain(vec2 uv, float t){
  vec2 g = vec2(uv.x*90., uv.y*2. + t*1.6 + h(vec2(floor(uv.x*90.),0.))*10.);
  float s = smoothstep(.97, 1., fract(g.y)) * step(.86, h(vec2(floor(g.x), floor(g.y))));
  return s;
}
float drops(vec2 uv, float t){
  vec2 g = uv*vec2(uRes.x/uRes.y,1.)*14.;
  vec2 id = floor(g); vec2 f = fract(g)-.5;
  float n = h(id); if (n < .7) return 0.;
  vec2 o = vec2(h(id+1.)-.5, h(id+2.)-.5)*.6;
  float life = fract(t*.15 + n*10.);
  return smoothstep(.14,.06,length(f-o)) * (1.-life);
}
void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  float dr = drops(uv, uT);
  vec2 ruv = uv + vec2(dr*.02, dr*.03);
  vec3 c = mix(vec3(.02,.025,.03), vec3(.04,.08,.1), uv.y);
  c += bokeh(ruv, uT);
  c += vec3(.6,.7,.8)*rain(uv, uT)*.12;
  c += vec3(.9,.95,1.)*dr*.08;
  c *= .85 + .15*smoothstep(1.2,.2,length(uv-.5));
  gl_FragColor = vec4(c,1.);
}`;
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

export function ShaderBackdrop({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (document.documentElement.dataset.gfx === "basic") return;
    const cv = ref.current!;
    const gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power", preserveDrawingBuffer: true });
    if (!gl) return;
    const sh = (t: number, s: string) => { const o = gl.createShader(t)!; gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    gl.useProgram(pr);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(pr, "uRes"), uT = gl.getUniformLocation(pr, "uT");
    const scale = Math.min(devicePixelRatio, 1) * 0.6;
    const resize = () => { cv.width = Math.max(1, cv.clientWidth * scale); cv.height = Math.max(1, cv.clientHeight * scale); gl.viewport(0, 0, cv.width, cv.height); };
    const ro = new ResizeObserver(resize); ro.observe(cv); resize();
    let on = false, raf = 0; const t0 = performance.now();
    const loop = () => { raf = requestAnimationFrame(loop); if (!on) return; gl.uniform2f(uRes, cv.width, cv.height); gl.uniform1f(uT, (performance.now() - t0) / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; cv.classList.toggle("on", on); });
    io.observe(cv); loop();
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className={`shader-bg ${className}`} aria-hidden="true" />;
}
