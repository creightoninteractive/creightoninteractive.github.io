/* Touch presentation; Unity owns all mission decisions, arithmetic, and validation. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let game,S,screen='',key=null,moveId=null,lookId=null,origin,last,drag,tapTarget,activeSlider=null;
 const command=(action,extra={})=>game?.SendMessage('Expedition','MobileCommand',JSON.stringify({action,...extra}));
 const root=document.createElement('div');root.id='mobile-ui';root.hidden=true;root.innerHTML=`<div id="touch-surface"></div><div id="hud"><span id="goal"></span><span id="clock"></span></div><div id="nearby"></div><div id="joystick-rest"></div><div id="joystick" hidden><div id="stick"></div></div><button id="marker" aria-label="Interact with target" hidden>↓<span></span></button><button id="tape-marker" hidden>Tape notes</button><div id="caption"></div><section id="mobile-panel" hidden><header id="panel-head"><h2 id="panel-title"></h2><button id="lookup">LOOK UP!<small>Return to the stream</small></button></header><div id="panel-body"></div><div id="caption-panel"></div></section><section id="keypad" class="keypad" aria-label="Measurement keypad" hidden></section>`;
 $('unity-fullscreen-container').append(root);
 const intro=document.createElement('section');intro.className='mobile-intro';intro.hidden=true;intro.innerHTML='<img id="intro-image" alt="Expedition cinematic panel"><button id="skip-intro">Skip Intro</button><div id="intro-caption" class="intro-caption"></div>';$('unity-fullscreen-container').append(intro);
 const rotate=document.createElement('div');rotate.id='rotate-phone';rotate.textContent='Turn your phone sideways to explore the stream.';document.body.append(rotate);
 const set=(id,text)=>{const e=$(id);if(e&&e.textContent!==String(text??''))e.textContent=text??'';};
 const button=(a,text)=>`<button data-action="${a}">${text}</button>`;
 const number=(field,label,value,status='')=>`<div class="field-row"><label>${label}</label><button class="number ${status.toLowerCase()}" data-field="${field}" data-label="${esc(label)}" ${status==='Correct'?'disabled':''}>${esc(value)||'Tap to enter'}</button></div>`;
 const titles={tape:'Tape readings',plan:'Three-station field notebook',probe:'FlowTracker2 · Discharge measurement',log:'Station observations',reference:'Scientific coaching',complete:'MISSION ACCOMPLISHED',failed:'Expedition checkpoint'};
 function reset(){moveId=lookId=null;activeSlider=null;$('joystick').hidden=true;command('reset');}
 function endKey(){if(key){key=null;$('keypad').hidden=true;command('edit-focus',{value:'0'});}}
 function lookup(){endKey();reset();command('lookup');}
 $('lookup').onclick=lookup;$('skip-intro').onclick=()=>command('skip');
 function render(){
  const s=S,b=$('panel-body');
  if(screen==='tape')b.innerHTML=`<div class="wet-layout"><img class="station-plan wet-width" src="wet-width.png?science=2" alt="Wet width equals far wet edge 15.72 metres minus near wet edge 3.72 metres; tape zero is on dry bank."><div class="card">${number('tape','Wet width (m)',s.draft)}<div class="feedback" id="feedback"></div><div class="actions">${button('example','Show calculation')}${button('width-save','Save wet width')}</div>${s.planComplete?button('plan','Review station plan'):''}</div></div>`;
  if(screen==='plan')b.innerHTML=`<img class="station-plan" src="station-plan.png?science=2" alt="Equally space three probe locations across the wet width between wet edges 3.72 and 15.72 metres. Calculate each tape position."><div class="plan-fields">${s.entries.map((v,i)=>`<div>${number('station'+i,'Station '+(i+1)+' (m)',v,s.status[i])}<small id="status${i}"></small></div>`).join('')}</div><div class="feedback" id="feedback"></div><div class="actions">${button('plan-save',s.planComplete?'Return to fieldwork':'Check and save plan')}</div>`;
  if(screen==='probe')b.innerHTML=`<div class="cols"><div class="card"><h3>Probe orientation</h3><div class="probe-angle"><div class="tape"></div><label>Measuring tape</label><div class="target"></div><div class="actual" id="probe-arrow"></div></div><p id="angle-reading"></p><p class="fine" id="angle-guidance"></p><label>Rotate probe<input id="angle" class="range" type="range" min="-180" max="180" step="1" aria-label="Rotate probe"></label><div class="actions">${button('turn-left','↶ Turn left 5°')}${button('turn-right','Turn right 5° ↷')}</div><p class="fine">Dashed arrow: correct target. White arrow: your probe. Keep X at 90° to the tape; reversed does not count.</p></div><div class="card"><h3 id="probe-station"></h3><div class="actions">${button('depth','Measure water depth')}</div><div id="depth-reading" class="metric"></div><label id="height-reading"></label><input id="height" class="range" type="range" min="0" step="0.01" aria-label="Sample height above streambed"><div class="actions">${button('height-down','Lower 0.01 m')}${button('height-up','Raise 0.01 m')}</div><p class="fine">Target: 60% of measured depth below the surface.</p><div class="actions">${button('sample','Start velocity measurement')}</div><p id="mean-reading" class="metric"></p><p id="quality" class="fine"></p><div class="actions">${button('log','Open observation log')}</div></div></div>`;
  if(screen==='log')b.innerHTML=`<div class="cols"><div class="card"><h3>Station ${s.station} · Tape ${s.location} m</h3>${number('width','Wet width (m)',s.width)}${number('depth','Water depth (m)',s.depth)}${number('speed','Mean Vx (m/s)',s.speed)}<label>Field notes (optional)<textarea id="field-notes" rows="2" style="display:block;width:100%;font-size:16px">${esc(s.notes)}</textarea></label><div class="actions">${button('rod','Return to rod')}${button('record','Record observation')}</div></div><div class="card"><h3>Measurement checks</h3><div class="feedback" id="feedback"></div><div id="review"></div><div class="actions">${button('tape','Review tape readings')}</div></div></div>`;
  if(screen==='reference')b.innerHTML=`<div class="card"><p>${esc(s.reference)}</p>${s.reference.startsWith('Place')?'<svg viewBox="0 0 620 155" role="img" aria-label="Sampling volume at 60 percent of depth below surface and 40 percent above bed" style="max-height:150px;width:100%"><path d="M20 15H600" stroke="#78d7ed" stroke-width="4"/><path d="M20 140H600" stroke="#ddc08a" stroke-width="5"/><path d="M200 15V140" stroke="#eef0d4" stroke-width="6"/><circle cx="200" cy="90" r="7" fill="#77ecdb"/><g fill="white" font-size="17"><text x="240" y="45">0.6 × depth below surface</text><text x="240" y="118">0.4 × depth above bed</text></g></svg>':s.reference.startsWith('Probe')?'<svg viewBox="0 0 620 170" role="img" aria-label="Tape horizontal, directed X-axis down perpendicular to tape; Y points right toward the remote sampling volume" style="max-height:170px;width:100%"><path d="M20 20H600" stroke="#f5d363" stroke-width="5"/><text x="25" y="45" fill="#f5d363" font-size="16">Measuring tape</text><path d="M220 65V150m-6-10 6 10 6-10M220 65H330m-10-6 10 6-10 6" fill="none" stroke="white" stroke-width="3"/><text x="197" y="140" fill="white" font-size="18">X</text><text x="300" y="56" fill="white" font-size="18">Y</text><circle cx="355" cy="65" r="7" fill="#77ecdb"/><text x="375" y="70" fill="white" font-size="15">Remote sample · 10 cm</text><text x="375" y="95" fill="white" font-size="15">6 mm × 9 mm</text><path d="M530 115v40m-6-10 6 10 6-10" fill="none" stroke="#78d7ed" stroke-width="3"/><text x="440" y="137" fill="#78d7ed" font-size="15">Flow</text></svg>':''}<div class="actions">${button('reference-close','Return to measurement')}</div></div>`;
  if(screen==='complete')b.innerHTML=`<h2>STREAM DISCHARGE CALCULATED</h2><div class="result-value">${s.discharge} m³/s</div><p>Approximately ${s.discharge} cubic metres of water flow past this cross-section every second.</p>${s.rows.map(r=>`<p>${esc(r)}</p>`).join('')}<p class="fine">Simplified training survey: three interior measurements; wet edges have zero depth and velocity.</p><div class="actions">${button('replay-intro','Play again with story')}${button('replay-skip','Play again — skip story')}${button('credits','Asset credits')}</div>`;
  if(screen==='failed')b.innerHTML=`<h2>${esc(s.directive)}</h2><p>Return to your last saved checkpoint.</p><div class="actions">${button('retry','Return to checkpoint')}</div>`;
  b.scrollTop=0;
  if(screen==='tape'||screen==='plan'){const first=b.querySelector('[data-field]:not(:disabled)');first?.classList.add('suggested-focus');first?.focus({preventScroll:true});}

 }
 function bindValues(){
  const s=S;
  for(const e of root.querySelectorAll('[data-field]')){const f=e.dataset.field,v=f==='tape'?s.draft:f.startsWith('station')?s.entries[Number(f.slice(7))]:s[f];e.textContent=v||'Tap to enter';if(f.startsWith('station')){const i=Number(f.slice(7));e.disabled=s.status[i]==='Correct';e.className='number '+s.status[i].toLowerCase()+(document.activeElement===e?' suggested-focus':'');set('status'+i,s.status[i]);}}
  set('feedback',screen==='tape'?(s.showCalculation?`${s.far} − ${s.near} = ${(Number(s.far)-Number(s.near)).toFixed(2)} m. Enter this wet width.`:s.feedback):screen==='plan'?s.math||s.feedback:s.feedback);
  if(screen==='plan')root.querySelector('[data-action="plan-save"]').textContent=s.planComplete?'Return to fieldwork':'Check and save plan';
  if(screen==='probe'){
   set('probe-station',`Station ${s.station} · Tape ${s.location} m`);set('angle-reading',`Your probe: ${Math.round(s.bearing)}° · Target: 90°`);set('angle-guidance',s.error<=5?'Aligned — hold steady.':`${Math.round(s.error)}° from target. Turn ${s.angle>0?'left':'right'} toward the dashed arrow.`);
   $('probe-arrow').style.transform=`rotate(${180-s.bearing}deg)`;
   if(activeSlider!=='angle')$('angle').value=s.angle;
   if(activeSlider!=='height')$('height').value=s.height;$('height').max=s.maxHeight;
   set('height-reading',`Sample height above bed: ${s.height.toFixed(2)} m`);set('depth-reading',`Depth: ${s.depthReading} m`);
   const sample=root.querySelector('[data-action="sample"]');sample.disabled=!s.canSample;sample.textContent=s.sampling?`Stop measurement · ${s.elapsed.toFixed(0)} s`:s.hasSample?'Measure velocity again':'Start velocity measurement';
   root.querySelector('[data-action="depth"]').disabled=s.sampling;set('mean-reading',s.hasSample?`Mean Vx: ${s.mean} m/s`:s.sampling?'Measuring — hold steady':s.measured?'Set the sampling height':'First align the probe and read depth');set('quality',`${s.quality} · Flow angle ${s.flowAngle.toFixed(0)}°`);
  }
  if(screen==='log')$('review').innerHTML=s.review.map(r=>`<p class="fine">${esc(r)}</p>`).join('');
 }
 function state(s){
  S=s;window.streamflowMobileState=s;
  intro.hidden=s.screen!=='intro';if(!intro.hidden){const src=`panel-${s.panel+1}.png`;if($('intro-image').getAttribute('src')!==src)$('intro-image').src=src;set('intro-caption',s.caption);}
  root.hidden=['waiting','checkpoint','intro','mission','controls'].includes(s.screen);
  if(screen!==s.screen){endKey();reset();screen=s.screen;render();}
  const enlarged=!root.hidden&&screen!=='field';$('mobile-panel').hidden=!enlarged;$('lookup').hidden=['complete','failed'].includes(screen);set('panel-title',titles[screen]);
  $('touch-surface').hidden=enlarged||!s.walking;$('hud').hidden=enlarged;$('joystick-rest').hidden=enlarged||!s.walking;
  $('caption').hidden=enlarged;set('caption',s.caption);set('caption-panel',s.caption);set('goal',s.step==='Arrival'?s.goal.replace('CO₂','Illustrative CO₂'):s.goal);set('clock',s.clock);
  $('nearby').hidden=screen!=='field';set('nearby',s.danger?`${s.distance.toFixed(1)} m to cover`:s.step==='Arrival'?'Navigation: ~68 million years ago · Explore the footprint':s.step==='FarBank'||s.step==='Station'?`Near ${s.near} m · Far ${s.far} m`:`${s.distance.toFixed(1)} m to target`);
  const marker=$('marker');marker.hidden=!s.marker||root.hidden;marker.classList.toggle('ready',s.interact);marker.firstChild.textContent=s.worldArrow&&s.mx>.06&&s.mx<.94&&s.my>.20&&s.my<.73?'':'↓';marker.style.left=`${Math.max(.06,Math.min(.94,s.mx))*100}%`;marker.style.top=`${Math.max(.20,Math.min(.73,s.my))*100}%`;marker.querySelector('span').textContent=s.danger?'COVER':s.interact?'Tap to interact':s.distance.toFixed(1)+' m';
  const tape=$('tape-marker');tape.hidden=!s.tapeMarker;tape.style.left=`${Math.max(.08,Math.min(.92,s.tx))*100}%`;tape.style.top=`${Math.max(.25,Math.min(.70,s.ty))*100}%`;
  if(!root.hidden)bindValues();
  if(s.danger&&key)endKey();
 }
 function openKey(field,label){
  let value=field==='tape'?S.draft:field.startsWith('station')?S.entries[Number(field.slice(7))]:S[field];
  key={field,label,value:value||''};reset();command('edit-focus',{value:'1'});const k=$('keypad');k.hidden=false;
  k.innerHTML=`<header><div class="key-label">${esc(label)}</div><output id="key-value">${esc(key.value)||'—'}</output><button id="key-lookup">LOOK UP!<small style="display:block">Return to the stream</small></button></header><div class="keypad-grid">${['7','8','9','⌫','4','5','6','Clear','1','2','3','Done','0','.'].map(v=>`<button data-key="${v}" class="${v==='Done'?'done':''}">${v}</button>`).join('')}</div>`;
  $('key-lookup').onclick=lookup;
 }
 root.addEventListener('click',e=>{
  const n=e.target.closest('[data-field]');if(n){openKey(n.dataset.field,n.dataset.label);return;}
  const k=e.target.closest('[data-key]');if(k&&key){const v=k.dataset.key;if(v==='Done'){endKey();return;}if(v==='Clear')key.value='';else if(v==='⌫')key.value=key.value.slice(0,-1);else if(key.value.length<12&&(v!=='.'||!key.value.includes('.')))key.value+=v==='.'&&!key.value?'0.':v;set('key-value',key.value||'—');command('edit',{field:key.field,value:key.value});return;}
  const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action;
  if(a==='turn-left'||a==='turn-right'){command('angle',{value:String(S.angle+(a==='turn-left'?-5:5))});return;}
  if(a==='height-up'||a==='height-down'){command('height',{value:String(S.height+(a==='height-up'?.01:-.01))});return;}
  if(a.startsWith('replay-')){command('replay',{value:a==='replay-skip'?'skip':'intro'});return;}
  command(a);
 });
 root.addEventListener('input',e=>{if(e.target.classList.contains('range'))command(e.target.id,{value:e.target.value});if(e.target.id==='field-notes')command('edit',{field:'notes',value:e.target.value});});
 root.addEventListener('pointerdown',e=>{if(e.target.classList.contains('range')){activeSlider=e.target.id;command('edit-focus',{value:'1'});}});
 document.addEventListener('pointerup',()=>{if(activeSlider){activeSlider=null;command('edit-focus',{value:'0'});}});
 root.addEventListener('focusin',e=>{if(e.target.id==='field-notes'){reset();command('edit-focus',{value:'1'});}});root.addEventListener('focusout',e=>{if(e.target.id==='field-notes')command('edit-focus',{value:'0'});});
 function down(e){
  if(!S?.walking||screen!=='field')return;
  const target=e.target;if(!['touch-surface','marker','tape-marker'].includes(target.id)&&target.parentElement?.id!=='marker')return;
  e.preventDefault();target.setPointerCapture(e.pointerId);
  if(e.clientX<innerWidth*.42&&e.clientY>innerHeight*.38&&target.id==='touch-surface'&&moveId===null){moveId=e.pointerId;origin={x:e.clientX,y:e.clientY};$('joystick').hidden=false;$('joystick').style.left=origin.x+'px';$('joystick').style.top=origin.y+'px';$('stick').style.transform='';}
  else if(lookId===null){lookId=e.pointerId;last={x:e.clientX,y:e.clientY};drag={...last,distance:0};tapTarget=target.id==='tape-marker'?'tape':target.closest('#marker')?'interact':null;}
 }
 function motion(e){
  if(e.pointerId===moveId){const dx=e.clientX-origin.x,dy=e.clientY-origin.y,r=Math.hypot(dx,dy),scale=Math.min(1,48/Math.max(1,r));$('stick').style.transform=`translate(${dx*scale}px,${dy*scale}px)`;command('move',{x:dx*scale/48,y:-dy*scale/48});e.preventDefault();}
  else if(e.pointerId===lookId){const dx=e.clientX-last.x,dy=e.clientY-last.y;drag.distance=Math.max(drag.distance,Math.hypot(e.clientX-drag.x,e.clientY-drag.y));if(drag.distance>9)command('look',{x:dx*.22,y:dy*.22});last={x:e.clientX,y:e.clientY};e.preventDefault();}
 }
 function up(e){if(e.pointerId===moveId){moveId=null;$('joystick').hidden=true;command('move',{x:0,y:0});}if(e.pointerId===lookId){if(e.type==='pointerup'&&drag.distance<=9&&tapTarget&&(tapTarget==='tape'||S.interact))command(tapTarget);lookId=null;}}
 root.addEventListener('pointerdown',down);root.addEventListener('pointermove',motion);root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
 $('marker').addEventListener('keydown',e=>{if(e.key==='Enter'&&S?.interact)command('interact');});
 addEventListener('blur',reset);addEventListener('resize',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 window.StreamflowMobile={state,ready:g=>{game=g;}};
})();
