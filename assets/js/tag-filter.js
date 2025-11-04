(function () {
  var TAG_PARAM_RE = /^\/tag\/([^/]+)\/?$/; // matches /tag/<slug>/
  var tagLinks = Array.prototype.slice.call(document.querySelectorAll('.tag-link'));
  var items    = Array.prototype.slice.call(document.querySelectorAll('.post-item'));
  var totalEl  = document.querySelector('.post_total .left');
  var titleEl  = document.querySelector('.default_title h1');

  if (!items.length) return; 

  function normalize(s){ return (s||'').toLowerCase(); }

  function setActiveTag(slug) {
    tagLinks.forEach(function (a) {
      var on = a.getAttribute('data-tag') === slug;
      a.classList.toggle('active', on);
    });
  }

  function filterByTag(slug) {
    var count = 0;
    items.forEach(function (li) {
      var tags = normalize(li.getAttribute('data-tags') || '');
      var show = !slug || tags.split(/\s+/).indexOf(slug) !== -1;
      li.style.display = show ? '' : 'none';
      if (show) count++;
    });

    // update header + object count
    if (titleEl) titleEl.textContent = slug ? slug : (window.siteTitle || titleEl.textContent);
    if (totalEl) totalEl.textContent = (slug ? count : items.length) + ' object(s)';

    setActiveTag(slug);
  }

  function applyFromPath(pathname) {
    var m = TAG_PARAM_RE.exec(pathname);
    var slug = m ? decodeURIComponent(m[1]) : '';
    filterByTag(slug);
    return slug;
  }

  // intercept tag clicks (no full reload)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.tag-link');
    if (!a) return;
    var slug = a.getAttribute('data-tag');
    if (!slug) return;

    e.preventDefault();
    // update URL (keeps nice links; no reload)
    var url = a.getAttribute('href') || ('/tag/' + slug + '/');
    window.history.pushState({ tag: slug }, '', url);
    filterByTag(slug);
  });

  // back/forward support
  window.addEventListener('popstate', function () {
    applyFromPath(location.pathname);
  });

  // initial apply on load
  // save the original site title so we can restore when clearing filter
  try { window.siteTitle = document.querySelector('.default_title h1')?.textContent || ''; } catch(_){}
  applyFromPath(location.pathname);
})();

