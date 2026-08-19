const { execSync } = require('child_process');

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
  if (!expr || expr.trim() === '') return null;

  let s = expr.trim();

  s = s.replace(/×/g, '*');
  s = s.replace(/÷/g, '/');
  s = s.replace(/−/g, '-');

  s = s.replace(/(?<=\d|\))\s*\(/g, '*(');
  s = s.replace(/\)\s*(?=\d|\()/g, ')*');
  s = s.replace(/(?<=\d|\))\s*(?=[a-zπe])/gi, '*');

  s = s.replace(/([\d\.]+)\s*([\+\-])\s*([\d\.]+)%/g, (m, base, op, pct) => {
    return `${base} ${op} (${base} * (${pct} / 100))`;
  });
  s = s.replace(/([\d\.]+)%/g, '($1 / 100)');

  s = s.replace(/(\d+)!/g, 'factorial($1)');
  s = s.replace(/\(([^()]+)\)!/g, 'factorial($1)');

  s = s.replace(/\^/g, '**');

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

  s = s.replace(/π/g, `(${Math.PI})`);
  s = s.replace(/(^|[^a-zA-Z0-9_\.])e([^a-zA-Z0-9_\.]|$)/g, `$1(${Math.E})$2`);

  const openCount = (s.match(/\(/g) || []).length;
  const closeCount = (s.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    s += ')'.repeat(openCount - closeCount);
  }

  return s;
}

function evaluate(expr, mode = 'DEG') {
  const code = parseExpression(expr, mode);
  try {
    const fn = new Function('factorial', 'return (' + code + ')');
    const res = fn(factorial);
    return formatNumber(res);
  } catch(e) {
    return 'Error: ' + e.message;
  }
}

const tests = [
  ['0.1 + 0.2', '0.3'],
  ['50 + 10%', '55'],
  ['100 - 20%', '80'],
  ['200 × 15%', '30'],
  ['sin(30)', '0.5'],
  ['cos(60)', '0.5'],
  ['tan(45)', '1'],
  ['sqrt(144)', '12'],
  ['2^3', '8'],
  ['5!', '120'],
  ['5(2 + 3)', '25'],
  ['(2)(3)', '6'],
  ['10 ÷ 2', '5'],
  ['1234567 × 2', '2,469,134'],
  ['2 + 3 × 4', '14'],
  ['(2 + 3) × 4', '20'],
  ['10 ÷ 4', '2.5'],
  ['sin(90)', '1'],
  ['cos(0)', '1'],
  ['ln(e)', '1'],
  ['log(100)', '2'],
  ['abs(-42)', '42']
];

console.log('🧪 Running Calculator Core Test Suite:');
let passed = 0;
for (const [expr, expected] of tests) {
  const got = evaluate(expr);
  const ok = got === expected;
  console.log(`  ${ok ? '✓' : '✗'} [${expr}] => ${got} (expected ${expected})`);
  if (ok) passed++;
}

console.log(`\n🎉 Test Results: ${passed}/${tests.length} tests passed.`);
if (passed !== tests.length) {
  process.exit(1);
}
