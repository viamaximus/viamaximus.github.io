(function () {
  var openBtn = document.getElementById('open-dos');
  if (!openBtn) return;

  var win = null, input = null, body = null;

  function createWindow() {
    var overlay = document.createElement('div');
    overlay.id = 'dos-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;pointer-events:none;';

    var w = document.createElement('div');
    w.id = 'dos-window';
    w.style.cssText =
      'position:fixed;left:10%;top:10%;width:80%;height:70%;' +
      'background:#000;color:#0f0;border:2px solid #0f0;' +
      'display:flex;flex-direction:column;z-index:10002;pointer-events:auto;';

    var title = document.createElement('div');
    title.style.cssText =
      'background:#003300;color:#bff;padding:6px 8px;display:flex;align-items:center;justify-content:space-between;';
    title.innerHTML = '<strong>dos prompt</strong>' +
      '<div><button id="dos-min" style="margin-right:6px">_</button><button id="dos-close">X</button></div>';

    var content = document.createElement('div');
    content.id = 'dos-body';
    content.style.cssText = 'flex:1;overflow:auto;padding:8px;font-family:monospace;white-space:pre-wrap;';
    content.textContent =
      'microsoft(r) ms-dos(r) version 6.22\n' +
      '(c)copyright microsoft corp 1981-1994.\n\n' +
      'type "help" for commands.\n\nC:\\> ';

    var inp = document.createElement('input');
    inp.id = 'dos-input';
    inp.type = 'text';
    inp.style.cssText =
      'width:100%;border:0;outline:none;padding:6px 8px;font-family:monospace;background:#001500;color:#0f0;';

    w.appendChild(title); w.appendChild(content); w.appendChild(inp);
    document.body.appendChild(overlay); document.body.appendChild(w);

    return { win: w, input: inp, body: content, overlay: overlay };
  }

  function ensure() {
    if (!win) {
      var o = createWindow();
      win = o.win; input = o.input; body = o.body;
      document.getElementById('dos-close').onclick = close;
      document.getElementById('dos-min').onclick = function () {
        win.style.display = 'none';
      };
      input.addEventListener('keydown', onKey);
    }
    win.style.display = 'flex';
    input.focus();
    scrollToEnd();
  }

  function close() {
    if (win) { win.remove(); document.getElementById('dos-overlay')?.remove(); }
    win = input = body = null;
  }

  function print(txt) { body.textContent += txt; scrollToEnd(); }
  function println(txt) { print((txt || '') + '\n'); }
  function prompt() { print('\nC:\\> '); }
  function scrollToEnd() { body.scrollTop = body.scrollHeight; }

  function onKey(e) {
    if (e.key !== 'Enter') return;
    var cmd = input.value.trim(); input.value = '';
    println(cmd);
    handle(cmd);
    prompt();
  }

  function handle(cmd) {
    var parts = cmd.split(/\s+/); var c = (parts[0]||'').toLowerCase(); var arg = parts.slice(1).join(' ');

    switch (c) {
      case 'help':
        println('commands:');
        println('  help           show this help');
        println('  cls|clear      clear the screen');
        println('  date           show date/time');
        println('  dir            list recent posts');
        println('  open <path>    open a url/path on this site');
        println('  theme <dark|light>  switch theme');
        println('  exit           close window'); break;

      case 'cls': case 'clear':
        body.textContent = ''; break;

      case 'date':
        println(new Date().toString()); break;

      case 'exit':
        close(); break;

      case 'theme':
        if (/^dark$/i.test(arg)) document.documentElement.classList.add('theme-dark');
        else document.documentElement.classList.remove('theme-dark');
        try { localStorage.setItem('w95-theme', document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light'); } catch(_){}
        println('theme set to ' + (document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light'));
        break;

      case 'dir':
        try {
          var posts = window.__W95_POSTS__ || [];
          posts.slice(0, 20).forEach(function (p) { println(p.date + '  ' + p.path); });
        } catch(e){ println('no posts found.'); }
        break;

      case 'open':
        if (!arg) { println('usage: open /path'); break; }
        window.location.href = arg; break;

      case '':
        break;

      default:
        println("'" + c + "' is not recognized as an internal or external command.");
    }
  }

  openBtn.addEventListener('click', function () { ensure(); });
})();

