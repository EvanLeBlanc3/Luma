'use strict';
document.getElementById('repair').onclick=async()=>{
  const button=document.getElementById('repair'),status=document.getElementById('status'),scope=new URL('./',location.href).href;
  if(!navigator.onLine){status.textContent='Connect to the internet before refreshing LeLuma.';return;}
  button.disabled=true;status.textContent='Refreshing app files…';
  try{
    if('serviceWorker'in navigator){for(const registration of await navigator.serviceWorker.getRegistrations()){if(registration.scope===scope)await registration.unregister();}}
    if('caches'in window){for(const name of await caches.keys()){if((name.startsWith('leluma-'+scope+'-')||name.startsWith('luma-'+scope+'-')||name.startsWith('evcam-'+scope+'-')))await caches.delete(name);}}
    status.textContent='Ready. Opening the updated app…';location.replace(scope+'?updated=1.3.0');
  }catch(error){status.textContent='Could not finish refreshing. Close all LeLuma windows, then reopen the published address in Safari.';button.disabled=false;}
};
