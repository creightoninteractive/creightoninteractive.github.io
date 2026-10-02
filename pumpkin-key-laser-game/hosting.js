// V5 is a hosted experience. The earlier offline edition remains a separate file.
window.PUMPKIN_HOSTED = location.protocol === 'http:' || location.protocol === 'https:';
if (!window.PUMPKIN_HOSTED) document.documentElement.classList.add('offline-blocked');
