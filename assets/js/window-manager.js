(function () {
  var taskbar = document.getElementById('task-buttons');
  if (!taskbar) return;

  var zBase = 9000;
  var winCounter = 0;

  /* ---------- util: dock area (fixed pane) ---------- */
  function ensureDockArea() {
    var dock = document.getElementById('dock-area');
    if (dock) return dock;

    // create a classic bottom content window structure
    dock = document.createElement('div');
    dock.id = 'dock-area';
    dock.className = 'content';
    dock.setAttribute('aria-live', 'polite');
    dock.hidden = true;

    dock.innerHTML = '' +
      '<div class="post_title">' +
      '  <img src="/assets/img/file.ico" />' +
      '  <h1 id="dock-title"></h1>' +
      '  <div class="btn" id="dock-close" title="close"><span class="fa fa-times"></span></div>' +
      '</div>' +
      '<ul class="topbar"><li id="dock-date"></li></ul>' +
      '<div class="post_content" id="dock-content"></div>';

    // insert right after the main wrapper so it sits below the explorer panes
    var wrapper = document.querySelector('.wrapper') || document.body;
    wrapper.insertAdjacentElement('afterend', dock);

    // close button hides the dock
    var closeBtn = dock.querySelector('#dock-close');
    closeBtn.addEventListener('click', function () {
      dock.hidden = true;
    });

    return dock;
  }

  function setDockContent(data) {
    var dock = ensureDockArea();
    dock.querySelector('#dock-title').textContent = data.title || '';
    dock.querySelector('#dock-date').textContent = data.date || '';
    dock.querySelector('#dock-content').innerHTML = data.html || '';
    dock.hidden = false;
  }

  /* ---------- storage helpers (session only) ---------- */
  function saveState(key, data) { try { sessionStorage.setItem('w95:' + key, JSON.stringify(data)); } catch (_) {} }
  function loadState(key) { try { var s = sessionStorage.getItem('w95:' + key); return s ? JSON.parse(s) : null; } catch (_) { return null; } }

  /* ---------- task buttons ---------- */
  function createTaskButton(title, iconSrc) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'task-button active';
    btn.setAttribute('aria-pressed', 'true');
    btn.innerHTML = (iconSrc ? '<img class="icon" alt="" src="' + iconSrc + '">' : '') + '<span class="label"></span>';
    btn.querySelector('.label').textContent = title || 'window';
    taskbar.appendChild(btn);
    return btn;
  }
  function setTaskActive(taskBtn, active) {
    taskBtn.classList.toggle('active', active);
    taskBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  /* ---------- focus control ---------- */
  function focus(win) {
    document.querySelectorAll('.w95-window').forEach(function (w) { w.classList.remove('is-active'); });
    win.classList.add('is-active');
    win.style.zIndex = ++zBase;
  }

  /* ---------- drag support (disabled while docked) ---------- */
  function makeDraggable(win, handle, onStop) {
    var startX = 0, startY = 0, sx = 0, sy = 0, dragging = false;

    handle.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      if (win.dataset.docked === '1') return;
      dragging = true; focus(win);
      var rect = win.getBoundingClientRect(); sx = rect.left; sy = rect.top;
      startX = e.clientX; startY = e.clientY; e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX; var dy = e.clientY - startY;
      win.style.left = Math.max(0, Math.min(window.innerWidth - 80, sx + dx)) + 'px';
      win.style.top  = Math.max(0, Math.min(window.innerHeight - 60, sy + dy)) + 'px';
    });

    document.addEventListener('mouseup', function () { if (!dragging) return; dragging = false; if (onStop) onStop(); });
  }

  /* ---------- fetch post content and extract title/date/article ---------- */
  function loadPost(url, titleHint) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var metaTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
        var postTitle = doc.querySelector('.post_title h1')?.textContent;
        var title = postTitle || metaTitle || titleHint || url;

        // try to get date like the built-in viewer
        var date =
          doc.querySelector('.content > .topbar li')?.textContent ||
          doc.querySelector('time')?.getAttribute('datetime') ||
          '';

        var content =
          doc.querySelector('.post_content') ||
          doc.querySelector('article') ||
          doc.querySelector('main') ||
          doc.querySelector('.content') ||
          doc.body;

        // wrap a bit for nicer typography inside floating window
        var htmlOut = '<div class="w95-article">' + content.innerHTML + '</div>';
        return { title: title, html: htmlOut, date: date };
      });
  }

  /* ---------- menubar dropdowns ---------- */
  function buildMenus(win, titlebar, menubar, body, taskBtn, key) {
    var menus = {
      file: [
        { label: 'open in new tab', act: function () { window.open(win.dataset.url, '_blank'); } },
        { label: 'print…', act: function () {
            var w = window.open('', '_blank');
            w.document.write('<title>' + titlebar.querySelector('.title').textContent + '</title>' +
              '<style>body{font:16px/1.5 system-ui, sans-serif; padding:24px;} pre{background:#f5f5f5;padding:10px;overflow:auto;}</style>' +
              body.innerHTML);
            w.document.close(); w.focus(); w.print(); }
        },
        { sep: true },
        { label: 'close', act: function () { win.querySelector('.w95-close').click(); } }
      ],
      edit: [
        { label: 'find (ctrl+f)', act: function () { try { document.execCommand('find'); } catch(_) {} } },
        { label: 'select all', act: function () {
            var sel = window.getSelection(); var range = document.createRange();
            range.selectNodeContents(body); sel.removeAllRanges(); sel.addRange(range);
        } }
      ],
      view: [
        { label: 'maximize (dock)/restore', act: function () { dockToggle(win, key); } },
        { sep: true },
        { label: 'zoom in', act: function () { var z = parseFloat(body.dataset.zoom||'1'); z = Math.min(2, z+0.1); body.style.transform='scale('+z+')'; body.style.transformOrigin='top left'; body.dataset.zoom=z; } },
        { label: 'zoom out', act: function () { var z = parseFloat(body.dataset.zoom||'1'); z = Math.max(0.6, z-0.1); body.style.transform='scale('+z+')'; body.style.transformOrigin='top left'; body.dataset.zoom=z; } },
        { label: 'reset zoom', act: function () { body.style.transform=''; body.dataset.zoom='1'; } }
      ],
      help: [
        { label: 'about this window…', act: function () { alert('win95 window • draggable • dock into fixed pane • taskbar button • session restore'); } }
      ]
    };

    function showMenu(name, anchorEl) {
      hideMenus();
      var m = document.createElement('div');
      m.className = 'w95-menu';
      m.dataset.menu = name;

      menus[name].forEach(function (it) {
        if (it.sep) { var s = document.createElement('div'); s.className = 'sep'; m.appendChild(s); return; }
        var i = document.createElement('div'); i.className = 'item'; i.textContent = it.label;
        i.addEventListener('click', function (e) { e.stopPropagation(); hideMenus(); it.act(); });
        m.appendChild(i);
      });

      document.body.appendChild(m);
      var r = anchorEl.getBoundingClientRect();
      m.style.left = r.left + 'px'; m.style.top = (r.bottom + 1) + 'px';

      setTimeout(function () {
        function outside(ev) { if (!m.contains(ev.target)) { hideMenus(); document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', esc); } }
        function esc(ev) { if (ev.key === 'Escape') { hideMenus(); document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', esc); } }
        document.addEventListener('mousedown', outside);
        document.addEventListener('keydown', esc);
      }, 0);
    }
    function hideMenus() { document.querySelectorAll('.w95-menu').forEach(function (x) { x.remove(); }); }

    menubar.innerHTML =
      '<span class="menu" data-m="file">File</span>' +
      '<span class="menu" data-m="edit">Edit</span>' +
      '<span class="menu" data-m="view">View</span>' +
      '<span class="menu" data-m="help">Help</span>';

    menubar.addEventListener('click', function (e) {
      var m = e.target.closest('.menu'); if (!m) return;
      showMenu(m.dataset.m, m);
    });
  }

  /* ---------- spawn a floating window (classic three buttons) ---------- */
  function spawnWindow(opts) {
    var id = 'w95win-' + (++winCounter);
    var key = opts.key || id;

    var win = document.createElement('div');
    win.className = 'w95-window';
    win.id = id;
    win.dataset.url = opts.url || '';
    win.dataset.docked = '0';

    win.style.left = (opts.left || (10 + (winCounter * 2) % 20)) + '%';
    win.style.top  = (opts.top  || (10 + (winCounter * 2) % 20)) + '%';

    var titlebar = document.createElement('div');
    titlebar.className = 'w95-titlebar';
    titlebar.innerHTML =
      '<div class="title">' + (opts.title || 'loading...') + '</div>' +
      '<div class="controls">' +
      '  <button class="w95-btn w95-min" title="minimize">_</button>' +
      '  <button class="w95-btn w95-max" title="maximize (dock)/restore">⬜</button>' +
      '  <button class="w95-btn w95-close" title="close">X</button>' +
      '</div>';

    var menubar = document.createElement('div'); menubar.className = 'w95-menubar';
    var body = document.createElement('div'); body.className = 'w95-body'; body.innerHTML = opts.html || '<p>loading…</p>';

    win.appendChild(titlebar); win.appendChild(menubar); win.appendChild(body);
    document.body.appendChild(win);

    focus(win);
    makeDraggable(win, titlebar, function () { /* could persist pos if desired */ });

    // double-click title bar = dock/restore
    titlebar.addEventListener('dblclick', function () { dockToggle(win, key); });

    var taskBtn = createTaskButton(opts.title || 'window', opts.iconSrc);
    setTaskActive(taskBtn, true);

    // controls
    var btnMax   = titlebar.querySelector('.w95-max');
    var btnMin   = titlebar.querySelector('.w95-min');
    var btnClose = titlebar.querySelector('.w95-close');

    btnMax .addEventListener('click', function () { dockToggle(win, key); });
    btnMin .addEventListener('click', function () {
      // minimize: hide either the floating window or the docked pane
      if (win.dataset.docked === '1') {
        ensureDockArea().hidden = true;
        setTaskActive(taskBtn, false);
      } else {
        win.style.display = 'none';
        setTaskActive(taskBtn, false);
      }
    });
    btnClose.addEventListener('click', function () {
      if (win.dataset.docked === '1') ensureDockArea().hidden = true;
      try { taskBtn.remove(); } catch (_) {}
      try { win.remove(); } catch (_) {}
    });

    // clicking task button toggles whatever is active (docked pane vs floating)
    taskBtn.addEventListener('click', function () {
      if (win.dataset.docked === '1') {
        var dock = ensureDockArea();
        dock.hidden = !dock.hidden;
        setTaskActive(taskBtn, !dock.hidden);
      } else {
        if (win.style.display === 'none') { win.style.display = 'flex'; focus(win); setTaskActive(taskBtn, true); }
        else { win.style.display = 'none'; setTaskActive(taskBtn, false); }
      }
    });

    // menus
    buildMenus(win, titlebar, menubar, body, taskBtn, key);

    // expose useful refs
    win._titlebar = titlebar;
    win._menubar = menubar;
    win._body = body;
    win._taskBtn = taskBtn;

    return { win: win, body: body, titlebar: titlebar, taskBtn: taskBtn, key: key };
  }

  /* ---------- dock/restore into fixed pane ---------- */
  function dockToggle(win, key) {
    var dock = ensureDockArea();

    if (win.dataset.docked === '1') {
      // restore to floating
      dock.hidden = true;
      win.dataset.docked = '0';
      win.style.display = 'flex';
      focus(win);
      setTaskActive(win._taskBtn, true);
      saveState(key, { docked: false });
      return;
    }

    // dock: move content/title/date into dock pane, hide floating window
    var title = win._titlebar.querySelector('.title')?.textContent || '';
    // date is unknown from the already loaded body; try to sniff a date from the fetched content markup
    var dateEl = win._body.querySelector('time, .post_meta time, .post_title + .topbar li');
    var dateText = dateEl ? (dateEl.getAttribute('datetime') || dateEl.textContent || '') : '';

    setDockContent({ title: title, html: win._body.innerHTML, date: dateText });
    win.style.display = 'none';
    win.dataset.docked = '1';
    setTaskActive(win._taskBtn, true);
    saveState(key, { docked: true });
  }

  /* ---------- public: open a post ---------- */
  function openPost(url, iconSrc, titleHint) {
    var stateKey = 'post:' + url;
    var shell = spawnWindow({ title: titleHint || 'loading…', iconSrc: iconSrc, key: stateKey, url: url });

    loadPost(url, titleHint).then(function (data) {
      shell.titlebar.querySelector('.title').textContent = data.title;
      shell.taskBtn.querySelector('.label').textContent = data.title;
      shell.body.innerHTML = data.html;

      // if this url was previously docked in the session, re-dock immediately
      var s = loadState(stateKey);
      if (s && s.docked) {
        dockToggle(shell.win, stateKey);
      }
    }).catch(function (err) {
      shell.titlebar.querySelector('.title').textContent = 'error';
      shell.body.innerHTML = '<p>failed to load: ' + String(err) + '</p>';
    });
  }

  /* ---------- public: dos prompt ---------- */
  function openDos() {
    var stateKey = 'dos';
    var shell = spawnWindow({
      title: 'dos prompt', key: stateKey, iconSrc: '', url: '#dos',
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
      var cmd = input.value.trim(); input.value = ''; println(cmd); handle(cmd); prompt();
    });

    function handle(cmd) {
      var parts = cmd.split(/\s+/); var c = (parts[0]||'').toLowerCase(); var arg = parts.slice(1).join(' ');
      switch (c) {
        case 'help':
          println('commands:'); println('  help               show this help');
          println('  cls|clear          clear the screen');
          println('  date               show date/time');
          println('  dir                list recent posts');
          println('  open <path>        open a url/path on this site');
          println('  theme <dark|light> switch theme');
          println('  exit               close window'); println('  secret             ???'); break;
        case 'cls': case 'clear': body.textContent = ''; break;
        case 'date': println(new Date().toString()); break;
        case 'exit': try { shell.titlebar.querySelector('.w95-close').click(); } catch(_) {} break;
        case 'theme':
          if (/^dark$/i.test(arg)) document.documentElement.classList.add('theme-dark');
          else document.documentElement.classList.remove('theme-dark');
          try { localStorage.setItem('w95-theme', document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light'); } catch(_){}
          println('theme set to ' + (document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light')); break;
        case 'dir':
          try { (window.__W95_POSTS__ || []).slice(0, 20).forEach(function (p) { println(p.date + '  ' + p.path); }); }
          catch(e){ println('no posts found.'); } break;
        case 'open':
          if (!arg) { println('usage: open /path'); break; }
          window.location.href = arg; break;
        case 'secret': println('you found the secret. keep exploring.'); break;
        case '': break;
        default: println("'" + c + "' is not recognized as an internal or external command.");
      }
    }
  }

  /* ---------- enhance post list: [open] + intercept ---------- */
  function enhancePostList() {
    var list = document.querySelector('.post_list'); if (!list) return;

    Array.prototype.slice.call(list.querySelectorAll('a[href^="/"]')).forEach(function (a) {
      if (a.classList.contains('open-in-window')) return;
      if (a.nextElementSibling && a.nextElementSibling.classList?.contains('open-in-window')) return;
      var hasFileIcon = !!a.querySelector('img[src*="file"]'); if (!hasFileIcon) return;

      var open = document.createElement('a');
      open.href = a.href; open.className = 'open-in-window'; open.textContent = '[open]'; open.title = 'open in window';
      open.addEventListener('click', function (e) { e.preventDefault(); var icon = a.querySelector('img')?.getAttribute('src'); openPost(a.href, icon, a.textContent.trim()); });
      a.after(open);
    });

    list.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="/"]'); if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
      var hasFileIcon = !!a.querySelector('img[src*="file"]'); if (!hasFileIcon || a.classList.contains('open-in-window')) return;
      e.preventDefault();
      var icon = a.querySelector('img')?.getAttribute('src');
      openPost(a.getAttribute('href'), icon, a.textContent.trim());
    }, true);
  }

  /* ---------- bind start menu → dos ---------- */
  function bindStartDos() {
    var btn = document.getElementById('open-dos');
    if (!btn) return;
    btn.addEventListener('click', function (e) { e.preventDefault(); openDos(); });
  }

  /* ---------- init ---------- */
  enhancePostList();
  bindStartDos();

  // api (in case we want to script it)
  window.w95Manager = { openPost: openPost, openDos: openDos };

  try { console.log('[w95] window manager loaded'); } catch (_){}
})();

