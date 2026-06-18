'use strict';

let exchangeRates  = {};
let isLoadingRates = false;
let convertTimeout = null;
let DOM = {};

function cacheDom() {
  DOM = {
    fromAmount:   document.getElementById('fromAmount'),
    fromCurrency: document.getElementById('fromCurrency'),
    toAmount:     document.getElementById('toAmount'),
    toCurrency:   document.getElementById('toCurrency'),
    swapBtn:      document.getElementById('swapBtn'),
    convertBtn:   document.getElementById('convertBtn'),
    rateBar:      document.getElementById('rateBar'),
    rateBarText:  document.getElementById('rateBarText'),
    resultBox:    document.getElementById('resultBox'),
    resultMain:   document.getElementById('resultMain'),
    resultRate:   document.getElementById('resultRate'),
    errorBox:     document.getElementById('errorBox'),
    errorText:    document.getElementById('errorText'),
    lastUpdate:   document.getElementById('lastUpdate'),
  };
}

document.addEventListener('DOMContentLoaded', () => {
  cacheDom();
  bindEvents();
  fetchExchangeRates();
  setInterval(fetchExchangeRates, 5 * 60 * 1000);
});

function bindEvents() {
  DOM.convertBtn.addEventListener('click', handleConvert);
  DOM.swapBtn.addEventListener('click', handleSwap);
  DOM.fromCurrency.addEventListener('change', () => scheduleConvert());
  DOM.toCurrency.addEventListener('change',   () => scheduleConvert());
  DOM.fromAmount.addEventListener('input', scheduleConvert);
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleConvert(); });
  window.addEventListener('online',  () => fetchExchangeRates());
  window.addEventListener('offline', () => setRateBar('error', '❌ لا يوجد اتصال بالإنترنت'));
}

async function fetchExchangeRates() {
  if (isLoadingRates) return;
  isLoadingRates = true;
  setRateBar('loading', 'جاري جلب أسعار الصرف…');
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { signal: controller.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.rates || typeof data.rates !== 'object') throw new Error('تنسيق غير صحيح');
    exchangeRates = data.rates;
    DOM.lastUpdate.textContent = new Date().toLocaleTimeString('ar-EG', { hour:'2-digit', minute:'2-digit' });
    setRateBar('success', '✅ أسعار الصرف محدّثة');
    if (DOM.fromAmount.value.trim() !== '') handleConvert();
  } catch (err) {
    setRateBar('error', err.name === 'AbortError' ? '❌ انتهت مهلة الطلب' : '❌ تعذّر جلب أسعار الصرف');
  } finally {
    isLoadingRates = false;
  }
}

function setRateBar(state, message) {
  DOM.rateBar.classList.remove('is-loading', 'is-error', 'is-success');
  if (state) DOM.rateBar.classList.add(`is-${state}`);
  DOM.rateBarText.textContent = message;
}

function scheduleConvert() {
  clearTimeout(convertTimeout);
  convertTimeout = setTimeout(handleConvert, 300);
}

function handleConvert() {
  clearMessages();
  const rawValue   = DOM.fromAmount.value.trim();
  const fromCurr   = DOM.fromCurrency.value;
  const toCurr     = DOM.toCurrency.value;
  const fromAmount = parseFloat(rawValue);

  if (rawValue === '' || isNaN(fromAmount)) { DOM.toAmount.value = ''; return; }
  if (fromAmount < 0)   return showError('الرجاء إدخال رقم موجب');
  if (fromAmount === 0) return showError('الرجاء إدخال رقم أكبر من صفر');
  if (Object.keys(exchangeRates).length === 0) return showError('أسعار الصرف لم تُحمَّل بعد');
  if (!exchangeRates[fromCurr] || !exchangeRates[toCurr]) return showError('عملة غير مدعومة');

  const converted = (fromAmount / exchangeRates[fromCurr]) * exchangeRates[toCurr];
  if (!isFinite(converted)) return showError('حدث خطأ في الحساب');

  DOM.toAmount.value = converted.toFixed(2);
  DOM.resultMain.innerHTML =
    `<strong>${formatNumber(fromAmount)} ${fromCurr}</strong> = <strong>${formatNumber(converted)} ${toCurr}</strong>`;
  DOM.resultRate.textContent =
    `1 ${fromCurr} = ${formatNumber(exchangeRates[toCurr] / exchangeRates[fromCurr], 4)} ${toCurr}`;
  DOM.resultBox.classList.remove('hidden');
  DOM.fromAmount.classList.remove('is-error');
}

function handleSwap() {
  const tmpCurr          = DOM.fromCurrency.value;
  DOM.fromCurrency.value = DOM.toCurrency.value;
  DOM.toCurrency.value   = tmpCurr;
  const converted = DOM.toAmount.value;
  if (converted) DOM.fromAmount.value = parseFloat(converted).toFixed(2);
  DOM.toAmount.value = '';
  clearMessages();
  handleConvert();
}

function showError(msg) {
  DOM.errorText.textContent = msg;
  DOM.errorBox.classList.remove('hidden');
  DOM.fromAmount.classList.add('is-error');
  DOM.toAmount.value = '';
}

function clearMessages() {
  DOM.resultBox.classList.add('hidden');
  DOM.errorBox.classList.add('hidden');
  DOM.fromAmount.classList.remove('is-error');
}

function formatNumber(num, decimals = 2) {
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
