import {FILTERS,ADJUSTMENTS,BASE,parameters} from './filters.js';
import {Renderer,CpuRenderer,exportPhoto,toBlob} from './renderer.js';
import {cropRect} from './framing.js';

const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const size=source=>[source.videoWidth||source.naturalWidth||source.width,source.videoHeight||source.naturalHeight||source.height];
const pixels=(w,h)=>`${w.toLocaleString()} × ${h.toLocaleString()}`;
let prefs={};try{prefs=JSON.parse(localStorage.getItem('leluma.preferences.v1')||localStorage.getItem('evcam.preferences.v1')||localStorage.getItem('luma.preferences.v1')||'{}')||{};}catch{}
const state={filter:FILTERS.find(f=>f.id===prefs.filter)||FILTERS[1],strength:Number.isFinite(prefs.strength)?Math.max(0,Math.min(1,prefs.strength)):1,adjustments:{},favorites:new Set(Array.isArray(prefs.favorites)?prefs.favorites:[]),category:'Everyday',facing:'user',mode:'full',mirror:prefs.mirror!==false,format:prefs.format==='image/jpeg'?'image/jpeg':'image/png',timer:0,compare:false,review:false,demo:false,busy:false,stream:null,source:null,sourceFile:null,previewSource:null,sourceKind:'',cameraWanted:false,paused:false,exportFile:null,exportUrl:null};
let renderer,demoImage,raf=0,lastFrame=0,toastTimeout,cameraRequest=0,timerToken=0,offlineReady=false,exportBusy=false,exportTask=0,wakeLock=null;
let cameraPending=false,activeCameraCancel=null,renderScheduled=false,renderRunning=false,renderAgain=false,previewRevision=0,previewError=null;
let cameraOnly=false,cameraReady=false,mediaIssue='',mediaTime=null,mediaChangedAt=0,playAttempt=0,lastPaintAt=0;
const cameraEvents=[];
function cameraLog(message){cameraEvents.push(new Date().toISOString().slice(11,19)+' '+message);if(cameraEvents.length>15)cameraEvents.shift();}
state.strength=1;
state.framing=['original','portrait','landscape'].includes(prefs.framing)?prefs.framing:'original';
const previewInput=document.createElement('canvas');
const previewContext=previewInput.getContext('2d',{alpha:false});
state.category=state.filter.group==='Original'?'Everyday':state.filter.group;
function savePrefs(){try{localStorage.setItem('leluma.preferences.v1',JSON.stringify({filter:state.filter.id,strength:state.strength,favorites:[...state.favorites],mirror:state.mirror,format:state.format,framing:state.framing}));}catch{}}
function toast(message,delay=4500){clearTimeout(toastTimeout);$('toast').textContent=message;$('toast').hidden=false;toastTimeout=setTimeout(()=>$('toast').hidden=true,delay);}
function showDialog(id){if(!$(id).open)$(id).showModal();}
function portraitBlocked(){return matchMedia('(orientation: landscape) and (pointer: coarse)').matches;}
function params(){return state.compare?{...BASE}:parameters(state.filter,state.strength,state.adjustments);}
function layoutCamera(){
  const video=$('video'),[w,h]=size(video);if(!w||!h)return;
  const crop=cropRect(w,h,state.framing),box=$('viewfinder');
  const width=Math.min(box.clientWidth||320,(box.clientHeight||320)*crop.width/crop.height);
  $('cameraSurface').style.width=width+'px';$('cameraSurface').style.height=(width*crop.height/crop.width)+'px';
  video.style.transform=state.facing==='user'&&state.mirror?'scaleX(-1)':'none';
}
function cameraHint(){
  if(!state.stream||state.review)return;
  if($('preview').hidden){$('frameFilterName').textContent='Camera';$('frameHint').textContent=cameraOnly?'Camera only · look applied after capture':previewError?'Camera only · retry live filters':cameraReady?'Camera only · preparing look…':'Starting camera…';}
}
function updateMediaControls(){
  $('liveControls').hidden=!state.stream||state.review;
  $('mediaNotice').hidden=!state.stream||!mediaIssue||state.review;
  $('mediaNoticeText').textContent=mediaIssue;
  $('previewMode').textContent=cameraOnly?'Show live filters':'Show camera only';
  $('previewMode').setAttribute('aria-pressed',String(cameraOnly));
  $('shutterButton').disabled=state.busy||(state.mode==='live'&&(!cameraReady||cameraPending));
  cameraHint();
}
function failPreview(error){
  previewError=error;cameraLog('Filter preview: '+error.message);
  if(state.stream)$('preview').hidden=true;
  $('previewError').hidden=false;
  $('previewErrorText').textContent=state.stream?'Showing camera only. Your look will apply after capture.':'The photo preview could not update.';
  $('frameHint').textContent='Preview interrupted';cameraHint();
}
function safeRender(changed=true){
  if(changed){++previewRevision;previewError=null;$('previewError').hidden=true;$('frameFilterName').textContent=state.compare?'Original':state.filter.name;$('frameHint').textContent='Applying look…';}
  if(state.stream&&(cameraOnly||!cameraReady)){cameraHint();return;}
  if(renderRunning){renderAgain=true;return;}
  if(renderScheduled||document.hidden)return;
  renderScheduled=true;requestAnimationFrame(async()=>{
    renderScheduled=false;renderRunning=true;const revision=previewRevision;
    try{await render();}catch(error){if(revision===previewRevision)failPreview(error);}
    finally{renderRunning=false;if(renderAgain&&!previewError){renderAgain=false;safeRender(false);}}
  });
}
async function render(){
  if(document.hidden)return;
  if(!state.review&&!state.stream&&!state.demo)return;
  if(state.stream&&(cameraOnly||!cameraReady))return;
  if(!renderer)renderer=new CpuRenderer($('preview'));
  const src=state.review?state.previewSource:state.stream?$('video'):demoImage;
  if(!src)return;
  const [sw,sh]=size(src);if(!sw||!sh)return;
  if(src===$('video')&&src.readyState<2)return;
  const revision=previewRevision,stream=state.stream,filterName=state.compare?'Original':state.filter.name;
  const crop=state.review?cropRect(...size(state.source),state.framing):cropRect(sw,sh,state.framing);
  const cropScaleX=state.review?sw/size(state.source)[0]:1,cropScaleY=state.review?sh/size(state.source)[1]:1;
  const ratio=Math.min(1,(stream?400:480)/Math.max(crop.width,crop.height)),w=Math.max(1,Math.round(crop.width*ratio)),h=Math.max(1,Math.round(crop.height*ratio));
  if(previewInput.width!==w||previewInput.height!==h){previewInput.width=w;previewInput.height=h;}
  previewContext.drawImage(src,crop.x*cropScaleX,crop.y*cropScaleY,crop.width*cropScaleX,crop.height*cropScaleY,0,0,w,h);
  const valid=()=>revision===previewRevision&&stream===state.stream&&!previewError&&(!stream||(!cameraOnly&&cameraReady));
  const committed=await renderer.render(previewInput,w,h,params(),{mirror:!state.review&&!!stream&&state.facing==='user'&&state.mirror,fullSize:[w,h],shouldCommit:valid});
  if(committed&&valid()){lastPaintAt=Date.now();$('preview').hidden=false;$('frameFilterName').textContent=filterName;$('frameHint').textContent=state.compare?'Before · original colors':state.review?'Look applied':state.demo?'Sample · look applied':'Live · look applied';state.renderedRevision=revision;$('previewError').hidden=true;}
}
function loop(now){
  if(!state.stream||document.hidden)return;
  checkCameraFrames();
  const renderingAllowed=!portraitBlocked()&&!document.querySelector('dialog[open]');
  if(!renderingAllowed)lastPaintAt=Date.now();
  if(renderingAllowed&&!cameraOnly&&cameraReady&&!$('preview').hidden&&Date.now()-lastPaintAt>3000)failPreview(new Error('Live filters stopped updating.'));
  if(now-lastFrame>150&&!previewError&&renderingAllowed){safeRender(false);lastFrame=now;}
  raf=requestAnimationFrame(loop);
}
function sync(){
  $('strength').value=String(Math.round(state.strength*100));$('strengthValue').value=$('strength').value;
  $('lookDescription').textContent=state.filter.id==='original'&&Object.values(state.adjustments).some(Boolean)?'No preset. Your manual adjustments still apply.':state.filter.description;
  $('favoriteButton').setAttribute('aria-pressed',String(state.favorites.has(state.filter.id)));
  $('favoriteButton').disabled=state.filter.id==='original';
  $('favoriteButton').setAttribute('aria-label',`${state.favorites.has(state.filter.id)?'Unfavorite':'Favorite'} ${state.filter.name}`);
  $('compareButton').setAttribute('aria-pressed',String(state.compare));
  $('liveMode').setAttribute('aria-pressed',String(state.mode==='live'));$('fullMode').setAttribute('aria-pressed',String(state.mode==='full'));
  $('captureMode').hidden=state.review;$('cameraActions').hidden=state.review;$('reviewActions').hidden=!state.review;
  $('shutterButton').disabled=state.busy||((!cameraReady||cameraPending)&&state.mode==='live');
  $('shutterButton').setAttribute('aria-label',state.timer?'Start photo timer':state.mode==='full'?'Take full-resolution photo':'Capture live photo');
  $('flipButton').disabled=state.busy||cameraPending||state.review;$('timerButton').disabled=state.busy||state.review||state.mode==='full';
  $('importButton').disabled=state.busy;$('saveButton').disabled=state.busy;$('retakeButton').disabled=state.busy;
  $('liveMode').disabled=state.busy;$('fullMode').disabled=state.busy;
  $('startButton').disabled=cameraPending||state.busy;$('resumeButton').disabled=cameraPending||state.busy;
  $('startButton').textContent=cameraPending?'Opening camera…':'Open camera';$('resumeButton').textContent=cameraPending?'Opening camera…':'Resume camera';
  $('cancelCameraButton').hidden=!cameraPending;$('cancelResumeButton').hidden=!cameraPending;
  $('timerLabel').textContent=state.timer?`${state.timer}s`:'Timer';$('timerButton').setAttribute('aria-label',`Timer: ${state.timer?state.timer+' seconds':'off'}`);
  $('timerButton').setAttribute('aria-pressed',String(state.timer>0));
  const framingLabel=state.framing==='original'?'Full frame · no crop':state.framing==='portrait'?'Portrait · 3:4 center crop':'Landscape · 4:3 center crop';
  $('captureNote').textContent=framingLabel+' · '+(state.review?'save before closing':state.mode==='full'?'native photo → chosen look':'live feed resolution');
  $('framingLabel').textContent=framingLabel;
  for(const mode of ['original','portrait','landscape']){$('frame-'+mode).setAttribute('aria-pressed',String(state.framing===mode));$('frame-'+mode).disabled=state.busy;}
  $('welcome').hidden=!!state.stream||(!cameraPending&&(state.review||state.demo||state.paused));
  $('resumePanel').hidden=!state.paused||state.review||cameraPending;
  $('frameBottom').hidden=!state.stream&&!state.review&&!state.demo;
  $('frameHint').textContent=state.review?'Ready to fine-tune':state.demo?'Sample scene · not your camera':'Live preview';
  $('sourceBadge').textContent=state.review?state.sourceKind:state.stream?'LIVE CAMERA':state.demo?'SAMPLE SCENE':'YOUR LIGHT, YOUR LOOK';
  $('resolutionBadge').hidden=!state.review&&!state.stream;
  if(state.review||state.stream){const crop=cropRect(...size(state.review?state.source:$('video')),state.framing);$('resolutionBadge').textContent=pixels(crop.width,crop.height);}
  document.querySelectorAll('.filter-item').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===state.filter.id)));
  layoutCamera();updateMediaControls();
}
function setCategory(category){state.category=category;renderCategories();renderFilters();}
function renderCategories(){
  $('categories').replaceChildren();
  for(const name of ['Everyday','Selfie','Skin','Definition','Warm','Cool','Film','Editorial','Favorites']){
    const button=document.createElement('button');button.textContent=name;button.setAttribute('aria-pressed',String(state.category===name));button.onclick=()=>setCategory(name);$('categories').append(button);
  }
}
function renderFilters(){
  const rail=$('filterRail');rail.replaceChildren();
  const filters=state.category==='Favorites'?FILTERS.filter(f=>state.favorites.has(f.id)):[FILTERS[0],...FILTERS.filter(f=>f.group===state.category)];
  if(!filters.length){const p=document.createElement('p');p.className='empty-favorites';p.textContent='Your little collection starts here. Tap the star on any look to keep it close.';rail.append(p);return;}
  for(const filter of filters){
    const button=document.createElement('button');button.className='filter-item';button.dataset.id=filter.id;button.setAttribute('aria-label',`${filter.name}: ${filter.description}`);button.setAttribute('aria-pressed',String(state.filter.id===filter.id));
    const img=new Image();img.src=`./thumbnails/${filter.id}.jpg`;img.alt='';img.width=60;img.height=70;img.loading='lazy';
    const label=document.createElement('span');label.textContent=filter.name;button.append(img,label);
    if(state.favorites.has(filter.id)){const star=document.createElement('span');star.className='favorite-dot';star.textContent='★';button.append(star);}
    button.onclick=()=>{state.filter=filter;state.strength=1;state.compare=false;if(!state.stream&&!state.review&&!cameraPending)state.demo=true;sync();safeRender();savePrefs();};rail.append(button);
  }
  rail.scrollLeft=0;
}
function renderAdjustments(){
  for(const adjustment of ADJUSTMENTS){
    const row=document.createElement('div');row.className='adjust-row';
    const label=document.createElement('label');label.htmlFor=`adjust-${adjustment.key}`;label.textContent=adjustment.name;if(adjustment.help)label.title=adjustment.help;
    const input=document.createElement('input');input.type='range';input.id=label.htmlFor;input.min=adjustment.min;input.max=adjustment.max;input.step=adjustment.step;input.value=0;if(adjustment.help)input.setAttribute('aria-description',adjustment.help);
    const output=document.createElement('output');output.setAttribute('for',input.id);output.value=0;
    input.oninput=()=>{state.adjustments[adjustment.key]=+input.value;output.value=input.value;state.compare=false;sync();safeRender();};row.append(label,input,output);$('adjustments').append(row);
  }
}
function setTab(tab){const looks=tab==='looks';$('looksTab').setAttribute('aria-selected',String(looks));$('adjustTab').setAttribute('aria-selected',String(!looks));$('looksPanel').hidden=!looks;$('adjustPanel').hidden=looks;}

async function requestWake(){try{if('wakeLock'in navigator){const lock=await navigator.wakeLock.request('screen');if(state.stream)wakeLock=lock;else lock.release().catch(()=>{});}}catch{}}
function stopCamera(){
  ++cameraRequest;++playAttempt;++previewRevision;activeCameraCancel?.();activeCameraCancel=null;cameraPending=false;cancelAnimationFrame(raf);
  const old=state.stream;state.stream=null;old?.getTracks().forEach(t=>t.stop());$('video').srcObject=null;
  cameraReady=false;mediaTime=null;mediaIssue='';$('preview').hidden=true;$('previewError').hidden=true;
  wakeLock?.release().catch(()=>{});wakeLock=null;
}
function checkCameraFrames(){
  if(!state.stream)return;
  const video=$('video'),track=state.stream.getVideoTracks()[0],now=Date.now();
  const wasReady=cameraReady;
  if(track?.muted){cameraReady=false;mediaIssue='Safari paused this camera. Re-enable it in Safari, or tap Restart camera.';}
  else if(video.paused){cameraReady=false;mediaIssue='Camera playback is paused. Tap Resume video.';}
  else if(video.readyState>=2&&video.videoWidth&&video.videoHeight){
    if(mediaTime!==video.currentTime){mediaTime=video.currentTime;mediaChangedAt=now;cameraReady=true;mediaIssue='';}
    else if(now-mediaChangedAt>4500){cameraReady=false;mediaIssue='No new camera frames. Tap Resume video or Restart camera.';}
  }else if(now-mediaChangedAt>4500){cameraReady=false;mediaIssue='Waiting for camera frames. Tap Resume video or Restart camera.';}
  if(!cameraReady)$('preview').hidden=true;
  if(cameraReady&&!wasReady){cameraLog('Video frames ready');layoutCamera();safeRender();}
  updateMediaControls();
}
function playCamera(){
  if(!state.stream||document.hidden)return;
  const video=$('video'),stream=state.stream,attempt=++playAttempt;
  mediaIssue='Starting video…';mediaChangedAt=Date.now();mediaTime=null;updateMediaControls();
  // Called directly by Resume video, so Safari receives a fresh user gesture.
  // A play() promise must never hold the entire camera UI in a disabled state.
  try{
    const pending=video.play();
    Promise.resolve(pending).then(()=>{if(state.stream===stream&&attempt===playAttempt){cameraLog('Video play resolved');checkCameraFrames();}}).catch(error=>{
      if(state.stream!==stream||attempt!==playAttempt)return;
      cameraReady=false;$('preview').hidden=true;mediaIssue='Tap Resume video to start playback, or Restart camera.';cameraLog('Video play: '+error.name);updateMediaControls();
    });
  }catch(error){mediaIssue='Tap Resume video to start playback, or Restart camera.';cameraLog('Video play: '+error.name);updateMediaControls();}
  cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
}
async function startCamera(){
  if(state.busy||cameraPending)return;
  if(!window.isSecureContext){toast('Open LeLuma from its HTTPS GitHub Pages address to use the camera.',8000);return;}
  if(!navigator.mediaDevices?.getUserMedia){toast('This browser cannot open the camera. Open LeLuma in Safari, or import a photo.',8000);return;}
  stopCamera();const request=++cameraRequest;state.cameraWanted=true;state.paused=false;state.demo=false;cameraPending=true;sync();cameraLog('Requesting '+state.facing+' camera');
  let canceled=false,timeout,stream=null;
  const timeoutError=new Error('Camera access did not finish. Allow access in Safari, then tap Open camera again.');
  const canceledError=new Error('Camera opening canceled.');canceledError.name='AbortError';
  const deadline=new Promise((_,reject)=>{activeCameraCancel=()=>{canceled=true;reject(canceledError);};timeout=setTimeout(()=>{canceled=true;reject(timeoutError);},30000);});
  // Only media acquisition holds the Open button. Playback has its own recovery.
  deadline.catch(()=>{});
  try{
    async function acquire(constraints){
      const pending=navigator.mediaDevices.getUserMedia({audio:false,video:constraints});
      pending.then(result=>{if(canceled||request!==cameraRequest)result.getTracks().forEach(t=>t.stop());}).catch(()=>{});
      return Promise.race([pending,deadline]);
    }
    try{stream=await acquire({facingMode:{ideal:state.facing},width:{ideal:1920},height:{ideal:1440},frameRate:{ideal:24,max:30}});}
    catch(error){if(!canceled&&['OverconstrainedError','NotReadableError','AbortError'].includes(error.name)){await sleep(250);if(canceled)throw canceledError;stream=await acquire({facingMode:{ideal:state.facing}});}else throw error;}
    if(canceled||request!==cameraRequest){stream.getTracks().forEach(t=>t.stop());return;}
    clearTimeout(timeout);activeCameraCancel=null;cameraPending=false;
    state.stream=stream;const video=$('video');video.muted=true;video.defaultMuted=true;video.playsInline=true;video.autoplay=true;
    video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.srcObject=stream;
    const actual=stream.getVideoTracks()[0].getSettings?.().facingMode;if(actual==='user'||actual==='environment')state.facing=actual;
    if(document.hidden){stopCamera();state.paused=true;sync();return;}
    state.paused=false;state.demo=false;state.review=false;previewError=null;sync();cameraLog('Stream attached');playCamera();requestWake();
    try{const lock=screen.orientation?.lock?.('portrait-primary');lock?.catch(()=>{});}catch{}
    const track=stream.getVideoTracks()[0];
    track.addEventListener('ended',()=>{if(state.stream===stream){cameraLog('Track ended');stopCamera();state.paused=true;sync();}});
    track.addEventListener('mute',()=>{if(state.stream===stream){cameraLog('Track muted');checkCameraFrames();}});
    track.addEventListener('unmute',()=>{if(state.stream===stream){cameraLog('Track unmuted');playCamera();}});
  }catch(error){
    clearTimeout(timeout);if(request!==cameraRequest)return;
    cameraLog('Camera error: '+error.name+' '+error.message);activeCameraCancel=null;state.stream?.getTracks().forEach(t=>t.stop());state.stream=null;$('video').srcObject=null;state.paused=false;state.cameraWanted=false;state.demo=false;
    const messages={NotAllowedError:'Camera access is off. Allow Camera in Safari’s website settings, then try again. You can also import a photo.',NotFoundError:'No camera was found. Import a photo to use all 75 filters.',NotReadableError:'The camera is busy. Close other camera apps and try again.'};
    if(error.name!=='AbortError')toast(messages[error.name]||error.message,8500);
  }finally{clearTimeout(timeout);if(request===cameraRequest){cameraPending=false;activeCameraCancel=null;sync();}}
}
function loadImage(url){return new Promise((resolve,reject)=>{const image=new Image();const timeout=setTimeout(()=>reject(new Error('The image took too long to open. Try a JPEG or PNG copy.')),20000);image.onload=()=>{clearTimeout(timeout);resolve(image);};image.onerror=()=>{clearTimeout(timeout);reject(new Error('This image could not be opened. Try a JPEG or PNG copy from Photos.'));};image.src=url;});}
async function enterReview(source,sourceFile,kind,mirror=false){
  stopCamera();state.cameraWanted=false;state.paused=false;
  const [w,h]=size(source);if(!w||!h)throw new Error('The photo has no readable image dimensions.');
  const reduced=document.createElement('canvas'),scale=Math.min(1,1400/Math.max(w,h));reduced.width=Math.round(w*scale);reduced.height=Math.round(h*scale);
  const context=reduced.getContext('2d',{alpha:false});if(mirror){context.translate(reduced.width,0);context.scale(-1,1);}context.drawImage(source,0,0,reduced.width,reduced.height);
  clearPhoto();state.source=source;state.sourceFile=sourceFile;state.sourceKind=kind;state.previewSource=reduced;state.photoMirror=mirror;state.review=true;state.compare=false;state.demo=false;sync();safeRender();
}
async function importFile(file,kind){
  if(!file)return;
  state.busy=true;sync();let url;
  try{
    url=URL.createObjectURL(file);const image=await loadImage(url);await enterReview(image,file,kind);state.sourceURL=url;url=null;toast('Photo opened at its source size. Make it yours.');
  }catch(error){toast(error.message,8000);}finally{if(url)URL.revokeObjectURL(url);state.busy=false;sync();}
}
function clearExport(){if(state.exportUrl)URL.revokeObjectURL(state.exportUrl);state.exportUrl=null;state.exportFile=null;$('savePreview').removeAttribute('src');}
function clearPhoto(){
  clearExport();if(state.sourceURL)URL.revokeObjectURL(state.sourceURL);state.sourceURL=null;
  for(const src of [state.source,state.previewSource])if(src instanceof HTMLCanvasElement)src.width=src.height=1;
  state.source=null;state.sourceFile=null;state.previewSource=null;
}
function openNative(){
  if(state.busy)return;
  stopCamera();state.cameraWanted=true;state.paused=true;sync();
  $('nativeInput').setAttribute('capture',state.facing);$('nativeInput').value='';$('nativeInput').click();
}
async function captureLive(){
  if(!state.stream||!cameraReady||state.busy||portraitBlocked())return;
  const token=++timerToken;state.busy=true;sync();
  try{
    for(let n=state.timer;n>0;n--){$('countdown').textContent=n;$('countdown').hidden=false;await sleep(1000);if(token!==timerToken||!state.stream)throw new Error('Timer canceled.');}
    $('countdown').hidden=true;
    if(portraitBlocked())throw new Error('Turn your phone upright before taking a photo.');
    checkCameraFrames();const video=$('video'),[w,h]=size(video);if(!cameraReady||!w||!h)throw new Error('The camera is not ready yet. Resume the video before taking a photo.');
    const source=document.createElement('canvas');source.width=w;source.height=h;source.getContext('2d',{alpha:false}).drawImage(video,0,0);
    const mirror=state.facing==='user'&&state.mirror;await enterReview(source,null,'LIVE CAPTURE',mirror);
    $('flash').classList.remove('on');void $('flash').offsetWidth;$('flash').classList.add('on');
    toast(`Captured ${pixels(w,h)} pixels. Your look stays editable.`);
  }catch(error){toast(error.message);}finally{$('countdown').hidden=true;state.busy=false;sync();}
}
async function prepareExport(original=false){
  if(exportBusy||!state.source)return;
  const task=++exportTask;exportBusy=true;state.busy=true;state.compare=false;safeRender();sync();clearExport();
  $('saveHeading').textContent=original?'Keeping your original…':'Preparing your photo…';$('savePreview').hidden=true;$('exportProgress').hidden=false;$('exportProgress').value=0;
  $('shareButton').disabled=true;$('saveOriginalButton').disabled=true;$('downloadLink').hidden=true;$('openImageLink').hidden=true;$('exportDetails').textContent='Rendering every source pixel.';showDialog('saveDialog');
  try{
    const source=state.source,crop=cropRect(...size(source),original?'original':state.framing),w=crop.width,h=crop.height;
    const blob=original?(state.sourceFile||await toBlob(source)):await exportPhoto(source,parameters(state.filter,state.strength,state.adjustments),{type:state.format,mirror:state.photoMirror,framing:state.framing,onProgress:p=>{$('exportProgress').value=p;}});
    if(task!==exportTask)return;
    const stamp=new Date().toISOString().replace(/[:.]/g,'-');
    const extension=blob.type==='image/png'?'png':blob.type==='image/jpeg'?'jpg':blob.type==='image/heic'?'heic':'img';
    const name=original&&state.sourceFile?`Original-${state.sourceFile.name}`:`LeLuma-${original?'Original':state.filter.name.replaceAll(' ','-')}-${stamp}.${extension}`;
    state.exportFile=new File([blob],name,{type:blob.type||'image/png'});state.exportUrl=URL.createObjectURL(blob);
    $('savePreview').src=state.exportUrl;$('savePreview').hidden=false;$('exportProgress').hidden=true;
    $('saveHeading').textContent=original?'Your original.':'A moment, made yours.';
    $('exportDetails').textContent=`${pixels(w,h)} pixels · ${(blob.size/1048576).toFixed(1)} MB\n${original?'Unfiltered, uncropped original':(state.format==='image/png'?'PNG · lossless encoding':'JPEG · maximum quality')+' · '+(state.framing==='original'?'full frame':state.framing+' crop')}`;
    $('shareButton').disabled=false;$('downloadLink').href=state.exportUrl;$('downloadLink').download=name;$('downloadLink').hidden=false;$('openImageLink').href=state.exportUrl;$('openImageLink').hidden=false;
  }catch(error){$('saveHeading').textContent='Your original is safe.';$('exportProgress').hidden=true;$('exportDetails').textContent=error.message||'This iPhone could not export the full-size image. No smaller copy was substituted.';}
  finally{exportBusy=false;state.busy=false;$('saveOriginalButton').disabled=false;sync();}
}
async function sharePhoto(){
  const file=state.exportFile;if(!file)return;
  // Keep this call directly inside the click gesture. Encoding happened earlier.
  if(navigator.canShare?.({files:[file]})&&navigator.share){
    try{await navigator.share({files:[file]});toast('Share sheet closed. Choose Save Image there to keep a copy.');}catch(error){if(error.name!=='AbortError')toast('Sharing was unavailable. Use Open photo and touch and hold to save.',7000);}
  }else{toast('Open the photo below, then touch and hold to save it. You can also download it.',7500);}
}
function setOfflineStatus(){
  $('offlineStatus').innerHTML='<i></i>';
  $('offlineStatus').append(document.createTextNode(offlineReady?(navigator.onLine?'Offline ready':'Offline · ready'):(navigator.onLine?'Offline setup pending':'Offline · not cached')));
}
async function setupOffline(){
  if(!('serviceWorker'in navigator)||!window.isSecureContext){$('offlineStatus').textContent='Open from HTTPS to enable offline';return;}
  try{
    await navigator.serviceWorker.register('./sw.js',{scope:'./'});await navigator.serviceWorker.ready;
    offlineReady=true;setOfflineStatus();
  }catch{$('offlineStatus').textContent='Offline setup failed · reopen online';}
}

$('startButton').onclick=startCamera;$('resumeButton').onclick=startCamera;
$('playCamera').onclick=playCamera;$('restartCamera').onclick=startCamera;
$('previewMode').onclick=()=>{cameraOnly=!cameraOnly;++previewRevision;$('preview').hidden=true;$('previewError').hidden=true;previewError=null;updateMediaControls();if(!cameraOnly)safeRender();};
$('retryPreview').onclick=()=>{cameraOnly=false;renderer?.dispose();renderer=null;renderAgain=false;updateMediaControls();safeRender();};
for(const mode of ['original','portrait','landscape'])$('frame-'+mode).onclick=()=>{state.framing=mode;sync();safeRender();savePrefs();};
$('cancelCameraButton').onclick=$('cancelResumeButton').onclick=()=>{stopCamera();state.cameraWanted=false;state.paused=false;state.demo=false;sync();toast('Camera opening canceled. You can retry or use Full photo.');};
$('demoButton').onclick=()=>{state.demo=true;sync();safeRender();toast('Sample scene. Open the camera with Flip, or import your own photo.');};
$('flipButton').onclick=async()=>{state.facing=state.facing==='user'?'environment':'user';await startCamera();};
$('gridButton').onclick=()=>{const show=$('grid').hidden;$('grid').hidden=!show;$('gridButton').setAttribute('aria-pressed',String(show));};
$('timerButton').onclick=()=>{state.timer=state.timer===0?3:state.timer===3?10:0;sync();};
$('compareButton').onclick=()=>{state.compare=!state.compare;sync();safeRender();};
$('favoriteButton').onclick=()=>{if(state.filter.id==='original')return;if(state.favorites.has(state.filter.id))state.favorites.delete(state.filter.id);else state.favorites.add(state.filter.id);savePrefs();sync();renderFilters();};
$('strength').oninput=()=>{state.strength=+$('strength').value/100;state.compare=false;sync();safeRender();savePrefs();};
$('looksTab').onclick=()=>setTab('looks');$('adjustTab').onclick=()=>setTab('adjust');
for(const id of ['looksTab','adjustTab'])$(id).onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const other=id==='looksTab'?'adjustTab':'looksTab';$(other).click();$(other).focus();}};
$('resetAdjust').onclick=()=>{state.adjustments={};$('adjustments').querySelectorAll('input,output').forEach(e=>e.value=0);safeRender();toast('Adjustments reset. Your selected look is still applied.');};
$('liveMode').onclick=()=>{state.mode='live';sync();if(!state.stream)startCamera();};$('fullMode').onclick=()=>{state.mode='full';sync();};
$('shutterButton').onclick=()=>{if(portraitBlocked())return;if(state.mode==='full')openNative();else captureLive();};
$('importButton').onclick=()=>{if(cameraPending){stopCamera();state.cameraWanted=false;state.paused=false;sync();}$('fileInput').value='';$('fileInput').click();};
$('fileInput').onchange=e=>importFile(e.target.files[0],'IMPORTED PHOTO');$('nativeInput').onchange=e=>importFile(e.target.files[0],'FULL PHOTO');
$('nativeInput').addEventListener('cancel',()=>{state.paused=true;sync();toast('No photo selected. Resume your live camera whenever you’re ready.');});
$('retakeButton').onclick=()=>showDialog('newPhotoDialog');
$('confirmNewPhoto').onclick=()=>{$('newPhotoDialog').close();clearPhoto();state.review=false;state.demo=false;sync();startCamera();};
$('saveButton').onclick=()=>prepareExport();$('shareButton').onclick=sharePhoto;$('saveOriginalButton').onclick=()=>prepareExport(true);
function cameraDetails(){
  const video=$('video'),track=state.stream?.getVideoTracks()[0];
  return ['LeLuma 1.3.0',navigator.userAgent||'Browser unknown',
    'Secure page: '+window.isSecureContext,'App installed: '+!!navigator.standalone,
    'Permission request pending: '+cameraPending,'Stream attached: '+!!state.stream,
    'Track: '+(track?`${track.readyState}; enabled=${track.enabled}; muted=${track.muted}`:'none'),
    `Video: ${video.videoWidth} × ${video.videoHeight}; readyState=${video.readyState}; paused=${video.paused}; time=${video.currentTime}`,
    'Camera frames ready: '+cameraReady,'Display: '+($('preview').hidden?'native video':'filtered canvas'),
    'Selected look: '+state.filter.id,'Preview error: '+(previewError?.message||'none'),
    'Playback notice: '+(mediaIssue||'none'),...cameraEvents].join('\n');
}
function refreshDetails(){$('cameraDetails').value=cameraDetails();}
$('helpButton').onclick=$('qualityButton').onclick=()=>{refreshDetails();showDialog('helpDialog');};
$('refreshDetails').onclick=refreshDetails;
$('copyDetails').onclick=async()=>{refreshDetails();try{await navigator.clipboard.writeText($('cameraDetails').value);toast('Camera details copied.');}catch{$('cameraDetails').focus();$('cameraDetails').select();toast('Select and copy the camera details shown here.');}};
$('formatSelect').value=state.format;$('formatSelect').onchange=()=>{state.format=$('formatSelect').value;savePrefs();};
$('mirrorSetting').checked=state.mirror;$('mirrorSetting').onchange=()=>{state.mirror=$('mirrorSetting').checked;layoutCamera();savePrefs();safeRender();};
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>$(button.dataset.close).close();
$('saveDialog').addEventListener('close',()=>{if(!exportBusy)clearExport();});
$('saveDialog').addEventListener('cancel',e=>{if(exportBusy)e.preventDefault();});
$('closeSave').onclick=()=>{if(exportBusy){toast('Finishing your full-size photo…');return;}$('saveDialog').close();};
$('updateButton').onclick=async()=>{try{const registration=await navigator.serviceWorker.getRegistration();if(!registration)throw new Error();await registration.update();toast('Update check complete. Save your photo before closing and reopening LeLuma.',6000);}catch{toast('Could not check for updates. Try again while online.');}};
$('repairLink').onclick=event=>{if(state.review&&!window.confirm('Save this photo before repairing LeLuma. Leave this unsaved edit?'))event.preventDefault();};
document.addEventListener('visibilitychange',()=>{
  // Permission dialogs can temporarily hide Safari. Do not cancel their pending request.
  if(document.hidden){++timerToken;if(state.stream&&!cameraPending){stopCamera();state.paused=state.cameraWanted&&!state.review;state.busy=false;sync();}}
  else if(state.cameraWanted&&!state.review&&!state.stream&&!cameraPending){state.paused=true;sync();}
});
window.addEventListener('pagehide',()=>{++timerToken;stopCamera();});
window.addEventListener('pageshow',()=>{if(state.cameraWanted&&!state.review&&!state.stream){state.paused=true;state.busy=false;sync();}});
window.addEventListener('online',setOfflineStatus);window.addEventListener('offline',setOfflineStatus);
window.addEventListener('resize',()=>{if(portraitBlocked()){++timerToken;}else if(state.stream){sync();playCamera();}});
window.addEventListener('beforeunload',e=>{if(state.review){e.preventDefault();e.returnValue='';}});
$('video').addEventListener('resize',()=>{if(state.stream)sync();});
$('video').addEventListener('pause',()=>{if(state.stream&&!state.review){cameraLog('Video paused');checkCameraFrames();}});
for(const event of ['loadeddata','playing'])$('video').addEventListener(event,()=>{if(state.stream){cameraLog(event);checkCameraFrames();}});
$('video').addEventListener('error',()=>{if(state.stream){cameraReady=false;$('preview').hidden=true;mediaIssue='Video could not start. Tap Restart camera.';cameraLog('Video element error');updateMediaControls();}});

async function init(){
  renderCategories();renderFilters();renderAdjustments();sync();setupOffline();
  window.lelumaReady=true;$('startupNotice').hidden=true;
  // The native video is visible while the renderer warms up. Only a current,
  // completed filter frame can cover it; camera-only mode is labeled explicitly.
  try{renderer=new CpuRenderer($('preview'));}catch{renderer=null;}
  try{
    demoImage=await loadImage('./demo.png');safeRender();
  }catch{/* A missing sample must never disable camera, import or capture. */}
}
init().catch(error=>{window.lelumaReady=false;$('startupNotice').hidden=false;toast('LeLuma could not finish loading. Use Repair app below, then reopen.',10000);});
