(() => {
  'use strict';
  if (!window.PUMPKIN_HOSTED) return;
  const $ = id => document.getElementById(id);
  const scenes = window.PUMPKIN_STORY;
  const root = $('story-root'), art = [$('story-image-a'), $('story-image-b')];
  const player = new Audio(), mist = new Audio('assets/story-audio/mist_prompt.wav');
  player.preload = mist.preload = 'auto'; mist.volume = .45;
  let index = -1, active = 0, generation = 0, timer = null, visible = false;
  let training = false, expanded = false, muted = false, fadeTimer = null;
  let startedAt = 0, audioRecovery = null;
  const retained = []; // Keep decoded image and audio buffers alive through the intro.
  const params = new URLSearchParams(location.search);
  if (params.get('debug') === '1') root.classList.add('debug-story');

  function stopAudio() {
    clearInterval(fadeTimer); fadeTimer = null;
    for (const a of [player, mist]) { a.pause(); try { a.currentTime = 0; } catch {} }
    player.onended = null;
    $('story-audio-message').hidden = true; audioRecovery = null;
  }
  function cancelScene() {
    generation++; clearTimeout(timer); timer = null; stopAudio();
  }
  function play(a, recovery) {
    const token = generation;
    try {
      const attempt = a.play();
      if (attempt) attempt.catch(() => {
        if (training || a !== player || token !== generation) return;
        audioRecovery = recovery;
        $('story-audio-message').hidden = false;
      });
    } catch {
      if (training || token !== generation) return;
      audioRecovery = recovery; $('story-audio-message').hidden = false;
    }
  }
  $('retry-story-audio').addEventListener('click', () => {
    $('story-audio-message').hidden = true;
    if (audioRecovery) audioRecovery();
  });
  function layoutTarget() {
    if (index < 0 || training) return;
    const scene = scenes[index], target = $('story-hotspot');
    if (!scene.target) { target.hidden = true; return; }
    const box = $('story-image-box').getBoundingClientRect();
    const image = art[active].getBoundingClientRect();
    const [x1,y1,x2,y2] = scene.target;
    // Position relative to the actual contained image, not its letterboxed parent.
    Object.assign(target.style, {
      left:`${image.left-box.left+x1/scene.width*image.width}px`,
      top:`${image.top-box.top+y1/scene.height*image.height}px`,
      width:`${(x2-x1)/scene.width*image.width}px`,
      height:`${(y2-y1)/scene.height*image.height}px`
    });
    target.hidden = false; target.setAttribute('aria-label', scene.label);
  }
  function showScene(next) {
    if (training) return;
    cancelScene(); index = next; const scene = scenes[index];
    if (scene.id === 'scene11') { enterTraining(); return; }
    const token = generation;
    root.dataset.scene = scene.id; root.classList.toggle('sign-transition', scene.id.startsWith('scene3'));
    $('story-start').hidden = true; $('story-stage').hidden = false;
    $('story-toolbar').hidden = false; $('story-caption').hidden = true;
    $('story-chapter').textContent = scene.title;
    active = 1-active;
    art[active].src = scene.image; art[active].alt = scene.alt;
    art[active].width = scene.width; art[active].height = scene.height;
    art[active].classList.add('active'); art[1-active].classList.remove('active');
    $('story-prompt').hidden = !scene.prompt;
    $('story-prompt').textContent = scene.prompt || '';
    $('story-prompt').classList.remove('reveal');
    void $('story-prompt').offsetWidth; $('story-prompt').classList.add('reveal');
    visible = true; startedAt = performance.now();
    layoutTarget(); requestAnimationFrame(layoutTarget);
    if (scene.prompt) play(mist, () => play(mist));
    if (scene.sound) {
      player.src = `assets/story-audio/${scene.sound}`;
      player.volume = scene.voice ? 1 : .7;
      const replay = () => { if (token === generation && !training) play(player, replay); };
      if (scene.voice) {
        player.onended = () => {
          if (token === generation && !training && player.ended) showScene(index+1);
        };
      }
      replay();
    }
    if (scene.ms) timer = setTimeout(() => {
      if (token === generation && !training) showScene(index+1);
    }, scene.ms);
  }
  $('story-hotspot').addEventListener('click', () => {
    // Ignore the second click of an accidental double click across changing frames.
    if (!visible || training || !scenes[index]?.target || performance.now()-startedAt < 220) return;
    showScene(index+1);
  });
  new ResizeObserver(layoutTarget).observe($('story-image-box'));
  window.addEventListener('resize', layoutTarget);

  function fitEmbeddedGame() {
    if (!training) return;
    const viewport = $('laptop-screen-viewport');
    if (expanded) return;
    const fixedHeight = [...document.querySelectorAll('#training-game-root .masthead, #practice .lesson-bar, #practice .instruction, #practice .feedback-bar')]
      .reduce((sum, el) => sum + el.getBoundingClientRect().height, 0) + 20;
    const width = Math.min(viewport.clientWidth-24, Math.max(170,viewport.clientHeight-fixedHeight)*960/540);
    $('training-game-root').style.setProperty('--embedded-stage-width', `${width}px`);
  }
  function enterTraining() {
    if (training) return;
    clearTimeout(timer); timer = null; generation++; player.onended = null;
    // Fade any remaining story sound without affecting the independent arcade players.
    const initial = [player.volume, mist.volume]; const start = performance.now();
    fadeTimer = setInterval(() => {
      const amount = Math.max(0, 1-(performance.now()-start)/500);
      player.volume = initial[0]*amount; mist.volume = initial[1]*amount;
      if (!amount) stopAudio();
    }, 25);
    training = true; visible = false;
    root.hidden = true; $('scene11-shell').hidden = false;
    $('training-game-root').inert = false;
    if (muted && $('sound').getAttribute('aria-pressed') === 'true') $('sound').click();
    fitEmbeddedGame(); requestAnimationFrame(fitEmbeddedGame);
    $('laptop-screen-viewport').scrollTop = 0;
  }
  function expandTraining() {
    if (!training || expanded) return;
    expanded = true;
    document.body.classList.add('training-fullscreen');
    // Same root and same engine instance. Only the container's CSS changes.
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
      fitEmbeddedGame();
      $('laptop-screen-viewport').scrollTop = 0;
    });
  }
  document.addEventListener('training:accepted', expandTraining, {once:true});
  window.addEventListener('resize', fitEmbeddedGame);
  new ResizeObserver(fitEmbeddedGame).observe($('laptop-screen-viewport'));
  new ResizeObserver(fitEmbeddedGame).observe($('hint-text'));
  new ResizeObserver(fitEmbeddedGame).observe($('training-game-root').querySelector('.instruction'));
  $('screenshot').addEventListener('load',fitEmbeddedGame);
  $('skip-intro').addEventListener('click', () => { cancelScene(); enterTraining(); });
  $('story-sound').addEventListener('click', () => {
    muted = !muted; player.muted = mist.muted = muted;
    $('story-sound').textContent = muted ? 'Sound Off' : 'Sound On';
    $('story-sound').setAttribute('aria-pressed',String(!muted));
  });
  $('start-story').addEventListener('click', () => { showScene(0); });

  function preloadImage(scene) {
    const image = new Image(); retained.push(image); image.src = scene.image;
    return image.decode();
  }
  function preloadAudio(src) {
    return new Promise((resolve,reject) => {
      const audio = new Audio(); retained.push(audio); audio.preload = 'auto';
      const timeout = setTimeout(() => {cleanup();reject(new Error(src));}, 20000);
      const cleanup = () => {clearTimeout(timeout);audio.oncanplaythrough = audio.onerror = null;};
      audio.oncanplaythrough = () => {cleanup();resolve();};
      audio.onerror = () => {cleanup();reject(new Error(src));};
      audio.src = src; audio.load();
    });
  }
  async function preload() {
    $('preload-status').textContent = 'Preparing the story…';
    $('start-story').disabled = true; $('skip-intro').disabled = true;
    $('retry-loading').hidden = true;
    const sounds = ['mist_prompt.wav',...scenes.filter(s=>s.sound).map(s=>s.sound)];
    try {
      await Promise.all([...scenes.map(preloadImage),...sounds.map(s=>preloadAudio(`assets/story-audio/${s}`))]);
      $('preload-status').textContent = 'Ready. Sound brings the story to life.';
      $('start-story').disabled = false; $('skip-intro').disabled = false;
    } catch {
      $('preload-status').textContent = 'Some story files could not load. Check your connection and try again.';
      $('retry-loading').hidden = false;
    }
  }
  $('retry-loading').addEventListener('click',preload);
  preload();
})();
