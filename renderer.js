import {BASE} from './filters.js';
import {processPixels} from './pixels.js';
import {cropRect} from './framing.js';
const vertex=`attribute vec2 aPosition; varying vec2 vUV;
void main(){vUV=vec2((aPosition.x+1.0)*.5,(1.0-aPosition.y)*.5);gl_Position=vec4(aPosition,0.,1.);}`;
const fragment=`precision highp float;
varying vec2 vUV;
uniform sampler2D uImage;
uniform vec2 uTexSize,uFullSize,uOrigin;
uniform float uMirror,uRadius,uDefinitionRadius;
uniform float exposure,contrast,saturation,warmth,tint,fade,grain,vignette,smooth,sharp,clarity,shadows,highlights,mono,sepia;
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
float noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 tap(vec2 uv,vec2 d){return texture2D(uImage,clamp(uv+d/uTexSize,vec2(0.),vec2(1.))).rgb;}
void main(){
  vec2 uv=vec2(mix(vUV.x,1.-vUV.x,uMirror),vUV.y);
  vec3 original=texture2D(uImage,uv).rgb;
  vec3 c=original;
  if(smooth>.001){
    vec3 accum=c;float weight=1.;
    for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){
      vec3 q=tap(uv,vec2(float(i),float(j))*uRadius);
      float w=exp(-dot(q-c,q-c)*55.);accum+=q*w;weight+=w;
    }}
    float y=lum(c);float cb=.5+(c.b-y)*.564;float cr=.5+(c.r-y)*.713;
    float skin=smoothstep(.48,.54,cr)*(1.-smoothstep(.68,.76,cr))*smoothstep(.22,.3,cb)*(1.-smoothstep(.52,.59,cb));
    skin*=smoothstep(.03,.16,y)*(1.-smoothstep(.94,1.,y));
    c=mix(c,accum/weight,smooth*skin);
  }
  if(sharp>.001){
    vec3 blur=(tap(uv,vec2(1.,0.))+tap(uv,vec2(-1.,0.))+tap(uv,vec2(0.,1.))+tap(uv,vec2(0.,-1.)))*.25;
    c+=clamp(original-blur,vec3(-.12),vec3(.12))*sharp;
  }
  if(clarity>.001){
    vec3 broad=vec3(0.);
    for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){broad+=tap(uv,vec2(float(i),float(j))*uDefinitionRadius);}}
    c+=clamp(lum(original)-lum(broad/9.),-.18,.18)*clarity*.65;
  }
  c*=exp2(exposure);
  float l=lum(c);
  c+=shadows*.22*pow(1.-clamp(l,0.,1.),2.);
  c-=highlights*.18*pow(clamp(l,0.,1.),3.);
  c=(c-.5)*contrast+.5;
  c*=vec3(1.+warmth*.16+tint*.04,1.-abs(warmth)*.02-tint*.07,1.-warmth*.16+tint*.04);
  c=mix(vec3(lum(c)),c,saturation);
  vec3 brown=vec3(dot(c,vec3(.393,.769,.189)),dot(c,vec3(.349,.686,.168)),dot(c,vec3(.272,.534,.131)));
  c=mix(c,brown,sepia);c=mix(c,vec3(lum(c)),mono);
  c=c*(1.-fade)+vec3(fade*.58);
  vec2 fullUV=(uOrigin+vUV*uTexSize)/uFullSize;
  float edge=smoothstep(.26,.72,length(fullUV-.5));c*=1.-edge*vignette*.65;
  c+=(noise(floor(fullUV*uFullSize))-.5)*grain*.11;
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}`;

export class Renderer {
  constructor(canvas,{preserve=false}={}){
    this.canvas=canvas;
    const gl=this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:preserve,premultipliedAlpha:false,powerPreference:'low-power'});
    if(!gl) throw new Error('LeLuma needs WebGL for its filters. Try reopening in Safari.');
    const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    this.program=gl.createProgram();
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error('Could not initialize the filters.');
    gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(this.program);
    this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(this.program,'aPosition');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    this.uniforms={};for(const name of [...Object.keys(BASE),'uImage','uTexSize','uFullSize','uOrigin','uMirror','uRadius','uDefinitionRadius'])this.uniforms[name]=gl.getUniformLocation(this.program,name);
  }
  render(source,w,h,params,{mirror=false,origin=[0,0],fullSize=[w,h],radius,definitionRadius,upload=true}={}){
    const gl=this.gl;if(gl.isContextLost())throw new Error('The graphics context was interrupted. Reopen LeLuma to continue.');
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    gl.viewport(0,0,w,h);gl.useProgram(this.program);gl.bindTexture(gl.TEXTURE_2D,this.texture);
    if(upload)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
    gl.uniform1i(this.uniforms.uImage,0);
    const sw=source.videoWidth||source.naturalWidth||source.width,sh=source.videoHeight||source.naturalHeight||source.height;
    gl.uniform2f(this.uniforms.uTexSize,sw,sh);gl.uniform2f(this.uniforms.uFullSize,...fullSize);gl.uniform2f(this.uniforms.uOrigin,...origin);
    gl.uniform1f(this.uniforms.uMirror,mirror?1:0);gl.uniform1f(this.uniforms.uRadius,radius??Math.max(1,Math.min(...fullSize)/420));
    gl.uniform1f(this.uniforms.uDefinitionRadius,definitionRadius??Math.max(2,Math.min(...fullSize)/60));
    for(const key of Object.keys(BASE))gl.uniform1f(this.uniforms[key],params[key]??BASE[key]);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  dispose(){const gl=this.gl;gl.deleteTexture(this.texture);gl.deleteBuffer(this.buffer);gl.deleteProgram(this.program);gl.getExtension('WEBGL_lose_context')?.loseContext();this.canvas.width=this.canvas.height=1;}
}

let worker=null,workerFailed=false,jobId=0;
const jobs=new Map();
function endWorker(){worker?.terminate();worker=null;workerFailed=true;for(const job of jobs.values())job.reject(new Error('Filter worker interrupted.'));jobs.clear();}
async function computePixels(data,w,h,params,options){
  if(!workerFailed&&typeof Worker!=='undefined'){
    try{
      if(!worker){worker=new Worker('./pixel-worker.bundle.js');worker.onmessage=event=>{const job=jobs.get(event.data.id);if(!job)return;jobs.delete(event.data.id);event.data.error?job.reject(new Error(event.data.error)):job.resolve(event.data.data);};worker.onerror=endWorker;}
      const id=++jobId;
      return await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{endWorker();reject(new Error('Filter worker timed out.'));},w*h<300000?2000:15000);jobs.set(id,{resolve:data=>{clearTimeout(timeout);resolve(data);},reject:error=>{clearTimeout(timeout);reject(error);}});worker.postMessage({id,data,w,h,params,options});});
    }catch{endWorker();}
  }
  return processPixels(data,w,h,params,options);
}
export class CpuRenderer {
  constructor(canvas){this.canvas=canvas;this.context=canvas.getContext('2d',{alpha:false});this.input=document.createElement('canvas');this.inputContext=this.input.getContext('2d',{alpha:false,willReadFrequently:true});if(!this.context||!this.inputContext)throw new Error('The photo canvas is unavailable. Close and reopen LeLuma.');}
  async render(source,w,h,params,options={}){
    if(this.input.width!==w||this.input.height!==h){this.input.width=w;this.input.height=h;}
    const ctx=this.inputContext;ctx.save();if(options.mirror){ctx.translate(w,0);ctx.scale(-1,1);}ctx.drawImage(source,0,0,w,h);ctx.restore();
    const {shouldCommit,...pixelOptions}=options;
    const input=ctx.getImageData(0,0,w,h),data=await computePixels(input.data,w,h,params,pixelOptions);
    if(shouldCommit&&!shouldCommit())return false;
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    this.context.putImageData(new ImageData(data,w,h),0,0);
    return true;
  }
  dispose(){this.canvas.width=this.canvas.height=this.input.width=this.input.height=1;}
}

export function toBlob(canvas,type='image/png',quality=1){return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(new Error('Photo encoding timed out. Your original is still available; try saving again or choose JPEG.')),45000);
  try{canvas.toBlob(blob=>{clearTimeout(timeout);blob?resolve(blob):reject(new Error('Your iPhone could not encode this full-size photo. No smaller copy was substituted.'));},type,quality);}
  catch(error){clearTimeout(timeout);reject(error);}
});}

// Tile only the GPU work. The final image keeps every source pixel and is never
// resized to preview dimensions. Padding prevents smoothing seams between tiles.
export async function exportPhoto(source,params,{type='image/png',mirror=false,framing='original',onProgress=()=>{}}={}){
  const crop=cropRect(source.naturalWidth||source.width,source.naturalHeight||source.height,framing),w=crop.width,h=crop.height;
  const output=document.createElement('canvas');output.width=w;output.height=h;
  const ctx=output.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('Not enough memory for this full-size image. Your original has not been changed.');
  const tile=document.createElement('canvas');let gpu=document.createElement('canvas');
  let renderer;
  try{
    // Detect canvas allocation failure without silently resizing.
    ctx.fillStyle='#ffffff';ctx.fillRect(w-1,h-1,1,1);
    if(ctx.getImageData(w-1,h-1,1,1).data[3]!==255)throw new Error('This photo exceeds the canvas capacity of this iPhone. Your original is unchanged.');
    try{renderer=new Renderer(gpu,{preserve:true});}catch{gpu=document.createElement('canvas');renderer=new CpuRenderer(gpu);}
    const radius=Math.max(1,Math.min(w,h)/420),definitionRadius=Math.max(2,Math.min(w,h)/60),pad=Math.ceil(Math.max(radius,definitionRadius))+2;
    const tileCtx=tile.getContext('2d',{alpha:false});const size=1024;
    let done=0;const total=Math.ceil(w/size)*Math.ceil(h/size);
    for(let y=0;y<h;y+=size){for(let x=0;x<w;x+=size){
      const cw=Math.min(size,w-x),ch=Math.min(size,h-y),sx=Math.max(0,x-pad),sy=Math.max(0,y-pad);
      const tw=Math.min(w,x+cw+pad)-sx,th=Math.min(h,y+ch+pad)-sy;
      tile.width=tw;tile.height=th;tileCtx.drawImage(source,crop.x+sx,crop.y+sy,tw,th,0,0,tw,th);
      try{await renderer.render(tile,tw,th,params,{origin:[sx,sy],fullSize:[w,h],radius,definitionRadius});}
      catch(error){if(renderer instanceof CpuRenderer)throw error;renderer.dispose();gpu=document.createElement('canvas');renderer=new CpuRenderer(gpu);await renderer.render(tile,tw,th,params,{origin:[sx,sy],fullSize:[w,h],radius,definitionRadius});}
      if(mirror){ctx.save();ctx.translate(w,0);ctx.scale(-1,1);}
      ctx.drawImage(gpu,x-sx,y-sy,cw,ch,x,y,cw,ch);if(mirror)ctx.restore();
      onProgress(++done/total);await new Promise(r=>setTimeout(r,0));
    }}
    return await toBlob(output,type,1);
  } finally {renderer?.dispose();tile.width=tile.height=1;output.width=output.height=1;}
}
