/* =====================================================
   RADIO ULTRA GAMMA — Interactive Electromagnetic Spectrum
   ===================================================== */

(function () {
  'use strict';

  /* ---------- CONFIG ---------- */
  const SCALE_SPACING = 203;
  const WL_COUNT = 23;
  const FR_COUNT = 22;
  const SCALE_START_LEFT = 1019;  // must match `.scale { left: }` in CSS

  const WAVE_TYPES = [
    'LONG WAVES',
    'RADIO WAVES',
    'MICROWAVES',
    'INFRA-RED',
    'LIGHT',
    'ULTRAVIOLET',
    'X-RAYS',
    'GAMMA RAYS',
    'SHORT WAVES'
  ];

  /* ---------- SCALES ---------- */
  const WL_POWERS = [];
  for (let p = 6; p >= 6 - (WL_COUNT - 1); p--) WL_POWERS.push(p);
  const FR_POWERS = [];
  for (let p = 2; p <= 2 + (FR_COUNT - 1); p++) FR_POWERS.push(p);

  const SUP = { '-': '⁻', '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
  function formatPow(base, exp) {
    const expStr = String(exp).split('').map(c => SUP[c] || c).join('');
    return `${base}${expStr}`;
  }

  function buildScale(ticksId, labelsId, count, powers) {
    const ticksEl  = document.getElementById(ticksId);
    const labelsEl = document.getElementById(labelsId);
    if (!ticksEl || !labelsEl) return;
    ticksEl.innerHTML = '';
    labelsEl.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const x = i * SCALE_SPACING;

      const tick = document.createElement('div');
      tick.className = 'tick';
      tick.style.left = x + 'px';
      ticksEl.appendChild(tick);

      const label = document.createElement('div');
      label.className = 'label';
      label.style.left = x + 'px';
      label.textContent = formatPow('10', powers[i]);
      labelsEl.appendChild(label);
    }
  }

  function buildTypeLabels() {
    const wrap = document.getElementById('typeLabels');
    if (!wrap) return;
    wrap.innerHTML = '';

    // Positions along the scale region (x-offset within the scale)
    const positions = [0, 400, 1200, 1900, 2450, 2680, 3150, 3750, 4450];
    // Per-label nudges (px, positive = right): LONG, RADIO, MICRO, INFRA, LIGHT, UV, XRAY, GAMMA, SHORT
    const labelOffsets = [-10, -15, -35, -87, -40, 10, 30, -15, -55];

    positions.forEach((p, i) => {
      const baseLeft = SCALE_START_LEFT + p;

      const tick = document.createElement('div');
      tick.className = 'type-tick';
      tick.style.left = (baseLeft + labelOffsets[i]) + 'px';
      wrap.appendChild(tick);

      const label = document.createElement('div');
      label.className = 'type-label';
      label.style.left = (baseLeft + 4 + labelOffsets[i]) + 'px';
      label.textContent = WAVE_TYPES[i];
      wrap.appendChild(label);
    });
  }

  /* ---------- BLOCK INTERACTIONS ---------- */
  function repositionAllBlocks() {
    document.querySelectorAll('.info-block').forEach(positionBlock);
  }

  function initBlocks() {
    const blocks = document.querySelectorAll('.info-block');
    const buttons = document.querySelectorAll('.toggle-btn');

    repositionAllBlocks();

    buttons.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const target = btn.getAttribute('data-target');
        const block = document.querySelector(`.info-block[data-block="${target}"]`);
        if (!block) return;
        const wasOpen = block.classList.contains('is-open');

        // Close every block
        blocks.forEach(b => b.classList.remove('is-open'));
        // Open current if it was closed
        if (!wasOpen) block.classList.add('is-open');

        // Re-anchor all blocks (sizes may have changed)
        // Wait a tick so layout settles first
        requestAnimationFrame(repositionAllBlocks);
      });

      // Update aria-label based on state
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        const block = document.querySelector(`.info-block[data-block="${target}"]`);
        if (!block) return;
        btn.setAttribute('aria-label', block.classList.contains('is-open') ? 'Less info' : 'More info');
      });
    });

    // Close open block when clicking outside
    document.addEventListener('click', e => {
      if (e.target.closest('.info-block')) return;
      const anyOpen = [...blocks].some(b => b.classList.contains('is-open'));
      if (!anyOpen) return;
      blocks.forEach(b => b.classList.remove('is-open'));
      document.querySelectorAll('.toggle-btn').forEach(btn => btn.setAttribute('aria-label', 'More info'));
      requestAnimationFrame(repositionAllBlocks);
      setTimeout(repositionAllBlocks, 270);
    });
  }

  // Put block's bottom edge on the wave centerline (anchor's center)
  function positionBlock(block) {
    const waveWrap = document.getElementById('waveWrap');
    if (!waveWrap) return;
    const waveCenter = waveWrap.offsetTop + waveWrap.offsetHeight / 2;
    block.style.top = (waveCenter - block.offsetHeight) + 'px';
  }

  /* ---------- PARALLAX (info-blocks only, lerp 0.08) ---------- */
  function initParallax() {
    const blocks = document.querySelectorAll('.info-block');
    blocks.forEach(block => {
      block._baseLeft = parseFloat(block.style.left) || 0;
      block._lerpX    = block._baseLeft - window.scrollX;
      block.style.left = block._lerpX + 'px';
    });
    (function tick() {
      const sx = window.scrollX;
      blocks.forEach(block => {
        const target  = block._baseLeft - sx;
        block._lerpX += (target - block._lerpX) * 0.4;
        block.style.left = block._lerpX + 'px';
      });
      requestAnimationFrame(tick);
    })();
  }

  /* ---------- WHEEL → HORIZONTAL SCROLL ---------- */
  function initWheelScroll() {
    document.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        window.scrollBy({ left: e.deltaY, behavior: 'auto' });
        e.preventDefault();
      }
    }, { passive: false });
  }

  /* ---------- IMAGE LOAD ---------- */
  function initImageReposition() {
    // Re-measure blocks as images finish loading
    document.querySelectorAll('img').forEach(img => {
      if (img.complete) return;
      img.addEventListener('load', () => requestAnimationFrame(repositionAllBlocks));
      img.addEventListener('error', () => requestAnimationFrame(repositionAllBlocks));
    });
  }

  /* ---------- INIT ---------- */
  function init() {
    buildScale('wlTicks', 'wlLabels', WL_COUNT, WL_POWERS);
    buildScale('frTicks', 'frLabels', FR_COUNT, FR_POWERS);
    buildTypeLabels();
    initBlocks();
    initParallax();
    initWheelScroll();
    initImageReposition();

    window.addEventListener('resize', repositionAllBlocks);
    window.addEventListener('load',  repositionAllBlocks);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
