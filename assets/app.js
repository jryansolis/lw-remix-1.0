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

  // Hover-to-preview: on hover (desktop only) play a clean, muted, looping
  // mid-clip of a video card's content using the YouTube IFrame Player API —
  //  • starts ~30% into the video and loops a ~9s window (not the start)
  //  • the player is scaled up inside an overflow-hidden frame so YouTube's
  //    title bar, controls and watermark are cropped out of view
  // Source: the card's own [data-preview] wins; else nearest [data-list].
  //   "VIDEOID" → that video · "list:PLAYLIST" → that playlist's current item
  let ytLoading = false; const ytQueue = [];
  function ensureYT(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    ytQueue.push(cb);
    if (ytLoading) return;
    ytLoading = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prev === 'function') prev();
      ytQueue.splice(0).forEach((f) => f());
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }

  function initVideoPreviews() {
    if (!window.matchMedia('(hover: hover)').matches) return; // skip touch devices
    if (!document.getElementById('lw-prev-style')) {
      const st = document.createElement('style');
      st.id = 'lw-prev-style';
      // scale crops the embed's chrome (title top / controls + watermark bottom)
      st.textContent = '.lw-prev{position:absolute;inset:0;overflow:hidden;z-index:5;pointer-events:none;background:#0b0b0b;opacity:0;transition:opacity .35s ease}.lw-prev>iframe{position:absolute;top:50%;left:50%;width:100%;height:100%;transform:translate(-50%,-50%) scale(1.62);border:0}';
      document.head.appendChild(st);
    }
    const seen = new Set(); const targets = [];
    document.querySelectorAll('[data-preview]').forEach((el) => {
      const z = el.matches('.imgz') ? el : el.querySelector('.imgz');
      if (z && !seen.has(z)) { targets.push(z); seen.add(z); }
    });
    document.querySelectorAll('[data-list]').forEach((host) => {
      host.querySelectorAll('.imgz').forEach((z) => { if (!seen.has(z)) { targets.push(z); seen.add(z); } });
    });

    targets.forEach((z) => {
      const host = z.closest('[data-preview]') || z.closest('[data-list]');
      const raw = z.getAttribute('data-preview') ||
                  (host && host.getAttribute('data-preview')) ||
                  (host && host.getAttribute('data-list') ? 'list:' + host.getAttribute('data-list') : null);
      if (!raw) return;
      if (getComputedStyle(z).position === 'static') z.style.position = 'relative';
      let timer;

      const mount = () => {
        if (z.__prev) return;
        const wrap = document.createElement('div'); wrap.className = 'lw-prev';
        const holder = document.createElement('div'); wrap.appendChild(holder);
        z.appendChild(wrap);
        const state = { wrap: wrap, player: null, interval: null, dead: false, start: null, vid: '' };
        z.__prev = state;
        ensureYT(() => {
          if (state.dead) return;
          const isList = raw.indexOf('list:') === 0;
          const vars = { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, playsinline: 1 };
          if (isList) { vars.listType = 'playlist'; vars.list = raw.slice(5); }
          const opts = {
            host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%', playerVars: vars,
            events: {
              onReady: (e) => { try { e.target.mute(); e.target.playVideo(); } catch (_) {} },
              onStateChange: (e) => {
                if (e.data !== 1) return; // 1 = PLAYING
                const p = e.target; if (state.dead) return;
                wrap.style.opacity = '1';
                let vid = ''; try { vid = (p.getVideoData() || {}).video_id || ''; } catch (_) {}
                if (vid !== state.vid) {
                  state.vid = vid;
                  let d = 0; try { d = p.getDuration() || 0; } catch (_) {}
                  state.dur = d;
                  state.start = d > 40 ? Math.floor(d * 0.3) : (d > 14 ? 5 : 0);
                  if (state.start > 0) { try { p.seekTo(state.start, true); } catch (_) {} }
                }
                if (!state.interval) {
                  // Re-seek only to keep a long mid-window and to avoid the end
                  // screen — a tight loop would re-buffer and flash YouTube chrome.
                  state.interval = setInterval(() => {
                    if (state.dead) return;
                    try {
                      const t = p.getCurrentTime();
                      const past = t > state.start + 28;
                      const nearEnd = state.dur > 0 && t > state.dur - 3;
                      if (past || nearEnd || (state.start > 0 && t < state.start - 2)) p.seekTo(state.start, true);
                    } catch (_) {}
                  }, 1000);
                }
              }
            }
          };
          if (!isList) opts.videoId = raw;
          try { state.player = new YT.Player(holder, opts); } catch (_) {}
        });
      };

      const unmount = () => {
        const st = z.__prev; if (!st) return;
        st.dead = true; if (st.interval) clearInterval(st.interval);
        try { if (st.player && st.player.destroy) st.player.destroy(); } catch (_) {}
        if (st.wrap && st.wrap.parentNode) st.wrap.remove();
        z.__prev = null;
      };

      z.addEventListener('mouseenter', () => { timer = setTimeout(mount, 240); });
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
