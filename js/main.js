// Exchange rates cache
let exchangeRates = {};
let lastUpdateTime = null;

// Initialize the converter on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchExchangeRates();
    
    // Event listeners
    document.getElementById('convertBtn').addEventListener('click', convertCurrency);
    document.getElementById('fromAmount').addEventListener('input', convertCurrency);
    document.getElementById('fromCurrency').addEventListener('change', convertCurrency);
    document.getElementById('toCurrency').addEventListener('change', convertCurrency);
    document.getElementById('swapBtn').addEventListener('click', swapCurrencies);
    
    // Auto-refresh rates every 5 minutes
    setInterval(fetchExchangeRates, 5 * 60 * 1000);
});

// Fetch exchange rates from API
async function fetchExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        
        exchangeRates = data.rates;
        lastUpdateTime = new Date().toLocaleTimeString('ar-EG');
        
        document.getElementById('lastUpdate').textContent = lastUpdateTime;
        document.getElementById('rateInfo').classList.remove('alert-danger');
        document.getElementById('rateInfo').classList.add('alert-info');
        
        // Trigger conversion if there's already an amount
        if (document.getElementById('fromAmount').value) {
            convertCurrency();
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        document.getElementById('rateInfo').classList.remove('alert-info');
        document.getElementById('rateInfo').classList.add('alert-danger');
        document.getElementById('rateText').textContent = 'خطأ في جلب أسعار الصرف. يرجى التحقق من الاتصال بالإنترنت.';
    }
}

// Convert currency
function convertCurrency() {
    const fromAmount = parseFloat(document.getElementById('fromAmount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('errorMsg');
    
    // Hide previous messages
    resultDiv.classList.add('d-none');
    errorDiv.classList.add('d-none');
    
    // Validation
    if (fromAmount === '' || isNaN(fromAmount)) {
        document.getElementById('rateText').textContent = 'أدخل مبلغاً صحيحاً للتحويل';
        return;
    }
    
    if (fromAmount < 0) {
        errorDiv.classList.remove('d-none');
        document.getElementById('errorText').textContent = '❌ الرجاء إدخال رقم موجب';
        return;
    }
    
    if (fromAmount === 0) {
        errorDiv.classList.remove('d-none');
        document.getElementById('errorText').textContent = '❌ الرجاء إدخال رقم أكبر من صفر';
        return;
    }
    
    // Check if we have exchange rates
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
        errorDiv.classList.remove('d-none');
        document.getElementById('errorText').textContent = '⏳ جاري جلب أسعار الصرف...';
        return;
    }
    
    try {
        // Get rates relative to USD
        const fromRate = exchangeRates[fromCurrency] || 1;
        const toRate = exchangeRates[toCurrency] || 1;
        
        // Convert: amount in USD = fromAmount / fromRate
        // Then convert to target currency = (fromAmount / fromRate) * toRate
        const convertedAmount = (fromAmount / fromRate) * toRate;
        
        // Update the result field
        document.getElementById('toAmount').value = convertedAmount.toFixed(2);
        
        // Show result message
        resultDiv.classList.remove('d-none');
        document.getElementById('resultText').innerHTML = 
            `✅ <strong>${fromAmount} ${fromCurrency}</strong> = <strong>${convertedAmount.toFixed(2)} ${toCurrency}</strong>`;
        
        // Update rate info
        const ratePerOne = toRate / fromRate;
        document.getElementById('rateText').textContent = 
            `📊 سعر الصرف: 1 ${fromCurrency} = ${ratePerOne.toFixed(4)} ${toCurrency}`;
        
    } catch (error) {
        console.error('Error during conversion:', error);
        errorDiv.classList.remove('d-none');
        document.getElementById('errorText').textContent = '❌ حدث خطأ أثناء التحويل';
    }
}

// Swap currencies
function swapCurrencies() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const fromAmount = document.getElementById('fromAmount');
    const toAmount = document.getElementById('toAmount');
    
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
}
