/* ─────────────────────────────────────────────────────────────
   Clarence Grimaldo — Portfolio
   Vanilla port of the Claude Design "Portfolio.dc.html" component.
   No framework: SPA routing, YouTube-backed audio player, gallery
   lightbox, scroll-reveal, in-view video autoplay, hover states.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ── Data ───────────────────────────────────────────────── */
  const SI = [
    { src: 'https://github.com/user-attachments/assets/c5de53a7-d9fe-4a82-b652-b6dc1c2ca5c7', title: 'Early Morning Skyline', desc: '' },
    { src: 'https://github.com/user-attachments/assets/37a48d60-00c4-444c-8c04-c11b16e80760', title: 'Volumetric Clouds', desc: 'Cumulus and altocumulus volumetric cloud layers.' },
    { src: 'https://github.com/user-attachments/assets/4a92a336-9fc4-43b3-9897-d81013de431b', title: 'Path Traced Global Illumination', desc: 'Multibounce global illumination with SVGF denoising.' },
    { src: 'uploads/pasted-1782196174950-0.png', title: 'Integrated PBR', desc: 'Hardcoded rough and smooth reflections with integrated normals for reflection details and varying roughness per texel.' },
    { src: 'https://github.com/user-attachments/assets/11e3fe64-94a2-4df5-ab9c-6779996f429b', title: 'Urban Rooftop', desc: '' },
    { src: 'https://github.com/user-attachments/assets/33f6534d-ae84-47de-8b7c-375bc73fbac8', title: 'Path Traced Global Illumination II', desc: '' },
    { src: 'https://github.com/user-attachments/assets/d4547eca-447c-4d3a-8f26-a443ae8ce56d', title: 'Soft Shadows', desc: '' },
    { src: 'https://github.com/user-attachments/assets/0f248606-44e1-4a70-937e-2e266029b5c7', title: 'Integrated PBR II', desc: '' },
    { src: 'https://github.com/user-attachments/assets/f1fcd585-3402-4b2a-b2bb-2dfe5a52cadb', title: 'Path Traced Global Illumination III', desc: '' },
    { src: 'https://github.com/user-attachments/assets/0a594301-648f-49ef-ab48-20a544b7c61e', title: 'Water Rendering', desc: 'Reflections, caustics, refraction, parallax waves, and wave displacement.' },
    { src: 'https://github.com/user-attachments/assets/a2e21c27-988f-443a-9305-c127d82f72ce', title: 'Bloom and Auto Exposure', desc: '' },
  ];

  const AI = [
    { src: 'https://github.com/user-attachments/assets/8d00e756-63e2-4645-829e-f12fd6242c0d', title: 'Castle Ruins', desc: 'Distant Horizons Support' },
    { src: 'https://github.com/user-attachments/assets/08f784b5-722f-456c-a47d-9d7c2b6ac2bc', title: 'Peaceful Nights', desc: 'Milky Way Galaxy, shooting stars, planet stars, and much more!' },
    { src: 'https://github.com/user-attachments/assets/7c3ebfbe-0a07-4232-90be-2c759f7e3c35', title: 'Vibrant Visuals', desc: '' },
    { src: 'https://github.com/user-attachments/assets/41d701b1-4354-4476-b40d-02fca12f0b49', title: 'Colored Lighting', desc: 'Floodfill colored lights integrated with SSPT lighting' },
    { src: 'https://github.com/user-attachments/assets/073621f3-ef81-46b9-b9cf-ddcb9a7427e0', title: 'Morning Dew', desc: '' },
    { src: 'https://github.com/user-attachments/assets/50d3fc1b-b647-4b42-a9ec-f5becf2e95b8', title: 'Screen Space Path Tracing', desc: 'SSPT global illumination' },
    { src: 'https://github.com/user-attachments/assets/d72bc2fe-907e-48e9-901b-c0d95e4cb111', title: 'Colored Lighting II', desc: '' },
    { src: 'https://github.com/user-attachments/assets/b70dbab3-6220-46c4-99d7-91df8239c1bd', title: 'Screen Space Path Tracing II', desc: 'SSPT ambient occlusion and global illumination' },
    { src: 'https://github.com/user-attachments/assets/d89280c9-5ea3-4757-b64a-07635a8c515a', title: 'Colored Lighting III', desc: '' },
  ];

  const UJEI = [
    { src: 'uploads/Combat%20Shot.png', title: 'HD-2D Combat', desc: 'HD-2D Combat', video: false },
    { src: 'uploads/Sprite%2C%20Scene%20and%20Postprocessing.png', title: 'HD-2D Style', desc: '2D sprites with proper lighting, shading, and bloom rendered inside a 3D environment.', video: false },
    { src: 'uploads/combatfinal.mp4', title: 'Hack n Slash', desc: 'Fight enemies in zones of varying difficulties and enemy types — each with their own move sets and animations.', video: true },
    { src: 'uploads/Enemy%20AI%2C%20Action%20Queues.mp4', title: 'Enemy AI', desc: 'Utilizes attack tokens and a queue system for controlled attacks and strategies. Different enemy behaviors, targeting, and navigation — including Optimal Reciprocal Collision Avoidance for velocity and direction-based avoidance between agents.', video: true },
    { src: 'uploads/Player%20Sprite.mp4', title: 'HD-2D Sprites', desc: 'A system of animation frame, class, and control scripts to build entities and player classes from the ground up. Attach sprite sheet tiling onto different animation frame states and define behaviors — idle, walk, attack, or skill.', video: true },
    { src: 'uploads/Stat%20System.mp4', title: 'Stat System', desc: 'Complete challenge or combat zones and earn varying stat bonuses to outscale enemies. Every class, attack, and skill is connected to the stat system — with allocations tuned to different playstyles, promoting build identity and freedom.', video: true },
  ];

  const SONGS = [
    { title: 'Live', artist: 'Derivacat', duration: 241, videoId: 'NDlexOBvFRI', ytUrl: 'https://www.youtube.com/watch?v=NDlexOBvFRI' },
    { title: 'Melody', artist: 'Derivacat', duration: 199, videoId: '82CpiVZCteE', ytUrl: 'https://www.youtube.com/watch?v=82CpiVZCteE' },
    { title: 'Everything To Me', artist: 'Porter Robinson', duration: 291, videoId: '3y1gPtOD1N8', ytUrl: 'https://www.youtube.com/watch?v=3y1gPtOD1N8' },
    { title: 'Something Comforting', artist: 'Porter Robinson', duration: 267, videoId: '-C-2AqRD8io', ytUrl: 'https://www.youtube.com/watch?v=-C-2AqRD8io' },
    { title: 'Flaws', artist: 'Fair Dawn & aru e', duration: 240, videoId: 'RJSllpiX0Zg', ytUrl: 'https://www.youtube.com/watch?v=RJSllpiX0Zg' },
  ];

  /* ── State ──────────────────────────────────────────────── */
  const state = {
    page: 'home', navOpen: false, galOpen: false, galProject: 'serie', galIdx: 0,
    songIdx: 0, playing: false, currentTime: 0, muted: false, volume: 0.05, ytLinksOpen: false,
  };

  let ytPlayer = null, ytReady = false, timeInterval = null, lastSong = -1, seekActive = false;
  let revObserver = null, vidObserver = null;
  let userGestured = false; // browsers block audible autoplay until the first interaction

  /* ── Tiny DOM helpers ───────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function setText(id, v) { const el = $(id); if (el && el.textContent !== v) el.textContent = v; }
  function setAttr(id, a, v) { const el = $(id); if (el && el.getAttribute(a) !== v) el.setAttribute(a, v); }

  /* ── Hover (replaces the design's style-hover attribute) ── */
  function bindHover(root) {
    (root || document).querySelectorAll('[data-hover]').forEach((el) => {
      if (el.dataset.hb) return;
      el.dataset.hb = '1';
      el.addEventListener('mouseenter', () => {
        el.dataset._restore = el.getAttribute('style') || '';
        el.setAttribute('style', el.dataset._restore + ';' + el.getAttribute('data-hover'));
      });
      el.addEventListener('mouseleave', () => {
        if (el.dataset._restore !== undefined) el.setAttribute('style', el.dataset._restore);
      });
    });
  }

  /* ── Routing ────────────────────────────────────────────── */
  function go(p) {
    state.navOpen = false;
    applyNav();
    if (p === state.page) { window.scrollTo(0, 0); return; }
    state.page = p;
    document.querySelectorAll('[data-view]').forEach((s) => s.classList.toggle('active', s.getAttribute('data-view') === p));
    // nav active states
    $('nav-projects').classList.toggle('active', p === 'serie' || p === 'allium' || p === 'uje');
    $('nav-legacy').classList.toggle('active', p === 'legacy');
    $('nav-3d').classList.toggle('active', p === '3d');
    // mini player only off-home
    $('mini-player').classList.toggle('show', p !== 'home');
    window.scrollTo(0, 0);
    setTimeout(() => { setupReveal(); setupVideos(); }, 60);
  }

  function toggleNav() {
    state.navOpen = !state.navOpen;
    applyNav();
  }
  function applyNav() {
    const panel = $('nav-panel'), overlay = $('nav-overlay'), caret = $('nav-caret');
    const open = state.navOpen;
    panel.style.maxHeight = open ? '310px' : '0';
    panel.style.borderBottomColor = open ? 'rgba(212,130,110,.1)' : 'rgba(212,130,110,0)';
    overlay.style.opacity = open ? '1' : '0';
    overlay.style.pointerEvents = open ? 'auto' : 'none';
    caret.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  }

  /* ── Scroll reveal ──────────────────────────────────────── */
  function setupReveal() {
    if (revObserver) revObserver.disconnect();
    revObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const d = parseInt(e.target.dataset.d || '0', 10);
          setTimeout(() => { e.target.style.opacity = '1'; e.target.style.transform = 'none'; }, d);
          revObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.active [data-r], [data-view].active [data-r]').forEach((el) => revObserver.observe(el));
  }

  /* ── In-view video autoplay ─────────────────────────────── */
  function setupVideos() {
    if (vidObserver) vidObserver.disconnect();
    const vids = document.querySelectorAll('[data-view].active video[data-vid]');
    if (!vids.length) return;
    vids.forEach((v) => { v.muted = true; v.loop = true; v.playsInline = true; });
    vidObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) { v.muted = true; v.loop = true; v.play().catch(() => {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.15 });
    vids.forEach((v) => vidObserver.observe(v));
  }

  /* ── Gallery lightbox ───────────────────────────────────── */
  function galImgs(proj) { return proj === 'allium' ? AI : proj === 'uje' ? UJEI : SI; }

  function openGal(proj) {
    state.galProject = proj; state.galIdx = 0; state.galOpen = true;
    document.body.style.overflow = 'hidden';
    const m = $('gallery-modal');
    m.style.display = 'flex';
    requestAnimationFrame(() => { m.style.opacity = '1'; m.style.pointerEvents = 'auto'; });
    renderGal();
  }
  function closeGal() {
    state.galOpen = false;
    document.body.style.overflow = '';
    const m = $('gallery-modal');
    m.style.opacity = '0'; m.style.pointerEvents = 'none';
    setTimeout(() => { if (!state.galOpen) { m.style.display = 'none'; $('gal-media').innerHTML = ''; } }, 260);
  }
  function galStep(dir) {
    const imgs = galImgs(state.galProject);
    state.galIdx = (state.galIdx + dir + imgs.length) % imgs.length;
    renderGal();
  }
  function renderGal() {
    const imgs = galImgs(state.galProject);
    const it = imgs[state.galIdx] || {};
    const media = $('gal-media');
    if (it.video) {
      media.innerHTML = '<video src="' + it.src + '" autoplay loop muted playsinline style="max-width:100%;max-height:64vh;display:block"></video>';
    } else {
      media.innerHTML = '<img src="' + it.src + '" alt="' + (it.title || '') + '" onerror="this.onerror=null;this.removeAttribute(\'src\');this.style.cssText=\'width:60vw;max-width:900px;height:50vh;background:linear-gradient(135deg,#1a0e0a,#2a1410)\'" style="max-width:100%;max-height:64vh;object-fit:contain;display:block">';
    }
    setText('gal-title', it.title || '');
    setText('gal-desc', it.desc || '');
    setText('gal-counter', (state.galIdx + 1) + ' / ' + imgs.length);
  }

  /* ── Audio player (YouTube IFrame API) ──────────────────── */
  // Unmute once the visitor has interacted (respecting a manual mute).
  function tryUnmute() {
    if (!ytReady || !ytPlayer || !userGestured || state.muted) return;
    try { ytPlayer.unMute(); ytPlayer.setVolume(Math.round(state.volume * 100)); } catch (e) {}
  }

  function apPlay() { if (ytReady && ytPlayer) { try { ytPlayer.playVideo(); } catch (e) {} } state.playing = true; renderAudio(); }
  function apPause() { if (ytReady && ytPlayer) { try { ytPlayer.pauseVideo(); } catch (e) {} } state.playing = false; renderAudio(); }
  function togglePlay() { state.playing ? apPause() : apPlay(); }
  function loadSong(i) { if (ytReady && ytPlayer) { try { ytPlayer.loadVideoById(SONGS[i].videoId); } catch (e) {} } }
  function skipNext() { state.songIdx = (state.songIdx + 1) % SONGS.length; state.currentTime = 0; loadSong(state.songIdx); renderAudio(); }
  function skipPrev() {
    state.songIdx = state.currentTime > 3 ? state.songIdx : (state.songIdx - 1 + SONGS.length) % SONGS.length;
    state.currentTime = 0; loadSong(state.songIdx); renderAudio();
  }
  function selectSong(i) { state.songIdx = i; state.currentTime = 0; loadSong(i); renderAudio(); }
  function seekTo(e) {
    const t = Number(e.target.value);
    state.currentTime = t;
    if (ytReady && ytPlayer) { try { ytPlayer.seekTo(t, true); } catch (err) {} }
    renderAudio();
  }
  function setVol(e) {
    const v = Number(e.target.value);
    state.volume = v; state.muted = false;
    if (ytReady && ytPlayer) { try { ytPlayer.setVolume(Math.round(v * 100)); ytPlayer.unMute(); } catch (err) {} }
    renderAudio();
  }
  function toggleMute() {
    state.muted = !state.muted;
    if (ytPlayer) {
      try {
        if (state.muted) ytPlayer.mute();
        else { ytPlayer.unMute(); ytPlayer.setVolume(Math.round(state.volume * 100)); }
      } catch (e) {}
    }
    renderAudio();
  }

  function renderPlaylist() {
    const wrap = $('playlist');
    wrap.innerHTML = SONGS.map((s, i) => {
      const active = i === state.songIdx;
      const row = 'display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;border-bottom:1px solid rgba(212,130,110,.06);background:' + (active ? 'rgba(212,130,110,.07)' : 'transparent');
      const dot = 'width:5px;height:5px;border-radius:50%;flex-shrink:0;background:' + (active ? '#d4826e' : 'transparent') + ';border:1px solid rgba(212,130,110,' + (active ? '.5' : '.18') + ')';
      const title = 'font-size:12px;font-weight:' + (active ? '600' : '400') + ';color:' + (active ? '#f5ede8' : '#9ab8bb') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      return '<div onclick="App.selectSong(' + i + ')" data-hover="background:rgba(212,130,110,.06)" style="' + row + '">' +
        '<div style="' + dot + '"></div>' +
        '<div style="min-width:0;flex:1"><div style="' + title + '">' + s.title + '</div>' +
        '<div style="font-family:\'DM Mono\',monospace;font-size:9px;color:#7a5a58">' + s.artist + '</div></div>' +
        '<span style="font-family:\'DM Mono\',monospace;font-size:9px;color:#4a3232">' + fmt(s.duration) + '</span></div>';
    }).join('');
    bindHover(wrap);
  }

  function renderYtLinks() {
    const wrap = $('yt-links');
    wrap.innerHTML = SONGS.map((s) =>
      '<a href="' + s.ytUrl + '" target="_blank" rel="noopener" data-hover="background:rgba(212,130,110,.05);color:#f5ede8;border-color:rgba(212,130,110,.28)" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border:1px solid rgba(212,130,110,.1);color:#9ab8bb;text-decoration:none">' +
      '<div><div style="font-size:12px;font-weight:500;color:#f5ede8;margin-bottom:1px">' + s.title + '</div>' +
      '<div style="font-family:\'DM Mono\',monospace;font-size:9px;color:#4a3232">' + s.artist + '</div></div>' +
      '<i class="ph ph-arrow-square-out" style="font-size:13px;flex-shrink:0;margin-left:8px;color:#d4826e"></i></a>'
    ).join('');
    bindHover(wrap);
  }
  function toggleYtLinks() {
    state.ytLinksOpen = !state.ytLinksOpen;
    $('yt-links').style.display = state.ytLinksOpen ? 'flex' : 'none';
    $('yt-caret').style.transform = state.ytLinksOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  }

  function renderAudio() {
    const s = SONGS[state.songIdx];
    const cover = 'https://img.youtube.com/vi/' + s.videoId + '/mqdefault.jpg';
    setAttr('ap-cover', 'src', cover); setAttr('ap-cover', 'alt', s.title);
    setAttr('mp-cover', 'src', cover); setAttr('mp-cover', 'alt', s.title);
    setText('ap-title', s.title); setText('ap-artist', s.artist);
    setText('mp-title', s.title); setText('mp-artist', s.artist);
    setText('ap-cur', fmt(state.currentTime)); setText('ap-dur', fmt(s.duration));

    [['ap-seek'], ['mp-seek']].forEach(([id]) => {
      const el = $(id); if (!el) return;
      el.max = s.duration;
      if (!seekActive) el.value = state.currentTime;
    });

    const playIcon = state.playing ? 'ph ph-pause' : 'ph ph-play';
    ['ap-play-icon', 'mp-play-icon'].forEach((id) => { const el = $(id); if (el) el.className = playIcon; });

    const muteIcon = state.muted ? 'ph ph-speaker-slash' : (state.volume < 0.3 ? 'ph ph-speaker-low' : 'ph ph-speaker-high');
    ['ap-mute-icon', 'mp-mute-icon'].forEach((id) => { const el = $(id); if (el) el.className = muteIcon; });

    const vol = $('ap-vol'); if (vol) vol.value = state.muted ? 0 : state.volume;

    const pulse = $('ap-pulse');
    if (pulse) {
      pulse.style.background = state.playing ? '#d4826e' : 'rgba(212,130,110,.2)';
      pulse.style.animation = state.playing ? 'pulse 1.5s ease infinite' : 'none';
    }

    if (state.songIdx !== lastSong) { lastSong = state.songIdx; renderPlaylist(); }
  }

  function initYT() {
    try {
      ytPlayer = new YT.Player('yt-player', {
        height: '1', width: '1',
        videoId: SONGS[state.songIdx].videoId,
        playerVars: { autoplay: 1, controls: 0, rel: 0, iv_load_policy: 3, playsinline: 1 },
        events: {
          onReady: (e) => {
            ytReady = true;
            e.target.setVolume(Math.round(state.volume * 100));
            // Start muted so the browser permits autoplay, then begin playback.
            e.target.mute();
            e.target.playVideo();
            state.playing = true; renderAudio();
            tryUnmute(); // unmute immediately if the visitor already interacted
          },
          onStateChange: (e) => {
            if (e.data === 1) { state.playing = true; renderAudio(); }
            if (e.data === 2) { state.playing = false; renderAudio(); }
            if (e.data === 0) skipNext();
          },
        },
      });
    } catch (err) { setTimeout(() => { state.playing = true; renderAudio(); }, 800); }
  }

  function bootYT() {
    if (window.YT && window.YT.Player) { initYT(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); initYT(); };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onerror = () => setTimeout(() => { state.playing = true; renderAudio(); }, 800);
      document.head.appendChild(tag);
    }
  }

  /* ── Featured media (serie / allium / uje) ──────────────── */
  function renderFeatured(id, items, count) {
    const wrap = $(id);
    wrap.innerHTML = items.slice(0, count).map((it, i) => {
      const delay = i * 80;
      const num = String(i + 1).padStart(2, '0');
      const media = it.video
        ? '<video data-vid src="' + it.src + '" loop muted playsinline style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block"></video>'
        : '<img src="' + it.src + '" alt="' + (it.title || '') + '" onerror="this.onerror=null;this.removeAttribute(\'src\');this.style.background=\'linear-gradient(135deg,#1a0e0a,#2a1410)\'" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block">';
      const heading = it.video
        ? '<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px"><h3 style="font-size:16px;font-weight:600;margin:0;color:#f5ede8">' + it.title + '</h3><span style="font-family:\'DM Mono\',monospace;font-size:9px;color:#d4826e;border:1px solid rgba(212,130,110,.28);padding:2px 8px;letter-spacing:.1em">LOOP</span></div>'
        : '<h3 style="font-size:16px;font-weight:600;margin:0 0 9px;color:#f5ede8">' + it.title + '</h3>';
      const desc = it.desc ? '<p style="font-size:14px;color:#9ab8bb;line-height:1.75;margin:0">' + it.desc + '</p>' : '';
      return '<div style="margin-bottom:80px;opacity:0;transform:translateY(32px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)" data-r="1" data-d="' + delay + '">' +
        media +
        '<div style="padding:20px 0 0;display:flex;gap:20px;align-items:flex-start">' +
        '<span style="font-family:\'DM Mono\',monospace;font-size:11px;color:#d4826e;opacity:.4;min-width:26px;flex-shrink:0;padding-top:3px">' + num + '</span>' +
        '<div>' + heading + desc + '</div></div></div>';
    }).join('');
  }

  /* ── Boot ───────────────────────────────────────────────── */
  function init() {
    renderFeatured('serie-featured', SI, 4);
    renderFeatured('allium-featured', AI, 4);
    renderFeatured('uje-featured', UJEI, 6);
    renderPlaylist();
    renderYtLinks();
    renderAudio();
    bindHover(document);

    // keep seek slider stable while the user is dragging it
    ['ap-seek', 'mp-seek'].forEach((id) => {
      const el = $(id); if (!el) return;
      el.addEventListener('pointerdown', () => { seekActive = true; });
      el.addEventListener('pointerup', () => { seekActive = false; });
      el.addEventListener('change', () => { seekActive = false; });
    });

    // first interaction → make the autoplaying (muted) track audible
    const gestureEvents = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    const onFirstGesture = () => {
      userGestured = true;
      tryUnmute();
      gestureEvents.forEach((ev) => window.removeEventListener(ev, onFirstGesture, true));
    };
    gestureEvents.forEach((ev) => window.addEventListener(ev, onFirstGesture, { capture: true, passive: true }));

    // gallery keyboard nav
    document.addEventListener('keydown', (e) => {
      if (!state.galOpen) return;
      if (e.key === 'Escape') closeGal();
      else if (e.key === 'ArrowLeft') galStep(-1);
      else if (e.key === 'ArrowRight') galStep(1);
    });

    // playback clock — polls the YT player, falls back to simulation
    timeInterval = setInterval(() => {
      if (ytReady && ytPlayer) {
        try { state.currentTime = Math.floor(ytPlayer.getCurrentTime() || 0); renderAudio(); } catch (e) {}
      } else if (state.playing) {
        if (state.currentTime >= SONGS[state.songIdx].duration - 1) skipNext();
        else { state.currentTime += 1; renderAudio(); }
      }
    }, 1000);

    bootYT();
    setupReveal();
    setupVideos();
  }

  /* public API used by inline handlers */
  window.App = {
    go, toggleNav, openGal, closeGal, galStep,
    togglePlay, skipNext, skipPrev, selectSong, seekTo, setVol, toggleMute, toggleYtLinks,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
