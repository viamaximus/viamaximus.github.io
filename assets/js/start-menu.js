(function () {
  // binds the start button to toggle the start menu
  var start = document.getElementById('start-btn');
  var menu  = document.getElementById('start-menu');
  if (!start || !menu) return;

  function openMenu()  { menu.hidden = false; menu.setAttribute('aria-hidden','false'); }
  function closeMenu() { menu.hidden = true;  menu.setAttribute('aria-hidden','true'); }

  start.addEventListener('click', function (e) {
    e.preventDefault();
    if (menu.hidden) openMenu(); else closeMenu();
  });

  document.addEventListener('click', function (e) {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== start) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
})();

