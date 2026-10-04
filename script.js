(function() {
  'use strict';

  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const resultSection = document.getElementById('resultSection');
  const errorMsg = document.getElementById('errorMsg');

  // ---------- 事件绑定 ----------
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', e => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    fileInput.value = '';
  });

  // ---------- 文件处理 ----------
  function handleFile(file) {
    errorMsg.style.display = 'none';
    resultSection.style.display = 'none';

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showError('请选择 .csv 文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target.result.replace(/^\uFEFF/, '');
        const rows = parseCSV(text);
        if (rows.length === 0) throw new Error('CSV 文件为空或格式不正确');
        validateColumns(rows[0]);
        const result = computeOldPtt(rows);
        renderResult(result, file.name);
      } catch (err) {
        showError('解析失败：' + err.message);
      }
    };
    reader.onerror = () => showError('读取文件失败');
    reader.readAsText(file, 'UTF-8');
  }

  function showError(msg) {
    errorMsg.textContent = '⚠ ' + msg;
    errorMsg.style.display = 'block';
  }

  // ---------- CSV 解析 ----------
  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];
    const header = parseLine(lines[0]).map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length < 2) continue;
      const obj = {};
      header.forEach((h, idx) => {
        obj[h] = (cols[idx] !== undefined ? cols[idx] : '').trim();
      });
      rows.push(obj);
    }
    return rows;
  }

  function parseLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; }
          else { inQuotes = false; }
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { result.push(cur); cur = ''; }
        else { cur += ch; }
      }
    }
    result.push(cur);
    return result;
  }

  function validateColumns(row) {
    const required = ['SongId', 'Difficulty', 'Score', 'Constant', 'Potential', 'ClearType'];
    const missing = required.filter(c => !(c in row));
    if (missing.length > 0) {
      throw new Error('缺少必要列：' + missing.join(', '));
    }
  }

  // ---------- 核心计算 ----------
  function computeOldPtt(rows) {
    const scores = [];

    for (const row of rows) {
      const songId = row.SongId;
      const difficulty = parseInt(row.Difficulty, 10);
      const score = parseInt(row.Score, 10);
      const constant = parseFloat(row.Constant);
      const newPotential = parseFloat(row.Potential);
      const clearType = parseInt(row.ClearType, 10);

      if (isNaN(newPotential) || isNaN(clearType)) continue;

      // ClearType: 0 = Track Lost（未通关），非 0 = 通关
      const isClear = clearType !== 0;
      // 新版单曲潜力值 = 旧版 + 0.2（仅通关时），旧版下限为 0
      const oldPotential = isClear ? Math.max(0, newPotential - 0.2) : newPotential;

      scores.push({
        songId,
        difficulty,
        score,
        constant,
        newPotential,
        oldPotential,
        clearType,
        isClear
      });
    }

    // 按旧版单曲潜力值降序排列
    scores.sort((a, b) => b.oldPotential - a.oldPotential);

    const b30 = scores.slice(0, 30);
    const r10 = scores.slice(0, 10);

    const b30Sum = b30.reduce((s, x) => s + x.oldPotential, 0);
    const r10Sum = r10.reduce((s, x) => s + x.oldPotential, 0);

    // 旧版公式：(B30 + R10) / 40
    // 成绩不足 40 个时，按实际有效槽位数计算
    const denominator = Math.min(40, b30.length + r10.length);
    const oldPtt = denominator > 0 ? (b30Sum + r10Sum) / denominator : 0;

    return { scores, b30, r10, b30Sum, r10Sum, denominator, oldPtt, total: scores.length };
  }

  // ---------- 渲染 ----------
  function diffName(d) {
    return ['PST', 'PRS', 'FTR', 'BYD', 'ETR'][d] || '?';
  }

  function diffClass(d) {
    return 'diff-' + (d >= 0 && d <= 4 ? d : 0);
  }

  function fmtScore(n) {
    return n.toLocaleString('en-US');
  }

  function renderResult(result, fileName) {
    const { b30, r10, b30Sum, r10Sum, denominator, oldPtt, total } = result;

    let html = `
      <div class="result-card">
        <div class="result-label">旧版潜力值</div>
        <div class="result-value">${oldPtt.toFixed(2)}</div>
        <div class="result-sub">精确值：${oldPtt.toFixed(6)} ｜ 基于 ${b30.length} 条成绩计算</div>
      </div>

      <div class="calc-card">
        <div class="calc-title">计算过程</div>
        <div class="calc-row">
          <span class="k">CSV 总成绩数</span>
          <span class="v">${total}</span>
        </div>
        <div class="calc-row">
          <span class="k">Best 30 旧版总和</span>
          <span class="v">${b30Sum.toFixed(6)}</span>
        </div>
        <div class="calc-row">
          <span class="k">Recent 10 旧版总和（取最好 10 个）</span>
          <span class="v">${r10Sum.toFixed(6)}</span>
        </div>
        <div class="calc-row">
          <span class="k">分母</span>
          <span class="v">${denominator}</span>
        </div>
        <div class="calc-row">
          <span class="k">旧版潜力值</span>
          <span class="v accent">${oldPtt.toFixed(6)}</span>
        </div>
        <div class="formula">
          (B30总和 + R10总和) / 40<br>
          = (${b30Sum.toFixed(6)} + ${r10Sum.toFixed(6)}) / ${denominator}<br>
          = <span style="color:#00d4ff">${oldPtt.toFixed(6)}</span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header">
          <span>单曲成绩明细（按旧版潜力值排序）</span>
          <span class="badge">Top ${b30.length}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>曲目</th>
                <th>难度</th>
                <th>分数</th>
                <th>定数</th>
                <th>新版 ptt</th>
                <th>旧版 ptt</th>
                <th>通关</th>
              </tr>
            </thead>
            <tbody>
    `;

    b30.forEach((item, idx) => {
      const rank = idx + 1;
      const isR10 = rank <= 10;
      html += `
        <tr class="${isR10 ? 'r10-row' : ''}">
          <td class="mono">${rank}</td>
          <td>${escapeHtml(item.songId)}</td>
          <td><span class="diff-tag ${diffClass(item.difficulty)}">${diffName(item.difficulty)}</span></td>
          <td class="mono">${fmtScore(item.score)}</td>
          <td class="mono">${item.constant.toFixed(1)}</td>
          <td class="mono" style="color:#8888aa">${item.newPotential.toFixed(4)}</td>
          <td class="mono" style="color:#00d4ff;font-weight:600">${item.oldPotential.toFixed(4)}</td>
          <td class="${item.isClear ? 'clear-yes' : 'clear-no'}">${item.isClear ? '✓' : '—'}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
        <div class="legend">
          <div class="legend-item"><span class="legend-dot r10"></span> 前 10 名（R10，同时计入 B30）</div>
          <div class="legend-item"><span class="legend-dot b30"></span> 第 11~30 名（仅计入 B30）</div>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" id="copyBtn">复制结果</button>
        <button class="btn btn-secondary" id="resetBtn">重新上传</button>
      </div>
    `;

    resultSection.innerHTML = html;
    resultSection.style.display = 'block';

    // 按钮事件
    document.getElementById('copyBtn').addEventListener('click', () => {
      const text = `旧版潜力值：${oldPtt.toFixed(2)}\n` +
                   `精确值：${oldPtt.toFixed(6)}\n` +
                   `B30 总和：${b30Sum.toFixed(6)}\n` +
                   `R10 总和：${r10Sum.toFixed(6)}\n` +
                   `分母：${denominator}`;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        const orig = btn.textContent;
        btn.textContent = '已复制 ✓';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      }).catch(() => {
        alert('复制失败，请手动选择文本');
      });
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      resultSection.style.display = 'none';
      resultSection.innerHTML = '';
      errorMsg.style.display = 'none';
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

})();