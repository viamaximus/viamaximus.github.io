(function () {
  var key = 'w95-theme';            // 'dark' | 'light'
  var btn = document.getElementById('theme-toggle');

  function apply(mode) {
    if (mode === 'dark') {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
    try { localStorage.setItem(key, mode); } catch (_) {}
  }

  // init: prefer stored mode, else system preference
  var saved = null;
  try { saved = localStorage.getItem(key); } catch (_) {}
  if (saved) apply(saved);
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    apply('dark');
  }

  // toggle
  if (btn) btn.addEventListener('click', function () {
    var isDark = document.documentElement.classList.contains('theme-dark');
    apply(isDark ? 'light' : 'dark');
  });
})();

