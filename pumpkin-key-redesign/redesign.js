(() => {
  'use strict';
  if (!window.PUMPKIN_HOSTED) return;
  const $ = id => document.getElementById(id);
  const img=$('screenshot'),stage=$('stage'),frame=stage.parentElement;
  const lens=$('magnifier'),copy=$('magnifier-image');
  document.body.append(lens); // Fixed relative to the viewport, even inside laptop art.
  let held=false,point=null,raf=0;
  let feedbackTimer;
  new MutationObserver(()=>{
    clearTimeout(feedbackTimer);$('feedback').dataset.expired='false';
    feedbackTimer=setTimeout(()=>{$('feedback').dataset.expired='true';},4500);
  }).observe($('feedback'),{childList:true,characterData:true,subtree:true});
  const hide=()=>{lens.hidden=true;};

  function fit() {
    const s=window.ONSHAPE_LESSON.steps.find(s=>String(s.id)===stage.dataset.screenId);
    if (!s || !frame.clientWidth || !frame.clientHeight) {hide();return;}
    const ratio=s.imageWidth/s.imageHeight;
    const w=Math.min(frame.clientWidth,frame.clientHeight*ratio);
    // Fit the stage itself, not an image inside a larger letterboxed click surface.
    // Existing sourcePoint(), overlay, and percentage input fields remain aligned.
    stage.style.setProperty('width',`${w}px`,'important');
    stage.style.setProperty('height',`${w/ratio}px`,'important');
    hide();
  }
  const scheduleFit=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(fit);};
  new ResizeObserver(scheduleFit).observe(frame);
  new MutationObserver(()=>{hide();point=null;scheduleFit();}).observe(img,{attributes:true,attributeFilter:['src','width','height']});
  img.addEventListener('load',scheduleFit);
  window.addEventListener('resize',scheduleFit);
  window.visualViewport?.addEventListener('resize',scheduleFit);
  document.addEventListener('training:accepted',hide);
  scheduleFit();

  function show() {
    if (!held || !point || $('practice').hidden || $('training-game-root').inert) {hide();return;}
    const r=img.getBoundingClientRect(),{x,y}=point;
    if(x<r.left||x>r.right||y<r.top||y>r.bottom){hide();return;}
    const size=180,zoom=2.5;
    const left=Math.max(0,Math.min(innerWidth-size,x-size/2));
    const frameBounds=frame.getBoundingClientRect();
    const top=Math.max(frameBounds.top,Math.min(Math.min(innerHeight,frameBounds.bottom)-size,y-size/2));
    // At the edges, keep the sampled point centered while clamping the lens to view.
    lens.style.left=`${left}px`;lens.style.top=`${top}px`;
    if(copy.src!==img.src)copy.src=img.src;
    Object.assign(copy.style,{width:`${r.width*zoom}px`,height:`${r.height*zoom}px`,left:`${size/2-2-(x-r.left)*zoom}px`,top:`${size/2-2-(y-r.top)*zoom}px`});
    lens.hidden=false;
  }
  stage.addEventListener('pointermove',e=>{point={x:e.clientX,y:e.clientY};held=e.shiftKey;show();});
  stage.addEventListener('pointerdown',e=>{point={x:e.clientX,y:e.clientY};held=e.shiftKey;show();});
  stage.addEventListener('pointerleave',()=>{point=null;hide();});
  document.addEventListener('keydown',e=>{if(e.key==='Shift'){held=true;show();}});
  document.addEventListener('keyup',e=>{if(e.key==='Shift'){held=false;hide();}});
  window.addEventListener('blur',()=>{held=false;point=null;hide();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){held=false;point=null;hide();}});
})();
