// Exchange rates cache
let exchangeRates = {};
let lastUpdateTime = null;
let isLoadingRates = false;

// Initialize the converter on page load
document.addEventListener('DOMContentLoaded', function() {
    // Fetch rates on page load
    fetchExchangeRates();
    
    // Event listeners
    const convertBtn = document.getElementById('convertBtn');
    const fromAmount = document.getElementById('fromAmount');
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const swapBtn = document.getElementById('swapBtn');
    
    if (convertBtn) convertBtn.addEventListener('click', convertCurrency);
    if (fromAmount) fromAmount.addEventListener('input', convertCurrency);
    if (fromCurrency) fromCurrency.addEventListener('change', convertCurrency);
    if (toCurrency) toCurrency.addEventListener('change', convertCurrency);
    if (swapBtn) swapBtn.addEventListener('click', swapCurrencies);
    
    // Auto-refresh rates every 5 minutes
    setInterval(fetchExchangeRates, 5 * 60 * 1000);
    
    // Prevent form submission
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            convertCurrency();
        });
    }
});

// Fetch exchange rates from API
async function fetchExchangeRates() {
    if (isLoadingRates) return; // Prevent multiple simultaneous requests
    
    isLoadingRates = true;
    const rateInfo = document.getElementById('rateInfo');
    const rateText = document.getElementById('rateText');
    
    try {
        // Set loading state
        if (rateInfo && rateText) {
            rateInfo.classList.remove('alert-danger', 'alert-info');
            rateInfo.classList.add('alert-info');
            rateText.textContent = '⏳ جاري جلب أسعار الصرف...';
        }
        
        // Fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate response data
        if (!data.rates || typeof data.rates !== 'object') {
            throw new Error('Invalid response format');
        }
        
        exchangeRates = data.rates;
        lastUpdateTime = new Date().toLocaleTimeString('ar-EG');
        
        // Update UI
        if (document.getElementById('lastUpdate')) {
            document.getElementById('lastUpdate').textContent = lastUpdateTime;
        }
        
        if (rateInfo && rateText) {
            rateInfo.classList.remove('alert-danger');
            rateInfo.classList.add('alert-info');
            rateText.textContent = '✅ تم تحديث أسعار الصرف بنجاح';
        }
        
        // Trigger conversion if there's already an amount
        const fromAmountInput = document.getElementById('fromAmount');
        if (fromAmountInput && fromAmountInput.value) {
            convertCurrency();
        }
        
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        
        if (rateInfo && rateText) {
            rateInfo.classList.remove('alert-info');
            rateInfo.classList.add('alert-danger');
            
            if (error.name === 'AbortError') {
                rateText.textContent = '❌ انتهت مهلة الانتظار. يرجى التحقق من الاتصال بالإنترنت.';
            } else {
                rateText.textContent = '❌ خطأ في جلب أسعار الصرف. يرجى التحقق من الاتصال بالإنترنت.';
            }
        }
    } finally {
        isLoadingRates = false;
    }
}

// Convert currency
function convertCurrency() {
    try {
        // Get DOM elements
        const fromAmountInput = document.getElementById('fromAmount');
        const fromCurrencySelect = document.getElementById('fromCurrency');
        const toCurrencySelect = document.getElementById('toCurrency');
        const resultDiv = document.getElementById('result');
        const errorDiv = document.getElementById('errorMsg');
        const toAmountInput = document.getElementById('toAmount');
        const rateText = document.getElementById('rateText');
        
        // Validate elements exist
        if (!fromAmountInput || !fromCurrencySelect || !toCurrencySelect) {
            console.error('Required DOM elements not found');
            return;
        }
        
        const fromAmount = parseFloat(fromAmountInput.value);
        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;
        
        // Hide previous messages
        if (resultDiv) resultDiv.classList.add('d-none');
        if (errorDiv) errorDiv.classList.add('d-none');
        
        // Validation: Empty input
        if (fromAmountInput.value === '' || isNaN(fromAmount)) {
            if (rateText) {
                rateText.textContent = 'أدخل مبلغاً صحيحاً للتحويل';
            }
            if (toAmountInput) toAmountInput.value = '';
            return;
        }
        
        // Validation: Negative number
        if (fromAmount < 0) {
            if (errorDiv) {
                errorDiv.classList.remove('d-none');
                const errorText = document.getElementById('errorText');
                if (errorText) errorText.textContent = '❌ الرجاء إدخال رقم موجب';
            }
            if (toAmountInput) toAmountInput.value = '';
            return;
        }
        
        // Validation: Zero
        if (fromAmount === 0) {
            if (errorDiv) {
                errorDiv.classList.remove('d-none');
                const errorText = document.getElementById('errorText');
                if (errorText) errorText.textContent = '❌ الرجاء إدخال رقم أكبر من صفر';
            }
            if (toAmountInput) toAmountInput.value = '';
            return;
        }
        
        // Check if we have exchange rates
        if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
            if (errorDiv) {
                errorDiv.classList.remove('d-none');
                const errorText = document.getElementById('errorText');
                if (errorText) errorText.textContent = '⏳ جاري جلب أسعار الصرف...';
            }
            return;
        }
        
        // Validate currencies exist in rates
        if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
            if (errorDiv) {
                errorDiv.classList.remove('d-none');
                const errorText = document.getElementById('errorText');
                if (errorText) errorText.textContent = '❌ عملة غير مدعومة';
            }
            return;
        }
        
        // Perform conversion
        const fromRate = exchangeRates[fromCurrency];
        const toRate = exchangeRates[toCurrency];
        
        // Validate rates are valid numbers
        if (typeof fromRate !== 'number' || typeof toRate !== 'number' || fromRate <= 0 || toRate <= 0) {
            throw new Error('Invalid rate values');
        }
        
        // Convert: amount in USD = fromAmount / fromRate
        // Then convert to target currency = (fromAmount / fromRate) * toRate
        const convertedAmount = (fromAmount / fromRate) * toRate;
        
        // Validate result
        if (!isFinite(convertedAmount)) {
            throw new Error('Conversion resulted in invalid number');
        }
        
        // Update the result field
        if (toAmountInput) {
            toAmountInput.value = convertedAmount.toFixed(2);
        }
        
        // Show result message
        if (resultDiv) {
            resultDiv.classList.remove('d-none');
            const resultText = document.getElementById('resultText');
            if (resultText) {
                resultText.innerHTML = `✅ <strong>${fromAmount.toLocaleString('ar-EG')} ${fromCurrency}</strong> = <strong>${convertedAmount.toFixed(2).toLocaleString('ar-EG')} ${toCurrency}</strong>`;
            }
        }
        
        // Update rate info
        const ratePerOne = toRate / fromRate;
        if (rateText) {
            rateText.textContent = `📊 سعر الصرف: 1 ${fromCurrency} = ${ratePerOne.toFixed(4)} ${toCurrency}`;
        }
        
    } catch (error) {
        console.error('Error during conversion:', error);
        const errorDiv = document.getElementById('errorMsg');
        if (errorDiv) {
            errorDiv.classList.remove('d-none');
            const errorText = document.getElementById('errorText');
            if (errorText) errorText.textContent = '❌ حدث خطأ أثناء التحويل';
        }
    }
}

// Swap currencies
function swapCurrencies() {
    try {
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        const fromAmount = document.getElementById('fromAmount');
        const toAmount = document.getElementById('toAmount');
        
        // Validate elements exist
        if (!fromCurrency || !toCurrency || !fromAmount || !toAmount) {
            console.error('Required elements for swap not found');
            return;
        }
        
        // Swap currency selections
        const tempCurrency = fromCurrency.value;
        fromCurrency.value = toCurrency.value;
        toCurrency.value = tempCurrency;
        
        // Swap amounts
        const tempAmount = fromAmount.value;
        fromAmount.value = toAmount.value;
        toAmount.value = tempAmount;
        
        // Trigger conversion
        convertCurrency();
    } catch (error) {
        console.error('Error during currency swap:', error);
    }
}

// Handle offline/online events
window.addEventListener('online', function() {
    console.log('Connection restored');
    fetchExchangeRates();
});

window.addEventListener('offline', function() {
    console.log('Connection lost');
    const rateInfo = document.getElementById('rateInfo');
    const rateText = document.getElementById('rateText');
    if (rateInfo && rateText) {
        rateInfo.classList.remove('alert-info');
        rateInfo.classList.add('alert-danger');
        rateText.textContent = '❌ لا توجد اتصالات بالإنترنت';
    }
});
