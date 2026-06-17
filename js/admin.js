/* ========================================
   admin.js — 管理页面逻辑
   情侣空间管理助手
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

let config = {};

// === 初始化 ===
function init() {
  loadConfig();
  initTabs();
  initUploadZone();
  initColorPickers();
  initThemeColorPicker();
  renderAllAdmin();
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
  config = Object.assign({}, DEFAULT_CONFIG, config);
  // 有效化
  config.photos = config.photos || [];
  config.messages = config.messages || [];
  config.anniversaries = config.anniversaries || [];
}

// === 保存配置到 localStorage ===
function saveConfig() {
  localStorage.setItem('couples-space-config', JSON.stringify(config));
}

// === 保存并导出 ===
function saveAndExport() {
  saveSettingsSilent();
  saveConfig();
  showToast('✅ 配置已保存！现在可以去预览空间了');
}

// === 静默保存设置 ===
function saveSettingsSilent() {
  const title = document.getElementById('settingTitle')?.value?.trim();
  const subtitle = document.getElementById('settingSubtitle')?.value?.trim();
  const themeColor = document.getElementById('settingThemeColor')?.value;
  const musicFile = document.getElementById('settingMusic')?.value?.trim();
  const startDate = document.getElementById('startDate')?.value;

  if (title) config.title = title;
  if (subtitle) config.subtitle = subtitle;
  if (themeColor) config.themeColor = themeColor;
  if (musicFile !== undefined) config.musicFile = musicFile;
  if (startDate !== undefined) config.startDate = startDate;

  saveConfig();
}

// === 导出配置文件 ===
function exportConfig() {
  saveSettingsSilent();
  saveConfig();
  const data = JSON.stringify(config, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'couples-space-config.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📥 配置文件已下载');
}

// === 导入配置 ===
function importConfigPrompt() {
  document.getElementById('importFileInput').click();
}

function importConfig(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      config = Object.assign({}, DEFAULT_CONFIG, imported);
      // 有效化
      config.photos = config.photos || [];
      config.messages = config.messages || [];
      config.anniversaries = config.anniversaries || [];
      saveConfig();
      renderAllAdmin();
      showToast('✅ 配置导入成功');
    } catch(err) {
      showToast('❌ 配置文件格式错误');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// === 保存设置 ===
function saveSettings() {
  saveSettingsSilent();
  showToast('✅ 设置已保存');
}

// === 渲染所有管理列表 ===
function renderAllAdmin() {
  renderAdminPhotos();
  renderAdminMessages();
  renderAdminAnniversaries();
  renderSettingsForm();
}

// === 渲染照片管理列表 ===
function renderAdminPhotos() {
  const list = document.getElementById('photoAdminList');
  const count = document.getElementById('photoCount');
  const photos = config.photos || [];

  count.textContent = photos.length;

  if (photos.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <span class="icon">📷</span>
        还没有添加照片
      </div>`;
    return;
  }

  list.innerHTML = photos.map((p, i) => {
    const src = p.startsWith('data:') ? p : 'photos/' + p;
    return `
    <div class="photo-admin-item">
      <img src="${escapeAttr(src)}" alt="照片 ${i+1}" loading="lazy" onerror="this.style.display='none'">
      <button class="remove-btn" onclick="removePhoto(${i})" title="删除">✕</button>
    </div>
  `).join('');
}

// === 添加照片（手动输入） ===
function addPhotoManually() {
  const input = document.getElementById('manualPhotoName');
  const name = input.value.trim();
  if (!name) {
    showToast('请输入照片文件名');
    return;
  }
  if (!config.photos.includes(name)) {
    config.photos.push(name);
    saveConfig();
    renderAdminPhotos();
    input.value = '';
    showToast('✅ 照片已添加');
  } else {
    showToast('⚠️ 该照片已在列表中');
  }
}

// === 删除照片 ===
function removePhoto(index) {
  if (confirm('确定要删除这张照片吗？')) {
    config.photos.splice(index, 1);
    saveConfig();
    renderAdminPhotos();
    showToast('🗑️ 照片已删除');
  }
}

// === 初始化上传区域 ===
function initUploadZone() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('photoFileInput');

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.borderColor = 'var(--primary)';
    zone.style.background = '#ffe0eb';
  });
  zone.addEventListener('dragleave', () => {
    zone.style.borderColor = 'var(--primary-light)';
    zone.style.background = 'var(--bg-card-alt)';
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.style.borderColor = 'var(--primary-light)';
    zone.style.background = 'var(--bg-card-alt)';
    handlePhotoFiles(e.dataTransfer.files);
  });

  input.addEventListener('change', () => {
    handlePhotoFiles(input.files);
    input.value = '';
  });
}

// === 处理照片文件 ===
function handlePhotoFiles(files) {
  if (!files || files.length === 0) return;

  let added = 0;
  const promises = [];

  Array.from(files).forEach(file => {
    if (!file.type.match(/^image\//)) return;

    const promise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const dataUrl = e.target.result;
        // 存储为 data URL（因为用户没有本地服务器，无法写入文件系统）
        if (!config.photos.includes(dataUrl)) {
          config.photos.push(dataUrl);
          added++;
        }
        resolve();
      };
      reader.readAsDataURL(file);
    });
    promises.push(promise);
  });

  Promise.all(promises).then(() => {
    if (added > 0) {
      saveConfig();
      renderAdminPhotos();
      showToast(`✅ 成功添加 ${added} 张照片`);
    } else {
      showToast('⚠️ 没有新的照片可添加（可能已存在）');
    }
  });
}

// === 渲染留言管理列表 ===
function renderAdminMessages() {
  const list = document.getElementById('messageAdminList');
  const messages = config.messages || [];

  if (messages.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="icon">💬</span>
        还没有留言
      </div>`;
    return;
  }

  list.innerHTML = messages.map((m, i) => `
    <div class="message-admin-item">
      <div>
        <strong>${escapeHtml(m.author || '匿名')}</strong>
        <span style="color:${escapeAttr(m.color || '#ff6b9d')};"> ●</span>
        <span style="color:var(--text-light);font-size:0.8rem;margin-left:0.5rem;">${escapeHtml(m.date || '')}</span>
        <p style="margin-top:0.3rem;">${escapeHtml(m.text || '')}</p>
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeMessage(${i})">🗑️ 删除</button>
    </div>
  `).join('');
}

// === 添加留言 ===
function addMessage() {
  const author = document.getElementById('msgAuthor').value.trim();
  const color = document.getElementById('msgColor').value;
  const text = document.getElementById('msgText').value.trim();

  if (!author) { showToast('请输入发送者'); return; }
  if (!text) { showToast('请输入留言内容'); return; }

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  config.messages.push({
    author: author,
    color: color,
    text: text,
    date: dateStr
  });

  saveConfig();
  renderAdminMessages();

  // 清空表单
  document.getElementById('msgAuthor').value = '';
  document.getElementById('msgText').value = '';

  showToast('💌 留言已添加');
}

// === 删除留言 ===
function removeMessage(index) {
  if (confirm('确定要删除这条留言吗？')) {
    config.messages.splice(index, 1);
    saveConfig();
    renderAdminMessages();
    showToast('🗑️ 留言已删除');
  }
}

// === 渲染纪念日管理列表 ===
function renderAdminAnniversaries() {
  const list = document.getElementById('anniversaryAdminList');
  const anniversaries = config.anniversaries || [];

  if (anniversaries.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="icon">📅</span>
        还没有添加纪念日
      </div>`;
    return;
  }

  list.innerHTML = anniversaries.map((a, i) => `
    <div class="anniversary-admin-item">
      <div>
        <strong>${escapeHtml(a.name || '纪念日')}</strong>
        <span style="color:var(--text-light);margin-left:0.5rem;">${escapeHtml(a.date || '')}</span>
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeAnniversary(${i})">🗑️ 删除</button>
    </div>
  `).join('');
}

// === 添加纪念日 ===
function addAnniversary() {
  const name = document.getElementById('anniversaryName').value.trim();
  const date = document.getElementById('anniversaryDate').value;

  if (!name) { showToast('请输入纪念日名称'); return; }
  if (!date) { showToast('请选择日期'); return; }

  config.anniversaries.push({
    name: name,
    date: date
  });

  // 按日期排序
  config.anniversaries.sort((a, b) => {
    const today = new Date();
    const year = today.getFullYear();
    const da = new Date(year, new Date(a.date).getMonth(), new Date(a.date).getDate());
    const db = new Date(year, new Date(b.date).getMonth(), new Date(b.date).getDate());
    return da - db;
  });

  saveConfig();
  renderAdminAnniversaries();

  document.getElementById('anniversaryName').value = '';
  document.getElementById('anniversaryDate').value = '';

  showToast('📅 纪念日已添加');
}

// === 删除纪念日 ===
function removeAnniversary(index) {
  if (confirm('确定要删除这个纪念日吗？')) {
    config.anniversaries.splice(index, 1);
    saveConfig();
    renderAdminAnniversaries();
    showToast('🗑️ 纪念日已删除');
  }
}

// === 渲染设置表单 ===
function renderSettingsForm() {
  document.getElementById('settingTitle').value = config.title || '';
  document.getElementById('settingSubtitle').value = config.subtitle || '';
  document.getElementById('settingThemeColor').value = config.themeColor || '#ff6b9d';
  document.getElementById('settingMusic').value = config.musicFile || '';
  document.getElementById('startDate').value = config.startDate || '';

  // 选中主题色
  const themeDots = document.querySelectorAll('#themeColorOptions .color-dot');
  themeDots.forEach(dot => {
    if (dot.dataset.color === config.themeColor) {
      dot.classList.add('selected');
    } else {
      dot.classList.remove('selected');
    }
  });
}

// === 初始化标签页 ===
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(targetId);
      if (target) target.classList.add('active');
    });
  });
}

// === 初始化颜色选择器 ===
function initColorPickers() {
  // 留言颜色选择
  const msgDots = document.querySelectorAll('#msgColorOptions .color-dot');
  msgDots.forEach(dot => {
    dot.addEventListener('click', () => {
      msgDots.forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      document.getElementById('msgColor').value = dot.dataset.color;
    });
  });

  // 默认选中第一个
  if (msgDots.length > 0) {
    msgDots[0].classList.add('selected');
    document.getElementById('msgColor').value = msgDots[0].dataset.color;
  }
}

// === 初始化主题色选择器 ===
function initThemeColorPicker() {
  const themeDots = document.querySelectorAll('#themeColorOptions .color-dot');
  themeDots.forEach(dot => {
    dot.addEventListener('click', () => {
      themeDots.forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      document.getElementById('settingThemeColor').value = dot.dataset.color;
    });
  });
}

// === Toast ===
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// === HTML 转义 ===
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// === 启动 ===
document.addEventListener('DOMContentLoaded', init);
