(function () {
  var taskbar = document.getElementById('task-buttons');
  if (!taskbar) return;

  var zBase = 9000;
  var winCounter = 0;

  /* storage helpers (session only) */
  function saveState(key, data) {
    try { sessionStorage.setItem('w95:' + key, JSON.stringify(data)); } catch (_) {}
  }
  function loadState(key) {
    try {
      var s = sessionStorage.getItem('w95:' + key);
      return s ? JSON.parse(s) : null;
    } catch (_) { return null; }
  }

  /* task buttons */
  function createTaskButton(title, iconSrc) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'task-button active';
    btn.setAttribute('aria-pressed', 'true');
    btn.innerHTML =
      (iconSrc ? '<img class="icon" alt="" src="' + iconSrc + '">' : '') +
      '<span class="label"></span>';
    btn.querySelector('.label').textContent = title || 'window';
    taskbar.appendChild(btn);
    return btn;
  }
  function setTaskActive(taskBtn, active) {
    taskBtn.classList.toggle('active', active);
    taskBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  /* focus control */
  function focus(win) {
    document.querySelectorAll('.w95-window').forEach(function (w) {
      w.classList.remove('is-active');
    });
    win.classList.add('is-active');
    win.style.zIndex = ++zBase;
  }

  /* drag support */
  function makeDraggable(win, handle, onStop) {
    var startX = 0, startY = 0, sx = 0, sy = 0, dragging = false;

    handle.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      if (win.classList.contains('is-maximized')) return; // no drag when maximized
      dragging = true;
      focus(win);
      var rect = win.getBoundingClientRect();
      sx = rect.left; sy = rect.top;
      startX = e.clientX; startY = e.clientY;
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      win.style.left = Math.max(0, Math.min(window.innerWidth - 80, sx + dx)) + 'px';
      win.style.top  = Math.max(0, Math.min(window.innerHeight - 60, sy + dy)) + 'px';
    });

    document.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      if (onStop) onStop();
    });
  }

  /* maximize / restore */
  function toggleMaximize(win, key) {
    var isMax = win.classList.contains('is-maximized');
    if (isMax) {
      // restore from stored prev rect
      var prev = win._prevRect;
      if (prev) {
        win.style.left = prev.left + 'px';
        win.style.top  = prev.top + 'px';
        win.style.width  = prev.width + 'px';
        win.style.height = prev.height + 'px';
      }
      win.classList.remove('is-maximized');
      saveGeometry(win, key);
    } else {
      // remember current rect
      var r = win.getBoundingClientRect();
      win._prevRect = { left: r.left, top: r.top, width: r.width, height: r.height };
      win.classList.add('is-maximized');
      // store maximized state
      saveState(key, { maximized: true, left: r.left, top: r.top, width: r.width, height: r.height });
    }
    focus(win);
  }

  function saveGeometry(win, key) {
    if (!key) return;
    var r = win.getBoundingClientRect();
    var maximized = win.classList.contains('is-maximized');
    saveState(key, { left: r.left, top: r.top, width: r.width, height: r.height, maximized: maximized });
  }

  function restoreGeometry(win, key) {
    var s = key && loadState(key);
    if (!s) return;
    if (s.maximized) {
      // set previous rect so restore has somewhere to go back to
      win.style.left = (s.left || 0) + 'px';
      win.style.top  = (s.top || 0) + 'px';
      win.style.width  = (s.width || win.offsetWidth) + 'px';
      win.style.height = (s.height || win.offsetHeight) + 'px';
      win._prevRect = { left: s.left || 0, top: s.top || 0, width: s.width || win.offsetWidth, height: s.height || win.offsetHeight };
      win.classList.add('is-maximized');
    } else {
      if (typeof s.left === 'number')  win.style.left = s.left + 'px';
      if (typeof s.top === 'number')   win.style.top  = s.top + 'px';
      if (typeof s.width === 'number') win.style.width  = s.width + 'px';
      if (typeof s.height=== 'number') win.style.height = s.height + 'px';
      win.classList.remove('is-maximized');
    }
  }

  /* fetch post content from an internal url */
  function loadPost(url) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var title = doc.querySelector('.post_title h1, h1')?.textContent || doc.title || url;
        var content = doc.querySelector('.post_content') || doc.querySelector('article') || doc.querySelector('main') || doc.body;
        return { title: title, html: content.innerHTML };
      });
  }

  /* create a managed window shell */
  function spawnWindow(opts) {
    var id = 'w95win-' + (++winCounter);
    var key = opts.key || id;

    var win = document.createElement('div');
    win.className = 'w95-window';
    win.id = id;

    // default cascade
    win.style.left = (opts.left || (10 + (winCounter * 2) % 20)) + '%';
    win.style.top  = (opts.top  || (10 + (winCounter * 2) % 20)) + '%';

    var titlebar = document.createElement('div');
    titlebar.className = 'w95-titlebar';
    titlebar.innerHTML =
      '<div class="title">' + (opts.title || 'loading...') + '</div>' +
      '<div class="controls">' +
      '  <button class="w95-btn w95-min" title="minimize">_</button>' +
      '  <button class="w95-btn w95-close" title="close">X</button>' +
      '</div>';

    var menubar = document.createElement('div');
    menubar.className = 'w95-menubar';
    menubar.textContent = opts.menuText || 'File  Edit  View  Help';

    var body = document.createElement('div');
    body.className = 'w95-body';
    body.innerHTML = opts.html || '<p>loading…</p>';

    win.appendChild(titlebar);
    win.appendChild(menubar);
    win.appendChild(body);
    document.body.appendChild(win);

    focus(win);

    // restore saved geometry/maximize
    restoreGeometry(win, key);

    // drag support; on stop, save geometry
    makeDraggable(win, titlebar, function () { saveGeometry(win, key); });

    // double click title bar maximize/restore
    titlebar.addEventListener('dblclick', function () { toggleMaximize(win, key); });

    // taskbutton
    var taskBtn = createTaskButton(opts.title || 'window', opts.iconSrc);
    setTaskActive(taskBtn, true);

    taskBtn.addEventListener('click', function () {
      if (win.style.display === 'none') {
        win.style.display = 'flex';
        focus(win);
        setTaskActive(taskBtn, true);
      } else {
        win.style.display = 'none';
        setTaskActive(taskBtn, false);
      }
    });

    // controls
    var btnMin   = titlebar.querySelector('.w95-min');
    var btnClose = titlebar.querySelector('.w95-close');

    btnMin.addEventListener('click', function () {
      win.style.display = 'none';
      setTaskActive(taskBtn, false);
    });

    btnClose.addEventListener('click', function () {
      try { win.remove(); } catch (_) {}
      try { taskBtn.remove(); } catch (_) {}
      // cleanup stored size so next open starts fresh (optional: comment out to persist)
      // saveState(key, null);
    });

    return { win: win, body: body, titlebar: titlebar, taskBtn: taskBtn, key: key };
  }

  /* public: open a post in a managed window */
  function openPost(url, iconSrc) {
    var stateKey = 'post:' + url;
    var shell = spawnWindow({ title: 'loading…', iconSrc: iconSrc, key: stateKey });
    loadPost(url).then(function (data) {
      shell.titlebar.querySelector('.title').textContent = data.title;
      shell.taskBtn.querySelector('.label').textContent = data.title;
      shell.body.innerHTML = data.html;
    }).catch(function (err) {
      shell.titlebar.querySelector('.title').textContent = 'error';
      shell.body.innerHTML = '<p>failed to load: ' + String(err) + '</p>';
    });
  }

  /* public: open dos as a managed window */
  function openDos() {
    var stateKey = 'dos';
    var shell = spawnWindow({
      title: 'dos prompt',
      key: stateKey,
      iconSrc: '', // no icon by default
      html:
        '<div id="dos-body" style="flex:1;overflow:auto;white-space:pre-wrap;font-family:monospace;background:#001500;color:#0f0;padding:8px;"></div>' +
        '<input id="dos-input" type="text" style="width:100%;border:0;outline:none;padding:6px 8px;font-family:monospace;background:#001500;color:#0f0;" />'
    });

    var body = shell.body.querySelector('#dos-body');
    var input = shell.body.querySelector('#dos-input');
    function print(t){ body.textContent += t; body.scrollTop = body.scrollHeight; }
    function println(t){ print((t||'') + '\n'); }
    function prompt(){ print('\nC:\\> '); }

    body.textContent =
      'microsoft(r) ms-dos(r) version 6.22\n' +
      '(c)copyright microsoft corp 1981-1994.\n\n' +
      'type "help" for commands.\n\nC:\\> ';

    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var cmd = input.value.trim(); input.value = '';
      println(cmd);
      handle(cmd);
      prompt();
    });

    function handle(cmd) {
      var parts = cmd.split(/\s+/);
      var c = (parts[0]||'').toLowerCase();
      var arg = parts.slice(1).join(' ');

      switch (c) {
        case 'help':
          println('commands:');
          println('  help               show this help');
          println('  cls|clear          clear the screen');
          println('  date               show date/time');
          println('  dir                list recent posts');
          println('  open <path>        open a url/path on this site');
          println('  theme <dark|light> switch theme');
          println('  exit               close window');
          println('  secret             ???'); /* tiny easter egg */
          break;

        case 'cls': case 'clear':
          body.textContent = ''; break;

        case 'date':
          println(new Date().toString()); break;

        case 'exit':
          try { shell.titlebar.querySelector('.w95-close').click(); } catch(_) {}
          break;

        case 'theme':
          if (/^dark$/i.test(arg)) document.documentElement.classList.add('theme-dark');
          else document.documentElement.classList.remove('theme-dark');
          try { localStorage.setItem('w95-theme', document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light'); } catch(_){}
          println('theme set to ' + (document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light'));
          break;

        case 'dir':
          try {
            (window.__W95_POSTS__ || []).slice(0, 20).forEach(function (p) { println(p.date + '  ' + p.path); });
          } catch(e){ println('no posts found.'); }
          break;

        case 'open':
          if (!arg) { println('usage: open /path'); break; }
          window.location.href = arg; break;

        case 'secret':
          println('you found the secret. keep exploring.'); break;

        case '':
          break;

        default:
          println("'" + c + "' is not recognized as an internal or external command.");
      }
    }
  }

  /* enhance post list with [open] controls */
  function enhancePostList() {
    document.querySelectorAll('.post_list a[href*="/20"]').forEach(function (a) {
      if (a.nextElementSibling && a.nextElementSibling.classList?.contains('open-in-window')) return;
      var open = document.createElement('a');
      open.href = a.href;
      open.className = 'open-in-window';
      open.textContent = '[open]';
      open.title = 'open in window';
      open.addEventListener('click', function (e) {
        e.preventDefault();
        var icon = a.querySelector('img')?.getAttribute('src');
        openPost(a.href, icon);
      });
      a.after(open);
    });
  }

  /* bind start menu dos item to managed dos window */
  function bindStartDos() {
    var btn = document.getElementById('open-dos');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openDos();
    });
  }

  /* initial */
  enhancePostList();
  bindStartDos();

  /* expose a tiny api for other scripts if needed */
  window.w95Manager = { openPost: openPost, openDos: openDos };
})();

