// ============================================
// 配置
// ============================================
const GEMINI_API_KEY = 'AIzaSyBJCJXafzZrPsi0OOyA-4OpdE7a_1UAduw'; //
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
// 🔽 新增: 介面 Loading 鎖定/解鎖狀態函式
// ============================================
function setLoadingState(isLoading) {
    // 目標元素
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    // 找出所有 "onclick=generateRowenaMealPlan()" 的按鈕
    // 假設按鈕 class 可有多個，但只要有 onclick 屬性內容即可
    // 或直接找所有 button，檢查其 onclick 是否呼叫 generateRowenaMealPlan
    const mealPlanButtons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'))
        .filter(btn => {
            // Direct onclick attribute
            if (typeof btn.onclick === 'function' && btn.onclick.name === 'generateRowenaMealPlan') {
                return true;
            }
            // HTML attribute string (有時候用字串，兼容寫法)
            const attr = btn.getAttribute('onclick');
            return attr && attr.replace(/\s+/g, '').startsWith('generateRowenaMealPlan(');
        });

    [chatInput, chatSend, ...mealPlanButtons].forEach(el => {
        if (!el) return;
        el.disabled = !!isLoading;
        if (isLoading) {
            el.classList.add('opacity-50');
            el.style.opacity = '0.5';
            el.style.cursor = 'not-allowed';
        } else {
            el.classList.remove('opacity-50');
            el.style.opacity = '';
            el.style.cursor = '';
        }
    });
}

// ============================================
// Tab 3: Rowena 聊天初始化
// ============================================
function initChat() {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    if (!chatInput || !chatSend) {
        console.warn('找不到聊天輸入框或發送按鈕');
        return;
    }

    // 監聽發送按鈕點擊
    chatSend.addEventListener('click', () => {
        sendMessageToRowena();
    });

    // 監聽 Enter 鍵
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessageToRowena();
        }
    });
}

// 發送訊息給 Rowena
async function sendMessageToRowena() {
    setLoadingState(true);
    const chatInput = document.getElementById('chat-input');
    try {
        const message = chatInput.value.trim();

        if (!message) return;

        if (GEMINI_API_KEY === 'YOUR_KEY_HERE') {
            showNotification('請先設定 Gemini API Key！', 'error');
            return;
        }

        // 顯示使用者訊息
        appendMessage(message, 'user');
        chatInput.value = '';

        // 顯示載入中
        const loadingId = appendMessage('Rowena 幫你諗緊主意中...', 'assistant', true);

        try {
            // 獲取健康檔案資料作為上下文（如果有）
            const profileContext = getProfileContext();
            
            // 構建 prompt
            let prompt = `用戶問：${message}`;
            
            if (profileContext) {
                prompt = `${profileContext}\n\n用戶問：${message}`;
            }

            // 合併系統提示詞
            const fullPrompt = ROWENA_SYSTEM_PROMPT + "\n\n" + prompt + "\n\n請用廣東話回答，語氣親切友善，提供實用建議。";

            // 調用 Gemini API
            const result = await callGemini([
                { role: "user", parts: [{ text: fullPrompt }] }
            ]);

            // 移除載入訊息
            removeChatMessage(loadingId);

            // 顯示 Rowena 回應
            appendMessage(formatChatMessage(result), 'assistant');
        } catch (error) {
            console.error('Chat error:', error);
            removeChatMessage(loadingId);
            const errorMsg = error.message || '未知錯誤';
            appendMessage(`唔好意思呀，Rowena 出咗啲問題：${errorMsg}～ 請再試多次，謝曬你💖`, 'assistant');
        }
    } finally {
        setLoadingState(false);
        if (chatInput) chatInput.focus();
    }
}

/**
 * Rowena AI: 智能一日三餐配膳 with 超市特價
 * 執行步驟：
 * 1. 顯示「載入中」訊息
 * 2. 讀 DOM: name/goal
 * 3. 隨機抽取 40 筆精簡超市商品資料
 * 4. 構建 prompt，呼叫 Gemini
 * 5. 顯示結果，支援 Markdown+換行+粗體
 */

async function generateRowenaMealPlan() {
    // 保持原有的 UI 狀態設定
    if (typeof setLoadingState === 'function') setLoadingState(true);
    const chatInput = document.getElementById('chat-input');
    
    // 1. 顯示載入訊息
    // 這裡保留你原本的寫法，假設 appendMessage 會回傳 ID
    const loadingId = appendMessage('Rowena 正在根據你的身體狀況，搜尋今日最抵買嘅食材... 💖', 'assistant', true);

    try {
        // 2. DOM 讀 user profile (name, goal)
        let nameInput = document.getElementById('name');
        let goalInput = document.getElementById('goal');
        
        // 容錯: 沒有欄位就預設
        let name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "親愛的";
        let goal = goalInput && goalInput.value.trim() ? goalInput.value.trim() : "健康飲食";

        // 3. 取超市資料（data.json）
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("無法載入超市數據！");

        // ------------------ 修復開始 ------------------
        const rawData = await response.json();
        let data = [];

        // 智能判斷：如果是新格式 { products: [...] } 就取 products，否則直接用
        if (Array.isArray(rawData)) {
            data = rawData;
        } else if (rawData.products && Array.isArray(rawData.products)) {
            data = rawData.products;
        } else {
            console.error("未知的資料格式:", rawData);
            data = []; // 避免崩潰，給個空陣列
        }

        if (data.length === 0) throw new Error("找不到商品資料，無法生成菜單");
        // ------------------ 修復結束 ------------------

        // shuffle & 抽 40 筆 (邏輯保持不變)
        for (let i = data.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [data[i], data[j]] = [data[j], data[i]];
        }
        
        let sampled = data.slice(0, 40).map(item => ({
            name: item.name,
            price: item.price,
            store: item.store,
            unit: item.unit || ""
        }));

        // 4. 構建 prompt 字串 (完全保持原樣)
        const prompt = `
你係 Rowena，香港精明營養師兼可愛的女仔。

【用戶檔案】
- 稱呼：${name}
- 目標：${goal}

【今日超市特價 (隨機精選)】
${JSON.stringify(sampled, null, 2)}

【任務】
請為 ${name} 設計一日三餐 (早餐/午餐/晚餐)。
1. 考慮佢嘅目標 (${goal})。
2. 每餐提供兩個選擇：
   - 🅰️ 慳家版 (盡量用特價清單入面嘅貨)
   - 🅱️ 營養版 (貴少少但更符合目標)
3. 必須估算價錢同卡路里。
4. 用廣東話，語氣要鼓勵人。
        `.trim();

        // 5. Gemini API: 呼叫 (保持原樣)
        // 確保 callGemini 存在
        if (typeof callGemini !== 'function') throw new Error("API 尚未連接");

        const result = await callGemini([
            { role: "user", parts: [{ text: prompt }] }
        ]);

        // 處理 markdown(粗體/換行) 並移除 loading
        if (typeof removeChatMessage === 'function') removeChatMessage(loadingId);
        
        // 確保 formatChatMessage 存在
        const replyText = (typeof formatChatMessage === 'function') ? formatChatMessage(result) : result;
        appendMessage(replyText, 'assistant');

    } catch (error) {
        console.error('Rowena Error:', error);
        if (typeof removeChatMessage === 'function') removeChatMessage(loadingId);
        appendMessage(`餐單攪唔掂呀：${error.message || '未知錯誤'}～ 請再試多次，謝曬你💖`, 'assistant');
    } finally {
        if (typeof setLoadingState === 'function') setLoadingState(false);
        if (chatInput) chatInput.focus();
    }
}

/**
 * 支援訊息顯示（與 addChatMessage差不多，但關鍵：有 loading 狀態、捲動、支援 id）
 * @param {string} message 
 * @param {string} sender 'user'|'assistant'
 * @param {boolean} isLoading 
 * @returns {string} messageId
 */
function appendMessage(message, sender, isLoading = false) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.error('找不到 chat-messages 元素');
        return null;
    }

    const messageId = `msg-${Date.now()}-${Math.random()}`;
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;

    // 格式化內容
    const formattedMsg = isLoading
        ? '<i class="fas fa-spinner fa-spin mr-2"></i> <span>Rowena 幫你諗緊主意中...</span>'
        : formatChatMessage(message);

    if (sender === 'user') {
        // 使用者訊息：右側顯示
        messageDiv.className = 'flex items-start gap-3 justify-end';
        messageDiv.innerHTML = `
            <div class="bg-pink-100 text-gray-800 p-3 rounded-2xl rounded-tr-none shadow-sm text-sm max-w-[80%]">
                ${formattedMsg}
            </div>
        `;
    } else {
        // Rowena 訊息：左側顯示，帶頭像
        messageDiv.className = 'flex items-start gap-3';
        messageDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 text-xs font-bold flex-shrink-0">Rowena</div>
            <div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700 max-w-[80%]">
                ${formattedMsg}
            </div>
        `;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageId;
}

/**
 * Gemini API 通用調用
 * @param {Array} contents - Gemini 格式 messages
 * @returns {Promise<string>}
 */
async function callGemini(contents) {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents
        })
    });

    const data = await response.json();

    // 內容格式檢查
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
    return data.candidates[0].content.parts[0].text;
}

// Chat訊息格式化：**粗體** + - 清單 + 換行(BR)
// ============================================
// 格式化訊息：將 Markdown 轉換為 HTML
// ============================================
function formatChatMessage(text) {
    if (!text) return "";

    // 1. 檢查是否成功載入 marked 函式庫
    if (typeof marked !== 'undefined' && marked.parse) {
        try {
            // 設定 marked 選項 (讓換行變成 <br>)
            marked.setOptions({
                breaks: true,  // 允許換行
                gfm: true      // 啟用 GitHub 風格 Markdown
            });
            // 使用 marked 將 Markdown 轉為 HTML
            return marked.parse(text);
        } catch (e) {
            console.error('Markdown 解析失敗:', e);
        }
    }

    // 2. 後備方案 (如果沒有載入 marked，使用簡單的正則表達式)
    // 這是你原本的邏輯，留著當作備用
    let safeText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    const lines = safeText.split(/\n/);
    let inList = false;
    let resultLines = [];
    
    lines.forEach((line) => {
        const listMatch = line.match(/^\s*-\s+(.+)/);
        if (listMatch) {
            if (!inList) {
                resultLines.push('<ul class="list-disc pl-6 mb-1">');
                inList = true;
            }
            resultLines.push(`<li>${listMatch[1]}</li>`);
        } else {
            if (inList) {
                resultLines.push('</ul>');
                inList = false;
            }
            resultLines.push(line);
        }
    });
    
    if (inList) resultLines.push('</ul>');
    return resultLines.join('\n').replace(/\n/g, '<br>');
}

/**
 * 移除 Loading/chat bubble
 */
function removeChatMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.remove();
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