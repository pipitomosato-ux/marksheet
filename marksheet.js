  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #ffffff;
    --bg-secondary: #f5f5f4;
    --bg-info: #e6f1fb;
    --bg-success: #eaf3de;
    --bg-danger: #fcebeb;
    --text: #1a1a1a;
    --text-secondary: #6b6b6b;
    --text-tertiary: #a0a0a0;
    --text-info: #185fa5;
    --text-success: #3b6d11;
    --text-danger: #a32d2d;
    --border: rgba(0,0,0,0.12);
    --border-hover: rgba(0,0,0,0.28);
    --blue: #178ADD;
    --green: #1D9E75;
    --red: #E24B4A;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1e1e1e;
      --bg-secondary: #2a2a2a;
      --bg-info: #0c2440;
      --bg-success: #0d2810;
      --bg-danger: #2d0f0f;
      --text: #f0f0f0;
      --text-secondary: #a0a0a0;
      --text-tertiary: #666;
      --text-info: #85b7eb;
      --text-success: #97c459;
      --text-danger: #f09595;
      --border: rgba(255,255,255,0.1);
      --border-hover: rgba(255,255,255,0.25);
    }
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg-secondary);
    color: var(--text);
    min-height: 100vh;
    padding: 2rem 1rem;
  }

  .container {
    max-width: 780px;
    margin: 0 auto;
    background: var(--bg);
    border-radius: var(--radius-lg);
    border: 0.5px solid var(--border);
    padding: 2rem;
  }

  h1 {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 1.5rem;
    color: var(--text);
  }

  /* Tab bar */
  .tab-bar {
    display: flex;
    gap: 4px;
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    padding: 4px;
    margin-bottom: 1.75rem;
  }
  .tab {
    flex: 1;
    padding: 8px 0;
    text-align: center;
    font-size: 14px;
    border-radius: 6px;
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    transition: all 0.15s;
    font-family: inherit;
  }
  .tab.active {
    background: var(--bg);
    color: var(--text);
    font-weight: 500;
    border: 0.5px solid var(--border);
  }

  /* Sections */
  .section { display: none; }
  .section.visible { display: block; }

  /* Setup */
  .setup-group {
    margin-bottom: 1.5rem;
  }
  .setup-group-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 10px;
  }

  /* Number input */
  .number-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .number-row input[type="number"] {
    width: 80px;
    padding: 8px 12px;
    font-size: 15px;
    font-family: inherit;
    border: 0.5px solid var(--border-hover);
    border-radius: var(--radius-sm);
    background: var(--bg);
    color: var(--text);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .number-row input[type="number"]:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(23,138,221,0.15);
  }
  .number-row span {
    font-size: 14px;
    color: var(--text-secondary);
  }

  /* Radio-style option tiles */
  .option-tiles {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .option-tile {
    position: relative;
    cursor: pointer;
  }
  .option-tile input[type="radio"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
  .option-tile-inner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--bg);
    font-size: 14px;
    color: var(--text-secondary);
    transition: all 0.15s;
    user-select: none;
  }
  .option-tile-inner .check-icon {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1.5px solid var(--border-hover);
    background: var(--bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .option-tile-inner .check-icon svg {
    display: none;
    width: 10px;
    height: 10px;
  }
  .option-tile:hover .option-tile-inner {
    border-color: var(--blue);
    color: var(--text);
  }
  .option-tile input:checked + .option-tile-inner {
    border-color: var(--blue);
    background: var(--bg-info);
    color: var(--text-info);
    font-weight: 500;
    box-shadow: 0 0 0 3px rgba(23,138,221,0.12);
  }
  .option-tile input:checked + .option-tile-inner .check-icon {
    background: var(--blue);
    border-color: var(--blue);
  }
  .option-tile input:checked + .option-tile-inner .check-icon svg {
    display: block;
  }

  .generate-btn {
    margin-top: 1.5rem;
    width: 100%;
    padding: 11px;
    font-size: 15px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    border-radius: var(--radius-sm);
    border: 0.5px solid var(--border-hover);
    background: var(--bg);
    color: var(--text);
    transition: background 0.15s;
  }
  .generate-btn:hover { background: var(--bg-secondary); }

  /* Sheet grid — 縦に流れて列が埋まったら右の列へ */
  .sheet-grid {
    display: grid;
    grid-template-rows: repeat(20, auto);
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 8px;
  }
  .q-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
  }
  .q-num {
    font-size: 13px;
    color: var(--text-tertiary);
    min-width: 26px;
    font-variant-numeric: tabular-nums;
  }
  .marks { display: flex; gap: 4px; }

  .mark {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid var(--border-hover);
    background: transparent;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    color: var(--text-secondary);
    transition: background 0.12s, border-color 0.12s, color 0.12s;
    font-family: inherit;
  }
  .mark:hover {
    border-color: var(--blue);
    color: var(--blue);
  }
  .mark.filled {
    background: var(--blue);
    border-color: var(--blue);
    color: #fff;
  }
  .mark.correct {
    background: var(--green);
    border-color: var(--green);
    color: #fff;
  }
  .mark.wrong {
    background: var(--red);
    border-color: var(--red);
    color: #fff;
  }
  .mark.answer-show {
    outline: 2px solid var(--green);
    outline-offset: 2px;
  }

  /* Submit row */
  .submit-row { display: flex; gap: 8px; margin-top: 1.5rem; }
  .submit-row button {
    flex: 1;
    padding: 10px;
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    border-radius: var(--radius-sm);
    border: 0.5px solid var(--border-hover);
    background: var(--bg);
    color: var(--text);
    transition: background 0.15s;
  }
  .submit-row button:hover { background: var(--bg-secondary); }
  .btn-primary {
    background: var(--blue) !important;
    border-color: var(--blue) !important;
    color: #fff !important;
  }
  .btn-primary:hover { opacity: 0.9; }

  /* PDF drop zone */
  .pdf-zone {
    border: 1.5px dashed var(--border-hover);
    border-radius: var(--radius-md);
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: 1rem;
  }
  .pdf-zone:hover { border-color: var(--blue); background: var(--bg-secondary); }
  .pdf-zone.dragover { border-color: var(--blue); background: var(--bg-info); }
  .pdf-zone svg { display: block; margin: 0 auto 10px; color: var(--text-tertiary); }
  .pdf-zone p { font-size: 14px; color: var(--text-secondary); }
  .pdf-zone .sub { font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }

  /* Status bar */
  .status-bar {
    display: none;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    margin-bottom: 1rem;
  }
  .status-bar.info    { display: flex; background: var(--bg-info);    color: var(--text-info);    }
  .status-bar.success { display: flex; background: var(--bg-success); color: var(--text-success); }
  .status-bar.danger  { display: flex; background: var(--bg-danger);  color: var(--text-danger);  }

  /* Result */
  .score-card {
    text-align: center;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 2rem;
    margin-bottom: 1.5rem;
  }
  .score-num { font-size: 48px; font-weight: 500; color: var(--blue); }
  .score-sub { font-size: 14px; color: var(--text-secondary); margin-top: 4px; }

  .legend {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }
  .legend span { display: flex; align-items: center; gap: 6px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
  .dot.c { background: var(--green); }
  .dot.w { background: var(--red); }

  .key-badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 20px;
    background: var(--bg-success);
    color: var(--text-success);
    margin-left: 6px;
  }

  .spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: -2px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .manual-label {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  /* 履歴 */
  .history-card {
    background: var(--bg);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .history-score {
    font-size: 22px;
    font-weight: 500;
    color: var(--blue);
    min-width: 60px;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }
  .history-meta {
    flex: 1;
    min-width: 0;
  }
  .history-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    border-radius: 4px;
    padding: 1px 4px;
    margin: -1px -4px;
    display: inline-block;
    max-width: 100%;
    transition: background 0.12s;
  }
  .history-name:hover { background: var(--bg-secondary); }
  .history-name::after {
    content: ' ✎';
    font-size: 11px;
    color: var(--text-tertiary);
    opacity: 0;
    transition: opacity 0.12s;
  }
  .history-name:hover::after { opacity: 1; }
  .history-name-input {
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    color: var(--text);
    background: var(--bg-secondary);
    border: 1px solid var(--blue);
    border-radius: 4px;
    padding: 1px 6px;
    outline: none;
    width: 100%;
    box-shadow: 0 0 0 2px rgba(23,138,221,0.15);
  }
  .history-sub {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 2px;
  }
  .history-delete {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-tertiary);
    font-size: 18px;
    padding: 4px 6px;
    border-radius: var(--radius-sm);
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.12s, background 0.12s;
  }
  .history-delete:hover { color: var(--red); background: var(--bg-danger); }
  .history-empty {
    text-align: center;
    padding: 2rem;
    font-size: 14px;
    color: var(--text-secondary);
  }

  /* ── 2ペインレイアウト ── */
  body.dual-mode {
    padding: 0;
    background: var(--bg-secondary);
  }
  .dual-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: var(--bg);
    border-bottom: 0.5px solid var(--border);
    flex-shrink: 0;
  }
  .dual-body {
    display: flex;
    height: calc(100vh - 52px);
    overflow: hidden;
  }
  .dual-body.tb {
    flex-direction: column;
  }
  .pane {
    overflow: auto;
    min-width: 0;
    min-height: 0;
  }
  .pane-pdf {
    background: #555;
    flex: 1;
  }
  .pane-sheet {
    background: var(--bg);
    flex: 1;
    padding: 1.25rem;
  }
  .resizer {
    flex-shrink: 0;
    background: var(--border);
    transition: background 0.15s;
  }
  .resizer {
    width: 4px;
    cursor: col-resize;
  }

  .resizer:hover, .resizer.dragging {
    background: var(--blue);
  }

  /* PDF canvas */
  #pdf-canvas-container {
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  #pdf-canvas-container canvas {
    max-width: 100%;
    box-shadow: 0 2px 12px rgba(0,0,0,0.4);
    border-radius: 2px;
  }

  /* レイアウト・モードボタン */
  .layout-btns {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .layout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: var(--radius-sm);
    border: 0.5px solid var(--border-hover);
    background: var(--bg);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.12s;
  }
  .layout-btn.active {
    background: var(--bg-info);
    border-color: var(--blue);
    color: var(--blue);
  }
  .viewer-mode-btns {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .mode-btn {
    padding: 4px 10px;
    font-size: 13px;
    font-family: inherit;
    border-radius: var(--radius-sm);
    border: 0.5px solid var(--border-hover);
    background: var(--bg);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.12s;
  }
  .mode-btn.active {
    background: var(--bg-info);
    border-color: var(--blue);
    color: var(--blue);
    font-weight: 500;
  }
  .page-nav-btn {
    width: 26px;
    height: 26px;
    border-radius: var(--radius-sm);
    border: 0.5px solid var(--border-hover);
    background: var(--bg);
    color: var(--text-secondary);
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s;
    font-family: inherit;
  }
  .page-nav-btn:hover {
    border-color: var(--blue);
    color: var(--blue);
  }

  /* 設定タブの小さいPDFドロップゾーン */
  .pdf-zone.small {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
  }
  .pdf-zone.small svg { flex-shrink: 0; }
  .pdf-zone.small span { font-size: 13px; }
