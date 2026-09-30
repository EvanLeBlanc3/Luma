// Portable filter path when WebGL is unavailable. Rows yield to keep taps responsive.
export async function processPixels(data,w,h,p,{origin=[0,0],fullSize=[w,h],radius=Math.max(1,Math.min(...fullSize)/420),definitionRadius=Math.max(2,Math.min(...fullSize)/60)}={}){
  const out=new Uint8ClampedArray(data.length),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const step=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  const luminance=(r,g,b)=>r*.2126+g*.7152+b*.0722,rad=Math.max(1,Math.round(radius)),detailRad=Math.max(2,Math.round(definitionRadius)),gain=2**p.exposure;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const i=(y*w+x)*4;let r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
      const rr=r,gg=g,bb=b;
      if(p.smooth>.001){
        const lum=luminance(r,g,b),cb=.5+(b-lum)*.564,cr=.5+(r-lum)*.713;
        const skin=step(.48,.54,cr)*(1-step(.68,.76,cr))*step(.22,.3,cb)*(1-step(.52,.59,cb))*step(.03,.16,lum)*(1-step(.94,1,lum));
        if(skin>.001){
          let ar=r,ag=g,ab=b,total=1;
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            const j=(clamp(y+dy*rad,0,h-1)*w+clamp(x+dx*rad,0,w-1))*4;
            const qr=data[j]/255,qg=data[j+1]/255,qb=data[j+2]/255;
            const weight=Math.exp(-((qr-r)**2+(qg-g)**2+(qb-b)**2)*55);
            ar+=qr*weight;ag+=qg*weight;ab+=qb*weight;total+=weight;
          }
          const amount=p.smooth*skin;r+=(ar/total-r)*amount;g+=(ag/total-g)*amount;b+=(ab/total-b)*amount;
        }
      }
      if(p.sharp>.001){
        const l=(y*w+Math.max(0,x-1))*4,rt=(y*w+Math.min(w-1,x+1))*4,u=(Math.max(0,y-1)*w+x)*4,d=(Math.min(h-1,y+1)*w+x)*4;
        r+=clamp(rr-(data[l]+data[rt]+data[u]+data[d])/1020,-.12,.12)*p.sharp;
        g+=clamp(gg-(data[l+1]+data[rt+1]+data[u+1]+data[d+1])/1020,-.12,.12)*p.sharp;
        b+=clamp(bb-(data[l+2]+data[rt+2]+data[u+2]+data[d+2])/1020,-.12,.12)*p.sharp;
      }
      if(p.clarity>.001){
        let broad=0;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const j=(clamp(y+dy*detailRad,0,h-1)*w+clamp(x+dx*detailRad,0,w-1))*4;
          broad+=luminance(data[j]/255,data[j+1]/255,data[j+2]/255);
        }
        const detail=clamp(luminance(rr,gg,bb)-broad/9,-.18,.18)*p.clarity*.65;
        r+=detail;g+=detail;b+=detail;
      }
      r*=gain;g*=gain;b*=gain;const lum=clamp(luminance(r,g,b));
      const tone=p.shadows*.22*(1-lum)**2-p.highlights*.18*lum**3;
      r=((r+tone-.5)*p.contrast+.5)*(1+p.warmth*.16+p.tint*.04);
      g=((g+tone-.5)*p.contrast+.5)*(1-Math.abs(p.warmth)*.02-p.tint*.07);
      b=((b+tone-.5)*p.contrast+.5)*(1-p.warmth*.16+p.tint*.04);
      const gray=luminance(r,g,b);r=gray+(r-gray)*p.saturation;g=gray+(g-gray)*p.saturation;b=gray+(b-gray)*p.saturation;
      const sr=r*.393+g*.769+b*.189,sg=r*.349+g*.686+b*.168,sb=r*.272+g*.534+b*.131;
      r+=(sr-r)*p.sepia;g+=(sg-g)*p.sepia;b+=(sb-b)*p.sepia;
      const bw=luminance(r,g,b);r+=(bw-r)*p.mono;g+=(bw-g)*p.mono;b+=(bw-b)*p.mono;
      const fx=(origin[0]+x+.5)/fullSize[0],fy=(origin[1]+y+.5)/fullSize[1];
      const edge=1-step(.26,.72,Math.hypot(fx-.5,fy-.5))*p.vignette*.65;
      const noise=Math.sin((origin[0]+x)*12.9898+(origin[1]+y)*78.233)*43758.5453;
      const grain=((noise-Math.floor(noise))-.5)*p.grain*.11;
      out[i]=clamp((r*(1-p.fade)+p.fade*.58)*edge+grain)*255;
      out[i+1]=clamp((g*(1-p.fade)+p.fade*.58)*edge+grain)*255;
      out[i+2]=clamp((b*(1-p.fade)+p.fade*.58)*edge+grain)*255;out[i+3]=255;
    }
    if(y%24===23)await new Promise(resolve=>setTimeout(resolve,0));
  }
  return out;
}
