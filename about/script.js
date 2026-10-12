/* ==========================================================================
   TheoCraft — 关于页交互脚本
   --------------------------------------------------------------------------
   · 核心成员：渲染悬停展开卡片（鼠标悬停 / 键盘聚焦展开详情）
   · 更多贡献者：渲染紧凑列表（头像 + ID + 简略介绍）
   两份名单与简介全部写在本文件顶部，想改内容改数据区即可。
   ========================================================================== */
'use strict';

(function () {

  /* ==========================================================================
     一、数据区
     ========================================================================== */

  /* 核心成员：每个人一张悬停展开卡片。
     · avatar  → 头像图片路径（相对 about/ 目录）；留空则用名字首字生成色块
     · role    → 职务
     · bio     → 详细介绍，数组，每个元素一段；留空显示占位提示
     · color   → 无头像时的色块底色 */
  const TEAM = [
    {
      name: 'Dozener',
      role: '转换器核心开发&项目总监',
      avatar: '../assets/webp/avater1.webp',
      color: '#14a794',
      bio: [
        '创意融合程序设计爱好者，初级建筑党，擅长美工设计，福瑞控（毛茸茸）',
        'TC核心开创/倡导者，负责西奥存档.City深度全量解析和软件 Java 层编写，也参与大量建筑复刻'
      ]
    },
    {
      name: 'Official Bean',
      role: '建筑复刻总监',
      avatar: '../assets/webp/avater2.webp',
      color: '#4c9a2a',
      bio: [
        '资深大师级MC建筑肝帝一个，GNwork成员，手握多座MC城市原创/复刻项目',
        '为TheoCraft贡献大量原创复刻建筑资源，同时参与建筑复刻的多层面指导',
        '<em>“建筑复刻方面，我们杜绝AI“</em>'
      ]
    },
    {
      name: '疯潮Fren',
      role: 'UI 设计总监',
      avatar: '../assets/webp/avater3.webp',
      color: '#0f6259',
      bio: [
        'Dingdua大学的学堂路区神（雾），MC复刻西奥建筑开创者，擅长前后端全栈开发（熟练使用AI偷懒）',
        'TheoCraft官网前端设计与维护，浅层技术支持等',
        '<em>“←不不不让我拥抱AI，爱让记忆更珍贵</br>（AI makes RAM more expensive）”</em>'
      ]
    }
  ];

  /* 更多（次要）贡献者：人数不限，直接往数组里加即可。
     · avatar → 头像路径，留空用 ID 首字生成色块
     · id     → 昵称 / ID
     · desc   → 一句简略介绍
   */
  const CONTRIBUTORS = [
    { id: 'DICECAN', desc: '姊妹项目Chunkoid现维护者，常参与TC的讨论和技术支持', avatar: '../assets/webp/avater4.webp' },
    { id: '零号小明', desc: '提供了一个大型城市存档，对于项目早期解析有很大帮助', avatar: '../assets/webp/avater5.webp' },
    { id: 'corax', desc: '西奥插件制作爱好者，在TCP插适平台中提供帮助和支持', avatar: '../assets/webp/avater6.webp' },
    { id: 'Ryan Steven', desc: '作者的好朋友~', avatar: '../assets/webp/avater7.webp' }
  ];

  /* ==========================================================================
     二、渲染
     ========================================================================== */

  const memberEl = document.getElementById('memberList');
  const contribEl = document.getElementById('contribList');

  /* 名字 / ID 首字，用于生成纯色头像 */
  function initialOf(text) {
    return (text || '?').trim().charAt(0).toUpperCase();
  }

  /* 头像：有图用图，没图用带底色的首字方块 */
  function avatarHTML(item, className, fallbackInitial) {
    if (item.avatar) {
      return '<span class="' + className + '"><img src="' + item.avatar + '" alt="" loading="lazy"></span>';
    }
    return '<span class="' + className + '" style="background:' + (item.color || '#14a794') + '">' +
      fallbackInitial + '</span>';
  }

  /* ---- 核心成员卡片 ---- */
  function renderMembers() {
    if (!memberEl) return;

    memberEl.innerHTML = TEAM.map(function (m, i) {
      const bioList = (m.bio && m.bio.length)
        ? m.bio
        : ['详细介绍占位，之后手动补写。'];

      const detail = bioList.map(function (p) {
        return '<p>' + p + '</p>';
      }).join('');

      return '' +
        '<article class="member reveal" style="--d:' + (i * 90) + 'ms" tabindex="0" ' +
          'aria-label="' + m.name + '，' + m.role + '，聚焦查看详细介绍">' +
          '<div class="member__head">' +
            avatarHTML(m, 'member__avatar', initialOf(m.name)) +
            '<div>' +
              '<h3 class="member__name">' + m.name + '</h3>' +
              '<p class="member__role">' + m.role + '</p>' +
            '</div>' +
            '<span class="member__caret" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
                'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M6 9l6 6 6-6"></path>' +
              '</svg>' +
            '</span>' +
          '</div>' +
          '<div class="member__detail"><div>' + detail + '</div></div>' +
          '<p class="member__hint">悬停查看详细介绍</p>' +
        '</article>';
    }).join('');
  }

  /* ---- 更多贡献者列表 ---- */
  function renderContributors() {
    if (!contribEl) return;

    contribEl.innerHTML = CONTRIBUTORS.map(function (c) {
      return '' +
        '<li class="contrib">' +
          avatarHTML(c, 'contrib__avatar', initialOf(c.id)) +
          '<div>' +
            '<p class="contrib__id">' + c.id + '</p>' +
            '<p class="contrib__desc">' + c.desc + '</p>' +
          '</div>' +
        '</li>';
    }).join('');
  }

  /* ---- 启动 ---- */
  renderMembers();
  renderContributors();

  if (window.TC && window.TC.initReveal) {
    try { window.TC.initReveal(); } catch (err) {
      if (window.console && console.error) console.error('[TheoCraft] initReveal 失败：', err);
    }
  }
})();