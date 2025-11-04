(function () {
  // highlight the selected tag in the left tree
  var tagLinks = document.querySelectorAll('.tag_list a');
  tagLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      tagLinks.forEach(function (el) { el.classList.remove('active-folder'); });
      a.classList.add('active-folder');
    });
  });

  // highlight the selected file in the right list
  var fileLinks = document.querySelectorAll('.post_list a');
  fileLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      fileLinks.forEach(function (el) { el.classList.remove('active-file'); });
      a.classList.add('active-file');
    });
  });

  var numbersEl = document.getElementById('numbers');
  if (numbersEl && typeof numbersEl.textContent === 'string') {
    var raw = numbersEl.textContent.trim();
    var parts = (raw || '').split('');
    var i = 0;
    setInterval(function () {
      if (!numbersEl) return;
      numbersEl.textContent = parts.slice(0, i++).join('');
      if (i > parts.length) i = 0;
    }, 120);
  }

  var contentClose = document.querySelector('.post_title .btn:not(.btn_max):not(.btn_min)');
  if (contentClose) {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        try { contentClose.click(); } catch (_) {}
      }
    });
  }

})();

