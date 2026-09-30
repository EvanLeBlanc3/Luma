// 75 deliberately different looks, plus a neutral Original.
const look = (id, name, group, description, values) => ({id,name,group,description,values});
export const BASE = Object.freeze({exposure:0,contrast:1,saturation:1,warmth:0,tint:0,fade:0,grain:0,vignette:0,smooth:0,sharp:0,clarity:0,shadows:0,highlights:0,mono:0,sepia:0});
export const FILTERS = [
  look('original','Original','Original','Your image, untouched.',{}),
  look('clean','Clean','Everyday','Fresh color and a little definition.',{contrast:1.04,saturation:1.04,sharp:.1}),
  look('crisp','Crisp','Everyday','Clean edges with gentle contrast.',{contrast:1.09,sharp:.28,saturation:1.02}),
  look('daylight','Daylight','Everyday','Bright, balanced daylight.',{exposure:.12,warmth:.05,saturation:1.05,highlights:.1}),
  look('linen','Linen','Everyday','Soft whites and quiet color.',{contrast:.95,saturation:.86,fade:.04,warmth:.08}),
  look('vivid','Vivid','Everyday','Lively color with punch.',{contrast:1.12,saturation:1.24,sharp:.14}),
  look('lift','Lift','Everyday','Open shadows, natural highlights.',{shadows:.28,highlights:.2,exposure:.05}),
  look('balance','Balance','Everyday','A subtle, everyday polish.',{contrast:1.06,saturation:1.07,shadows:.1,highlights:.12}),
  look('clarity','Clarity','Everyday','Defined detail and rich midtones.',{contrast:1.14,sharp:.4,highlights:.1,saturation:.98}),
  look('airy','Airy','Everyday','Light and luminous.',{exposure:.23,contrast:.93,shadows:.17,saturation:.92}),
  look('softlight','Soft Light','Everyday','A gentle glow without heavy color.',{exposure:.09,contrast:.92,fade:.025,highlights:.15}),
  look('petal','Petal','Selfie','Soft texture with a blush of pink.',{smooth:.3,tint:.14,exposure:.07,contrast:.98}),
  look('porcelain','Porcelain','Selfie','Cool, soft, and luminous.',{smooth:.36,warmth:-.09,saturation:.9,exposure:.13}),
  look('honeyglow','Honey Glow','Selfie','Warm skin tones, soft detail.',{smooth:.25,warmth:.26,contrast:1.03,shadows:.09}),
  look('freshface','Fresh Face','Selfie','An understated portrait refresh.',{smooth:.22,exposure:.08,saturation:1.05,sharp:.08}),
  look('rosy','Rosy','Selfie','A warm rose tint.',{smooth:.24,tint:.26,warmth:.09,saturation:1.06}),
  look('softfocus','Soft Focus','Selfie','Gentle skin softening and lifted blacks.',{smooth:.48,contrast:.93,fade:.05,exposure:.07}),
  look('studio','Studio','Selfie','Sculpted light with subtle smoothing.',{smooth:.19,contrast:1.14,sharp:.13,highlights:.15}),
  look('peach','Peach','Selfie','Peachy warmth and delicate color.',{smooth:.3,warmth:.24,tint:.09,saturation:.94,fade:.02}),
  look('pearl','Pearl','Selfie','Soft pearly light.',{smooth:.33,exposure:.17,highlights:.25,saturation:.85,tint:.07}),
  look('trueyou','True You','Selfie','Minimal smoothing, true-to-life color.',{smooth:.14,contrast:1.025,sharp:.06,shadows:.05}),
  look('golden','Golden','Warm','Golden-hour warmth.',{warmth:.42,contrast:1.07,saturation:1.08,highlights:.15}),
  look('amber','Amber','Warm','Deep amber with rich shadows.',{warmth:.5,contrast:1.15,saturation:.96,vignette:.12}),
  look('sunset','Sunset','Warm','Warm highlights with a rosy finish.',{warmth:.4,tint:.2,saturation:1.15,contrast:1.06}),
  look('copper','Copper','Warm','Burnished, earthy midtones.',{warmth:.36,sepia:.18,saturation:.92,contrast:1.2}),
  look('sand','Sand','Warm','Muted, sun-washed neutrals.',{warmth:.24,saturation:.76,fade:.08,contrast:.97}),
  look('candle','Candle','Warm','Intimate warmth and soft edges.',{warmth:.53,tint:.08,exposure:-.08,vignette:.28,highlights:.12}),
  look('apricot','Apricot','Warm','A bright apricot glow.',{warmth:.32,tint:.1,exposure:.16,saturation:1.08}),
  look('terracotta','Terracotta','Warm','Clay reds and earth tones.',{warmth:.38,tint:.12,sepia:.22,contrast:1.13,saturation:.84}),
  look('sundaze','Sundaze','Warm','Hazy afternoon light.',{warmth:.31,fade:.13,contrast:.91,exposure:.1,grain:.04}),
  look('maple','Maple','Warm','Deep autumn warmth.',{warmth:.45,contrast:1.18,saturation:1.12,exposure:-.06,vignette:.15}),
  look('arctic','Arctic','Cool','Bright, clean blue light.',{warmth:-.38,exposure:.1,contrast:1.05,saturation:.91}),
  look('glacier','Glacier','Cool','Crisp icy whites.',{warmth:-.3,tint:-.08,contrast:1.15,sharp:.25}),
  look('bluehour','Blue Hour','Cool','Twilight blues and soft shadows.',{warmth:-.42,tint:.12,exposure:-.12,fade:.04,saturation:.9}),
  look('mint','Mint','Cool','Fresh greens with soft contrast.',{warmth:-.17,tint:-.25,contrast:.96,exposure:.07}),
  look('slate','Slate','Cool','Muted color, clean definition.',{warmth:-.2,saturation:.62,contrast:1.13,sharp:.16}),
  look('moonlight','Moonlight','Cool','Cool, quiet night tones.',{warmth:-.38,tint:.16,exposure:-.2,highlights:.25,vignette:.26}),
  look('coast','Coast','Cool','Breezy blues and lifted shadows.',{warmth:-.22,tint:-.1,saturation:1.16,shadows:.2}),
  look('lavender','Lavender','Cool','A delicate lilac wash.',{warmth:-.22,tint:.34,fade:.04,contrast:.95}),
  look('rain','Rain','Cool','Moody, muted cool tones.',{warmth:-.24,saturation:.74,contrast:1.08,exposure:-.12,grain:.05}),
  look('chrome','Chrome','Cool','Sharp, modern, cool contrast.',{warmth:-.15,contrast:1.25,sharp:.35,saturation:.85}),
  look('retro70','Retro 70','Film','Faded gold with a film-like texture.',{warmth:.28,sepia:.25,fade:.13,grain:.16,saturation:.85}),
  look('vhs','VHS','Film','Nostalgic magenta and muted blacks.',{tint:.24,warmth:-.08,fade:.14,grain:.22,saturation:.78}),
  look('polaroid','Instant','Film','Soft instant-film color.',{warmth:.19,fade:.1,contrast:1.06,grain:.08,saturation:.88}),
  look('cinema','Cinema','Film','Rich, cool shadows and deep contrast.',{warmth:-.18,tint:-.08,contrast:1.22,saturation:.85,fade:.035,vignette:.2}),
  look('faded','Faded','Film','Washed color and lifted blacks.',{fade:.22,saturation:.67,contrast:.92,warmth:.06}),
  look('sepia','Sepia','Film','Classic brown-toned monochrome.',{sepia:1,contrast:1.08,grain:.08,vignette:.16}),
  look('noir','Noir','Film','Deep black-and-white contrast.',{mono:1,contrast:1.3,sharp:.15,vignette:.2}),
  look('silver','Silver','Film','Elegant, soft black and white.',{mono:1,contrast:1.03,fade:.06,highlights:.2,grain:.08}),
  look('newsprint','Newsprint','Film','Gritty monochrome texture.',{mono:1,contrast:1.24,grain:.38,sharp:.2}),
  look('1977','1977','Film','Warm, faded memories.',{warmth:.32,tint:.16,sepia:.16,fade:.17,grain:.14,vignette:.16}),
  look('silk','Silk','Skin','Soft skin texture with natural-looking color.',{smooth:.48,contrast:.97,highlights:.22,exposure:.08}),
  look('satin','Satin','Skin','Smooth texture with polished midtones.',{smooth:.4,contrast:1.065,sharp:.06,warmth:.06}),
  look('radiance','Radiance','Skin','Bright, warm, luminous skin tones.',{smooth:.32,exposure:.22,warmth:.18,shadows:.14,highlights:.18}),
  look('velvet','Velvet','Skin','Soft matte skin with richer shadows.',{smooth:.52,contrast:1.09,fade:.035,saturation:.9}),
  look('warmbalance','Warm Balance','Skin','Even-looking warmth with gentle texture.',{smooth:.37,warmth:.22,tint:.045,highlights:.27,saturation:.97}),
  look('softbronze','Soft Bronze','Skin','A sunlit bronze finish.',{smooth:.26,warmth:.38,sepia:.08,contrast:1.08,saturation:1.08}),
  look('freshlight','Fresh Light','Skin','Lifted shadows and a fresh, soft finish.',{smooth:.31,shadows:.28,exposure:.12,tint:.025,sharp:.05}),
  look('calm','Calm','Skin','Muted redness and a soft neutral finish.',{smooth:.43,saturation:.82,tint:-.1,contrast:.96,highlights:.2}),
  look('dewdrop','Dewdrop','Skin','Luminous highlights and delicate warmth.',{smooth:.28,exposure:.19,warmth:.1,tint:.11,saturation:1.03,fade:.02}),
  look('naturalskin','Natural Skin','Skin','Subtle softening that keeps more texture.',{smooth:.2,contrast:1.04,sharp:.09,shadows:.08,highlights:.16}),
  look('sculpt','Sculpt','Definition','Local contrast brings out contours and muscle detail.',{clarity:.55,contrast:1.15,sharp:.21,highlights:.12,saturation:.95}),
  look('athlete','Athlete','Definition','Crisp athletic portraits with natural warmth.',{clarity:.48,contrast:1.18,sharp:.29,warmth:.12,saturation:1.03}),
  look('chisel','Chisel','Definition','Stronger local detail and deep tonal contrast.',{clarity:.8,contrast:1.24,sharp:.32,exposure:-.06,saturation:.88}),
  look('form','Form','Definition','Balanced contour detail with open shadows.',{clarity:.38,contrast:1.1,shadows:.16,highlights:.19,sharp:.16}),
  look('power','Power','Definition','Bold gym-style contrast and definition.',{clarity:.7,contrast:1.3,sharp:.24,saturation:.91,vignette:.16}),
  look('bronzeedge','Bronze Edge','Definition','Warm skin tones with pronounced contours.',{clarity:.5,warmth:.34,contrast:1.17,sharp:.18,sepia:.06}),
  look('feature','Feature','Definition','Gentle skin softening with defined facial detail.',{smooth:.22,clarity:.3,sharp:.24,contrast:1.085,highlights:.15}),
  look('precision','Precision','Definition','Clean, cool detail for eyes, hair and texture.',{clarity:.44,sharp:.5,contrast:1.12,warmth:-.075,saturation:1.02}),
  look('contour','Contour','Definition','Deeper midtone separation and soft highlights.',{clarity:.62,contrast:1.14,highlights:.31,smooth:.1,exposure:-.04}),
  look('steel','Steel','Definition','Graphic black-and-white muscle and texture detail.',{mono:1,clarity:.66,contrast:1.2,sharp:.31,grain:.035}),
  look('cover','Cover','Editorial','Polished portrait contrast and softly refined texture.',{smooth:.25,clarity:.2,contrast:1.13,exposure:.08,saturation:.96,tint:.055}),
  look('runway','Runway','Editorial','Cool fashion color with crisp definition.',{clarity:.24,sharp:.22,warmth:-.21,tint:.12,contrast:1.19,saturation:.81}),
  look('spotlight','Spotlight','Editorial','Brighter subjects, rich edges and controlled highlights.',{exposure:.2,contrast:1.15,highlights:.3,vignette:.36,smooth:.18}),
  look('espresso','Espresso','Editorial','Rich coffee-brown color and a soft film finish.',{warmth:.27,sepia:.34,contrast:1.17,fade:.065,grain:.055,exposure:-.07}),
  look('afterglow','Afterglow','Editorial','A peach-pink finish with soft contrast.',{warmth:.29,tint:.27,fade:.075,exposure:.1,saturation:1.11,smooth:.12})
];
export const ADJUSTMENTS = [
  {key:'smooth',name:'Skin smoothing',min:0,max:100,step:1,initial:0,help:'Adds edge-preserving softening to skin-like colors; not face detection.'},
  {key:'contrast',name:'Contrast',min:-40,max:40,step:1,initial:0},
  {key:'sharp',name:'Sharpen',min:0,max:100,step:1,initial:0},
  {key:'clarity',name:'Definition',min:0,max:100,step:1,initial:0,help:'Local contrast for features, contours and muscle detail.'},
  {key:'warmth',name:'Warmth',min:-100,max:100,step:1,initial:0},
  {key:'exposure',name:'Exposure',min:-100,max:100,step:1,initial:0},
  {key:'saturation',name:'Color',min:-100,max:100,step:1,initial:0},
  {key:'tint',name:'Tint',min:-100,max:100,step:1,initial:0},
  {key:'shadows',name:'Lift shadows',min:0,max:100,step:1,initial:0},
  {key:'highlights',name:'Soften highlights',min:0,max:100,step:1,initial:0},
  {key:'grain',name:'Grain',min:0,max:100,step:1,initial:0},
  {key:'vignette',name:'Vignette',min:0,max:100,step:1,initial:0}
];
export function parameters(filter, strength, adjustments={}) {
  const p={...BASE};
  for(const [key,value] of Object.entries(filter.values)) p[key]=BASE[key]+(value-BASE[key])*strength;
  for(const [key,value] of Object.entries(adjustments)) {
    if(!(key in p)) continue;
    p[key]+=value/(key==='contrast'?100:key==='exposure'?100:100);
  }
  p.smooth=Math.min(.85,Math.max(0,p.smooth));
  p.sharp=Math.min(1.2,Math.max(0,p.sharp));
  p.clarity=Math.min(1.25,Math.max(0,p.clarity));
  p.saturation=Math.max(0,p.saturation);
  return p;
}
