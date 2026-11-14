// Native browser APIs only. No service, video, fabricated progress, or autoplay bypass.
window.StreamflowStartup=async function({loaderUrl,config}){
 const canvas=document.getElementById('unity-canvas'),container=document.getElementById('unity-fullscreen-container');
 const splash=document.getElementById('splash'),art=document.getElementById('splash-image'),bar=document.getElementById('loading-progress'),fill=document.getElementById('loading-fill');
 const gate=document.getElementById('audio-gate'),begin=document.getElementById('begin-intro'),controls=document.getElementById('expedition-controls'),enter=document.getElementById('begin-expedition');
 const checkpoint=document.getElementById('expedition-checkpoint'),continueSaved=document.getElementById('checkpoint-continue'),startNew=document.getElementById('checkpoint-new');
 const mission=document.getElementById('expedition-mission'),proceed=document.getElementById('mission-continue');
 const telemetry=window.streamflowStartup={minimumVisibleMs:2000,visibleMs:0,progress:[],released:false,contexts:[]};
 let instance,ready=false,painted=false,previous=performance.now(),released=false,started=false;
 const contexts=[];
 function audioState(){
   const blocked=!contexts.length||contexts.some(c=>c.state!=='running');
   telemetry.contexts=contexts.map(c=>c.state);
   if(instance&&released){
     instance.SendMessage('Expedition','BrowserAudioState',blocked?'blocked':'running');
     const showGate=blocked&&controls.hidden&&mission.hidden&&!telemetry.expeditionBegun;
     if(showGate&&gate.hidden){gate.hidden=false;begin.focus();console.log('INTRO_AUDIO_WAIT');}
     if(!blocked){gate.hidden=true;if(!started){started=true;instance.SendMessage('Expedition','BrowserReady','');console.log('INTRO_AUDIO_READY');}}
   }
 }
 const Native=window.AudioContext||window.webkitAudioContext;
 if(Native){class ObservedAudioContext extends Native{constructor(...args){super(...args);contexts.push(this);this.addEventListener('statechange',audioState);audioState();}}window.AudioContext=ObservedAudioContext;if(window.webkitAudioContext)window.webkitAudioContext=ObservedAudioContext;}
 const unlock=()=>{for(const c of contexts)if(c.state!=='running')c.resume().then(audioState).catch(()=>{});audioState();};
 document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);begin.addEventListener('click',unlock);
 telemetry.showCheckpoint=(stale=false)=>{continueSaved.hidden=stale;document.getElementById('checkpoint-message').textContent=stale?'The science lesson has been updated. Start a new expedition to use the corrected measurements. Your old save stays until you choose.':'You have an unfinished expedition.';telemetry.checkpointActive=true;telemetry.expeditionBegun=false;gate.hidden=true;checkpoint.hidden=false;(stale?startNew:continueSaved).focus();console.log('CHECKPOINT_CHOICE_VISIBLE');};
 telemetry.hideCheckpoint=()=>{telemetry.checkpointActive=false;checkpoint.hidden=true;canvas.focus();};
 continueSaved.addEventListener('click',()=>{unlock();telemetry.expeditionBegun=true;instance.SendMessage('Expedition','ContinueCheckpoint','');});
 startNew.addEventListener('click',()=>{unlock();telemetry.expeditionBegun=false;instance.SendMessage('Expedition','StartNewExpedition','');});
 telemetry.showMission=()=>{window.getSelection()?.removeAllRanges();telemetry.expeditionBegun=false;gate.hidden=true;mission.hidden=false;proceed.focus();console.log('MISSION_VISIBLE');};
 telemetry.hideMission=()=>{mission.hidden=true;console.log('MISSION_HIDDEN');};
 proceed.addEventListener('click',()=>{unlock();instance.SendMessage('Expedition','ContinueFromMission','');});
 telemetry.showControls=()=>{window.getSelection()?.removeAllRanges();telemetry.expeditionBegun=false;gate.hidden=true;controls.hidden=false;enter.focus();console.log('CONTROLS_VISIBLE');};
 telemetry.hideControls=()=>{telemetry.expeditionBegun=true;controls.hidden=true;canvas.focus();console.log('CONTROLS_HIDDEN');};
 enter.addEventListener('click',()=>{unlock();instance.SendMessage('Expedition','BeginFromControls','');});
 // Unity captures keyboard defaults globally; keep focused HTML buttons accessible.
 document.addEventListener('keydown',event=>{
   const button=document.activeElement;
   if((button===begin||button===enter||button===proceed||button===continueSaved||button===startNew)&&(event.key==='Enter'||event.key===' ')){
     event.preventDefault();event.stopImmediatePropagation();button.click();
   }
 },true);
 function fit(){if(document.fullscreenElement)return;const scale=Math.min(1,innerWidth/1366,Math.max(1,innerHeight-36)/768);document.getElementById('unity-container').style.width=(1366*scale)+'px';}
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
 script.onload=()=>createUnityInstance(canvas,config,progress=>{
   const value=Math.max(0,Math.min(1,progress));fill.style.width=(100*value)+'%';bar.setAttribute('aria-valuenow',String(Math.round(100*value)));telemetry.progress.push(value);
 }).then(game=>{instance=game;ready=true;telemetry.readyAt=performance.now();document.getElementById('fullscreen').onclick=()=>game.SetFullscreen(1);}).catch(error);
 document.body.appendChild(script);
};
