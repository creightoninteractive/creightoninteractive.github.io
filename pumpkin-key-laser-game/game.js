(() => {
  'use strict';
  if (!window.PUMPKIN_HOSTED) return;
  const lesson = window.ONSHAPE_LESSON;
  const challenges=lesson.steps.filter(s=>s.type!=='finale');
  const maxScore=lesson.steps.filter(s=>s.scored===true).length;
  const $ = id => document.getElementById(id);
  const stage = $('stage'), img = $('screenshot'), overlay = $('overlay');
  const debug = new URLSearchParams(location.search).get('debug') === '1';
  const state = {step:0, sub:0, misses:[], hints:0, score:0, runs:[], busy:false, ready:false, pointer:null, measure:null, box:null, pulse:false};
  let advanceTimer, pulseTimer, inputTimer;
  const field=$('dimension-input');
  let soundEnabled=true;
  const sfx=Object.fromEntries(Object.entries(window.ONSHAPE_SFX).map(([key,path])=>{const a=new Audio(path);a.preload='auto';a.volume=key==='wrong'?.65:.35;return [key,a];}));
  function playSfx(name) {
    if(!soundEnabled)return;
    // Reuse one player per effect so repeated attempts cannot stack copies.
    try {const a=sfx[name];a.pause();a.currentTime=0;const p=a.play();if(p)p.catch(()=>{});}catch{} // A browser audio restriction must never block practice.
  }
  function stopSfx(){Object.values(sfx).forEach(a=>{try{a.pause();a.currentTime=0;}catch{}});}
  function animate(el,cls){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);}
  const run=()=>state.runs[state.step];
  function scoreUI(){
    $('live-score').textContent=`Score: ${state.score} / ${maxScore}`;
    $('point-status').textContent=run().completed ? (run().pointEligible?'Point earned':'Practice completed') : run().pointEligible?'Point available':'Practice-only';
    $('point-status').dataset.eligible=String(run().pointEligible);
    $('hint').innerHTML=run().pointEligible?"Hint <small>(costs this step's point)</small>":'Hint <small>(practice-only)</small>';
  }
  function losePoint(reason){if(!run().pointEligible)return;run().pointEligible=false;run().lostReason=reason;playSfx('pointLost');scoreUI();}
  // Preload the local screenshots. No network services or dependencies.
  const preload = lesson.steps.map(s => {const image = new Image(); image.src = s.image; return image;});
  const current = () => lesson.steps[state.step];
  const inside = (p,b) => p.x >= b.x1 && p.x <= b.x2 && p.y >= b.y1 && p.y <= b.y2;
  // The image and pointer surface have identical bounds; no object-fit letterboxing.
  function sourcePoint(event) {
    const r = img.getBoundingClientRect();
    return {x:(event.clientX-r.left)*lesson.width/r.width, y:(event.clientY-r.top)*lesson.height/r.height};
  }
  const bounds = (a,b) => ({x1:Math.min(a.x,b.x),y1:Math.min(a.y,b.y),x2:Math.max(a.x,b.x),y2:Math.max(a.y,b.y)});
  function say(text, kind='') {$('feedback').textContent=text; $('feedback').dataset.kind=kind;}
  function activeTargets() {const s=current(); return s.type==='drag' ? [s.startRegion,s.endRegion] : s.type==='orderedClicks' ? [s.targets[state.sub]] : s.field ? [s.field,...(s.targets||[])] : s.targets||[];}
  function rect(box, cls) {return `<rect class="${cls}" x="${box.x1}" y="${box.y1}" width="${box.x2-box.x1}" height="${box.y2-box.y1}" rx="2"/>`;}
  function draw() {
    const s=current(); let markup='';
    if(s.type==='orderedClicks' && state.sub===1) markup+=rect(s.targets[0],'selected');
    if(debug) activeTargets().forEach((b,i) => {markup+=rect(b, `target ${s.type==='drag' && i===1 ? 'end-target' : ''}`); if(s.type==='drag') markup+=`<text class="svg-label" x="${b.x1}" y="${b.y1-7}">${i===0?'START · hold':'END · release'}</text>`;});
    if(state.pointer && s.type==='drag') markup+=rect(bounds(state.pointer.start,state.pointer.last),'drag-preview');
    if(state.measure) markup+=rect(bounds(state.measure.start,state.measure.last),'measure');
    else if(debug && state.box) markup+=rect(state.box,'measure');
    overlay.innerHTML=markup;
  }
  function hint() {if(state.busy)return;state.hints++;run().hintUsed=true;losePoint('hint');playSfx('hint');say('Hint used — this step is now practice-only.');$('hint-text').textContent=current().hint;$('hint-text').hidden=false;}
  function miss(extra='') {
    state.misses[state.step]++; const n=state.misses[state.step];
    run().wrongAttempts=n;playSfx('wrong');
    $('attempts').textContent=`${n} ${n===1?'miss':'misses'} this step`;
    const wasEligible=run().pointEligible;
    if(n>=lesson.scoring.wrongLimit)losePoint('misses');
    say(wasEligible && !run().pointEligible ? 'No point for this step now — keep going and master it!' : !run().pointEligible ? 'Keep going — this step is practice-only. You can still master it!' : n===1 ? 'Not quite — take another look!' : 'Close! One more miss and this step becomes practice-only.','retry');
    animate($('feedback'),'nudge');
  }
  function resetPointer() {const id=state.pointer?.id ?? state.measure?.id;state.pointer=null;state.measure=null;if(id!==undefined && stage.hasPointerCapture(id))stage.releasePointerCapture(id);}
  function render() {
    clearTimeout(pulseTimer);clearTimeout(inputTimer);field.hidden=true;resetPointer();state.pulse=false;state.box=null;state.sub=0;state.busy=false;state.ready=false;
    const s=current();stage.dataset.screenId=s.id;
    if(s.type==='finale'){finish();return;}
    $('practice').hidden=false;$('complete').hidden=true;
    img.src=s.image;img.alt=`Screen ${s.id}: ${s.title} Onshape practice screenshot.`;
    img.style.aspectRatio='auto';
    if(s.imageWidth){img.width=s.imageWidth;img.height=s.imageHeight;}
    if(img.complete && img.naturalWidth)state.ready=true;
    $('step-count').textContent=`Step ${challenges.indexOf(s)+1} of ${challenges.length}`;
    $('step-icon').textContent=String(state.step+1).padStart(2,'0');
    $('instruction').textContent=s.title;animate($('instruction'),'enter');
    $('detail').textContent=s.type==='drag'?'Press, hold, move diagonally down-right, then release.':s.type==='orderedClicks'?'Complete both clicks in order.':s.field?'Replace the dimension. Pause briefly after typing to check your value.':s.type==='rightClick'?'Use a right-click or a two-finger trackpad click.':s.type==='keyPress'?`Press ${s.key} on your keyboard.`:'Find the right control in the screenshot. Take your time.';
    $('gesture').textContent=s.type==='drag'?'CLICK + HOLD + DRAG':s.type==='orderedClicks'?'2 CLICKS IN ORDER':'CLICK';
    $('attempts').textContent=`${state.misses[state.step]} misses this step`;
    $('hint-text').hidden=true;$('hint-text').textContent='';scoreUI();
    say('Two misses are free. Use a hint if you need help.');
    $('progress').innerHTML=challenges.map((step,i)=>`<li class="${state.runs[lesson.steps.indexOf(step)].completed?'done':step===s?'current':''}" ${step===s?'aria-current="step"':''} aria-label="Screen ${step.id}: ${state.runs[lesson.steps.indexOf(step)].completed?'complete':step===s?'current':'upcoming'}"></li>`).join('');
    $('debug-step').value=state.step;$('rectangle').value='';$('percentages').textContent='';$('delta').textContent='dx: — · dy: —';draw();
    if(s.field){field.hidden=false;field.value=s.initialValue||'';field.setAttribute('aria-label',s.inputLabel||'Dimension');field.removeAttribute('aria-invalid');positionField();field.focus({preventScroll:true});field.select();}
    else if(s.type==='keyPress')stage.focus({preventScroll:true});
  }
  function finish() {
    state.busy=true;state.pulse=false;clearTimeout(pulseTimer);resetPointer();
    $('practice').hidden=true;$('complete').hidden=false;
    $('total-retries').textContent=state.misses.reduce((a,b)=>a+b,0);$('total-hints').textContent=state.hints;$('complete').focus();
    clearTimeout(inputTimer);field.hidden=true;
    const finale=current().type==='finale'?current():null;
    $('complete-title').textContent=finale?.title||'MISSION COMPLETE!';
    $('finale-image').hidden=!finale;if(finale)$('finale-image').src=finale.image;
    $('completion-description').textContent=`You completed ${challenges.length} challenges. Simulation complete — no file was sent to a laser cutter.`;
    $('final-score').textContent=`${state.score} / ${maxScore}`;
    $('score-message').textContent=state.score===maxScore?'Perfect run!':state.score/maxScore>=7/9?'Nice work!':state.score/maxScore>=4/9?'You finished — another run can raise your score.':'Practice run complete — try it again and see what you remember.';
    $('lost-hints').textContent=state.runs.filter(r=>r.lostReason==='hint').length;
    $('lost-misses').textContent=state.runs.filter(r=>r.lostReason==='misses').length;
    playSfx('complete');animate($('complete'),'celebrate');
  }
  function advance() {
    if(state.busy)return;state.busy=true;resetPointer();draw();
    clearTimeout(inputTimer);
    if(!run().completed){if(current().scored===true && run().pointEligible)state.score+=lesson.scoring.pointsPerStep;run().completed=true;}
    scoreUI();playSfx('correct');say(run().pointEligible?'Nice! Point earned.':'You got it! Keep rolling.','success');animate(document.querySelector('.frame'),'success-glow');
    document.dispatchEvent(new CustomEvent('training:accepted', {detail:{step:current().id,score:state.score}}));
    advanceTimer=setTimeout(()=>{if(state.step===lesson.steps.length-1)finish();else {state.step++;render();}},220);
  }
  function restart() {
    clearTimeout(advanceTimer);clearTimeout(pulseTimer);clearTimeout(inputTimer);resetPointer();stopSfx();
    Object.assign(state,{step:0,sub:0,misses:lesson.steps.map(()=>0),hints:0,score:0,runs:lesson.steps.map(()=>({wrongAttempts:0,hintUsed:false,pointEligible:true,completed:false,lostReason:null})),busy:false,pulse:false,box:null});
    $('practice').hidden=false;$('complete').hidden=true;render();say('Ready when you are. Follow the instruction above.');
  }
  function clickAt(p) {
    const s=current();
    if(s.type==='rightClick'||s.type==='keyPress'){miss();return;}
    if(s.type==='textInput'){validateText(true);return;}
    if(s.type==='textThenClick'){if((s.targets||[]).some(b=>inside(p,b)) && textValid())advance();else miss();return;}
    if(s.type==='orderedClicks') {
      if(inside(p,s.targets[state.sub])) {if(state.sub<s.targets.length-1){state.sub++;const message=s.afterSelection||'Correct. Complete the next click.';$('detail').textContent=message;say(message,'success');playSfx('correct');state.pulse=false;draw();}else advance();}
      else miss(state.sub===0 && inside(p,s.targets[1])?'Select the Pumpkin-Template file first, then click Open.':'');
    } else if(s.targets.some(b=>inside(p,b))) advance(); else miss();
  }
  stage.addEventListener('pointerdown',e=>{
    if(e.target===field)return;
    if(state.busy || !state.ready || !e.isPrimary || e.button!==0 || state.pointer || state.measure)return;
    e.preventDefault();const p=sourcePoint(e);stage.setPointerCapture(e.pointerId);
    if(debug && e.shiftKey) {state.measure={id:e.pointerId,start:p,last:p};draw();return;}
    // Keep the same pointer captured through release, including releases outside the image.
    state.pointer={id:e.pointerId,start:p,last:p,moved:false,valid:current().type!=='drag'||inside(p,current().startRegion)};
    draw();
  });
  stage.addEventListener('pointermove',e=>{
    const p=sourcePoint(e);
    if(debug)$('coords').textContent=`x: ${p.x.toFixed(1)} · y: ${p.y.toFixed(1)}`;
    if(state.measure?.id===e.pointerId){state.measure.last=p;draw();return;}
    const pointer=state.pointer;if(!pointer || pointer.id!==e.pointerId)return;
    // Lost button state cancels the gesture; hovering never completes a drag.
    if(!(e.buttons&1)){resetPointer();draw();return;}
    pointer.last=p;if(Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>3)pointer.moved=true;
    if(debug)$('delta').textContent=`dx: ${(p.x-pointer.start.x).toFixed(1)} · dy: ${(p.y-pointer.start.y).toFixed(1)}`;draw();
  });
  stage.addEventListener('pointerup',e=>{
    if(state.measure?.id===e.pointerId) {
      state.box=Object.fromEntries(Object.entries(bounds(state.measure.start,sourcePoint(e))).map(([k,v])=>[k,Math.round(v)]));resetPointer();
      $('rectangle').value=JSON.stringify(state.box);
      $('percentages').textContent=Object.entries(state.box).map(([k,v])=>`${k}: ${(v/(k[0]==='x'?960:540)*100).toFixed(2)}%`).join(' · ');draw();return;
    }
    const pointer=state.pointer;if(!pointer || pointer.id!==e.pointerId)return;
    const p=sourcePoint(e),s=current();resetPointer();draw();if(state.busy)return;
    if(s.type==='drag') {
      if(pointer.valid && pointer.moved && inside(p,s.endRegion) && p.x-pointer.start.x>=s.minDx && p.y-pointer.start.y>=s.minDy)advance();
      else miss('Try the drag again: press in the start area, keep holding, and release farther down-right in the end area.');
    } else if(Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)<=14)clickAt(p);
    else miss('Use a click or tap for this step.');
  });
  ['pointercancel','lostpointercapture'].forEach(type=>stage.addEventListener(type,()=>{if(state.pointer || state.measure){resetPointer();draw();}}));
  window.addEventListener('blur',()=>{resetPointer();draw();});
  window.addEventListener('resize',()=>{resetPointer();draw();});
  stage.addEventListener('contextmenu',e=>{e.preventDefault();if(state.busy||!state.ready)return;resetPointer();if(current().type==='rightClick' && current().targets.some(b=>inside(sourcePoint(e),b)))advance();else miss();});
  document.addEventListener('keydown',e=>{if(state.busy||!state.ready||current().type!=='keyPress'||e.repeat)return;if(e.key===current().key){e.preventDefault();e.stopPropagation();advance();}},true);
  // Input percentages share the same logical space as click hit-testing. ResizeObserver
  // adjusts the font, while percentage bounds track the actual screenshot automatically.
  function positionField(){const b=current().field;if(!b)return;Object.assign(field.style,{left:`${b.x1/lesson.width*100}%`,top:`${b.y1/lesson.height*100}%`,width:`${(b.x2-b.x1)/lesson.width*100}%`,height:`${(b.y2-b.y1)/lesson.height*100}%`,fontSize:`${10*img.getBoundingClientRect().width/lesson.width}px`});}
  new ResizeObserver(positionField).observe(img);
  const normalize=value=>value.toLowerCase().replace(/\s+/g,'');
  function textValid(){return (current().acceptedValues||[]).some(v=>normalize(v)===normalize(field.value));}
  function validateText(submitted=false){if(state.busy||field.hidden)return;if(textValid()){field.removeAttribute('aria-invalid');if(current().type==='textInput')advance();else say('Value ready. Click the confirmation control.');}else if(submitted){field.setAttribute('aria-invalid','true');miss();}}
  field.addEventListener('input',()=>{clearTimeout(inputTimer);field.removeAttribute('aria-invalid');const step=state.step;inputTimer=setTimeout(()=>{if(state.step===step)validateText(false);},700);});
  field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(current().submitKey==='Enter')validateText(true);else if(!textValid())validateText(true);}});
  img.addEventListener('load',()=>{state.ready=true;});
  img.addEventListener('error',()=>{state.ready=false;say('The screenshot could not load. Keep the assets folder beside index.html, then refresh.','retry');});
  $('hint').addEventListener('click',hint);$('restart').addEventListener('click',restart);$('again').addEventListener('click',()=>{restart();stage.focus();});
  document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();restart();});
  $('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;$('sound').textContent=soundEnabled?'Sound On':'Sound Off';$('sound').setAttribute('aria-pressed',String(soundEnabled));if(!soundEnabled)stopSfx();});
  $('debug').hidden=!debug;
  $('debug-step').innerHTML=lesson.steps.map((s,i)=>`<option value="${i}">Screen ${s.id} · ${s.title}</option>`).join('');
  $('debug-step').addEventListener('change',()=>{clearTimeout(advanceTimer);state.step=Number($('debug-step').value);render();say('Teacher preview. Shift + drag to measure a target.');});
  $('copy').addEventListener('click',async()=>{if(!$('rectangle').value){say('Shift + drag on the screenshot to measure a rectangle first.');return;}try{await navigator.clipboard.writeText($('rectangle').value);say('Rectangle JSON copied.');}catch{$('rectangle').focus();$('rectangle').select();say('Select and copy the rectangle text with Ctrl+C.');}});
  document.querySelector('.intro').innerHTML=`${challenges.length} challenges. ${maxScore} possible points.<br>Two misses are free. A hint trades this step's point for help.`;
  restart();
})();
