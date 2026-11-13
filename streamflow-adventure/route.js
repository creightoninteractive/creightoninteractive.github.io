(function () {
  function choose(ua, override) {
    if (override === 'mobile' || override === 'desktop') return override;
    if (/CrOS|Windows NT|Macintosh|iPad/i.test(ua)) return 'desktop';
    return /iPhone|iPod/i.test(ua) || (/Android/i.test(ua) && /Mobile/i.test(ua)) ? 'mobile' : 'desktop';
  }
  if (typeof module === 'object') { module.exports = { choose }; return; }
  let preference = null;
  try { preference = localStorage.getItem('streamflow.version'); } catch (_) {}
  document.querySelectorAll('[data-version]').forEach(function (link) {
    link.addEventListener('click', function () {
      try { localStorage.setItem('streamflow.version', link.dataset.version); } catch (_) {}
    });
  });
  if (new URLSearchParams(location.search).get('choose') !== '1') {
    location.replace(choose(navigator.userAgent, preference) === 'mobile' ? '/streamflow-mobile/' : '/streamflow/');
  }
})();
