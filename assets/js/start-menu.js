(function () {
  var start = document.getElementById('start-btn');
  var menu  = document.getElementById('start-menu');

  if (!start || !menu) return;

  function open()  { menu.hidden = false; menu.setAttribute('aria-hidden','false'); }
  function close() { menu.hidden = true;  menu.setAttribute('aria-hidden','true'); }

  start.addEventListener('click', function (e) {
    e.preventDefault();
    if (menu.hidden) open(); else close();
  });

  document.addEventListener('click', function (e) {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== start) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();

