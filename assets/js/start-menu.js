(function () {
  var start = document.getElementById('start-btn');
  var menu  = document.getElementById('start-menu');
  if (!start || !menu) return;

  function openMenu()  {
    menu.hidden = false;
    menu.setAttribute('aria-hidden', 'false');
    start.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    menu.hidden = true;
    menu.setAttribute('aria-hidden', 'true');
    start.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    if (menu.hidden) openMenu(); else closeMenu();
  }

  // clicking the start button should not trigger the doc click closer
  start.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  // clicking anywhere outside both the button and menu closes it
  document.addEventListener('click', function (e) {
    if (menu.hidden) return;
    var inButton = start.contains(e.target);
    var inMenu   = menu.contains(e.target);
    if (!inButton && !inMenu) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
})();

