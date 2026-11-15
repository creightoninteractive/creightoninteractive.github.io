// Local, same-origin bridge. Neither rounded answers nor iframe data replace Unity measurements.
(()=>{'use strict';
 let game,frame,payload,lastState,storageKey;
 const origin=location.origin;
 const send=(method,value='')=>game.SendMessage('Expedition',method,value);
 function save(state){
  if(!payload||!state||state.version!==1)return;
  lastState=state;
  try{localStorage.setItem(storageKey,JSON.stringify({id:payload.id,data:payload.data,state}));}catch(e){console.warn('LAB_LOCAL_SAVE_UNAVAILABLE',e.name);}
  send('LaboratorySave',JSON.stringify(state));
 }
 window.StreamflowLaboratory={
  ready(instance){game=instance;},
  open(p){
   if(frame)return;payload=p;storageKey='streamflow.lab.'+location.pathname;
   let state;try{state=p.state?JSON.parse(p.state):null;const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved?.id===p.id&&JSON.stringify(saved.data)===JSON.stringify(p.data)&&(!state||saved.state.revision>=state.revision))state=saved.state;}catch{}
   lastState=state;document.exitPointerLock?.();
   frame=document.createElement('iframe');frame.id='laboratory-finale';frame.title="Valerie's stream discharge laboratory";frame.allow='autoplay';
   frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#091b22';
   frame.src='finale/index.html?integrated=1';document.getElementById('unity-fullscreen-container').append(frame);
   document.documentElement.classList.add('laboratory-active');console.log('LAB_HOST_OPEN');
  },
  close(){try{localStorage.removeItem(storageKey);}catch{}frame?.remove();frame=null;payload=null;lastState=null;document.documentElement.classList.remove('laboratory-active');document.getElementById('unity-canvas').focus();console.log('LAB_HOST_COMPLETE');}
 };
 addEventListener('message',e=>{
  if(!frame||e.origin!==origin||e.source!==frame.contentWindow)return;
  if(e.data?.type==='lab-ready')frame.contentWindow.postMessage({type:'lab-init',payload:{...payload,state:lastState}},origin);
  if(e.data?.type==='lab-save')save(e.data.state);
  if(e.data?.type==='lab-complete'&&lastState?.complete===true){save(lastState);send('LaboratoryComplete');}
 });
 const css=document.createElement('style');css.textContent='.laboratory-active #mobile-ui,.laboratory-active #rotate-phone{display:none!important}.laboratory-active body{overflow:hidden}';document.head.append(css);
})();
