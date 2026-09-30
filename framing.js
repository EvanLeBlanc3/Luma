// Exact integer 3:4 / 4:3 crops, using source pixels without upscaling.
export function cropRect(width,height,framing='original'){
  if(framing==='original')return {x:0,y:0,width,height};
  const [a,b]=framing==='landscape'?[4,3]:[3,4];
  const unit=Math.floor(Math.min(width/a,height/b));
  if(unit<1)return {x:0,y:0,width,height};
  const w=unit*a,h=unit*b;
  return {x:Math.floor((width-w)/2),y:Math.floor((height-h)/2),width:w,height:h};
}
