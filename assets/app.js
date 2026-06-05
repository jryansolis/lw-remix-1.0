/* Livewire Wired — shared interactions (framework-free) */
(function () {
  const LS_KEY = 'lw_following';
  const getFollowing = () => {
    try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); }
    catch { return new Set(); }
  };
  const saveFollowing = (set) => localStorage.setItem(LS_KEY, JSON.stringify([...set]));

  // Seed a demo "following" state on first visit so the Following feed is populated.
  let following = getFollowing();
  if (!localStorage.getItem(LS_KEY)) {
    following = new Set(['author:Vishal Teckchandani', 'author:Steve Johnson', 'topic:ETFs', 'topic:Retirement']);
    saveFollowing(following);
  }

  const isFollowing = (key) => following.has(key);

  function paintButton(btn) {
    const key = btn.dataset.follow;
    const on = isFollowing(key);
    btn.classList.toggle('is-following', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    const label = btn.querySelector('[data-follow-label]') || btn;
    const compact = btn.hasAttribute('data-compact');
    if (label === btn) {
      btn.textContent = on ? (compact ? 'Following' : 'Following ✓') : 'Follow';
    } else {
      label.textContent = on ? 'Following' : 'Follow';
    }
  }

  function toggleFollow(key) {
    if (following.has(key)) following.delete(key); else following.add(key);
    saveFollowing(following);
    // repaint every button bound to this key
    document.querySelectorAll(`[data-follow="${cssEscape(key)}"]`).forEach(paintButton);
    // update any "following count" badges
    document.querySelectorAll('[data-following-count]').forEach((el) => {
      el.textContent = following.size;
    });
    return following.has(key);
  }

  function cssEscape(s) { return s.replace(/"/g, '\\"'); }

  // Wire follow buttons
  function initFollowButtons() {
    document.querySelectorAll('[data-follow]').forEach((btn) => {
      paintButton(btn);
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowOn = toggleFollow(btn.dataset.follow);
        // tiny feedback pulse
        btn.animate(
          [{ transform: 'scale(0.94)' }, { transform: 'scale(1)' }],
          { duration: 160, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
      });
    });
  }

  // Author follow popover
  function initPopovers() {
    const triggers = document.querySelectorAll('[data-popover-trigger]');
    let open = null;
    const closeAll = () => {
      document.querySelectorAll('.lw-popover.open').forEach((p) => p.classList.remove('open'));
      open = null;
    };
    triggers.forEach((t) => {
      const pop = t.parentElement.querySelector('.lw-popover');
      if (!pop) return;
      t.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const wasOpen = pop.classList.contains('open');
        closeAll();
        if (!wasOpen) { pop.classList.add('open'); open = pop; }
      });
      // also open on hover (desktop)
      t.parentElement.addEventListener('mouseenter', () => {
        if (window.matchMedia('(hover: hover)').matches) { closeAll(); pop.classList.add('open'); }
      });
      t.parentElement.addEventListener('mouseleave', () => {
        if (window.matchMedia('(hover: hover)').matches) pop.classList.remove('open');
      });
    });
    document.addEventListener('click', (e) => {
      if (open && !e.target.closest('.lw-popover') && !e.target.closest('[data-popover-trigger]')) closeAll();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  }

  // Homepage feed toggle — supports any number of tabs/panels
  // (e.g. Top News / Latest / Following). Pairs [data-feed-tab="x"] with
  // [data-feed-panel="x"]; defaults to the tab marked [data-default], else the first.
  function initFeedToggle() {
    const tabs = [...document.querySelectorAll('[data-feed-tab]')];
    if (!tabs.length) return;
    const panels = [...document.querySelectorAll('[data-feed-panel]')];
    const setTab = (name) => {
      tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.feedTab === name));
      // Set inline display directly — a `hidden` attribute is overridden by Tailwind
      // display utilities (e.g. `grid`) on the same element, so we can't rely on it.
      panels.forEach((el) => {
        const show = el.dataset.feedPanel === name;
        el.style.display = show ? '' : 'none';
        el.hidden = !show;
      });
    };
    tabs.forEach((t) => t.addEventListener('click', () => setTab(t.dataset.feedTab)));
    const def = tabs.find((t) => 'default' in t.dataset)?.dataset.feedTab || tabs[0].dataset.feedTab;
    setTab(def);
  }

  // Hover-to-preview: mount a muted, autoplaying YouTube iframe over a video
  // card's thumbnail on hover (desktop only), remove it on mouse-out.
  // Source resolution: the card's own [data-preview] wins; otherwise the
  // nearest ancestor [data-list] (a playlist) is used. Value forms:
  //   "VIDEOID"        → loops that single video, muted
  //   "list:PLAYLIST"  → autoplays the playlist, muted
  function initVideoPreviews() {
    if (!window.matchMedia('(hover: hover)').matches) return; // skip touch devices
    const srcFor = (val) => {
      if (val.indexOf('list:') === 0) {
        const id = val.slice(5);
        return 'https://www.youtube-nocookie.com/embed/videoseries?list=' + id +
          '&autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1';
      }
      return 'https://www.youtube-nocookie.com/embed/' + val +
        '?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=' + val + '&start=1';
    };
    // Collect targets: any .imgz that has its own data-preview, or sits inside a [data-list].
    const seen = new Set();
    const targets = [];
    document.querySelectorAll('.imgz[data-preview]').forEach((el) => { targets.push(el); seen.add(el); });
    document.querySelectorAll('[data-preview]').forEach((el) => {
      const z = el.matches('.imgz') ? el : el.querySelector('.imgz');
      if (z && !seen.has(z)) { targets.push(z); seen.add(z); }
    });
    document.querySelectorAll('[data-list]').forEach((host) => {
      host.querySelectorAll('.imgz').forEach((z) => { if (!seen.has(z)) { targets.push(z); seen.add(z); } });
    });

    targets.forEach((z) => {
      const host = z.closest('[data-preview]') || z.closest('[data-list]');
      const raw = (z.getAttribute('data-preview')) ||
                  (host && host.getAttribute('data-preview')) ||
                  (host && host.getAttribute('data-list') ? 'list:' + host.getAttribute('data-list') : null);
      if (!raw) return;
      if (getComputedStyle(z).position === 'static') z.style.position = 'relative';
      let timer;
      const mount = () => {
        if (z.querySelector('.lw-prev')) return;
        const f = document.createElement('iframe');
        f.className = 'lw-prev';
        f.src = srcFor(raw);
        f.setAttribute('tabindex', '-1');
        f.setAttribute('aria-hidden', 'true');
        f.allow = 'autoplay; encrypted-media; picture-in-picture';
        f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;z-index:5;pointer-events:none;opacity:0;transition:opacity .25s ease;';
        z.appendChild(f);
        requestAnimationFrame(() => { f.style.opacity = '1'; });
      };
      const unmount = () => { const f = z.querySelector('.lw-prev'); if (f) f.remove(); };
      z.addEventListener('mouseenter', () => { timer = setTimeout(mount, 220); });
      z.addEventListener('mouseleave', () => { clearTimeout(timer); unmount(); });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initFollowButtons();
    initPopovers();
    initFeedToggle();
    initVideoPreviews();
    document.querySelectorAll('[data-following-count]').forEach((el) => { el.textContent = following.size; });
  });
})();
