/**
 * Calculator Pro - Core Application Logic
 * Fast, responsive, robust standard and scientific calculator
 * with instant touch feedback, keyboard sanitation, and Capacitor compatibility.
 */

(function () {
  'use strict';

  // =========================================================================
  // State Management
  // =========================================================================
  const state = {
    expression: '',         // Current mathematical expression string
    previewResult: '',      // Real-time evaluated result
    lastResult: null,       // Result of last evaluated expression
    isEvaluated: false,     // Flag when equals '=' was just pressed
    angleMode: 'DEG',       // 'DEG' or 'RAD'
    mode: 'standard',       // 'standard' or 'scientific'
    history: []             // Array of { id, expression, result, timestamp }
  };

  // =========================================================================
  // DOM Elements Cache
  // =========================================================================
  const DOM = {
    app: document.getElementById('app'),
    expressionDisplay: document.getElementById('expression-display'),
    resultDisplay: document.getElementById('result-display'),
    resultContainer: document.getElementById('result-container'),
    resultPrefix: document.getElementById('result-prefix'),
    displayModeIndicator: document.getElementById('display-mode-indicator'),
    angleModeBtn: document.getElementById('angle-mode-btn'),
    angleBadge: document.getElementById('angle-badge'),
    modeStdBtn: document.getElementById('mode-std-btn'),
    modeSciBtn: document.getElementById('mode-sci-btn'),
    segmentedControl: document.querySelector('.segmented-control'),
    scientificPanel: document.getElementById('scientific-panel'),
    historyToggleBtn: document.getElementById('history-toggle-btn'),
    historyBadge: document.getElementById('history-badge'),
    historySheet: document.getElementById('history-sheet'),
    historyBackdrop: document.getElementById('history-backdrop'),
    historyItems: document.getElementById('history-items'),
    historyEmpty: document.getElementById('history-empty'),
    sheetCountBadge: document.getElementById('sheet-count-badge'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    closeHistoryBtn: document.getElementById('close-history-btn'),
    actionCopyBtn: document.getElementById('action-copy-btn'),
    actionBackspaceBtn: document.getElementById('action-backspace-btn'),
    keyClear: document.getElementById('key-clear'),
    keyEquals: document.getElementById('key-equals'),
    toastContainer: document.getElementById('toast-container'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    toastIcon: document.getElementById('toast-icon'),
    standardGrid: document.getElementById('standard-grid'),
    keypadWrapper: document.getElementById('keypad-wrapper')
  };

  // =========================================================================
  // Haptic Touch Feedback (Non-blocking & Zero Audio)
  // =========================================================================
  function triggerHaptic(type = 'num') {
    if (navigator.vibrate) {
      setTimeout(() => {
        try {
          if (type === 'equals') {
            navigator.vibrate([15, 20, 15]);
          } else if (type === 'clear' || type === 'error') {
            navigator.vibrate(20);
          } else {
            navigator.vibrate(8);
          }
        } catch (e) {}
      }, 0);
    }
  }

  // =========================================================================
  // Math Parser & Evaluation Engine
  // =========================================================================

  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'Error';
    if (!isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';

    const precisionRounded = Number(Math.round(Number(num + 'e+12')) + 'e-12');
    const absVal = Math.abs(precisionRounded);
    if ((absVal >= 1e12 || (absVal > 0 && absVal < 1e-7)) && absVal !== 0) {
      return precisionRounded.toExponential(6).replace(/\.?0+e/, 'e');
    }

    const parts = precisionRounded.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function parseExpression(expr, angleMode = 'DEG') {
    if (!expr || typeof expr !== 'string' || expr.trim() === '') return null;

    let s = expr.trim();

    // 1. Replace display glyphs
    s = s.replace(/×/g, '*');
    s = s.replace(/÷/g, '/');
    s = s.replace(/−/g, '-');

    // 2. Implicit multiplication on raw user expression
    s = s.replace(/(?<=\d|\))\s*\(/g, '*(');
    s = s.replace(/\)\s*(?=\d|\()/g, ')*');
    s = s.replace(/(?<=\d|\))\s*(?=[a-zπe])/gi, '*');

    // 3. Percentages
    s = s.replace(/([\d\.]+)\s*([\+\-])\s*([\d\.]+)%/g, (m, base, op, pct) => {
      return `${base} ${op} (${base} * (${pct} / 100))`;
    });
    s = s.replace(/([\d\.]+)%/g, '($1 / 100)');

    // 4. Factorial
    s = s.replace(/(\d+)!/g, 'factorial($1)');
    s = s.replace(/\(([^()]+)\)!/g, 'factorial($1)');

    // 5. Exponentiation
    s = s.replace(/\^/g, '**');

    // 6. Trig & Math functions
    const isDeg = angleMode === 'DEG';
    if (isDeg) {
      s = s.replace(/\basin\(/g, '(180/Math.PI)*Math.asin(');
      s = s.replace(/\bacos\(/g, '(180/Math.PI)*Math.acos(');
      s = s.replace(/\batan\(/g, '(180/Math.PI)*Math.atan(');
      s = s.replace(/\bsin\(/g, 'Math.sin((Math.PI/180)*');
      s = s.replace(/\bcos\(/g, 'Math.cos((Math.PI/180)*');
      s = s.replace(/\btan\(/g, 'Math.tan((Math.PI/180)*');
    } else {
      s = s.replace(/\basin\(/g, 'Math.asin(');
      s = s.replace(/\bacos\(/g, 'Math.acos(');
      s = s.replace(/\batan\(/g, 'Math.atan(');
      s = s.replace(/\bsin\(/g, 'Math.sin(');
      s = s.replace(/\bcos\(/g, 'Math.cos(');
      s = s.replace(/\btan\(/g, 'Math.tan(');
    }

    s = s.replace(/\bsqrt\(/g, 'Math.sqrt(');
    s = s.replace(/\bcbrt\(/g, 'Math.cbrt(');
    s = s.replace(/\blog\(/g, 'Math.log10(');
    s = s.replace(/\bln\(/g, 'Math.log(');
    s = s.replace(/\babs\(/g, 'Math.abs(');

    // 7. Constants
    s = s.replace(/π/g, `(${Math.PI})`);
    s = s.replace(/(^|[^a-zA-Z0-9_\.])e([^a-zA-Z0-9_\.]|$)/g, `$1(${Math.E})$2`);

    // 8. Auto-balance parentheses
    const openCount = (s.match(/\(/g) || []).length;
    const closeCount = (s.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      s += ')'.repeat(openCount - closeCount);
    }

    return s;
  }

  function evaluateExpression(expr, angleMode = 'DEG') {
    if (!expr || expr.trim() === '' || expr === '0') {
      return { success: true, value: 0, formatted: '0' };
    }

    const cleanExpr = expr.trim();
    const lastChar = cleanExpr.slice(-1);
    let evalTarget = cleanExpr;
    if (['+', '−', '×', '÷', '-', '*', '/', '^'].includes(lastChar)) {
      evalTarget = cleanExpr.slice(0, -1);
    }

    const jsCode = parseExpression(evalTarget, angleMode);
    if (!jsCode) return { success: true, value: 0, formatted: '0' };

    try {
      const evaluator = new Function('factorial', `
        "use strict";
        try {
          const res = (${jsCode});
          return res;
        } catch (e) {
          return NaN;
        }
      `);

      const rawResult = evaluator(factorial);

      if (typeof rawResult !== 'number' || isNaN(rawResult)) {
        return { success: false, error: 'Invalid expression' };
      }

      if (!isFinite(rawResult)) {
        return { success: false, error: 'Cannot divide by zero' };
      }

      return {
        success: true,
        value: rawResult,
        formatted: formatNumber(rawResult)
      };
    } catch (err) {
      return { success: false, error: 'Format error' };
    }
  }

  // =========================================================================
  // Input Handling & State Updaters
  // =========================================================================

  function updateDisplay() {
    // 1. Expression Line
    if (!state.expression || state.expression === '' || state.expression === '0') {
      DOM.expressionDisplay.textContent = '0';
      DOM.keyClear.textContent = 'AC';
    } else {
      DOM.expressionDisplay.textContent = state.expression;
      DOM.keyClear.textContent = 'C';
    }

    if (DOM.expressionDisplay.parentElement) {
      DOM.expressionDisplay.parentElement.scrollLeft = DOM.expressionDisplay.parentElement.scrollWidth;
    }

    // 2. Live Preview / Evaluated Result
    if (state.isEvaluated) {
      DOM.resultPrefix.textContent = '=';
      DOM.resultDisplay.textContent = state.previewResult || '0';
      DOM.resultDisplay.classList.remove('is-error');
    } else {
      if (state.expression && state.expression !== '0') {
        const evalOutcome = evaluateExpression(state.expression, state.angleMode);
        if (evalOutcome.success) {
          state.previewResult = evalOutcome.formatted;
          DOM.resultPrefix.textContent = '=';
          DOM.resultDisplay.textContent = evalOutcome.formatted;
          DOM.resultDisplay.classList.remove('is-error');
        } else {
          DOM.resultPrefix.textContent = '';
          DOM.resultDisplay.textContent = '';
        }
      } else {
        DOM.resultPrefix.textContent = '=';
        DOM.resultDisplay.textContent = '0';
        DOM.resultDisplay.classList.remove('is-error');
      }
    }

    // 3. Dynamic Font Sizing
    const len = DOM.resultDisplay.textContent.length;
    DOM.resultDisplay.classList.remove('font-medium', 'font-small', 'font-xsmall');
    if (len > 16) {
      DOM.resultDisplay.classList.add('font-xsmall');
    } else if (len > 12) {
      DOM.resultDisplay.classList.add('font-small');
    } else if (len > 8) {
      DOM.resultDisplay.classList.add('font-medium');
    }

    // 4. Update Header Badges
    DOM.angleBadge.textContent = state.angleMode;
    DOM.displayModeIndicator.textContent = state.angleMode === 'DEG' ? 'DEGREE' : 'RADIAN';
  }

  function handleNumberInput(val) {
    if (!/^(?:[0-9]|00)$/.test(val)) return;

    triggerHaptic('num');

    if (state.isEvaluated) {
      state.expression = val === '00' ? '0' : val;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.expression === '0') {
      if (val === '00') return;
      state.expression = val;
    } else {
      state.expression += val;
    }

    updateDisplay();
  }

  function handleDecimal() {
    triggerHaptic('num');

    if (state.isEvaluated) {
      state.expression = '0.';
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (!state.expression || state.expression === '0') {
      state.expression = '0.';
      updateDisplay();
      return;
    }

    const tokens = state.expression.split(/[\+\−\×\÷\(\)\^]/);
    const currentToken = tokens[tokens.length - 1];

    if (!currentToken.includes('.')) {
      state.expression += '.';
    }

    updateDisplay();
  }

  function handleOperator(op) {
    if (!['+', '−', '×', '÷', '^'].includes(op)) return;

    triggerHaptic('op');

    if (state.isEvaluated) {
      state.expression = (state.previewResult || '0').replace(/,/g, '') + ` ${op} `;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (!state.expression || state.expression === '0') {
      if (op === '−') {
        state.expression = '−';
      }
      updateDisplay();
      return;
    }

    const trimmed = state.expression.trim();
    const lastChar = trimmed.slice(-1);

    if (['+', '−', '×', '÷', '^'].includes(lastChar)) {
      if (op === '−' && ['×', '÷'].includes(lastChar)) {
        state.expression = trimmed + ' -';
      } else {
        state.expression = trimmed.slice(0, -1) + ` ${op} `;
      }
    } else {
      state.expression = trimmed + ` ${op} `;
    }

    updateDisplay();
  }

  function handleFunction(funcStr) {
    triggerHaptic('op');

    if (state.isEvaluated) {
      state.expression = funcStr;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.expression === '0' || !state.expression) {
      state.expression = funcStr;
    } else {
      const lastChar = state.expression.slice(-1);
      if (/\d|\)/.test(lastChar)) {
        state.expression += ` × ${funcStr}`;
      } else {
        state.expression += funcStr;
      }
    }

    updateDisplay();
  }

  function handleConstant(constStr) {
    triggerHaptic('num');

    if (state.isEvaluated || state.expression === '0' || !state.expression) {
      state.expression = constStr;
      state.isEvaluated = false;
    } else {
      const lastChar = state.expression.slice(-1);
      if (/\d|\)|\π|e/.test(lastChar)) {
        state.expression += ` × ${constStr}`;
      } else {
        state.expression += constStr;
      }
    }

    updateDisplay();
  }

  function handleParenthesis(paren) {
    triggerHaptic('op');

    if (state.isEvaluated) {
      state.expression = paren;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (paren === '(') {
      if (!state.expression || state.expression === '0') {
        state.expression = '(';
      } else {
        const lastChar = state.expression.trim().slice(-1);
        if (/\d|\)/.test(lastChar)) {
          state.expression += ' × (';
        } else {
          state.expression += '(';
        }
      }
    } else if (paren === ')') {
      const openCount = (state.expression.match(/\(/g) || []).length;
      const closeCount = (state.expression.match(/\)/g) || []).length;
      if (openCount > closeCount) {
        state.expression += ')';
      }
    }

    updateDisplay();
  }

  function handlePercentage() {
    triggerHaptic('op');
    if (!state.expression || state.expression === '0') return;
    state.expression += '%';
    state.isEvaluated = false;
    updateDisplay();
  }

  function handleSignToggle() {
    triggerHaptic('op');

    if (state.isEvaluated) {
      let num = parseFloat((state.previewResult || '0').replace(/,/g, ''));
      if (!isNaN(num)) {
        num = -num;
        state.previewResult = formatNumber(num);
        state.expression = num.toString();
        updateDisplay();
      }
      return;
    }

    if (!state.expression || state.expression === '0') return;

    const tokens = state.expression.split(/(\s*[\+\−\×\÷\^]\s*)/);
    if (tokens.length > 0) {
      let lastToken = tokens[tokens.length - 1].trim();
      if (lastToken.startsWith('(-') && lastToken.endsWith(')')) {
        tokens[tokens.length - 1] = lastToken.slice(2, -1);
      } else if (lastToken.startsWith('-')) {
        tokens[tokens.length - 1] = lastToken.slice(1);
      } else if (lastToken.length > 0) {
        tokens[tokens.length - 1] = `(-${lastToken})`;
      }
      state.expression = tokens.join('');
    }

    updateDisplay();
  }

  function handleBackspace() {
    triggerHaptic('clear');

    if (state.isEvaluated) {
      state.isEvaluated = false;
    }

    if (!state.expression || state.expression === '0') return;

    const funcs = ['asin(', 'acos(', 'atan(', 'sqrt(', 'cbrt(', 'sin(', 'cos(', 'tan(', 'log(', 'ln(', 'abs('];
    let matchedFunc = false;
    for (const f of funcs) {
      if (state.expression.endsWith(f)) {
        state.expression = state.expression.slice(0, -f.length);
        matchedFunc = true;
        break;
      }
    }

    if (!matchedFunc) {
      state.expression = state.expression.trimEnd();
      state.expression = state.expression.slice(0, -1).trimEnd();
    }

    if (state.expression === '') {
      state.expression = '0';
    }

    updateDisplay();
  }

  function handleClear() {
    triggerHaptic('clear');
    state.expression = '0';
    state.previewResult = '0';
    state.isEvaluated = false;
    updateDisplay();
  }

  function handleEquals() {
    if (!state.expression || state.expression === '0') return;

    const evalResult = evaluateExpression(state.expression, state.angleMode);

    if (evalResult.success) {
      triggerHaptic('equals');
      const formatted = evalResult.formatted;

      addHistoryItem(state.expression, formatted);

      state.lastResult = evalResult.value;
      state.previewResult = formatted;
      state.isEvaluated = true;
      updateDisplay();
    } else {
      triggerHaptic('error');
      DOM.resultPrefix.textContent = '';
      DOM.resultDisplay.textContent = evalResult.error || 'Error';
      DOM.resultDisplay.classList.add('is-error');
      showToast(evalResult.error || 'Invalid Expression', true);
    }
  }

  // =========================================================================
  // History Drawer & Persistence Engine
  // =========================================================================

  const HISTORY_STORAGE_KEY = 'calculator_pro_history_v1';
  const MODE_STORAGE_KEY = 'calculator_pro_mode_v1';
  const ANGLE_STORAGE_KEY = 'calculator_pro_angle_v1';

  function loadSettings() {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        state.history = JSON.parse(savedHistory);
      }

      const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
      if (savedMode === 'scientific') {
        setMode('scientific');
      }

      const savedAngle = localStorage.getItem(ANGLE_STORAGE_KEY);
      if (savedAngle === 'RAD') {
        state.angleMode = 'RAD';
      }
    } catch (e) {}
    renderHistory();
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state.history));
    } catch (e) {}
  }

  function addHistoryItem(expr, res) {
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      expression: expr,
      result: res,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.history.unshift(item);
    if (state.history.length > 50) {
      state.history.pop();
    }

    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    const count = state.history.length;
    DOM.sheetCountBadge.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    DOM.historyBadge.textContent = count > 99 ? '99+' : count;

    if (count === 0) {
      DOM.historyBadge.classList.add('hidden');
      DOM.historyEmpty.classList.remove('hidden');
      DOM.historyItems.innerHTML = '';
      return;
    }

    DOM.historyBadge.classList.remove('hidden');
    DOM.historyEmpty.classList.add('hidden');

    DOM.historyItems.innerHTML = state.history.map(item => `
      <div class="history-item" data-id="${item.id}" data-expr="${encodeURIComponent(item.expression)}" data-res="${encodeURIComponent(item.result)}">
        <div class="history-item-top">
          <span class="history-time">${item.timestamp}</span>
          <button type="button" class="history-item-del" data-del-id="${item.id}" title="Delete item" aria-label="Delete item">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="history-expr">${escapeHtml(item.expression)}</div>
        <div class="history-res">= ${escapeHtml(item.result)}</div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function openHistoryDrawer() {
    triggerHaptic('num');
    DOM.historySheet.classList.add('open');
    DOM.historyBackdrop.classList.add('open');
  }

  function closeHistoryDrawer() {
    triggerHaptic('num');
    DOM.historySheet.classList.remove('open');
    DOM.historyBackdrop.classList.remove('open');
  }

  function clearAllHistory() {
    triggerHaptic('clear');
    state.history = [];
    saveHistory();
    renderHistory();
    showToast('History cleared');
  }

  // =========================================================================
  // Mode & Feature Toggles
  // =========================================================================

  function setMode(mode) {
    triggerHaptic('num');
    state.mode = mode;
    DOM.segmentedControl.setAttribute('data-mode', mode);

    if (mode === 'scientific') {
      DOM.modeSciBtn.classList.add('active');
      DOM.modeSciBtn.setAttribute('aria-selected', 'true');
      DOM.modeStdBtn.classList.remove('active');
      DOM.modeStdBtn.setAttribute('aria-selected', 'false');
      DOM.scientificPanel.classList.add('open');
      DOM.scientificPanel.setAttribute('aria-hidden', 'false');
      DOM.angleModeBtn.classList.add('visible');
    } else {
      DOM.modeStdBtn.classList.add('active');
      DOM.modeStdBtn.setAttribute('aria-selected', 'true');
      DOM.modeSciBtn.classList.remove('active');
      DOM.modeSciBtn.setAttribute('aria-selected', 'false');
      DOM.scientificPanel.classList.remove('open');
      DOM.scientificPanel.setAttribute('aria-hidden', 'true');
      DOM.angleModeBtn.classList.remove('visible');
    }

    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch (e) {}
  }

  function toggleAngleMode() {
    triggerHaptic('num');
    state.angleMode = state.angleMode === 'DEG' ? 'RAD' : 'DEG';
    try {
      localStorage.setItem(ANGLE_STORAGE_KEY, state.angleMode);
    } catch (e) {}
    updateDisplay();
    showToast(`Mode: ${state.angleMode === 'DEG' ? 'Degrees' : 'Radians'}`);
  }

  // =========================================================================
  // Clipboard & Toast UI
  // =========================================================================

  let toastTimer = null;

  function showToast(message, isError = false) {
    if (toastTimer) clearTimeout(toastTimer);

    DOM.toastMessage.textContent = message;
    DOM.toastIcon.textContent = isError ? '!' : '✓';
    DOM.toastIcon.style.background = isError ? '#f43f5e' : 'var(--text-accent)';
    DOM.toast.classList.add('show');

    toastTimer = setTimeout(() => {
      DOM.toast.classList.remove('show');
    }, 2000);
  }

  function copyResultToClipboard() {
    const textToCopy = (state.previewResult || '0').replace(/,/g, '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        triggerHaptic('num');
        showToast('Result copied to clipboard');
      }).catch(() => {
        fallbackCopy(textToCopy);
      });
    } else {
      fallbackCopy(textToCopy);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      triggerHaptic('num');
      showToast('Result copied to clipboard');
    } catch (e) {
      showToast('Failed to copy');
    }
    document.body.removeChild(textarea);
  }

  // =========================================================================
  // Keypad & Click Event Delegation
  // =========================================================================

  function handleKeyAction(action, value) {
    switch (action) {
      case 'num':
        handleNumberInput(value);
        break;
      case 'decimal':
        handleDecimal();
        break;
      case 'operator':
        handleOperator(value);
        break;
      case 'func':
        handleFunction(value);
        break;
      case 'constant':
        handleConstant(value);
        break;
      case 'parenthesis':
        handleParenthesis(value);
        break;
      case 'percent':
        handlePercentage();
        break;
      case 'sign':
        handleSignToggle();
        break;
      case 'power':
        handleOperator(value);
        break;
      case 'factorial':
        if (state.expression && state.expression !== '0') {
          triggerHaptic('op');
          state.expression += '!';
          updateDisplay();
        }
        break;
      case 'reciprocal':
        handleFunction('1/(');
        break;
      case 'clear':
        handleClear();
        break;
      case 'equals':
        handleEquals();
        break;
      default:
        break;
    }
  }

  function attachEventListeners() {
    // 1. Instant touch active state on press
    DOM.app.addEventListener('pointerdown', (e) => {
      const keyBtn = e.target.closest('.key');
      if (keyBtn) {
        keyBtn.classList.add('key-pressed');
      }
    }, { passive: true });

    const releaseKeys = () => {
      document.querySelectorAll('.key.key-pressed').forEach(k => k.classList.remove('key-pressed'));
    };
    window.addEventListener('pointerup', releaseKeys, { passive: true });
    window.addEventListener('pointercancel', releaseKeys, { passive: true });

    // 2. Button click handler
    DOM.app.addEventListener('click', (e) => {
      const keyBtn = e.target.closest('.key');
      if (keyBtn) {
        e.preventDefault();
        const action = keyBtn.dataset.action;
        const val = keyBtn.dataset.value;
        handleKeyAction(action, val);
      }
    });

    // 3. Header buttons
    DOM.modeStdBtn.addEventListener('click', () => setMode('standard'));
    DOM.modeSciBtn.addEventListener('click', () => setMode('scientific'));
    DOM.angleModeBtn.addEventListener('click', toggleAngleMode);
    DOM.historyToggleBtn.addEventListener('click', openHistoryDrawer);

    // 4. Display Actions
    DOM.actionCopyBtn.addEventListener('click', copyResultToClipboard);
    DOM.resultContainer.addEventListener('click', copyResultToClipboard);
    DOM.actionBackspaceBtn.addEventListener('click', handleBackspace);

    // 5. History Sheet Controls
    DOM.closeHistoryBtn.addEventListener('click', closeHistoryDrawer);
    DOM.historyBackdrop.addEventListener('click', closeHistoryDrawer);
    DOM.clearHistoryBtn.addEventListener('click', clearAllHistory);

    // 6. History Item Click & Delete
    DOM.historyItems.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.history-item-del');
      if (delBtn) {
        e.stopPropagation();
        const id = delBtn.dataset.delId;
        state.history = state.history.filter(h => h.id !== id);
        saveHistory();
        renderHistory();
        triggerHaptic('clear');
        return;
      }

      const itemCard = e.target.closest('.history-item');
      if (itemCard) {
        const res = decodeURIComponent(itemCard.dataset.res);
        triggerHaptic('num');
        state.expression = res.replace(/,/g, '');
        state.isEvaluated = false;
        updateDisplay();
        closeHistoryDrawer();
        showToast('Loaded calculation result');
      }
    });

    // 7. Strictly Sanitized Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;

      if (/^F\d+$/.test(key) || ['Tab', 'CapsLock', 'Shift', 'Control', 'Alt', 'Meta', 'ContextMenu', 'Insert', 'Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'NumLock', 'ScrollLock', 'Pause'].includes(key)) {
        return;
      }

      if (/^[0-9]$/.test(key)) {
        handleNumberInput(key);
      } else if (key === '.') {
        handleDecimal();
      } else if (key === '+') {
        handleOperator('+');
      } else if (key === '-') {
        handleOperator('−');
      } else if (key === '*' || key === 'x' || key === 'X') {
        handleOperator('×');
      } else if (key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (key === '%') {
        handlePercentage();
      } else if (key === '^') {
        handleOperator('^');
      } else if (key === '(' || key === ')') {
        handleParenthesis(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Delete') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        handleClear();
      } else if (key.toLowerCase() === 's') {
        setMode(state.mode === 'standard' ? 'scientific' : 'standard');
      } else if (key.toLowerCase() === 'h') {
        if (DOM.historySheet.classList.contains('open')) {
          closeHistoryDrawer();
        } else {
          openHistoryDrawer();
        }
      }
    });

    // 8. Touch Swipe down on History Sheet to close
    let startY = 0;
    DOM.historySheet.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    DOM.historySheet.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0].clientY;
      if (endY - startY > 60) {
        closeHistoryDrawer();
      }
    }, { passive: true });
  }

  // =========================================================================
  // Application Bootstrap
  // =========================================================================
  function init() {
    loadSettings();
    attachEventListeners();
    updateDisplay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
