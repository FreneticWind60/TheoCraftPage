/* ==========================================================================
   TheoCraft — 首页交互脚本
   --------------------------------------------------------------------------
   · 纯原生 JavaScript，没有任何框架、没有构建步骤
   · 全程不发任何网络请求：实例、评价都写在本文件的数据区
   · 通用模块（主题 / 导航 / 页脚年份 / 滚动入场）在 assets/js/base.js，
     通过 window.TC 使用
   ========================================================================== */
'use strict';

/* ==========================================================================
   一、数据区  —— 想改内容，改这里就够了
   ========================================================================== */

/* --------------------------------------------------------------------------
   1) 转化实例（第 3 屏横向滚动列表）
      图片统一放在 assets/ 目录下，换成你自己的图时，保证 before / after
      两张图尺寸一致、取景一致，卡片里才能对得上。
   -------------------------------------------------------------------------- */
const CONVERSIONS = [
  {
    city: '翡翠湾',
    mode: '独立城市',                 // 转换模式：地面投影 / 地图画
    scale: '中等比例',              // 规模
    height: 'y 62–78',                // 建筑高度范围
    note: '海岸做了平滑处理，高度坡面按原世界逐格对齐。',
    before: 'assets/webp/before-1.webp',    // TheoTown 原图
    after: 'assets/webp/after-1.webp'       // Minecraft 效果图
  },
  {
    city: '旧城北区',
    mode: '区域城市',
    scale: '中等比例',
    height: 'y 128 单层',
    note: '软件道路映射完美，高架拐角岔口等完整还原。',
    before: 'assets/webp/before-2.webp',
    after: 'assets/webp/after-2.webp'
  },
  {
    city: '中央CBD',
    mode: '独立城市',
    scale: '中等比例',
    height: 'y 62–74',
    note: '大师级城建，巨量细节还原中央商务区',
    before: 'assets/webp/before-3.webp',
    after: 'assets/webp/after-3.webp'
  },
  {
    city: '市郊农区',
    mode: '独立城市',
    scale: '中等比例',
    height: 'y 63–70',
    note: '还原市郊农区的详细结构',
    before: 'assets/webp/before-4.webp',
    after: 'assets/webp/after-4.webp'
  },
  {
    city: '山下工业区',
    mode: '区域城市',
    scale: '小比例',
    height: 'y 96 单层',
    note: '小尺寸试水，一分钟出稿，先看效果再决定做大的。',
    before: 'assets/webp/before-5.webp',
    after: 'assets/webp/after-5.webp'
  }
];

/* --------------------------------------------------------------------------
   2) 用户评价（第 4 屏，10 秒轮播一条）
      想换成真实评价，直接改这个数组；条数不限，建议 5–8 条。
      stars 为 1–5 的整数。纯展示，不再收集用户输入。
   -------------------------------------------------------------------------- */
const REVIEWS = [
  {
    name: '像素老王',
    role: 'TheoTown 5 年老玩家',
    stars: 5,
    text: '我那个 40 万人口的存档，以前只能截图看着。现在能真的走进去，第一次进世界的时候有点想哭。'
  },
  {
    name: 'Momo_红石',
    role: 'Minecraft 建筑服服主',
    stars: 5,
    text: '比例算得挺准，西奥1格=麦块区块，差不多就是原图的样子。'
  },
  {
    name: '南屿',
    role: '插件开发者',
    stars: 4,
    text: '支持很多西奥的插件，开发人员手动适配的吗？太辛苦了。要是之后能适配更多插件就更完美了。'
  },
  {
    name: 'Kai',
    role: '建筑党',
    stars: 5,
    text: '本来没指望能转换好的，但是没想到转换精度那么高。这样一来，MC城建区马上就要迎来大变了。'
  },
  {
    name: '码农出击',
    role: '程序员 建筑党',
    stars: 4,
    text: '做得还行，就是包体积有点大，希望能推出在线版！'
  },
  {
    name: 'Lily_404',
    role: 'Minecraft 生存服服主',
    stars: 5,
    text: '完全不懂命令行，拖个存档进去点一下就好了。我把我家那片老城区搬进了服务器，朋友都说牛。'
  }
];

/* ==========================================================================
   二、交互模块
   ========================================================================== */

/* --------------------------------------------------------------------------
   2.1 首屏拖动对比
        鼠标和触摸都走 Pointer Events，一套逻辑通吃；
        进度存在 CSS 变量 --pos 上，图片用 clip-path 裁剪。
   -------------------------------------------------------------------------- */
function initCompare() {
  const box = document.getElementById('compare');
  if (!box) return;

  let ratio = 0.5;      // 0 = 全显示左边，1 = 全显示右边
  let dragging = false;

  function paint(value) {
    ratio = Math.min(1, Math.max(0, value));
    box.style.setProperty('--pos', (ratio * 100).toFixed(3) + '%');
    box.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  }

  // 把鼠标/手指的屏幕坐标换算成 0–1 的进度
  function paintFromClientX(clientX) {
    const rect = box.getBoundingClientRect();
    if (!rect.width) return;
    paint((clientX - rect.left) / rect.width);
  }

  // 第一次交互后，收掉「拖动对比」提示和手柄晃动
  function markTouched() {
    box.classList.add('has-touched');
  }

  // ---- 按下：开始拖动，并立即跳到按下的位置 ----
  box.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;  // 只响应鼠标左键
    dragging = true;
    markTouched();
    box.classList.add('is-dragging');
    // 捕获指针：拖出图片范围也能继续跟手
    if (box.setPointerCapture) {
      try { box.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
    }
    paintFromClientX(e.clientX);
  });

  // ---- 拖动 ----
  box.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    paintFromClientX(e.clientX);
    e.preventDefault();
  });

  // ---- 松开 / 取消：结束拖动 ----
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    box.classList.remove('is-dragging');
    if (box.releasePointerCapture && e && e.pointerId !== undefined) {
      try { box.releasePointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
    }
  }
  box.addEventListener('pointerup', endDrag);
  box.addEventListener('pointercancel', endDrag);
  window.addEventListener('pointerup', endDrag);      // 兜底：在窗口外松开鼠标

  // ---- 键盘支持（无障碍）：← → 微调，Home / End 到两端 ----
  box.addEventListener('keydown', function (e) {
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === 'ArrowLeft') { markTouched(); paint(ratio - step); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { markTouched(); paint(ratio + step); e.preventDefault(); }
    else if (e.key === 'Home') { markTouched(); paint(0); e.preventDefault(); }
    else if (e.key === 'End') { markTouched(); paint(1); e.preventDefault(); }
  });

  // 拖到一半调整窗口大小，保持相对位置
  window.addEventListener('resize', function () { paint(ratio); });

  paint(0.5);
}

/* --------------------------------------------------------------------------
   2.2 首屏文案框：鼠标移上来时，整张对比图高斯模糊
        故意不在 CSS 里用 :hover 做，而是加一个 .is-focus 到 .hero 上——
        这样鼠标悬停和键盘 focus 能用同一套逻辑，触屏设备也不受影响。
   -------------------------------------------------------------------------- */
function initHeroPanel() {
  const hero = document.querySelector('.hero');
  const panel = document.getElementById('heroPanel');
  if (!hero || !panel) return;

  function setFocus(on) {
    hero.classList.toggle('is-focus', on);
  }

  panel.addEventListener('mouseenter', function () { setFocus(true); });
  panel.addEventListener('mouseleave', function () { setFocus(false); });

  // 键盘 Tab 进框内的按钮 / 链接时同样模糊底图
  panel.addEventListener('focusin', function () { setFocus(true); });
  panel.addEventListener('focusout', function () {
    // 末条动态时 nextBtn 被 disabled，浏览器会把焦点移出面板并触发本事件，
    // 但用户鼠标仍悬停在框内，不应退出聚焦态 —— 延迟一拍后用 :hover 复核
    window.setTimeout(function () {
      if (panel.contains(document.activeElement) || panel.matches(':hover')) return;
      setFocus(false);
    }, 0);
  });
}

/* --------------------------------------------------------------------------
   2.3 首屏轮播：对比图 ↔ 背景图一 ↔ 背景图二
        每 5 秒自动切到下一画面；用户拖动对比轴时暂停，松手后恢复计时。
        切换通过给 .hero__stage 写 data-view（0/1/2）完成，CSS 负责淡入淡出；
        底部圆点指示器与画面双向同步，点击圆点直接跳转。
   -------------------------------------------------------------------------- */
function initHeroAlternation() {
  var stage = document.querySelector('.hero__stage');
  var compare = document.getElementById('compare');
  var dotsBox = document.getElementById('heroDots');
  if (!stage || !compare) return;

  var TOTAL = dotsBox ? dotsBox.querySelectorAll('.hero__dot').length : 0;
  if (TOTAL < 2) TOTAL = Math.max(TOTAL, 3);   // 圆点缺失时仍按三态轮播

  var INTERVAL = 5000;        // 5 秒切换
  var timerId = null;
  var view = 0;               // 当前画面：0=对比图 1=背景图一 2=背景图二
  var userInteracting = false; // 用户正在拖动对比轴

  function apply(next) {
    view = (next + TOTAL) % TOTAL;
    stage.setAttribute('data-view', String(view));
    if (dotsBox) {
      var dots = dotsBox.querySelectorAll('.hero__dot');
      for (var i = 0; i < dots.length; i++) {
        var on = i === view;
        dots[i].classList.toggle('is-active', on);
        dots[i].setAttribute('aria-selected', on ? 'true' : 'false');
      }
    }
  }

  function start() {
    stop();
    timerId = window.setInterval(function () {
      if (!userInteracting) apply(view + 1);
    }, INTERVAL);
  }

  function stop() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  // 点击圆点 → 跳转到对应画面并重新计时
  if (dotsBox) {
    dotsBox.addEventListener('click', function (e) {
      var dot = e.target.closest ? e.target.closest('.hero__dot') : null;
      if (!dot) return;
      apply(parseInt(dot.getAttribute('data-view'), 10) || 0);
      start();               // 手动跳转后从 5 秒重新倒数
    });
  }

  // 拖动开始 → 暂停计时
  compare.addEventListener('pointerdown', function () {
    userInteracting = true;
    stop();
  });

  // 拖动结束 → 恢复计时（从 5 秒重新倒数）
  function resume() {
    if (!userInteracting) return;
    userInteracting = false;
    start();
  }
  compare.addEventListener('pointerup', resume);
  compare.addEventListener('pointercancel', resume);
  window.addEventListener('pointerup', resume);

  // 页面切到后台暂停，省电
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  apply(0);
  start();
}

/* --------------------------------------------------------------------------
   2.4 开发动态图文：文案层向右翻页
        数据来自 assets/js/devlog.js（window.TC_DEVLOG，增改条目只动那个文件）。
        桌面端点【查看动态 >>】进入；触屏左右滑动切换。
        不做循环：首条再向左 = 返回主文案（prev 兼任返回），末条 next 置灰。
        切换动画发生在容器内部（轨道位移），容器本体只做小幅视差惯性偏移。
   -------------------------------------------------------------------------- */
function initHeroDevlog() {
  var panel = document.getElementById('heroPanel');
  var devlogPage = document.getElementById('heroDevlog');
  var openBtn = document.getElementById('heroDevlogBtn');
  if (!panel || !devlogPage || !openBtn) return;

  var data = window.TC_DEVLOG;
  if (!data || !data.length) {          // 无动态：隐藏入口，主文案保持原样
    openBtn.style.display = 'none';
    return;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // --- 渲染动态页：内部滑动轨道（图上文下）+ 底部时间轴 + 左右切换器 ---
  var slides = data.map(function (item) {
    var img = item.img
      ? '<img src="' + esc(item.img) + '" alt="" draggable="false" loading="lazy">'
      : '';
    return '' +
      '<article class="devlog__slide">' +
        '<div class="devlog__media">' + img + '</div>' +
        '<div class="devlog__body">' +
          '<h3 class="devlog__title">' + esc(item.title) + '</h3>' +
          '<p class="devlog__text">' + esc(item.text) + '</p>' +
        '</div>' +
      '</article>';
  }).join('');

  // 时间轴胶囊：每条动态一个，渲染 date 数据
  var capsules = data.map(function (item, i) {
    return '<span class="devlog__tcap' + (i === 0 ? ' is-active' : '') +
      '" data-i="' + i + '">' + esc(item.date) + '</span>';
  }).join('');

  devlogPage.innerHTML = '' +
    '<div class="devlog">' +
      '<div class="devlog__viewport">' +
        '<div class="devlog__track" id="devlogTrack">' + slides + '</div>' +
      '</div>' +
      '<div class="devlog__nav">' +
        '<button class="devlog__btn" type="button" data-act="prev" aria-label="上一条动态（第一条时返回主文案）">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"></path></svg>' +
        '</button>' +
        '<div class="devlog__timeline" id="devlogTimeline">' +
          '<div class="devlog__tl-line" aria-hidden="true"></div>' +
          '<div class="devlog__tl-track" id="devlogTlTrack">' + capsules + '</div>' +
        '</div>' +
        '<button class="devlog__btn" type="button" data-act="next" aria-label="下一条动态">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg>' +
        '</button>' +
      '</div>' +
    '</div>';

  var track = document.getElementById('devlogTrack');
  var tlTrack = document.getElementById('devlogTlTrack');
  var timeline = document.getElementById('devlogTimeline');
  var nextBtn = devlogPage.querySelector('[data-act="next"]');
  var idx = 0;

  // 时间轴居中：测量目标胶囊 offsetLeft，平移使其居中于视口。
  // 注意必须保留 translateY(-50%)：内联 transform 会整体覆盖 CSS 值，
  // 若只写 translateX 会丢掉垂直居中位，导致胶囊沉到时间轴线下方
  function centerCapsule() {
    var caps = tlTrack.querySelectorAll('.devlog__tcap');
    var cap = caps[idx];
    if (!cap || !timeline) return;
    var tlW = timeline.offsetWidth;
    var capCenter = cap.offsetLeft + cap.offsetWidth / 2;
    tlTrack.style.transform = 'translate(' + (tlW / 2 - capCenter) + 'px, -50%)';
  }

  function setSlide(n) {
    // 不循环：夹在 [0, len-1]
    idx = Math.max(0, Math.min(data.length - 1, n));
    track.style.transform = 'translateX(' + (-idx * 100) + '%)';
    // 时间轴胶囊高亮切换
    var caps = tlTrack.querySelectorAll('.devlog__tcap');
    for (var i = 0; i < caps.length; i++) {
      caps[i].classList.toggle('is-active', i === idx);
    }
    centerCapsule();
    // 末条时「下一条」置灰；「上一条」永远可点（首条时承担返回职责）
    nextBtn.disabled = idx >= data.length - 1;
  }

  // --- 容器视差惯性：与轨道移动方向同向微偏，动画结束后回弹归位 ---
  function nudge(dir) {
    panel.classList.remove('nudge-left', 'nudge-right');
    void panel.offsetWidth;               // 强制重排，动画可重复触发
    panel.classList.add(dir > 0 ? 'nudge-left' : 'nudge-right');
  }

  function openDevlog() {
    if (panel.classList.contains('is-devlog')) return;
    nudge(1);
    panel.classList.add('is-devlog');
  }
  function closeDevlog() {
    if (!panel.classList.contains('is-devlog')) return;
    nudge(-1);
    panel.classList.remove('is-devlog');
  }

  openBtn.addEventListener('click', openDevlog);

  devlogPage.addEventListener('click', function (e) {
    // 时间轴胶囊点击 → 跳转到对应动态
    var cap = e.target.closest ? e.target.closest('.devlog__tcap') : null;
    if (cap) {
      var ti = parseInt(cap.getAttribute('data-i'), 10);
      if (!isNaN(ti) && ti !== idx) {
        nudge(ti > idx ? 1 : -1);
        setSlide(ti);
      }
      return;
    }
    var btn = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    if (act === 'prev') {
      if (idx === 0) closeDevlog();       // 首条再向左 → 返回主文案
      else { nudge(-1); setSlide(idx - 1); }
    } else if (act === 'next' && idx < data.length - 1) {
      nudge(1);
      setSlide(idx + 1);
    }
  });

  // --- 触屏滑动：主文案左滑进入动态；动态页内左右滑切条目，首条右滑返回 ---
  var sx = 0, sy = 0, onTouch = false;
  panel.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { onTouch = false; return; }
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    onTouch = true;
  }, { passive: true });

  panel.addEventListener('touchend', function (e) {
    if (!onTouch) return;
    onTouch = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - sx, dy = t.clientY - sy;
    // 水平滑动意图不明显（距离短 / 纵向为主）则不干预，避免影响页面滚动
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    var onDevlog = panel.classList.contains('is-devlog');
    if (!onDevlog && dx < 0) {
      openDevlog();
    } else if (onDevlog && dx > 0) {
      if (idx === 0) closeDevlog();       // 首条右滑 → 返回主文案
      else { nudge(-1); setSlide(idx - 1); }
    } else if (onDevlog && dx < 0 && idx < data.length - 1) {  // 末条左滑不动
      nudge(1); setSlide(idx + 1);
    }
  }, { passive: true });

  setSlide(0);                            // 初始渲染：同步末条按钮置灰态

  // 窗口尺寸变化时重新居中活跃胶囊
  window.addEventListener('resize', centerCapsule);
}

/* --------------------------------------------------------------------------
   2.5 转化实例：渲染卡片 + 左右箭头滚动
   -------------------------------------------------------------------------- */
function initGallery() {
  const viewport = document.getElementById('galleryTrack');
  const list = document.getElementById('galleryList');
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');
  if (!viewport || !list) return;

  // --- 渲染卡片：每张卡片左侧原图、右侧效果图 ---
  //     reveal + --d 交给滚动入场动画，逐张错开出现
  list.innerHTML = CONVERSIONS.map(function (item, i) {
    return '' +
      '<article class="card-shot reveal" style="--d:' + (i * 80) + 'ms">' +
        '<div class="card-shot__media">' +
          '<div class="card-shot__half">' +
            '<img src="' + item.before + '" alt="' + item.city + ' 的 TheoTown 原图" loading="lazy">' +
            '<span class="card-shot__tag">TheoTown</span>' +
          '</div>' +
          '<div class="card-shot__half card-shot__half--after">' +
            '<img src="' + item.after + '" alt="' + item.city + ' 转换后的 Minecraft 效果" loading="lazy">' +
            '<span class="card-shot__tag card-shot__tag--after">Minecraft</span>' +
          '</div>' +
        '</div>' +
        '<div class="card-shot__body">' +
          '<h3 class="card-shot__city">' + item.city + '</h3>' +
          '<ul class="card-shot__meta">' +
            '<li class="meta-chip meta-chip--mode">' + item.mode + '</li>' +
            '<li class="meta-chip">' + item.scale + '</li>' +
            '<li class="meta-chip meta-chip--block">' + item.height + '</li>' +
          '</ul>' +
          '<p class="card-shot__note">' + item.note + '</p>' +
        '</div>' +
      '</article>';
  }).join('');

  // --- 每次滚动的距离 = 一张卡片宽 + 间距 ---
  function stepSize() {
    const card = list.querySelector('.card-shot');
    if (!card) return viewport.clientWidth * 0.8;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 20;
    return card.getBoundingClientRect().width + gap;
  }

  // --- 到两端时把对应箭头置灰 ---
  function updateArrows() {
    const max = viewport.scrollWidth - viewport.clientWidth;
    const left = viewport.scrollLeft;
    if (prevBtn) prevBtn.disabled = left <= 2;
    if (nextBtn) nextBtn.disabled = left >= max - 2;
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      viewport.scrollBy({ left: -stepSize(), behavior: 'smooth' });
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      viewport.scrollBy({ left: stepSize(), behavior: 'smooth' });
    });
  }

  viewport.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  // 图片加载完成后宽度会变，需要重新算一次箭头状态
  window.addEventListener('load', updateArrows);
  updateArrows();
}

/* --------------------------------------------------------------------------
   2.5 用户评价：10 秒轮播 + 手动刷新（纯展示，不收集输入）
   -------------------------------------------------------------------------- */
function initReviews() {
  const card = document.getElementById('reviewCard');
  const avatarEl = document.getElementById('reviewAvatar');
  const nameEl = document.getElementById('reviewName');
  const roleEl = document.getElementById('reviewRole');
  const starsEl = document.getElementById('reviewStars');
  const textEl = document.getElementById('reviewText');
  const barEl = document.getElementById('reviewBar');
  const timerTextEl = document.getElementById('reviewTimerText');
  const refreshBtn = document.getElementById('reviewRefreshBtn');

  if (!card || !nameEl || !textEl || REVIEWS.length === 0) return;

  const TICK_MS = 250;          // 进度条的刷新步长
  const PERIOD_MS = 10000;      // 自动换一条的间隔：10 秒
  const FADE_MS = 280;          // 要和 style.css 里 .review__card 的过渡时长一致

  let ticks = 0;                // 已经过去的时间
  let timerId = null;
  let currentIndex = -1;        // 当前显示的这条，用于避免连续抽到同一条

  const AVATAR_COLORS = ['#14a794', '#4c9a2a', '#0f6259', '#6cbb3c', '#33403f', '#0b4741'];

  /* ---- 渲染某一条评价；animate = true 时先淡出再换内容 ---- */
  function render(index, animate) {
    const item = REVIEWS[index];

    function apply() {
      if (avatarEl) {
        avatarEl.textContent = (item.name || '?').trim().charAt(0).toUpperCase();
        avatarEl.style.background = item.color || AVATAR_COLORS[index % AVATAR_COLORS.length];
      }
      nameEl.textContent = item.name;
      if (roleEl) roleEl.textContent = item.role;
      textEl.textContent = item.text;
      if (starsEl) {
        let html = '';
        for (let i = 0; i < 5; i++) {
          // 每次重建节点，星星的弹出动画就会重新播一遍
          html += '<span class="star' + (i < item.stars ? ' star--on' : '') + '">★</span>';
        }
        starsEl.innerHTML = html;
        starsEl.setAttribute('aria-label', '评价 ' + item.stars + ' 分，满分 5 分');
      }
      card.classList.remove('is-fading');
    }

    if (animate) {
      card.classList.add('is-fading');        // 透明度归零
      window.setTimeout(apply, FADE_MS);      // 等淡出结束再换文字，然后淡入
    } else {
      apply();
    }
  }

  /* ---- 随机抽一条（尽量不和上一条重复）---- */
  function pickIndex() {
    if (REVIEWS.length <= 1) return 0;
    let i = currentIndex;
    while (i === currentIndex) {
      i = Math.floor(Math.random() * REVIEWS.length);
    }
    return i;
  }

  /* ---- 进度条 + 倒计时文字 ---- */
  function updateTimerUI() {
    const left = Math.max(0, PERIOD_MS - ticks);
    if (barEl) barEl.style.width = (left / PERIOD_MS * 100) + '%';
    if (timerTextEl) timerTextEl.textContent = Math.ceil(left / 1000) + 's 后自动更换';
  }

  /* ---- 立刻换一条，并把计时器归零 ---- */
  function nextReview() {
    currentIndex = pickIndex();
    render(currentIndex, true);
    ticks = 0;
    updateTimerUI();
  }

  /* ---- 计时器：每 250ms 走一格，走满 10 秒自动换 ---- */
  function startTimer() {
    stopTimer();
    timerId = window.setInterval(function () {
      ticks += TICK_MS;
      if (ticks >= PERIOD_MS) {
        nextReview();          // 内部会把 ticks 归零并刷新进度条
      } else {
        updateTimerUI();
      }
    }, TICK_MS);
  }

  function stopTimer() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  // 手动刷新：立即换一条 + 重置 10 秒计时
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () {
      nextReview();
      startTimer();
    });
  }

  // 页面切到后台就暂停，回到前台重新计时（省电，也避免回来连跳好几条）
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  // ---- 启动 ----
  currentIndex = pickIndex();
  render(currentIndex, false);
  startTimer();
}

/* ==========================================================================
   三、启动
   （script 标签带了 defer，执行到这里 DOM 已经解析完毕；
     base.js 里的通用模块在这之前已经跑完）
   ========================================================================== */
/* 逐个跑，并且各自 try / catch：
   万一某个模块报错，后面的仍然会执行——尤其是滚动入场，
   它是把 .reveal 从 opacity:0 放出来的那一步，绝不能因为别人的错而漏掉。 */
[
  initCompare,
  initHeroPanel,
  initHeroAlternation,
  initHeroDevlog,
  initGallery,
  initReviews
].forEach(function (init) {
  try {
    init();
  } catch (err) {
    if (window.console && console.error) console.error('[TheoCraft] 首页模块初始化失败：', init.name, err);
  }
});

// 滚动入场放最后：要等画廊渲染完
if (window.TC && window.TC.initReveal) {
  try { window.TC.initReveal(); } catch (err) {
    if (window.console && console.error) console.error('[TheoCraft] initReveal 失败：', err);
  }
}