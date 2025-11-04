(function () {
  // simple taskbar program button manager for the single post window
  var win     = document.getElementById('content-window');
  var btnMin  = document.getElementById('btn-min');
  var btnMax  = document.getElementById('btn-max');
  var tbWrap  = document.getElementById('task-buttons');
  if (!win || !tbWrap) return;

  var title = (function () {
    var h = win.querySelector('.post_title h1');
    return (h && h.textContent) ? h.textContent : 'window';
  })();

  // create button
  var taskBtn = document.createElement('button');
  taskBtn.type = 'button';
  taskBtn.className = 'task-button active';
  taskBtn.setAttribute('aria-pressed', 'true');
  taskBtn.innerHTML =
    '<img class="icon" src="' + (document.querySelector('.post_title img')?.getAttribute('src') || '{{ "/assets/img/file.ico" | relative_url }}') + '" alt="">' +
    '<span class="label"></span>';
  taskBtn.querySelector('.label').textContent = title;
  tbWrap.appendChild(taskBtn);

  // helpers
  function isMinimized() {
    return document.body.classList.contains('content-min');
  }
  function setActive(active) {
    taskBtn.classList.toggle('active', active);
    taskBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
  function restore() {
    document.body.classList.remove('content-min');
    win.style.display = ''; // ensure visible
    setActive(true);
  }
  function minimize() {
    document.body.classList.add('content-min');
    setActive(false);
  }

  // task button click toggles minimize/restore
  taskBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (isMinimized()) restore(); else minimize();
  });

  // hook existing titlebar buttons
  if (btnMin) btnMin.addEventListener('click', function (e) {
    // let existing logic run, then mark inactive
    setTimeout(function(){ setActive(false); }, 0);
  });
  if (btnMax) btnMax.addEventListener('click', function (e) {
    // maximize still considered active
    setTimeout(function(){ setActive(true); }, 0);
  });

  // close button removes the task button
  var btnClose = win.querySelector('.post_title .btn:not(.btn_min):not(.btn_max)');
  if (btnClose) btnClose.addEventListener('click', function () {
    try { taskBtn.remove(); } catch (_) {}
  });

})();

