const links = [...document.querySelectorAll('.top-nav a[href^="#"]')];
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    links.forEach(link => {
      const active = link.hash === '#' + entry.target.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
}, {rootMargin: '-10% 0px -70% 0px'});
document.querySelectorAll('.content > section[id]').forEach(section => observer.observe(section));

// Local preview control; never displayed on the public homepage.
if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
  const frame = document.querySelector('.profile-frame');
  const storageKey = 'bailin-homepage-portrait-v3-casual-oval';
  const defaults = {scale:103, x:8, y:-9, width:157, height:218};
  let settings = {...defaults};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    for (const key of Object.keys(defaults)) {
      if (saved && Number.isFinite(saved[key])) settings[key] = saved[key];
    }
  } catch {}
  const panel = document.createElement('details');
  panel.className = 'portrait-adjuster';
  panel.open = new URLSearchParams(location.search).get('portrait') === 'edit';
  panel.innerHTML = `<summary>调整头像（本地预览）</summary>
    <p>照片位置沿用已保存的设置。横轴、纵轴独立调整，改框不会缩放照片。</p>
    <label>椭圆宽度（横轴）<output data-value="width"></output><input aria-label="椭圆宽度（横轴）" data-key="width" type="range" min="100" max="220" step="1"></label>
    <label>椭圆高度（纵轴）<output data-value="height"></output><input aria-label="椭圆高度（纵轴）" data-key="height" type="range" min="120" max="300" step="1"></label>
    <label>照片大小 <output data-value="scale"></output><input aria-label="照片大小" data-key="scale" type="range" min="60" max="300" step="1"></label>
    <label>左右位置 <output data-value="x"></output><input aria-label="左右位置" data-key="x" type="range" min="-30" max="30" step="1"></label>
    <label>上下位置 <output data-value="y"></output><input aria-label="上下位置" data-key="y" type="range" min="-30" max="30" step="1"></label>
    <div class="adjuster-actions"><button type="button" data-action="reset-frame">重置框</button><button type="button" data-action="reset">全部重置</button><button type="button" data-action="copy">复制 CSS</button><button type="button" data-action="export">导出参数</button></div>
    <p class="adjuster-status" role="status">仅影响此浏览器的本地预览。</p>`;
  document.body.append(panel);
  const status = panel.querySelector('.adjuster-status');
  function apply() {
    frame.style.setProperty('--portrait-scale', settings.scale / 100);
    frame.style.setProperty('--portrait-x', settings.x + '%');
    frame.style.setProperty('--portrait-y', settings.y + '%');
    frame.style.setProperty('--portrait-frame-width', settings.width + 'px');
    frame.style.setProperty('--portrait-frame-height', settings.height + 'px');
    frame.style.setProperty('--portrait-frame-ratio', settings.height / settings.width);
    panel.querySelectorAll('input[data-key]').forEach(input => {
      const value = settings[input.dataset.key];
      input.value = value;
      panel.querySelector(`[data-value="${input.dataset.key}"]`).value = value + (['width', 'height'].includes(input.dataset.key) ? ' px' : '%');
    });
  }
  function persist() {
    try {localStorage.setItem(storageKey, JSON.stringify(settings));status.textContent = '已保存到此浏览器；刷新后保留。';}
    catch {status.textContent = '无法保存到浏览器，请导出参数。';}
  }
  panel.addEventListener('input', event => {
    const key = event.target.dataset.key;
    if (!(key in defaults)) return;
    settings[key] = Number(event.target.value);
    apply(); persist();
  });
  function css() {
    return `.profile-frame {\n  --portrait-frame-width: ${settings.width}px;\n  --portrait-frame-height: ${settings.height}px;\n  --portrait-frame-ratio: ${settings.height / settings.width};\n  --portrait-scale: ${settings.scale / 100};\n  --portrait-x: ${settings.x}%;\n  --portrait-y: ${settings.y}%;\n}`;
  }
  panel.addEventListener('click', async event => {
    const action = event.target.dataset.action;
    if (action === 'reset-frame') {settings.width=defaults.width;settings.height=defaults.height;apply();persist();}
    if (action === 'reset') {settings = {...defaults}; apply(); persist();}
    if (action === 'copy') {
      try {await navigator.clipboard.writeText(css());status.textContent = '已复制 CSS，可发给我用于正式网页。';}
      catch {status.textContent = '复制失败，请使用“导出参数”。';}
    }
    if (action === 'export') {
      const url = URL.createObjectURL(new Blob([JSON.stringify({...settings, css:css()}, null, 2)], {type:'application/json'}));
      const link = document.createElement('a');link.href=url;link.download='bailin-portrait-settings.json';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      status.textContent = '已导出参数，可发给我用于正式网页。';
    }
  });
  apply();
}
