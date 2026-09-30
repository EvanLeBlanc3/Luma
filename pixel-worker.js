import {processPixels} from './pixels.js';
self.onmessage=async event=>{
  const {id,data,w,h,params,options}=event.data;
  try{const result=await processPixels(data,w,h,params,options);self.postMessage({id,data:result},[result.buffer]);}
  catch(error){self.postMessage({id,error:error.message});}
};
