/* ==========================================================================
   TheoCraft — 全站共享脚本（base.js）
   --------------------------------------------------------------------------
   只放每个页面都要用的通用模块，统一挂在 window.TC 上：
     · initTheme   白天 / 黑夜模式（读 localStorage，跟随系统）
     · initNav     汉堡菜单开合 + 导航栏透明→实底（有首屏大图才透明）
     · initYear    自动填充页脚年份
     · initReveal  滚动入场动画（各页脚本渲染完动态节点后再调用）
     · initCopy    一键复制（带 [data-copy] 的按钮，用于 QQ 群号等）
   页面脚本（各目录下的 script.js）在 defer 顺序中排在本文件之后，
   所以可以直接使用 window.TC。
   纯原生 JS，零框架、零外部请求。
   ========================================================================== */
'use strict';

(function () {

  /* ------------------------------------------------------------------------
     1) 白天 / 黑夜模式
        · 首选读 localStorage，其次跟随系统 prefers-color-scheme
        · 首屏那一瞬的主题由各页 <head> 里的内联脚本决定，这里只管切换和记忆
     ------------------------------------------------------------------------ */
  function initTheme() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    const STORAGE_KEY = 'theocraft-theme';
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    function readSaved() {
      try {
        const v = localStorage.getItem(STORAGE_KEY);
        return (v === 'light' || v === 'dark') ? v : null;
      } catch (e) {
        return null;
      }
    }

    function apply(theme, persist) {
      document.documentElement.setAttribute('data-theme', theme);
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute('aria-label', theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
      if (persist) {
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* 隐私模式下忽略 */ }
      }
    }

    apply(readSaved() || (mq.matches ? 'dark' : 'light'), false);

    btn.addEventListener('click', function () {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      // 切换时临时给所有元素加一层颜色过渡，避免整页颜色硬切
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const root = document.documentElement;
      if (!reduce) {
        root.classList.add('is-theme-switching');
        window.setTimeout(function () { root.classList.remove('is-theme-switching'); }, 420);
      }
      apply(next, true);
    });

    // 用户从没手动选过时，跟随系统夜间模式的变化
    function onSystemChange(e) {
      if (!readSaved()) apply(e.matches ? 'dark' : 'light', false);
    }
    if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);   // 老浏览器兜底
  }

  /* ------------------------------------------------------------------------
     2) 导航栏：汉堡菜单开合 + 滚过首屏后变实底
        首页有全屏大图（#top = .hero）→ 大图范围内透明白字；
        内页没有大图 → 一直是实底毛玻璃。
     ------------------------------------------------------------------------ */
  function initNav() {
    const nav = document.getElementById('siteNav');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!nav || !toggle || !links) return;

    const DESKTOP_BP = 860;   // 需要和 base.css 里的 860px 保持一致

    function setOpen(open) {
      links.classList.toggle('is-open', open);
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    }

    function isOpen() {
      return links.classList.contains('is-open');
    }

    toggle.addEventListener('click', function () { setOpen(!isOpen()); });

    // 移动端点完链接后自动收起
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Esc 关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    // 点菜单外部关闭（toggle 在 nav 内部，所以不会被误关）
    document.addEventListener('click', function (e) {
      if (isOpen() && !nav.contains(e.target)) setOpen(false);
    });

    // 从窄屏拉宽到桌面时，把菜单状态清掉，避免残留
    window.addEventListener('resize', function () {
      if (window.innerWidth > DESKTOP_BP && isOpen()) setOpen(false);
    });

    /* 导航栏两态：有首屏大图时，还在大图范围内 → 透明 + 白字；
       滚过大图 / 内页无大图 → 换实底色毛玻璃 */
    function onScroll() {
      const navH = nav.offsetHeight || 68;
      const hero = document.getElementById('top');
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : -1;
      nav.classList.toggle('is-solid', !hero || heroBottom <= navH - 6);
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ------------------------------------------------------------------------
     3) 页脚年份
     ------------------------------------------------------------------------ */
  function initYear() {
    const el = document.getElementById('footerYear');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------------------------------
     4) 滚动入场动画
        用 IntersectionObserver 给 .reveal 加 .is-in；
        入场用 CSS animation 而不是 transition，不会和 hover 的 transform 抢属性。
        各页脚本渲染完动态节点后再调用。
     ------------------------------------------------------------------------ */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function showAll() {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
    }

    if (reduce || !('IntersectionObserver' in window)) { showAll(); return; }

    let io;
    try {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);      // 只播一次
        });
      }, {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0
      });
    } catch (err) {
      showAll();                           // 观察器建不起来就干脆全部显示
      return;
    }

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------------
     5) 一键复制（官方 QQ 群号等）
        带 [data-copy] 的按钮：点击复制其值，按钮文案短暂变成「已复制」。
        · data-copy      要复制的文本
        · data-copy-done 复制成功后的提示文案（默认「已复制」）
        navigator.clipboard 在 file:// 或非安全上下文不可用，退回 execCommand。
     ------------------------------------------------------------------------ */
  function initCopy() {
    const buttons = Array.prototype.slice.call(document.querySelectorAll('[data-copy]'));
    if (!buttons.length) return;

    function legacyCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }

    function write(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(function () {
          return true;
        }, function () {
          return legacyCopy(text);
        });
      }
      return Promise.resolve(legacyCopy(text));
    }

    buttons.forEach(function (btn) {
      const label = btn.querySelector('.js-copy-text') || btn;
      const origin = label.textContent;
      let timer = null;

      btn.addEventListener('click', function () {
        const text = btn.getAttribute('data-copy');
        if (!text) return;

        write(text).then(function (ok) {
          if (!ok) return;
          label.textContent = btn.getAttribute('data-copy-done') || '已复制 ✓';
          btn.classList.add('is-copied');
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            label.textContent = origin;
            btn.classList.remove('is-copied');
          }, 2000);
        });
      });
    });
  }

  /* 对外暴露 */
  window.TC = {
    initTheme: initTheme,
    initNav: initNav,
    initYear: initYear,
    initReveal: initReveal,
    initCopy: initCopy
  };

  /* 基础模块随脚本立刻启动（script 带 defer，执行到这里 DOM 已就绪）。
     initReveal 不在其中：要等各页脚本渲染完动态内容后再手动调用。 */
  [initTheme, initNav, initYear, initCopy].forEach(function (init) {
    try {
      init();
    } catch (err) {
      if (window.console && console.error) console.error('[TheoCraft] 基础模块初始化失败：', init.name, err);
    }
  });
})();