// Native browser APIs only. No service, video, fabricated progress, or autoplay bypass.
window.StreamflowStartup=async function({loaderUrl,config}){
 const canvas=document.getElementById('unity-canvas'),container=document.getElementById('unity-fullscreen-container');
 const splash=document.getElementById('splash'),art=document.getElementById('splash-image'),bar=document.getElementById('loading-progress'),fill=document.getElementById('loading-fill');
 const gate=document.getElementById('audio-gate'),begin=document.getElementById('begin-intro'),controls=document.getElementById('expedition-controls'),enter=document.getElementById('begin-expedition');
 const mission=document.getElementById('expedition-mission'),proceed=document.getElementById('mission-continue');
 const telemetry=window.streamflowStartup={minimumVisibleMs:2000,visibleMs:0,progress:[],released:false,contexts:[]};
 let instance,ready=false,painted=false,previous=performance.now(),released=false,started=false,gestureAccepted=false;
 const contexts=[];
 function audioState(){
   const blocked=!gestureAccepted||document.hidden||innerHeight>innerWidth||!contexts.length||contexts.some(c=>c.state!=='running');
   telemetry.contexts=contexts.map(c=>c.state);
   if(instance&&released){
     instance.SendMessage('Expedition','BrowserAudioState',blocked?'blocked':'running');
     instance.SendMessage('Expedition','MobileCommand',JSON.stringify({action:'suspend',value:blocked?'1':'0'}));
     const showGate=blocked;begin.textContent=gestureAccepted?'Tap to resume expedition audio':'BEGIN ADVENTURE';
     if(showGate&&gate.hidden){gate.hidden=false;begin.focus();console.log('INTRO_AUDIO_WAIT');}
     if(!blocked){gate.hidden=true;if(!started){started=true;instance.SendMessage('Expedition','BrowserReady','');console.log('INTRO_AUDIO_READY');}}
   }
 }
 const Native=window.AudioContext||window.webkitAudioContext;
 if(Native){class ObservedAudioContext extends Native{constructor(...args){super(...args);contexts.push(this);this.addEventListener('statechange',audioState);audioState();}}window.AudioContext=ObservedAudioContext;if(window.webkitAudioContext)window.webkitAudioContext=ObservedAudioContext;}
 const unlock=()=>{for(const c of contexts)if(c.state!=='running')c.resume().then(audioState).catch(()=>{});audioState();};
 begin.addEventListener('click',()=>{gestureAccepted=true;unlock();});
 document.addEventListener('visibilitychange',audioState);addEventListener('resize',audioState);
 telemetry.showMission=()=>{window.getSelection()?.removeAllRanges();telemetry.expeditionBegun=false;gate.hidden=true;mission.hidden=false;proceed.focus();console.log('MISSION_VISIBLE');audioState();};
 telemetry.hideMission=()=>{mission.hidden=true;console.log('MISSION_HIDDEN');};
 proceed.addEventListener('click',()=>{unlock();instance.SendMessage('Expedition','ContinueFromMission','');});
 telemetry.showControls=()=>{window.getSelection()?.removeAllRanges();telemetry.expeditionBegun=false;gate.hidden=true;controls.hidden=false;enter.focus();console.log('CONTROLS_VISIBLE');audioState();};
 telemetry.hideControls=()=>{telemetry.expeditionBegun=true;controls.hidden=true;canvas.focus();console.log('CONTROLS_HIDDEN');};
 enter.addEventListener('click',()=>{unlock();instance.SendMessage('Expedition','BeginFromControls','');});
 // Unity captures keyboard defaults globally; keep focused HTML buttons accessible.
 document.addEventListener('keydown',event=>{
   const button=document.activeElement;
   if((button===begin||button===enter||button===proceed)&&(event.key==='Enter'||event.key===' ')){
     event.preventDefault();event.stopImmediatePropagation();button.click();
   }
 },true);
 function fit(){document.getElementById('unity-container').style.width='100vw';}
 addEventListener('resize',fit);document.addEventListener('fullscreenchange',fit);fit();
 const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 art.decode().then(async()=>{await frame();await frame();painted=true;previous=performance.now();telemetry.paintedAt=previous;console.log('SPLASH_PAINTED');}).catch(()=>{document.getElementById('startup-error').hidden=false;document.getElementById('startup-error').textContent='Splash image unavailable. Preparing expedition...';painted=true;telemetry.paintedAt=performance.now();});
 async function release(){
   released=true;telemetry.released=true;telemetry.releasedAt=performance.now();
   splash.style.opacity='0';await new Promise(resolve=>setTimeout(resolve,220));splash.hidden=true;
   unlock();audioState();
   console.log('STARTUP_RELEASE visibleMs='+telemetry.visibleMs.toFixed(1));
 }
 function tick(now){
   if(painted&&document.visibilityState==='visible')telemetry.visibleMs+=Math.min(100,Math.max(0,now-previous));
   previous=now;if(ready&&painted&&telemetry.visibleMs>=telemetry.minimumVisibleMs&&!released){release();return;}requestAnimationFrame(tick);
 }requestAnimationFrame(tick);
 const error=message=>{const el=document.getElementById('startup-error');el.hidden=false;el.textContent=String(message);console.error(message);};
 config.showBanner=(message,type)=>{if(type==='error')error(message);else console.warn(message);};
 const script=document.createElement('script');script.src=loaderUrl;
 script.onerror=()=>error('The local game loader could not be loaded. Reload after checking the preview server.');
 config.devicePixelRatio=Math.min(devicePixelRatio||1,1.5,1280/innerWidth);
 script.onload=()=>createUnityInstance(canvas,config,progress=>{
   const value=Math.max(0,Math.min(1,progress));fill.style.width=(100*value)+'%';bar.setAttribute('aria-valuenow',String(Math.round(100*value)));telemetry.progress.push(value);
 }).then(game=>{instance=game;window.StreamflowMobile.ready(game);ready=true;telemetry.readyAt=performance.now();document.getElementById('fullscreen').onclick=()=>game.SetFullscreen(1);}).catch(error);
 document.body.appendChild(script);
};
