const pdfjsLib = window['pdfjs-dist/build/pdf'];
  if (pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  let state = { qcount: 20, choices: 4, labelType: 'num', answers: {}, key: {} };

  // 問題PDF関連
  let qPdfDoc = null;
  let viewerMode = 'scroll'; // 'scroll' | 'page'
  let currentPage = 1;
  let pdfLayout = 'lr';      // 'lr' | 'tb' | 'none'

  function getLabels(n) {
    if (state.labelType === 'abc')  return ['A','B','C','D','E'].slice(0, n);
    if (state.labelType === 'kana') return ['ア','イ','ウ','エ','オ'].slice(0, n);
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  // ── タブ切り替え ──────────────────────────────
  function switchTab(name) {
    const names = ['setup','answer','key','result','history'];

    // 両方のタブバーを同期
    document.querySelectorAll('.tab').forEach(t => {
      const idx = names.indexOf(name);
      const allTabs = [...document.querySelectorAll('.tab')];
      // data属性で管理するより位置で判断
      t.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach((t, i) => {
      const barTabs = [...t.closest('.tab-bar').querySelectorAll('.tab')];
      const pos = barTabs.indexOf(t);
      if (names[pos] === name) t.classList.add('active');
    });

    // セクション切り替え
    document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
    const sec = document.getElementById('tab-' + name);
    if (sec) sec.classList.add('visible');

    // 回答・結果タブ + 問題PDF読込済 → 2ペイン表示
    if ((name === 'answer' || name === 'result') && qPdfDoc) {
      showDualPane(name);
    } else {
      hideDualPane();
    }
    if (name === 'answer') updateQPdfToggle();

    if (name === 'history') renderHistory();
  }

  function showDualPane(pane = 'answer') {
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('dual-pane').style.display = 'flex';
    document.getElementById('dual-pane').style.flexDirection = 'column';
    document.body.classList.add('dual-mode');
    // key-badge同期
    const b1 = document.getElementById('key-badge');
    const b2 = document.getElementById('key-badge2');
    if (b2) b2.style.display = b1.style.display;
    // 右ペイン切り替え
    document.getElementById('dual-answer-area').style.display = pane === 'answer' ? '' : 'none';
    document.getElementById('dual-result-area').style.display = pane === 'result' ? '' : 'none';
    if (pane === 'answer') renderDualSheet();
    renderPdfViewer();
    initResizer();
    applyLayout(pdfLayout);
    updateQPdfToggle();
  }

  function hideDualPane() {
    document.getElementById('main-container').style.display = '';
    document.getElementById('dual-pane').style.display = 'none';
    document.body.classList.remove('dual-mode');
  }

  // ── 設定 ──────────────────────────────────────
  function pickChoices(n) { state.choices = n; }
  function pickLabel(type) { state.labelType = type; }

  function generateSheet() {
    state.qcount = parseInt(document.getElementById('qcount').value) || 20;
    state.answers = {};
    state.key = {};
    renderSheet('answer-sheet', state.answers, false);
    renderSheet('answer-key', state.key, false);
    document.getElementById('key-badge').style.display = 'none';
    setStatus('', '');
    switchTab('answer');
  }

  // ── マークシート描画 ──────────────────────────
  function renderSheet(containerId, store, showResult, correctStore) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const labels = getLabels(state.choices);
    el.innerHTML = '';
    const rows = Math.ceil(state.qcount / 3);
    el.style.gridTemplateRows = `repeat(${rows}, auto)`;
    for (let q = 1; q <= state.qcount; q++) {
      const row = document.createElement('div');
      row.className = 'q-row';
      const num = document.createElement('div');
      num.className = 'q-num';
      num.textContent = q;
      const marks = document.createElement('div');
      marks.className = 'marks';
      labels.forEach((lbl, i) => {
        const btn = document.createElement('button');
        btn.className = 'mark';
        btn.textContent = lbl;
        if (store[q] === i) btn.classList.add('filled');
        if (showResult && correctStore) {
          if (store[q] === i && correctStore[q] === i) {
            btn.classList.remove('filled'); btn.classList.add('correct');
          } else if (store[q] === i && correctStore[q] !== i) {
            btn.classList.remove('filled'); btn.classList.add('wrong');
          }
          if (correctStore[q] === i && store[q] !== i)
            btn.classList.add('answer-show');
        }
        if (!showResult) btn.onclick = () => toggleMark(store, q, i, containerId, correctStore);
        marks.appendChild(btn);
      });
      row.appendChild(num);
      row.appendChild(marks);
      el.appendChild(row);
    }
  }

  function renderDualSheet() {
    renderSheet('answer-sheet-dual', state.answers, false);
  }

  function toggleMark(store, q, idx, containerId, correctStore) {
    if (store[q] === idx) delete store[q]; else store[q] = idx;
    renderSheet(containerId, store, false, correctStore);
    // 2ペインのシートも同期
    if (containerId === 'answer-sheet') renderDualSheet();
    if (containerId === 'answer-sheet-dual') renderSheet('answer-sheet', store, false, correctStore);
  }

  function clearAnswers() {
    state.answers = {};
    renderSheet('answer-sheet', state.answers, false);
    renderDualSheet();
  }

  function clearKey() {
    state.key = {};
    renderSheet('answer-key', state.key, false);
    document.getElementById('key-badge').style.display = 'none';
    setStatus('', '');
  }

  function grade() {
    if (Object.keys(state.key).length === 0) { switchTab('key'); return; }
    let correct = 0, total = 0;
    for (let q = 1; q <= state.qcount; q++) {
      if (state.key[q] !== undefined) {
        total++;
        if (state.answers[q] === state.key[q]) correct++;
      }
    }
    const pct = total ? Math.round(correct / total * 100) : 0;
    saveHistory(correct, total, pct);
    document.getElementById('result-content').innerHTML = `
      <div class="score-card">
        <div class="score-num">${correct} / ${total}</div>
        <div class="score-sub">正解数 &nbsp;|&nbsp; 正答率 ${pct}%</div>
      </div>
      <div class="legend">
        <span><span class="dot c"></span>正解</span>
        <span><span class="dot w"></span>不正解</span>
        <span style="font-size:12px;color:var(--text-tertiary);">（緑枠 = 正解の選択肢）</span>
      </div>
      <div id="result-detail" class="sheet-grid"></div>`;
    renderSheet('result-detail', state.answers, true, state.key);
    // 2ペイン用結果も同期
    const dualResult = document.getElementById('result-content-dual');
    if (dualResult) {
      dualResult.innerHTML = `
        <div class="score-card">
          <div class="score-num">${correct} / ${total}</div>
          <div class="score-sub">正解数 &nbsp;|&nbsp; 正答率 ${pct}%</div>
        </div>
        <div class="legend">
          <span><span class="dot c"></span>正解</span>
          <span><span class="dot w"></span>不正解</span>
          <span style="font-size:12px;color:var(--text-tertiary);">（緑枠 = 正解の選択肢）</span>
        </div>
        <div id="result-detail-dual" class="sheet-grid"></div>`;
      renderSheet('result-detail-dual', state.answers, true, state.key);
    }
    switchTab('result');
  }

  // ── 問題PDFの読み込み ─────────────────────────
  function onQDragOver(e) {
    e.preventDefault();
    document.getElementById('q-pdf-drop').classList.add('dragover');
  }
  function onQDragLeave() {
    document.getElementById('q-pdf-drop').classList.remove('dragover');
  }
  function onQDrop(e) {
    e.preventDefault(); onQDragLeave();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') loadQPdf(file);
  }
  function handleQPdfFile(e) {
    const file = e.target.files[0];
    if (file) loadQPdf(file);
  }

  async function loadQPdf(file) {
    const label = document.getElementById('q-pdf-label');
    label.textContent = '読み込み中...';
    try {
      const ab = await file.arrayBuffer();
      qPdfDoc = await pdfjsLib.getDocument({ data: ab }).promise;
      currentPage = 1;
      label.textContent = `✓ ${file.name}（${qPdfDoc.numPages}ページ）`;
      document.getElementById('q-pdf-drop').style.borderColor = 'var(--green)';
    } catch (err) {
      label.textContent = '⚠ 読み込みに失敗しました';
    }
  }

  // ── PDFビューアー ─────────────────────────────
  async function renderPdfViewer() {
    if (!qPdfDoc) return;
    const container = document.getElementById('pdf-canvas-container');
    container.innerHTML = '';

    if (viewerMode === 'scroll') {
      // 全ページを縦に並べる
      for (let i = 1; i <= qPdfDoc.numPages; i++) {
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        await renderPageToCanvas(i, canvas);
      }
      document.getElementById('page-nav').style.display = 'none';
    } else {
      // 1ページだけ表示
      const canvas = document.createElement('canvas');
      container.appendChild(canvas);
      await renderPageToCanvas(currentPage, canvas);
      updatePageIndicator();
      document.getElementById('page-nav').style.display = 'flex';
    }
  }

  async function renderPageToCanvas(pageNum, canvas) {
    const page = await qPdfDoc.getPage(pageNum);
    const pane = document.getElementById('pane-pdf');
    const paneW = pane.clientWidth - 32; // padding考慮
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(paneW / viewport.width, 2.0);
    const scaledViewport = page.getViewport({ scale });
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: scaledViewport }).promise;
  }

  function setViewerMode(mode) {
    viewerMode = mode;
    document.getElementById('btn-scroll').classList.toggle('active', mode === 'scroll');
    document.getElementById('btn-page').classList.toggle('active', mode === 'page');
    renderPdfViewer();
  }

  function changePage(delta) {
    if (!qPdfDoc) return;
    currentPage = Math.max(1, Math.min(qPdfDoc.numPages, currentPage + delta));
    renderPdfViewer();
  }

  function updatePageIndicator() {
    if (!qPdfDoc) return;
    document.getElementById('page-indicator').textContent = `${currentPage} / ${qPdfDoc.numPages}`;
  }

  // ── レイアウト・PDF閉じる ─────────────────────
  function setLayout(layout) {
    pdfLayout = layout;
    renderPdfViewer();
  }

  function applyLayout(layout) {
    // 左右のみ対応
  }

  // PDFペインだけ非表示（シートはそのまま）
  function closeQPdf() {
    hideDualPane();
    // 回答タブのまま通常レイアウトで表示
    document.getElementById('tab-answer').classList.add('visible');
    updateQPdfToggle();
  }

  // PDFペインを再表示
  function reopenQPdf() {
    if (!qPdfDoc) return;
    showDualPane();
    updateQPdfToggle();
  }

  // 回答タブのPDF追加/解除ボタンの表示を更新
  function updateQPdfToggle() {
    const btn = document.getElementById('qpdf-toggle-btn');
    if (!btn) return;
    const isDual = document.getElementById('dual-pane').style.display !== 'none';
    if (qPdfDoc) {
      btn.style.display = 'inline-flex';
      btn.textContent = isDual ? '問題PDFを隠す' : '問題PDFを表示';
      btn.onclick = isDual ? closeQPdf : reopenQPdf;
    } else {
      btn.style.display = 'none';
    }
  }

  // ── リサイザー（ドラッグで仕切り移動） ────────
  function initResizer() {
    const resizer = document.getElementById('resizer');
    const body = document.getElementById('dual-body');
    const pdfPane = document.getElementById('pane-pdf');
    const sheetPane = document.getElementById('pane-sheet');
    let dragging = false, startPos = 0, startSize = 0;

    resizer.onmousedown = (e) => {
      dragging = true;
      resizer.classList.add('dragging');
      const isLR = !body.classList.contains('tb');
      startPos = isLR ? e.clientX : e.clientY;
      startSize = isLR ? pdfPane.offsetWidth : pdfPane.offsetHeight;
      e.preventDefault();
    };

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const isLR = !body.classList.contains('tb');
      const delta = isLR ? e.clientX - startPos : e.clientY - startPos;
      const newSize = Math.max(200, startSize + delta);
      if (isLR) {
        pdfPane.style.flex = 'none';
        pdfPane.style.width = newSize + 'px';
      } else {
        pdfPane.style.flex = 'none';
        pdfPane.style.height = newSize + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        resizer.classList.remove('dragging');
        renderPdfViewer(); // サイズ変更後に再描画
      }
    });
  }

  // ── 正解PDF読み込み ───────────────────────────
  function setStatus(type, html) {
    const el = document.getElementById('pdf-status');
    el.className = 'status-bar' + (type ? ' ' + type : '');
    el.innerHTML = html;
  }

  function onDragOver(e) {
    e.preventDefault();
    document.getElementById('pdf-drop').classList.add('dragover');
  }
  function onDragLeave() {
    document.getElementById('pdf-drop').classList.remove('dragover');
  }
  function onDrop(e) {
    e.preventDefault(); onDragLeave();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') processPdf(file);
    else setStatus('danger', '⚠ PDFファイルを選択してください');
  }
  function handlePdfFile(e) {
    const file = e.target.files[0];
    if (file) processPdf(file);
  }

  async function processPdf(file) {
    setStatus('info', '<span class="spinner"></span>&nbsp;PDFを読み込んでいます...');
    try {
      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(it => it.str).join(' ') + '\n';
      }
      const direct = tryDirectParse(fullText);
      if (Object.keys(direct).length > 0) {
        autoDetectSettings(direct, fullText);
        applyExtractedAnswers(direct);
      } else {
        setStatus('info', '<span class="spinner"></span>&nbsp;AIが正解を解析中...');
        await extractAnswersWithAI(fullText);
      }
    } catch (err) {
      setStatus('danger', '⚠ PDFの読み込みに失敗しました: ' + err.message);
    }
  }

  function tryDirectParse(text) {
    const result = {};
    const reKana = /問\s*(\d+)\s*([アイウエオ])/g;
    let m;
    while ((m = reKana.exec(text)) !== null) result[m[1]] = m[2];
    if (Object.keys(result).length > 0) return result;
    const reAlpha = /問\s*(\d+)\s*([A-Ea-e])\b/g;
    while ((m = reAlpha.exec(text)) !== null) result[m[1]] = m[2].toUpperCase();
    if (Object.keys(result).length > 0) return result;
    const reNum = /問\s*(\d+)\s*([1-5])(?!\d)/g;
    while ((m = reNum.exec(text)) !== null) result[m[1]] = m[2];
    return result;
  }

  function autoDetectSettings(parsed, text) {
    const nums = Object.keys(parsed).map(Number);
    if (nums.length === 0) return;
    const maxQ = Math.max(...nums);
    if (maxQ > state.qcount) {
      state.qcount = maxQ;
      document.getElementById('qcount').value = maxQ;
    }
    const vals = Object.values(parsed);
    const hasKana = vals.some(v => 'アイウエオ'.includes(v));
    const hasAlpha = vals.some(v => /^[A-E]$/.test(v));
    const hasNum  = vals.some(v => /^[1-5]$/.test(v));
    if (hasKana) {
      state.labelType = 'kana';
      document.querySelector('input[name="label"][value="kana"]').checked = true;
      const kanaVals = [...new Set(vals.filter(v => 'アイウエオ'.includes(v)))];
      state.choices = Math.max(state.choices, Math.max(...kanaVals.map(v => 'アイウエオ'.indexOf(v) + 1)));
    } else if (hasAlpha) {
      state.labelType = 'abc';
      document.querySelector('input[name="label"][value="abc"]').checked = true;
    } else if (hasNum) {
      state.labelType = 'num';
      document.querySelector('input[name="label"][value="num"]').checked = true;
    }
    const maxChoice = Math.max(state.choices, ...vals.map(v => {
      const i = 'アイウエオABCDE12345'.indexOf(v);
      return i >= 0 ? (i % 5) + 1 : 0;
    }));
    if (maxChoice >= 3 && maxChoice <= 5) {
      state.choices = maxChoice;
      const radio = document.querySelector(`input[name="choices"][value="${maxChoice}"]`);
      if (radio) radio.checked = true;
    }
    renderSheet('answer-sheet', state.answers, false);
    renderSheet('answer-key', state.key, false);
  }

  async function extractAnswersWithAI(text) {
    const prompt = `以下はPDFから抽出したテキストです。各問題の正解を抽出してください。

テキスト:
${text.slice(0, 4000)}

各問題の正解をJSON形式で返してください。keyは問題番号（文字列）、valueは正解の選択肢：
{"1":"ウ","2":"エ",...}

JSONのみ返してください。`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      const raw = data.content.map(c => c.text || '').join('');
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      autoDetectSettings(parsed, '');
      applyExtractedAnswers(parsed);
    } catch (err) {
      setStatus('danger', '⚠ AI解析に失敗しました。手動で正解を入力してください。');
    }
  }

  function applyExtractedAnswers(parsed) {
    const labels = getLabels(state.choices);
    let count = 0;
    for (const [qStr, ans] of Object.entries(parsed)) {
      const q = parseInt(qStr);
      if (isNaN(q) || q < 1 || q > state.qcount) continue;
      const idx = labels.findIndex(l => String(l) === String(ans).trim());
      if (idx >= 0) { state.key[q] = idx; count++; }
    }
    renderSheet('answer-key', state.key, false);
    if (count > 0) {
      document.getElementById('key-badge').style.display = 'inline';
      setStatus('success', `✓ ${count}問の正解を読み込みました。確認・修正できます。`);
    } else {
      setStatus('danger', '⚠ 正解を読み取れませんでした。手動で入力してください。');
    }
  }

  // ── 履歴 ──────────────────────────────────────
  const HISTORY_KEY = 'marksheet-history';
  const HISTORY_MAX = 50;

  function saveHistory(correct, total, pct) {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    list.unshift({ id: Date.now(), date: new Date().toLocaleString('ja-JP'), correct, total, pct });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
  }

  function loadHistory() {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  }

  function deleteHistory(id) {
    const list = loadHistory().filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    renderHistory();
  }

  function clearAllHistory() {
    if (!confirm('採点履歴をすべて削除しますか？')) return;
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }

  function renameHistory(id) {
    const list = loadHistory();
    const h = list.find(x => x.id === id);
    if (!h) return;
    const card = document.querySelector(`[data-id="${id}"]`);
    const nameEl = card.querySelector('.history-name');
    const currentName = h.name || '';
    nameEl.outerHTML = `<input class="history-name-input" data-edit="${id}" value="${currentName}" placeholder="名前を入力…" maxlength="40">`;
    const input = card.querySelector('.history-name-input');
    input.focus();
    input.select();
    const commit = () => {
      const newName = input.value.trim();
      const updated = loadHistory().map(x => x.id === id ? { ...x, name: newName } : x);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      renderHistory();
    };
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { renderHistory(); }
    });
  }

  function renderHistory() {
    const el = document.getElementById('history-list');
    const list = loadHistory();
    if (list.length === 0) {
      el.innerHTML = '<p class="history-empty">まだ採点履歴がありません</p>';
      return;
    }
    el.innerHTML = list.map(h => `
      <div class="history-card" data-id="${h.id}">
        <div class="history-score">${h.correct}<span style="font-size:14px;color:var(--text-secondary);font-weight:400;"> / ${h.total}</span></div>
        <div class="history-meta">
          <span class="history-name" onclick="renameHistory(${h.id})">${h.name || '名前なし'}</span>
          <div class="history-sub">正答率 ${h.pct}% &nbsp;·&nbsp; ${h.date}</div>
        </div>
        <button class="history-delete" onclick="deleteHistory(${h.id})" title="削除">×</button>
      </div>
    `).join('');
  }

  generateSheet();
