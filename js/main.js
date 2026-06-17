/* ========================================
   main.js — 主页面逻辑
   情侣空间展示页
   ======================================== */

// === 默认配置 ===
const DEFAULT_CONFIG = {
  title: '❤️ 我们的空间',
  subtitle: '记录属于我们的每一个瞬间',
  themeColor: '#ff6b9d',
  musicFile: '',
  startDate: '',
  photos: [],
  messages: [],
  anniversaries: []
};

// === 初始化 ===
let config = {};

function init() {
  loadConfig();
  applyTheme();
  renderAll();
  initHearts();
  initMusicPlayer();
  initLightbox();
}

// === 加载配置 ===
function loadConfig() {
  const saved = localStorage.getItem('couples-space-config');
  if (saved) {
    try {
      config = JSON.parse(saved);
    } catch(e) {
      config = {};
    }
  }
  // 合并默认值
  config = Object.assign({}, DEFAULT_CONFIG, config);
  // 确保数组和对象是有效的
  config.photos = config.photos || [];
  config.messages = config.messages || [];
  config.anniversaries = config.anniversaries || [];
}

// === 应用主题色 ===
function applyTheme() {
  const root = document.documentElement;
  const c = config.themeColor || '#ff6b9d';
  root.style.setProperty('--primary', c);
  // 简单的颜色变体
  root.style.setProperty('--primary-light', lightenColor(c, 0.2));
  root.style.setProperty('--primary-dark', darkenColor(c, 0.15));
}

// === 渲染所有 ===
function renderAll() {
  renderHeader();
  renderCounter();
  renderPhotos();
  renderMessages();
  renderMusicInfo();
}

// === 渲染标题 ===
function renderHeader() {
  document.getElementById('siteTitle').textContent = config.title;
  document.getElementById('siteSubtitle').textContent = config.subtitle;
  document.title = config.title;
}

// === 渲染计时区 ===
function renderCounter() {
  const daysEl = document.getElementById('daysCount');
  const annListEl = document.getElementById('anniversariesList');

  if (config.startDate) {
    const start = new Date(config.startDate);
    const today = new Date();
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    daysEl.textContent = diffDays >= 0 ? diffDays : '--';
  } else {
    daysEl.textContent = '--';
  }

  // 渲染纪念日列表
  if (config.anniversaries && config.anniversaries.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = today.getTime();

    annListEl.innerHTML = config.anniversaries.map(a => {
      const d = new Date(a.date);
      d.setFullYear(today.getFullYear());
      // 如果今年的已经过了，算明年的
      if (d.getTime() < now) {
        d.setFullYear(today.getFullYear() + 1);
      }
      const diff = Math.ceil((d.getTime() - now) / (1000 * 60 * 60 * 24));
      return `<span class="anniversary-tag">📌 ${a.name}：还有 ${diff} 天</span>`;
    }).join('');
  } else {
    annListEl.innerHTML = '<span class="empty-state">还没有添加纪念日哦~</span>';
  }
}

// === 渲染照片滚动 ===
function renderPhotos() {
  const track = document.getElementById('photoTrack');
  const photos = config.photos || [];

  if (photos.length === 0) {
    track.innerHTML = `
      <div class="empty-state" style="padding:4rem;min-width:100%;">
        <span class="icon">📷</span>
        还没有照片，点击右上角"管理"添加吧~
      </div>`;
    track.style.animation = 'none';
    return;
  }

  // 复制一份实现无缝滚动
  const items = photos.map((p, i) => {
    // 区分 data URL 和文件名
    const src = p.startsWith('data:') ? p : 'photos/' + p;
    return `
    <div class="photo-item" onclick="openLightbox('${escapeHtml(p)}')">
      <img src="${escapeAttr(src)}" alt="照片 ${i+1}" loading="lazy" onerror="this.parentElement.style.display='none'">
    </div>
  `}).join('');

  // 如果只有一张照片，不需要滚动
  if (photos.length === 1) {
    track.innerHTML = items;
    track.style.animation = 'none';
    return;
  }

  // 至少 8 个元素才够流畅，不够就重复
  let repeatedItems = items + items;
  const totalItems = photos.length * 2;

  if (totalItems < 8) {
    const repeatTimes = Math.ceil(8 / photos.length);
    repeatedItems = '';
    for (let i = 0; i < repeatTimes; i++) {
      repeatedItems += items;
    }
  }

  track.innerHTML = repeatedItems;

  // 动态设置动画时长：每个元素约 3 秒
  const displayItems = photos.length >= 4 ? photos.length * 2 : 8;
  const duration = displayItems * 3;
  track.style.animation = `scrollPhotos ${duration}s linear infinite`;

  // hover 暂停
  const wrapper = document.getElementById('photoScrollWrapper');
  wrapper.onmouseenter = () => track.classList.add('paused');
  wrapper.onmouseleave = () => track.classList.remove('paused');
}

// === 渲染留言 ===
function renderMessages() {
  const grid = document.getElementById('messagesGrid');
  const messages = config.messages || [];

  if (messages.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="icon">💬</span>
        还没有留言，点击右上角"管理"写第一条吧~
      </div>`;
    return;
  }

  grid.innerHTML = messages.map(m => `
    <div class="message-card">
      <div class="author">
        <span class="author-dot" style="background:${escapeHtml(m.color || '#ff6b9d')};"></span>
        ${escapeHtml(m.author || '匿名')}
      </div>
      <div class="date">${escapeHtml(m.date || '')}</div>
      <div class="text">${escapeHtml(m.text || '')}</div>
    </div>
  `).join('');
}

// === 渲染音乐信息 ===
function renderMusicInfo() {
  const songNameEl = document.getElementById('songName');
  const bgMusic = document.getElementById('bgMusic');

  if (config.musicFile) {
    songNameEl.textContent = config.musicFile;
    bgMusic.src = 'music/' + config.musicFile;
  } else {
    songNameEl.textContent = '未设置音乐';
    bgMusic.src = '';
  }
}

// === 初始化音乐播放器 ===
function initMusicPlayer() {
  const btnPlay = document.getElementById('btnPlay');
  const bgMusic = document.getElementById('bgMusic');

  btnPlay.addEventListener('click', () => {
    if (!bgMusic.src) {
      showToast('请先在管理页面设置音乐文件');
      return;
    }
    if (bgMusic.paused) {
      bgMusic.play().catch(() => {
        showToast('浏览器阻止了自动播放，请点击播放按钮');
      });
      btnPlay.textContent = '⏸️';
    } else {
      bgMusic.pause();
      btnPlay.textContent = '▶️';
    }
  });

  // 首次自动播放尝试
  bgMusic.addEventListener('canplay', () => {
    bgMusic.play().then(() => {
      btnPlay.textContent = '⏸️';
    }).catch(() => {
      btnPlay.textContent = '▶️';
    });
  });
}

// === 初始化灯箱 ===
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const close = document.getElementById('lightboxClose');

  close.onclick = (e) => {
    e.stopPropagation();
    lightbox.classList.remove('active');
  };

  lightbox.onclick = () => {
    lightbox.classList.remove('active');
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      lightbox.classList.remove('active');
    }
  });
}

function openLightbox(photoSrc) {
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  // 区分 data URL 和文件名
  img.src = photoSrc.startsWith('data:') ? photoSrc : 'photos/' + photoSrc;
  lightbox.classList.add('active');
}

// === 初始化飘落心形 ===
function initHearts() {
  const container = document.getElementById('heartsContainer');
  const hearts = ['❤️', '💕', '💗', '💖', '💘', '💝', '💓', '💞', '🩷', '💌'];

  function createHeart() {
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = Math.random() * 100 + '%';
    heart.style.fontSize = (Math.random() * 20 + 16) + 'px';
    heart.style.animationDuration = (Math.random() * 6 + 8) + 's';
    heart.style.animationDelay = Math.random() * 5 + 's';
    container.appendChild(heart);

    // 动画结束后移除
    const duration = parseFloat(heart.style.animationDuration) + parseFloat(heart.style.animationDelay);
    setTimeout(() => {
      heart.remove();
    }, duration * 1000 + 500);
  }

  // 初始创建一批
  for (let i = 0; i < 15; i++) {
    setTimeout(createHeart, Math.random() * 3000);
  }

  // 持续创建
  setInterval(createHeart, 2000);
}

// === Toast ===
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// === 转义 HTML ===
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// === 颜色工具 ===
function lightenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + 40);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + 40);
  const b = Math.min(255, (num & 0x0000FF) + 40);
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function darkenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - 40);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - 40);
  const b = Math.max(0, (num & 0x0000FF) - 40);
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// === 启动 ===
document.addEventListener('DOMContentLoaded', init);
