// safe behaviors for the fixed article pane
// this file only affects the built-in bottom content window (not floating ones)

(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    // fixed content window (only exists on post pages)
    var win = document.getElementById('content-window');
    if (!win) return;

    // locate controls safely
    var btnMax  = document.getElementById('btn-max')  || null;
    var btnMin  = document.getElementById('btn-min')  || null;
    var btnClose = (function () {
      var all = win.querySelectorAll('.post_title .btn');
      for (var i = 0; i < all.length; i++) {
        if (!all[i].classList.contains('btn_max') && !all[i].classList.contains('btn_min')) {
          return all[i];
        }
      }
      return null;
    })();

    // minimize hides the fixed pane
    if (btnMin) {
      btnMin.addEventListener('click', function (e) {
        e.preventDefault();
        win.style.display = 'none';
        return false;
      });
    }

    // maximize toggles a class. window-manager overrides this behavior for floating windows.
    if (btnMax) {
      btnMax.addEventListener('click', function (e) {
        e.preventDefault();
        win.classList.toggle('is-maximized');
        return false;
      });
    }

    // close behavior is already handled by theme (navigates home via link)
    // we just prevent errors
    if (btnClose) {
      btnClose.addEventListener('click', function () {
        // no extra logic needed
      });
    }

    // esc hides fixed window without crashing
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && win && win.style.display !== 'none') {
        win.style.display = 'none';
      }
    });
  });
})();

