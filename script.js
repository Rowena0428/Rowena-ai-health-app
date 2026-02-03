// ============================================
// 配置
// ============================================
const GEMINI_API_KEY = 'AIzaSyCAT175-zJIxdTUG3ziaElMHIwsgkYczW8'; //AIzaSyBJCJXafzZrPsi0OOyA-4OpdE7a_1UAduw
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// 商品資料全域變數
let allProductData = [];

// ============================================
// Tab 切換邏輯
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // 初始化所有功能
    initTabSwitching();
    initPriceSearch();
    initProfile();
    initChat();
    initCamera();
});

function initTabSwitching() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // 更新按鈕狀態
            navButtons.forEach(btn => {
                btn.classList.remove('active', 'text-green-600');
                btn.classList.add('text-gray-400');
            });
            button.classList.add('active', 'text-green-600');
            button.classList.remove('text-gray-400');

            // 顯示對應的 Tab
            tabContents.forEach(tab => {
                tab.classList.add('hidden');
            });
            document.getElementById(targetTab).classList.remove('hidden');
        });
    });
}

// ============================================
// Tab 1: 價格快搜
// ============================================
// 定義全局變數 (確保它在最上方被定義)

async function initPriceSearch() {
    const priceList = document.getElementById('price-list');
    const priceLoading = document.getElementById('price-loading');
    const priceError = document.getElementById('price-error');

    try {
        // 讀取本地 data.json 檔案
        const response = await fetch('./data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 1. 先讀取原始資料
        const rawData = await response.json();
        
        // 2. 智能判斷資料格式 (修復重點)
        if (Array.isArray(rawData)) {
            // 情況 A：舊格式 (純陣列)
            allProductData = rawData;
        } else if (rawData.products && Array.isArray(rawData.products)) {
            // 情況 B：新格式 (物件包含 products)
            allProductData = rawData.products;
            
            // (選用) 如果你想顯示更新時間，可以在這裡處理 rawData.lastUpdated
            console.log("資料更新時間:", rawData.lastUpdated);
        } else {
            console.error("無法識別的資料格式:", rawData);
            allProductData = [];
        }

        console.log(`成功載入 ${allProductData.length} 筆商品資料`);

        // 隱藏載入中，顯示列表
        if (priceLoading) priceLoading.classList.add('hidden');
        if (priceError) priceError.classList.add('hidden');
        if (priceList) priceList.classList.remove('hidden');

        // 初始化搜尋功能
        initSearch();

        // 顯示隨機 50 筆資料
        displayRandomProducts(50);

    } catch (error) {
        console.error('載入資料失敗:', error);
        
        // 顯示錯誤訊息
        if (priceLoading) priceLoading.classList.add('hidden');
        if (priceList) priceList.classList.add('hidden');
        if (priceError) priceError.classList.remove('hidden');
    }
}

// 初始化搜尋功能
function initSearch() {
    const searchInput = document.getElementById('search-input');
    
    if (!searchInput) {
        console.warn('找不到 search-input 元素，搜尋功能將無法使用');
        return;
    }

    // 監聽輸入事件（即時搜尋）
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim();
        
        if (keyword === '') {
            // 搜尋框清空，顯示隨機 50 筆
            displayRandomProducts(50);
        } else {
            // 根據關鍵字搜尋
            searchProducts(keyword);
        }
    });

    // 監聽 Enter 鍵
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const keyword = e.target.value.trim();
            if (keyword !== '') {
                searchProducts(keyword);
            }
        }
    });
}

// 搜尋商品
function searchProducts(keyword) {
    if (!keyword || keyword === '') {
        displayRandomProducts(50);
        return;
    }

    // 將關鍵字轉為小寫以便不區分大小寫搜尋
    const lowerKeyword = keyword.toLowerCase();

    // 根據 name, brand, category 進行過濾
    const filteredProducts = allProductData.filter(product => {
        const nameMatch = product.name && product.name.toLowerCase().includes(lowerKeyword);
        const brandMatch = product.brand && product.brand.toLowerCase().includes(lowerKeyword);
        const categoryMatch = product.category && product.category.toLowerCase().includes(lowerKeyword);
        
        return nameMatch || brandMatch || categoryMatch;
    });

    console.log(`搜尋 "${keyword}"，找到 ${filteredProducts.length} 筆結果`);

    // 渲染搜尋結果
    renderProducts(filteredProducts);
}

// 顯示隨機商品
function displayRandomProducts(count = 50) {
    if (allProductData.length === 0) {
        console.warn('商品資料尚未載入');
        return;
    }

    // 隨機選取指定數量的商品
    const shuffled = [...allProductData].sort(() => 0.5 - Math.random());
    const randomProducts = shuffled.slice(0, Math.min(count, shuffled.length));

    console.log(`顯示隨機 ${randomProducts.length} 筆商品`);

    // 渲染商品列表
    renderProducts(randomProducts);
}

// 渲染商品列表
function renderProducts(products) {
    const priceList = document.getElementById('price-list');
    
    if (!priceList) {
        console.error('找不到 price-list 元素');
        return;
    }

    // 如果沒有商品，顯示空狀態
    if (products.length === 0) {
        priceList.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">找不到相關商品</p>
                <p class="text-gray-400 text-sm mt-2">請嘗試其他關鍵字</p>
            </div>
        `;
        return;
    }

    // 生成商品卡片 HTML
    const productsHTML = products.map(product => createProductCard(product)).join('');

    // 更新 DOM
    priceList.innerHTML = productsHTML;
}

// 建立商品卡片 HTML
function createProductCard(product) {
    const {
        id,
        name,
        brand,
        category,
        store,
        price,
        discount,
        image
    } = product;

    // 格式化價格（小數點後一位）
    const formattedPrice = typeof price === 'number' ? price.toFixed(1) : price;

    // 商品圖片（使用 Emoji 或預設圖示）
    const productImage = image || '📦';

    // 品牌和分類資訊
    const brandCategory = [brand, category].filter(Boolean).join(' • ');

    // 優惠標籤（如果有）
    const discountBadge = discount && discount.trim() !== '' 
        ? `<span class="bg-red-500 text-white text-xs px-2 py-1 rounded ml-2">${escapeHtml(discount)}</span>`
        : '';

    // 超市標籤顏色（根據不同超市使用不同顏色）
    const storeColorClass = getStoreColorClass(store);

    return `
        <div class="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow" data-id="${id || ''}">
            <div class="flex gap-4">
                <!-- 商品圖片 -->
                <div class="flex-shrink-0">
                    <div class="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                        ${productImage}
                    </div>
                </div>
                
                <!-- 商品資訊 -->
                <div class="flex-1 min-w-0">
                    <!-- 商品名稱 -->
                    <h3 class="font-semibold text-gray-800 text-base mb-1 line-clamp-2">
                        ${escapeHtml(name || '')}
                    </h3>
                    
                    <!-- 品牌和分類 -->
                    <p class="text-xs text-gray-500 mb-2 line-clamp-1">
                        ${escapeHtml(brandCategory)}
                    </p>
                    
                    <!-- 價格和優惠 -->
                    <div class="flex items-center mb-2">
                        <span class="text-2xl font-bold text-green-600">
                            $${formattedPrice}
                        </span>
                        ${discountBadge}
                    </div>
                    
                    <!-- 超市名稱 -->
                    <div class="flex items-center justify-between">
                        <span class="${storeColorClass} text-xs font-medium px-2 py-1 rounded">
                            <i class="fas fa-store mr-1"></i>${escapeHtml(store || '')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 根據超市名稱返回對應的顏色類別
function getStoreColorClass(store) {
    if (!store) return 'bg-gray-200 text-gray-700';
    
    const storeLower = store.toLowerCase();
    
    if (storeLower.includes('百佳') || storeLower.includes('parknshop')) {
        return 'bg-blue-100 text-blue-700';
    } else if (storeLower.includes('惠康') || storeLower.includes('wellcome')) {
        return 'bg-red-100 text-red-700';
    } else if (storeLower.includes('aeon')) {
        return 'bg-purple-100 text-purple-700';
    } else if (storeLower.includes('萬寧') || storeLower.includes('mannings')) {
        return 'bg-green-100 text-green-700';
    } else if (storeLower.includes('屈臣氏') || storeLower.includes('watsons')) {
        return 'bg-pink-100 text-pink-700';
    } else {
        return 'bg-gray-200 text-gray-700';
    }
}

// HTML 轉義（防止 XSS）
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Tab 2: 個人健康檔案
// ============================================
function initProfile() {
    const form = document.getElementById('profile-form');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');

    // 從 localStorage 載入資料
    loadProfileData();

    // 監聽身高體重變化，自動計算 BMI
    heightInput.addEventListener('input', calculateBMI);
    weightInput.addEventListener('input', calculateBMI);

    // 表單提交
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProfileData();
    });
}

function calculateBMI() {
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const bmiResult = document.getElementById('bmi-result');
    const bmiValue = document.getElementById('bmi-value');
    const bmiStatus = document.getElementById('bmi-status');

    if (height > 0 && weight > 0) {
        const bmi = weight / Math.pow(height / 100, 2);
        bmiValue.textContent = bmi.toFixed(1);
        
        let status = '';
        let statusColor = '';
        if (bmi < 18.5) {
            status = '體重過輕';
            statusColor = 'text-blue-600';
        } else if (bmi < 24) {
            status = '正常範圍';
            statusColor = 'text-green-600';
        } else if (bmi < 27) {
            status = '體重過重';
            statusColor = 'text-yellow-600';
        } else {
            status = '肥胖';
            statusColor = 'text-red-600';
        }
        
        bmiStatus.textContent = status;
        bmiStatus.className = `text-sm ${statusColor}`;
        bmiResult.classList.remove('hidden');
    } else {
        bmiResult.classList.add('hidden');
    }
}

function saveProfileData() {
    const profileData = {
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        height: document.getElementById('height').value,
        weight: document.getElementById('weight').value,
        gender: document.getElementById('gender').value,
        medicalHistory: document.getElementById('medical-history').value
    };

    localStorage.setItem('healthProfile', JSON.stringify(profileData));
    
    // 顯示成功訊息
    showNotification('資料已成功儲存！', 'success');
}

function loadProfileData() {
    const savedData = localStorage.getItem('healthProfile');
    if (savedData) {
        try {
            const profileData = JSON.parse(savedData);
            document.getElementById('name').value = profileData.name || '';
            document.getElementById('age').value = profileData.age || '';
            document.getElementById('height').value = profileData.height || '';
            document.getElementById('weight').value = profileData.weight || '';
            document.getElementById('gender').value = profileData.gender || '';
            document.getElementById('medical-history').value = profileData.medicalHistory || '';
            
            // 如果有身高體重，重新計算 BMI
            if (profileData.height && profileData.weight) {
                calculateBMI();
            }
        } catch (error) {
            console.error('載入資料失敗:', error);
        }
    }
}

function getProfileContext() {
    const savedData = localStorage.getItem('healthProfile');
    if (savedData) {
        try {
            const profileData = JSON.parse(savedData);
            let context = '以下是使用者的健康檔案資料：\n';
            
            if (profileData.name) context += `姓名：${profileData.name}\n`;
            if (profileData.age) context += `年齡：${profileData.age} 歲\n`;
            if (profileData.height && profileData.weight) {
                const bmi = (parseFloat(profileData.weight) / Math.pow(parseFloat(profileData.height) / 100, 2)).toFixed(1);
                context += `身高：${profileData.height} cm\n`;
                context += `體重：${profileData.weight} kg\n`;
                context += `BMI：${bmi}\n`;
            }
            if (profileData.gender) context += `性別：${profileData.gender === 'male' ? '男' : profileData.gender === 'female' ? '女' : '其他'}\n`;
            if (profileData.medicalHistory) context += `病史：${profileData.medicalHistory}\n`;
            
            return context;
        } catch (error) {
            return '';
        }
    }
    return '';
}

// ============================================
// ============================================
// Rowena 系統人格統一設定 Tab 3: Rowena 幫你慳
// ============================================

// Rowena 系統人格提示詞
const ROWENA_SYSTEM_PROMPT = `你係 Rowena，一位精打細算、親切友善嘅香港精明營養師兼可愛的女仔。你嘅特點：
- 用廣東話同用戶溝通，語氣親切、鼓勵、帶點幽默
- 熟悉全港超市（百佳、惠康、AEON、萬寧等）嘅特價資訊
- 專注幫用戶慳錢同時保持健康飲食
- 會用 💖✨🎉 等 Emoji 增加親和力
- 回答要實用、具體，會建議邊度買最抵`;

// ============================================
// 介面 Loading 鎖定/解鎖狀態函式
// ============================================
function setLoadingState(isLoading) {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const buttons = document.querySelectorAll('button');

    // 鎖定/解鎖輸入框
    if (chatInput) chatInput.disabled = isLoading;
    if (chatSend) chatSend.disabled = isLoading;

    // 鎖定/解鎖所有相關按鈕
    buttons.forEach(btn => {
        if (btn.onclick && btn.onclick.toString().includes('generateRowenaMealPlan')) {
            btn.disabled = isLoading;
            btn.style.opacity = isLoading ? '0.5' : '1';
            btn.style.cursor = isLoading ? 'not-allowed' : 'pointer';
        }
    });
}

function initChat() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send') || document.getElementById('send-btn');
    const clearBtn = document.getElementById('clear-chat-btn');

    // 1. 載入歷史紀錄
    loadChatHistory();

    // 2. 綁定發送按鈕
    if (sendBtn && chatInput) {
        // 移除舊的監聽器，防止重複
        const newBtn = sendBtn.cloneNode(true);
        if (sendBtn.parentNode) sendBtn.parentNode.replaceChild(newBtn, sendBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sendMessageToRowena();
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessageToRowena();
            }
        });
    }

    // 3. 綁定刪除按鈕
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('確定要刪除所有對話紀錄嗎？刪除後無法復原喔！')) {
                clearChatHistory();
            }
        });
    }
}

// 發送訊息給 Rowena (一般對話)
async function sendMessageToRowena() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;
    
    const message = chatInput.value.trim();
    if (!message) return;

    // 1. 顯示用戶訊息
    appendMessage(message, 'user');
    chatInput.value = '';
    setLoadingState(true);

    // 2. 顯示 Loading
    const loadingId = appendMessage(
        'Rowena 諗緊野... <i class="fas fa-circle-notch fa-spin text-pink-500 ml-2"></i>', 
        'assistant', 
        true
    );

    try {
        // 準備上下文
        const historyJson = localStorage.getItem('rowena_chat_history');
        let chatHistory = [];
        if (historyJson) {
            chatHistory = JSON.parse(historyJson).slice(-6).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));
        }

        // 加入當前訊息
        chatHistory.push({ role: "user", parts: [{ text: message }] });

        // 呼叫 API
        const reply = await callGemini(chatHistory);
        
        // 移除 Loading 並顯示回應
        removeChatMessage(loadingId);
        appendMessage(reply, 'assistant');

    } catch (error) {
        removeChatMessage(loadingId);
        appendMessage(`哎呀，連線有啲問題：${error.message}，請試多次啦！🙏`, 'assistant');
    } finally {
        setLoadingState(false);
    }
}

// ============================================
// 生成餐單核心邏輯 (Tab 3 按鈕觸發)
// ============================================
async function generateRowenaMealPlan() {
    setLoadingState(true);
    
    // 1. 顯示載入動畫
    const loadingId = appendMessage(
        'Rowena 正在為你精打細算，設計緊最啱你嘅餐單... <i class="fas fa-circle-notch fa-spin text-pink-500 ml-2"></i>', 
        'assistant', 
        true
    );

    try {
        // 2. 準備使用者資料
        let nameInput = document.getElementById('name');
        let goalInput = document.getElementById('goal');
        let name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "親愛的";
        let goal = goalInput && goalInput.value.trim() ? goalInput.value.trim() : "健康飲食";

        // 3. 確保資料已載入
        if (typeof allProductData === 'undefined' || allProductData.length === 0) {
            try {
                const response = await fetch('data.json');
                const rawData = await response.json();
                if (Array.isArray(rawData)) allProductData = rawData;
                else if (rawData.products) allProductData = rawData.products;
                else allProductData = [];
            } catch (e) { allProductData = []; }
        }

        // 4. 隨機抽取特價商品
        const shuffled = [...allProductData].sort(() => 0.5 - Math.random());
        const sampled = shuffled.slice(0, 40).map(item => `${item.name} ($${item.price})`);

        // 5. 構建 Prompt (強制 HTML 格式)
        const prompt = `
你係 Rowena，香港精明營養師。
【用戶檔案】稱呼：${name}，目標：${goal}
【今日特價】${JSON.stringify(sampled)}

請設計一日三餐，每餐提供：
🅰️ 慳家版 (用特價貨)
🅱️ 營養版 (更優質)
必須估算價錢同卡路里。用廣東話同 Emoji 💖。

【極重要：輸出格式】
請**只輸出 HTML 代碼**，不要用 Markdown (如 \`\`\`html)。
請將內容填入以下結構：

<div class="space-y-3">
    <div class="bg-pink-50 p-3 rounded-lg text-sm text-gray-700 mb-2">
        早晨 ${name}！為你目標「${goal}」設計嘅餐單在此，一齊加油呀！💪✨
    </div>

    <details class="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden group">
        <summary class="p-4 font-bold text-pink-600 cursor-pointer bg-white hover:bg-pink-50 transition-colors flex justify-between items-center list-none">
            <span class="flex items-center gap-2">🌞 早餐推介 <span class="text-xs font-normal text-gray-400">(按此展開)</span></span>
            <span class="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-4 text-sm text-gray-700 space-y-4 border-t border-pink-50">
            <div>
                <span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold mb-1">🅰️ 慳家版 ($價錢 / kcal)</span>
                <p class="font-medium text-gray-800">名稱</p>
                <p class="text-gray-500 text-xs mt-1">介紹...</p>
            </div>
            <div class="border-t border-dashed border-gray-200"></div>
            <div>
                <span class="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold mb-1">🅱️ 營養版 ($價錢 / kcal)</span>
                <p class="font-medium text-gray-800">名稱</p>
                <p class="text-gray-500 text-xs mt-1">介紹...</p>
            </div>
        </div>
    </details>

    <details class="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden group">
        <summary class="p-4 font-bold text-pink-600 cursor-pointer bg-white hover:bg-pink-50 transition-colors flex justify-between items-center list-none">
            <span class="flex items-center gap-2">🍜 午餐推介 <span class="text-xs font-normal text-gray-400">(按此展開)</span></span>
            <span class="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-4 text-sm text-gray-700 space-y-4 border-t border-pink-50">
            </div>
    </details>

    <details class="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden group">
        <summary class="p-4 font-bold text-pink-600 cursor-pointer bg-white hover:bg-pink-50 transition-colors flex justify-between items-center list-none">
            <span class="flex items-center gap-2">🌙 晚餐推介 <span class="text-xs font-normal text-gray-400">(按此展開)</span></span>
            <span class="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-4 text-sm text-gray-700 space-y-4 border-t border-pink-50">
            </div>
    </details>

    <div class="text-center text-xs text-gray-400 mt-2">*價錢只供參考</div>
</div>
`.trim();

        // 6. 呼叫 API
        const result = await callGemini([{ role: "user", parts: [{ text: prompt }] }]);

        // 7. 輸出結果 (這裡會自動識別 HTML)
        removeChatMessage(loadingId);
        
        // 移除可能存在的 Markdown 標記，確保乾淨
        const cleanResult = result.replace(/```html/g, '').replace(/```/g, '');
        appendMessage(cleanResult, 'assistant');

    } catch (error) {
        console.error('Rowena Plan Error:', error);
        removeChatMessage(loadingId);
        appendMessage(`哎呀，餐單生成出咗少少問題：${error.message}，請試多次啦！🙏`, 'assistant');
    } finally {
        setLoadingState(false);
    }
}

// ============================================
// Gemini API 核心通訊函式 (最終加強版)
// ============================================
async function callGemini(history, retryCount = 0) {
    if (typeof GEMINI_API_KEY === 'undefined' || !GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_KEY_HERE') {
        throw new Error("未設定 API Key");
    }

    const payload = {
        contents: history,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
        }
    };

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // 自動重試 (處理 429 繁忙 或 503 錯誤)
        if (response.status === 429 || response.status === 503) {
            if (retryCount < 3) {
                console.log(`Google 伺服器忙碌 (${response.status})，3秒後重試... (${retryCount + 1}/3)`);
                await new Promise(r => setTimeout(r, 3000));
                return callGemini(history, retryCount + 1);
            }
            throw new Error("伺服器太忙，請稍後再試 🙏");
        }

        if (!response.ok) throw new Error(`連線失敗 (${response.status})`);

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("API 沒有回傳內容");
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw error;
    }
}

// ============================================
// 歷史紀錄管理
// ============================================
function loadChatHistory() {
    const history = localStorage.getItem('rowena_chat_history');
    if (history) {
        JSON.parse(history).forEach(msg => appendMessage(msg.text, msg.sender, false, false));
    }
}

function clearChatHistory() {
    localStorage.removeItem('rowena_chat_history');
    const chat = document.getElementById('chat-messages');
    if (chat) chat.innerHTML = `<div class="text-center text-gray-400 text-sm py-4"><p>對話紀錄已清除 ✨</p></div>`;
}

// ============================================
// 💬 聊天室顯示函數 (唯一真理版)
// ============================================
function appendMessage(text, sender, isLoading = false, saveToStorage = true) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return null;

    const div = document.createElement('div');
    const isUser = sender === 'user';
    const msgId = 'msg-' + Date.now() + Math.random().toString(36).substr(2, 9);
    div.id = msgId;

    // 🔍 智能判斷：只要內容包含 HTML 特徵，就開啟 HTML 模式
    const isHtmlContent = !isUser && (text.includes('<details') || text.includes('<div class="space-y-3">'));

    div.className = `flex items-start gap-3 mb-4 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`;

    const avatar = isUser 
        ? `<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0"><i class="fas fa-user"></i></div>`
        : `<div class="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 text-xs font-bold flex-shrink-0">Rowena</div>`;

    let bubbleClass = isUser ? 'bg-green-500 text-white rounded-2xl rounded-tr-none p-3 shadow-sm'
        : (isHtmlContent ? 'w-full bg-transparent p-0' : 'bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-tl-none p-3 shadow-sm');

    let contentHtml = text;
    if (isLoading) {
        contentHtml = text; // Loading 訊息直接顯示
    } else if (isHtmlContent) {
        contentHtml = text; // HTML 內容直接顯示
    } else {
        // 普通文字轉義 (簡單版 Markdown)
        contentHtml = text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    div.innerHTML = `${avatar}<div class="${bubbleClass} text-sm max-w-[90%] overflow-hidden">${contentHtml}</div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (saveToStorage && !isLoading && text) {
        try {
            let history = JSON.parse(localStorage.getItem('rowena_chat_history') || '[]');
            history.push({ text: text, sender: sender });
            if (history.length > 50) history = history.slice(-50);
            localStorage.setItem('rowena_chat_history', JSON.stringify(history));
        } catch (e) {}
    }
    return msgId;
}
// 兼容舊名稱
const addChatMessage = appendMessage;

function removeChatMessage(id) {
    if (id && document.getElementById(id)) document.getElementById(id).remove();
    else {
        const chat = document.getElementById('chat-messages');
        if (chat && chat.lastElementChild) chat.lastElementChild.remove();
    }
}


// ============================================
// Tab 4: AI 食物鏡頭
// ============================================
function initCamera() {
    const imageInput = document.getElementById('food-image-input');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const analysisLoading = document.getElementById('analysis-loading');
    const analysisResult = document.getElementById('analysis-result');

    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 預覽
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.src = event.target.result;
            imagePreviewContainer.classList.remove('hidden');
            analysisResult.classList.add('hidden');
        };
        reader.readAsDataURL(file);

        // 分析
        await analyzeFoodImageByRowena(file);
    });
}

// 重寫 analyzeFoodImage: Rowena人格+省錢
async function analyzeFoodImageByRowena(file) {
    const analysisLoading = document.getElementById('analysis-loading');
    const analysisResult = document.getElementById('analysis-result');
    const analysisContent = document.getElementById('analysis-content');

    if (GEMINI_API_KEY === 'YOUR_KEY_HERE') {
        showNotification('請先設定 Gemini API Key！', 'error');
        return;
    }

    analysisLoading.classList.remove('hidden');
    analysisResult.classList.add('hidden');

    try {
        // 圖片轉 Base64
        const base64Image = await fileToBase64(file);
        const base64Data = base64Image.split(',')[1];

        // Rowena的人格分析prompt
        const prompt = `
你係 Rowena，精打細算嘅香港超市營養師！請幫我用以下 JSON 格式分析呢張食物相，直接回傳 JSON 字串（唔要 Markdown，唔要多餘開場白）。

{
"description": "識別食物名稱與簡短描述 (繁體中文，限制 15 字以內)",
"nutrition": {
    "calories": "數值 (每100克含熱量)",
    "sugar": "數值 (每100克含糖量)",
    "protein": "數值 (每100克含蛋白質)",
    "carbs": "數值 (每100克含碳水化合物)"
},
"fitness_advice": "用Rowena的語氣（廣東話+甜美），針對增肌或減脂用途評價此食物，補充超市購買/省錢貼士，限制 30 字以內"
}
`;

        // Gemini Vision API: 構建 user prompt, 將人設和功能描述合成一段
        const fullPrompt = ROWENA_SYSTEM_PROMPT + "\n\n" + prompt;

        const contentsArr = [
            {
                role: "user",
                parts: [
                    { text: fullPrompt },
                    {
                        inline_data: {
                            mime_type: file.type,
                            data: base64Data
                        }
                    }
                ]
            }
        ];

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: contentsArr
            })
        });

        const data = await response.json();

        if (
            !response.ok ||
            !data.candidates ||
            !data.candidates[0] ||
            !data.candidates[0].content ||
            !data.candidates[0].content.parts ||
            !data.candidates[0].content.parts[0] ||
            !data.candidates[0].content.parts[0].text
        ) {
            const errorMsg = data.error?.message || `HTTP ${response.status}`;
            throw new Error(errorMsg || 'API 響應格式不正確');
        }

        // 1. 取得並 parse JSON
        let analysisObj;
        try {
            analysisObj = JSON.parse(data.candidates[0].content.parts[0].text);
        } catch (e) {
            throw new Error('Rowena 回傳資料無法解析為 JSON');
        }

        // 2. 操作 UI
        const description = analysisObj.description ?? '-';
        const nutrition = analysisObj.nutrition || {};
        const calories = nutrition.calories ?? '-';
        const protein = nutrition.protein ?? '-';
        const carbs = nutrition.carbs ?? '-';
        const sugar = nutrition.sugar ?? '-';
        const advice = analysisObj.fitness_advice ?? '-';

        const analysisHTML = `
            <div class="text-xl font-bold mb-3">${description}</div>
            <div class="grid grid-cols-2 gap-3 text-sm mb-4">
                <div class="flex items-center gap-2">
                    <span class="inline-block px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-semibold">熱量</span>
                    <span class="font-bold">${calories}</span>
                    <span class="text-xs text-gray-400">kcal/100g</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">蛋白質</span>
                    <span class="font-bold">${protein}</span>
                    <span class="text-xs text-gray-400">g/100g</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">碳水</span>
                    <span class="font-bold">${carbs}</span>
                    <span class="text-xs text-gray-400">g/100g</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="inline-block px-2 py-1 rounded bg-pink-100 text-pink-700 text-xs font-semibold">糖</span>
                    <span class="font-bold">${sugar}</span>
                    <span class="text-xs text-gray-400">g/100g</span>
                </div>
            </div>
            <div class="bg-green-100 border-l-4 border-green-500 px-4 py-3 rounded relative">
                <span class="font-semibold text-green-700 block mb-1">💡 Rowena貼士</span>
                <span class="text-green-800">${advice}</span>
            </div>
        `;

        analysisContent.innerHTML = analysisHTML;
        analysisResult.classList.remove('hidden');
        analysisLoading.classList.add('hidden');
    } catch (error) {
        console.error('Analysis error:', error);
        const errorMsg = error.message || '未知錯誤';
        analysisContent.innerHTML = `<div class="text-red-600">
            <p class="font-bold mb-2">唔好意思，Rowena 出咗啲問題：</p>
            <p class="mb-2">${errorMsg}</p>
            <p class="text-sm mt-2">快D 檢查下：</p>
            <ul class="text-sm list-disc list-inside">
                <li>API Key 啱唔啱</li>
                <li>網絡連線正唔正常</li>
                <li>API 配額有冇用完</li>
                <li>圖檔格式支唔支援</li>
            </ul>
        </div>`;
        analysisResult.classList.remove('hidden');
        analysisLoading.classList.add('hidden');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
// ============================================
// 核心訊息顯示與儲存功能 (補完版)
// ============================================

/**
 * 在聊天視窗中新增一條訊息
 * @param {string} text - 訊息內容
 * @param {string} sender - 發送者 ('user' 或 'assistant'/'rowena')
 * @param {boolean} isLoading - 是否為載入動畫 (true 則不存檔)
 * @param {boolean} saveToStorage - 是否寫入 LocalStorage (預設 true)
 * @returns {string} 訊息的 ID (方便之後刪除，例如移除 loading)
 */
function appendMessage(text, sender, isLoading = false, saveToStorage = true) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    // 1. 定義樣式
    const isUser = sender === 'user';
    const div = document.createElement('div');
    const msgId = 'msg-' + Date.now() + Math.random().toString(36).substr(2, 9);
    div.id = msgId;
    
    // 容器排版 (左 vs 右)
    div.className = `flex items-start gap-3 mb-4 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`;

    // 2. 頭像 HTML
    const avatarHtml = isUser 
        ? `<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0"><i class="fas fa-user"></i></div>`
        : `<div class="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 text-xs font-bold flex-shrink-0">Rowena</div>`;

    // 3. 對話框樣式
    const bubbleColor = isUser ? 'bg-green-500 text-white' : 'bg-white text-gray-700 border border-gray-100';
    const borderRadius = isUser ? 'rounded-2xl rounded-tr-none' : 'rounded-2xl rounded-tl-none';
    
    // 4. 處理內容 (如果是 Loading 就不做 Markdown 轉換)
    let contentHtml = text;
    if (!isLoading && typeof formatChatMessage === 'function') {
        // 如果是 Rowena 的回覆，嘗試轉成 HTML (粗體/列表)
        contentHtml = isUser ? text : formatChatMessage(text);
    }

    // 5. 組合 HTML
    div.innerHTML = `
        ${avatarHtml}
        <div class="${bubbleColor} p-3 ${borderRadius} shadow-sm text-sm max-w-[85%] overflow-hidden break-words">
            <div class="prose ${isUser ? 'prose-invert' : ''} max-w-none">
                ${contentHtml}
            </div>
        </div>
    `;

    // 6. 插入畫面並捲動到底部
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 7. 自動儲存 (關鍵！)
    // 條件：必須開啟儲存、不是載入動畫、且必須有文字內容
    if (saveToStorage && !isLoading && text.trim() !== '') {
        saveMessageToLocalStorage(text, sender);
    }

    return msgId;
}

/**
 * 儲存單條訊息到 LocalStorage
 */
function saveMessageToLocalStorage(text, sender) {
    const STORAGE_KEY = 'rowena_chat_history';
    let history = localStorage.getItem(STORAGE_KEY);
    let messages = history ? JSON.parse(history) : [];
    
    messages.push({
        text: text,
        sender: sender, // 確保這裡存的是 'user' 或 'assistant'
        timestamp: new Date().getTime()
    });
    
    // 限制只存最近 50 條，避免瀏覽器變慢
    if (messages.length > 50) {
        messages = messages.slice(messages.length - 50);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

// ============================================
// Rowena 專屬菜單規劃功能
// ============================================

async function askRowenaMealPlan(userRequirement) {
    // userRequirement: 使用者自訂要求 (如熱量需求/偏好等字串)
    if (GEMINI_API_KEY === 'YOUR_KEY_HERE') {
        showNotification('請先設定 Gemini API Key！', 'error');
        return;
    }

    const chatMessages = document.getElementById('chat-messages');
    const loadingId = addChatMessage('Rowena 幫你計緊餐單中...', 'assistant', true);

    try {
        // 準備 prompt，A/B 超級省錢 v.s. 均衡
        let prompt = `
你係 Rowena，懂全港超市至筍貨的營養師，請針對以下條件幫我出一份一日三餐計劃，用表格形式輸出 A/B 兩種方案：

A.「極致慳錢路線」：以在香港易買、平價、又唔失營養的食材為主，舉例推介邊度買最抵 (如：AEON 或街市)。
B.「營養均衡路線」：食材專注營養與健康（價格次要但也要簡單建議）。

請全部用繁體中文，廣東話口吻，多加 💖✨ Emoji，每餐都列菜式和簡單食材，表格前有簡短親切說明。`;

        if (userRequirement && String(userRequirement).trim() !== "") {
            prompt += `\n\n* 額外要求：${userRequirement}`;
        }

        // system prompt 必須合併進 user input
        const fullPrompt = ROWENA_SYSTEM_PROMPT + "\n\n" + prompt;

        // Gemini API with Rowena System Personality
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: fullPrompt }]
                    }
                ]
            })
        });

        const data = await response.json();

        if (
            !response.ok ||
            !data.candidates ||
            !data.candidates[0] ||
            !data.candidates[0].content ||
            !data.candidates[0].content.parts ||
            !data.candidates[0].content.parts[0] ||
            !data.candidates[0].content.parts[0].text
        ) {
            const errorMsg = data.error?.message || `HTTP ${response.status}`;
            throw new Error(errorMsg || 'API 響應格式不正確');
        }

        const aiMealResponse = data.candidates[0].content.parts[0].text;
        removeChatMessage(loadingId);

        // Rowena: 轉換 <br> and <strong> for UX 一致
        addChatMessage(aiMealResponse, 'assistant');
    } catch (error) {
        removeChatMessage(loadingId);
        const errorMsg = (error && error.message) ? error.message : '未知錯誤';
        addChatMessage(`餐單攪唔掂呀：${errorMsg}～ 請再試多次，謝曬你💖`, 'assistant');
    }
}

// ============================================
// 工具函數
// ============================================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white font-medium`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}