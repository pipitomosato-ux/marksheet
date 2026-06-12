const pdfjsLib = window['pdfjs-dist/build/pdf'];
  if (pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  let state = { qcount: 20, choices: 4, labelType: 'num', answers: {}, key: {} };

  function getLabels(n) {
    if (state.labelType === 'abc')  return ['A','B','C','D','E'].slice(0, n);
    if (state.labelType === 'kana') return ['ア','イ','ウ','エ','オ'].slice(0, n);
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  function switchTab(name) {
    const names = ['setup','answer','key','result','history'];
    document.querySelectorAll('.tab').forEach((t, i) =>
      t.classList.toggle('active', names[i] === name));
    document.querySelectorAll('.section').forEach(s =>
      s.classList.remove('visible'));
    document.getElementById('tab-' + name).classList.add('visible');
    if (name === 'history') renderHistory();
  }

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

  function toggleMark(store, q, idx, containerId, correctStore) {
    if (store[q] === idx) delete store[q]; else store[q] = idx;
    renderSheet(containerId, store, false, correctStore);
  }

  function clearAnswers() {
    state.answers = {};
    renderSheet('answer-sheet', state.answers, false);
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
    switchTab('result');
  }

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
    // 「問N ア/イ/ウ/エ」形式（IPA試験など）
    const reKana = /問\s*(\d+)\s*([アイウエオ])/g;
    let m;
    while ((m = reKana.exec(text)) !== null) result[m[1]] = m[2];
    if (Object.keys(result).length > 0) return result;

    // 「問N A/B/C/D」形式
    const reAlpha = /問\s*(\d+)\s*([A-Ea-e])\b/g;
    while ((m = reAlpha.exec(text)) !== null) result[m[1]] = m[2].toUpperCase();
    if (Object.keys(result).length > 0) return result;

    // 「問N 1/2/3/4」形式
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
    const labels = getLabels(state.choices);
    const prompt = `以下はPDFから抽出したテキストです。このテキストから各問題の正解を抽出してください。

テキスト:
${text.slice(0, 4000)}

各問題の正解を以下のJSON形式で返してください。keyは問題番号（文字列）、valueは正解の選択肢（ア/イ/ウ/エ、A/B/C/D、1/2/3/4 など実際に使われている記号）：
{"1":"ウ","2":"エ",...}

見つからない問題は含めなくて構いません。JSONのみ返してください。`;
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

  const HISTORY_KEY = 'marksheet-history';
  const HISTORY_MAX = 50;

  function saveHistory(correct, total, pct) {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    list.unshift({
      id: Date.now(),
      date: new Date().toLocaleString('ja-JP'),
      correct,
      total,
      pct
    });
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
