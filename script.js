// ============================================
// 配置
// ============================================
let GEMINI_API_KEY = ''; //AIzaSyBJCJXafzZrPsi0OOyA-4OpdE7a_1UAduw
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const API_KEY_STORAGE_KEY = 'my_gemini_key';
const CHAT_HISTORY_STORAGE_KEY = 'rowena_chat_history';

// 商品資料全域變數
let allProductData = [];

// ============================================
// Tab 切換邏輯
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // 在這裡載入 API Key，確保在所有功能初始化前可用
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
        GEMINI_API_KEY = savedApiKey; 
    }

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
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');

    // 從 localStorage 載入健康檔案資料
    loadProfileData();

    // 從 localStorage 載入 API Key 並填入輸入框
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (apiKeyInput && savedApiKey) {
        apiKeyInput.value = savedApiKey;
        GEMINI_API_KEY = savedApiKey; // 更新全域變數
    }

    // 監聽身高體重變化，自動計算 BMI
    heightInput.addEventListener('input', calculateBMI);
    weightInput.addEventListener('input', calculateBMI);

    // 表單提交 (健康檔案)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProfileData();
    });

    // 儲存 API Key 按鈕監聽器
    if (saveApiKeyBtn && apiKeyInput) {
        saveApiKeyBtn.addEventListener('click', () => {
            const newApiKey = apiKeyInput.value.trim();
            if (newApiKey) {
                localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
                GEMINI_API_KEY = newApiKey; // 更新全域變數
                showNotification('API Key 已儲存並更新！頁面將重新載入。', 'success');
                setTimeout(() => location.reload(), 1500); // 儲存後重新整理
            } else {
                showNotification('API Key 不能為空。', 'error');
            }
        });
    }
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
- 格式嚴格限制：絕對禁止使用任何 Markdown 符號（如 * 或 #）。列表請改用 Emoji (如 🔸, ✨) 代替。
- 字數限制為100字
- 嚴禁出現粗體字,標題字體
- 回答要實用、具體，會建議邊度買最抵`;

// ============================================
// 介面 Loading 鎖定/解鎖狀態函式
// ============================================
function setGlobalLoadingState(isLoading) {
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send');
    const chatSendIcon = chatSendBtn ? chatSendBtn.querySelector('i') : null;
    const generateMealPlanBtn = document.querySelector('button[onclick*="askRowenaMealPlan"]');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    
    const elementsToControl = [chatInput, chatSendBtn, generateMealPlanBtn, clearChatBtn, apiKeyInput, saveApiKeyBtn];

    elementsToControl.forEach(el => {
        if (el) {
            el.disabled = isLoading;
            if (isLoading) {
                el.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                el.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    });

    // 特殊處理發送按鈕的圖示
    if (chatSendIcon) {
        if (isLoading) {
            chatSendIcon.classList.remove('fa-paper-plane');
            chatSendIcon.classList.add('fa-circle-notch', 'fa-spin');
        } else {
            chatSendIcon.classList.remove('fa-circle-notch', 'fa-spin');
            chatSendIcon.classList.add('fa-paper-plane');
        }
    }
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
            if (e.key === 'Enter' && !chatInput.disabled) {
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
    
    // 在發送前檢查是否處於載入狀態
    if (chatInput.disabled) return;

    const message = chatInput.value.trim();
    if (!message) return;

    // 1. 顯示用戶訊息
    appendMessage(message, 'user');
    chatInput.value = '';
    setGlobalLoadingState(true); // 開始載入狀態

    // 2. 顯示 Loading
    const loadingId = appendMessage(
        'Rowena 諗緊野... <i class="fas fa-circle-notch fa-spin text-pink-500 ml-2"></i>', 
        'assistant', 
        true
    );

    try {
        // 準備發送給 API 的訊息陣列
        let apiMessages = [];

        // 🔥 關鍵修復：每一句對話前，都要先「催眠」她，讓她記得自己是誰
        apiMessages.push({
            role: "user", 
            parts: [{ text: ROWENA_SYSTEM_PROMPT + "\n\n(請保持這個角色設定，用廣東話回答)" }]
        });
        
        // 加入這句話是為了避免模型以為第一句 Prompt 是使用者的對話，我們補一個 Model 回覆讓對話邏輯順暢
        apiMessages.push({
            role: "model",
            parts: [{ text: "收到！我係 Rowena，有咩可以幫你？💖" }]
        });

        // 3. 加入歷史紀錄 (讓對話連貫)
        const historyJson = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
        if (historyJson) {
            // 取最近 6 句就好，避免 Token 太多
            const savedHistory = JSON.parse(historyJson).slice(-6);
            savedHistory.forEach(msg => {
                apiMessages.push({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            });
        }

        // 4. 加入當前訊息
        apiMessages.push({ role: "user", parts: [{ text: message }] });

        // 呼叫 API
        const reply = await callGemini(apiMessages);
        
        // 移除 Loading 並顯示回應
        removeChatMessage(loadingId);
        appendMessage(reply, 'assistant');

    } catch (error) {
        removeChatMessage(loadingId);
        appendMessage(`哎呀，連線有啲問題：${error.message}，請試多次啦！🙏`, 'assistant');
    } finally {
        setGlobalLoadingState(false);
    }
}
// ============================================
// 數據獲取機制 (強制保底版)
// ============================================
async function getGuaranteedProductData() {
    // 硬編碼的後備數據 (至少 15 樣常見食材)
    const fallbackData = [
        { name: "白米 (1kg)", price: 45.0, category: "米麵", store: "惠康" },
        { name: "雞蛋 (10隻)", price: 22.0, category: "蛋奶", store: "百佳" },
        { name: "午餐肉 (340g)", price: 18.0, category: "罐頭", store: "AEON" },
        { name: "菜心 (一斤)", price: 8.0, category: "蔬菜", store: "街市" },
        { name: "牛奶 (1L)", price: 16.0, category: "蛋奶", store: "百佳" },
        { name: "雞胸肉 (200g)", price: 25.0, category: "肉類", store: "惠康" },
        { name: "急凍三文魚扒 (100g)", price: 35.0, category: "急凍", store: "AEON" },
        { name: "即食麵 (五包裝)", price: 20.0, category: "米麵", store: "百佳" },
        { name: "蘋果 (一個)", price: 6.0, category: "水果", store: "惠康" },
        { name: "香蕉 (一梳)", price: 12.0, category: "水果", store: "百佳" },
        { name: "方包 (一條)", price: 12.0, category: "麵包", store: "AEON" },
        { name: "薯仔 (一斤)", price: 10.0, category: "蔬菜", store: "街市" },
        { name: "豆腐 (一件)", price: 6.0, category: "豆製品", store: "惠康" },
        { name: "吞拿魚罐頭", price: 15.0, category: "罐頭", store: "百佳" },
        { name: "燕麥片 (500g)", price: 28.0, category: "早餐", store: "AEON" },
        { name: "豬肉片 (200g)", price: 30.0, category: "肉類", store: "惠康" }
    ];

    let rawProducts = [];

    // 1. 嘗試從全域變數讀取
    if (Array.isArray(allProductData) && allProductData.length > 0) {
        console.log("Rowena: 使用已快取的全域數據庫");
        rawProducts = allProductData;
    } else {
        // 2. 嘗試 fetch data.json
        try {
            console.log("Rowena: 嘗試從 data.json 獲取數據...");
            const response = await fetch('data.json');
            if (!response.ok) {
                console.warn(`Rowena: 無法從 data.json 獲取數據，狀態碼: ${response.status}`);
                rawProducts = fallbackData; // fetch 失敗，使用後備數據
            } else {
                const rawData = await response.json();
                
                if (Array.isArray(rawData)) {
                    rawProducts = rawData;
                } else if (rawData && Array.isArray(rawData.products)) {
                    rawProducts = rawData.products;
                }

                if (rawProducts.length === 0) {
                    console.warn("Rowena: data.json 數據為空，使用後備數據。");
                    rawProducts = fallbackData; // data.json 為空，使用後備數據
                }
            }
        } catch (error) {
            console.error("Rowena: 讀取 data.json 發生錯誤，使用後備數據。", error);
            rawProducts = fallbackData; // 發生錯誤，使用後備數據
        }
    }

    // ==========================================
    // 數據清洗層 (The Cleaning Layer)
    // ==========================================
    const NAME_BLACKLIST_KEYWORDS = ['包裝', '罐裝', '袋裝', '盒裝', '每袋', '每包', '每盒', '公克', '千克', '支裝', '個裝'];
    const PURE_SPEC_REGEX = /^(\d+(\.\d+)?[gG克kgKG磅lb]|[xX]\d+|\d+)$/i; // 偵測純數字或單位開頭，或純數字

    const cleanedProducts = rawProducts.map(item => {
        let name = item.name ? item.name.trim() : '';
        const category = item.category ? item.category.trim() : '';

        const startsWithBlacklist = NAME_BLACKLIST_KEYWORDS.some(keyword => name.startsWith(keyword));
        const isPureSpec = PURE_SPEC_REGEX.test(name);

        if (startsWithBlacklist || isPureSpec) {
            if (category && category !== '其他' && !name.includes(category)) {
                // 有分類且名稱不包含分類，則前置分類
                name = `${category} ${name}`.trim();
            } else {
                // 無分類或無法修復，則標記為 null (稍後過濾)
                return null;
            }
        }

        // 最終檢查：確保修復後的名稱有實際意義 (例如避免 "其他 500g" 這樣的結果)
        if (name.length < 3 || name === category || PURE_SPEC_REGEX.test(name)) {
             return null;
        }

        return { ...item, name: name }; // 回傳更新後的商品物件
    }).filter(item => item !== null); // 過濾掉所有被標記為 null 的商品

    // 如果清洗後數據為空，則回傳清理過的後備數據
    if (cleanedProducts.length === 0) {
        console.warn("Rowena: 數據清洗後為空，使用清理過的後備數據。");
        return fallbackData.map(item => ({ ...item, name: (item.name || '').trim() }))
                           .filter(item => item.name.length >= 3 && !PURE_SPEC_REGEX.test(item.name));
    }

    // 更新全域變數為清洗後的數據
    allProductData = cleanedProducts;
    return cleanedProducts;}

// ============================================
// Rowena 專屬菜單規劃功能 (聊天觸發版 & 按鈕觸發版統一邏輯)
// ============================================
async function askRowenaMealPlan(userRequirement = "") {
    // 1. 清洗輸入：過濾 null, undefined, 或字串 "undefined"
    let cleanReq = userRequirement;
    if (!cleanReq || cleanReq === 'undefined' || typeof cleanReq !== 'string') {
        cleanReq = '';
    }
    // 2. 設定顯示文字：如果是空字串，使用預設值
    const displayReq = cleanReq.trim() || '健康又慳家';

    // 1. 檢查 API Key
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_KEY_HERE') {
        showNotification('請先到「檔案」頁面設定 Google Gemini API Key！', 'error');
        return;
    }

    // 2. 鎖定界面
    setGlobalLoadingState(true);

    // 3. 顯示 Loading
    const loadingId = appendMessage(
        'Rowena 收到！正在精心為你設計餐單並計算價格... <i class="fas fa-circle-notch fa-spin text-pink-500 ml-2"></i>', 
        'assistant', 
        true
    );

    try {
        // 4. 獲取保證有數據的商品列表
        const products = await getGuaranteedProductData();

        // 5. 將商品列表轉換為 AI 可讀的文字清單 (隨機抽取 50 筆)
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        const priceListText = shuffled.slice(0, 70)
            .map(item => `- ${item.name}: $${(item.price || 0).toFixed(1)}`)
            .join('\n');

        // 6. 獲取用戶名稱
        const nameInput = document.getElementById('name');
        const userName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "朋友仔";

        // 7. 構建 System Prompt (注入價格清單，並強化指令)
        const prompt = `
你係 Rowena，一位精打細算、親切友善嘅香港精明營養師兼可愛的女仔。
- 用廣東話同用戶溝通，語氣親切、鼓勵、帶點幽默。
- 熟悉全港超市（百佳、惠康、AEON、萬寧等）嘅特價資訊。
- 專注幫用戶慳錢同時保持健康飲食。
- 會用 💖✨🎉 等 Emoji 增加親和力。

【用戶稱呼】${userName}
【用戶具體要求】${displayReq === '健康又慳家' ? '無特別要求，請務必設計「健康又慳家」的均衡餐單' : displayReq}

【🛒 參考價格數據庫 (必須使用這些價格來計算)】
${priceListText}

【任務】
請為用戶設計一日三餐。每餐提供：
1. **Plan A (慳家版)**: 嚴格從上方【🛒 參考價格數據庫】中挑選食材，並直接引用真實價格，務求最便宜。
2. **Plan B (營養版)**: 可考慮額外加入常見食材，但若【🛒 參考價格數據庫】沒有，需自行估算合理市價。
3. **估算卡路里**。

【⚠️ 嚴格計算與輸出規範】
1. **必須從【🛒 參考價格數據庫】中選材**，並直接使用清單上的價格。
2. **嚴禁輸出 "$XX.X"、"待定" 或任何不確定的價格**。所有價格必須是具體數字。
3. **最後必須提供清晰的「是日購物清單」**，並為 Plan A 和 Plan B 分別**計算出「預計總花費」**。
4. **只輸出 HTML 代碼**，不要用 Markdown (如 \`\`\`html)。
5. 請將內容填入以下 HTML 結構：

<div class="space-y-3">
    <div class="bg-pink-50 p-3 rounded-lg text-sm text-gray-700 mb-2">
        收到！參考咗最新超市數據，針對你嘅要求「${displayReq}」，Rowena 為你精心設計咗以下餐單同購物清單！💖
    </div>

    <details class="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden group">
        <summary class="p-4 font-bold text-pink-600 cursor-pointer bg-white hover:bg-pink-50 transition-colors flex justify-between items-center list-none">
            <span class="flex items-center gap-2">🌞 早餐推介 <span class="text-xs font-normal text-gray-400">(按此展開)</span></span>
            <span class="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-4 text-sm text-gray-700 space-y-4 border-t border-pink-50">
            <div>
                <span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold mb-1">🅰️ 慳家版 ($[預估價格] / [預估卡路里]kcal)</span>
                <p class="font-medium text-gray-800">菜式名稱</p>
                <p class="text-gray-500 text-xs mt-1">介紹...</p>
            </div>
            <div class="border-t border-dashed border-gray-200"></div>
            <div>
                <span class="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold mb-1">🅱️ 營養版 ($[預估價格] / [預估卡路里]kcal)</span>
                <p class="font-medium text-gray-800">菜式名稱</p>
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
            <!-- 午餐內容 -->
        </div>
    </details>

    <details class="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden group">
        <summary class="p-4 font-bold text-pink-600 cursor-pointer bg-white hover:bg-pink-50 transition-colors flex justify-between items-center list-none">
            <span class="flex items-center gap-2">🌙 晚餐推介 <span class="text-xs font-normal text-gray-400">(按此展開)</span></span>
            <span class="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-4 text-sm text-gray-700 space-y-4 border-t border-pink-50">
            <!-- 晚餐內容 -->
        </div>
    </details>

    <div class="bg-white rounded-xl border border-gray-200 shadow-sm mt-5 overflow-hidden">
        <div class="bg-gray-800 text-white px-4 py-2 font-bold text-center flex items-center justify-center gap-2">
            <i class="fas fa-shopping-basket"></i> 是日購物清單
        </div>
        <div class="p-4 space-y-4">
            <div>
                <h4 class="font-bold text-green-700 mb-2 text-sm flex justify-between">
                    <span>💰 Plan A (慳家版)</span>
                </h4>
                <ul class="text-sm text-gray-600 space-y-1 pl-1">
                    <li class="flex justify-between border-b border-gray-50 pb-1"><span>[食材名]</span><span>$[真實價格]</span></li>
                    <li class="flex justify-between border-b border-gray-50 pb-1"><span>[食材名]</span><span>$[真實價格]</span></li>
                </ul>
                <div class="text-right font-bold text-gray-800 text-sm pt-2">
                    總計: <span class="text-green-600 text-lg">$[加總金額]</span>
                </div>
            </div>
            
            <hr class="border-dashed border-gray-300">

            <div>
                <h4 class="font-bold text-purple-700 mb-2 text-sm flex justify-between">
                    <span>🥗 Plan B (營養版)</span>
                </h4>
                <ul class="text-sm text-gray-600 space-y-1 pl-1">
                    <li class="flex justify-between border-b border-gray-50 pb-1"><span>[食材名]</span><span>$[真實價格]</span></li>
                </ul>
                <div class="text-right font-bold text-gray-800 text-sm pt-2">
                    總計: <span class="text-purple-600 text-lg">$[加總金額]</span>
                </div>
            </div>
        </div>
        <div class="bg-gray-50 px-4 py-2 text-xs text-gray-400 text-center">
            *以上價格根據最新市場數據計算
        </div>
    </div>
</div>
`.trim();

        // 5. 呼叫 API
        const result = await callGemini([{ role: "user", parts: [{ text: prompt }] }]);

        // 6. 輸出結果
        removeChatMessage(loadingId);
        // 清理可能出現的 Markdown 符號
        const cleanResult = result.replace(/```html/g, '').replace(/```/g, '');
        appendMessage(cleanResult, 'assistant');

    } catch (error) {
        console.error('Rowena Plan Error:', error);
        removeChatMessage(loadingId);
        appendMessage(`數據連結失敗：${error.message}，請檢查 data.json 是否存在。`, 'assistant');
    } finally {
        setGlobalLoadingState(false);
    }
}

// ============================================
// Gemini API 核心通訊函式 (最終加強版)
// ============================================
async function callGemini(history, retryCount = 0) {
    let currentApiKey = GEMINI_API_KEY;
    if (!currentApiKey || currentApiKey === 'YOUR_KEY_HERE') {
        currentApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (!currentApiKey) {
            showNotification('請先到「檔案」頁面設定 Google Gemini API Key！', 'error');
            throw new Error("未設定 API Key");
        }
        GEMINI_API_KEY = currentApiKey; // 更新全域變數
    }

    const payload = {
        contents: history,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
        }
    };

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${currentApiKey}`, {
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

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`連線失敗 (${response.status}): ${errorData.error.message || '未知錯誤'}`);
        }

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("API 沒有回傳內容或格式不正確");
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
    const history = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (history) {
        JSON.parse(history).forEach(msg => appendMessage(msg.text, msg.sender, false, false));
    }
}

function clearChatHistory() {
    if (confirm('確定要刪除所有聊天記錄嗎？')) {
        localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
        const chat = document.getElementById('chat-messages');
        if (chat) chat.innerHTML = `<div class="text-center text-gray-400 text-sm py-4"><p>對話紀錄已清除 ✨</p></div>`;
        showNotification('聊天紀錄已清除！', 'success');
    }
}

// ============================================
// 💬 聊天室顯示函數 (唯一真理版)
// ============================================
function appendMessage(text, sender, isLoading = false, saveToStorage = true) {
    // 防呆處理：確保 text 不是 undefined 或 null
    text = text === undefined || text === null ? '' : String(text);

    // 強制移除所有星號 (*)，防止 Markdown 格式洩漏
    if (text) {
        text = text.replace(/\*/g, '');
    }

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
            .replace(/\*/g, '') // ❌ 強制刪除所有星號
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/\n/g, '<br>');
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
    let history = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
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

    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
}

// ============================================
// Rowena 專屬菜單規劃功能
// ============================================

// ============================================
// Rowena 專屬菜單規劃功能 (聊天觸發版 - 已修復)
// ============================================
// ============================================
// Rowena 專屬菜單規劃功能 (已連結 Data JSON + 強制計算價格)
// ============================================
async function askRowenaMealPlan(userRequirement) {
    // 1. 鎖定界面
    setGlobalLoadingState(true);

    // 2. 顯示 Loading
    const loadingId = appendMessage(
        'Rowena 收到！正在翻查超市價格資料庫，為你計算最抵餐單... <i class="fas fa-circle-notch fa-spin text-pink-500 ml-2"></i>', 
        'assistant', 
        true
    );

    try {
        // ==========================================
        // 核心修復：確保獲取價格數據
        // ==========================================
        let marketData = [];

        // 步驟 A: 嘗試從全域變數讀取
        if (typeof allProductData !== 'undefined' && allProductData.length > 0) {
            marketData = allProductData;
            console.log("Rowena: 使用已快取的數據庫");
        } 
        // 步驟 B: 如果全域變數是空的，嘗試重新下載 JSON
        else {
            try {
                console.log("Rowena: 正在重新下載 data.json...");
                const response = await fetch('data.json');
                const raw = await response.json();
                marketData = Array.isArray(raw) ? raw : (raw.products || []);
            } catch (e) {
                console.error("Rowena: 無法讀取 data.json", e);
            }
        }

        // 步驟 C: 【保底機制】如果真的讀不到 JSON，使用這組「緊急後備數據」
        // 這樣保證 AI 絕對有價格可以看，不會顯示 $XX.X
        if (marketData.length === 0) {
            console.warn("Rowena: 使用緊急後備數據");
            marketData = [
                { name: "泰國香米", price: 48.0 }, { name: "出前一丁", price: 4.5 },
                { name: "維他奶", price: 5.5 }, { name: "嘉頓方包", price: 12.0 },
                { name: "急凍雞翼", price: 28.0 }, { name: "冰鮮豬排", price: 35.0 },
                { name: "午餐肉", price: 18.0 }, { name: "雞蛋(10隻)", price: 22.0 },
                { name: "菜心", price: 8.0 }, { name: "西蘭花", price: 9.0 },
                { name: "番茄", price: 6.0 }, { name: "薯仔", price: 5.0 },
                { name: "硬豆腐", price: 6.0 }, { name: "急凍蝦仁", price: 38.0 },
                { name: "罐頭吞拿魚", price: 16.0 }, { name: "麥皮", price: 20.0 }
            ];
        }

        // ==========================================
        // 數據處理：將 JSON 轉換為 AI 可讀的文字清單
        // ==========================================
        // 我們隨機抽取 50 樣商品給 AI，因為全部塞進去會太長
        const shuffled = [...marketData].sort(() => 0.5 - Math.random());
        // 格式化為 "商品名稱: $價格" 的字串
        const priceListString = shuffled.slice(0, 50)
            .map(item => `- ${item.name}: $${item.price}`)
            .join('\n');

        // 用戶名稱
        let nameInput = document.getElementById('name');
        let name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "朋友仔";

        // ==========================================
        // 建構 Prompt (將價格表塞進去)
        // ==========================================
        const prompt = `
你係 Rowena，香港精明營養師。
【用戶稱呼】${name}
【用戶具體要求】${userRequirement}

【🛒 必須使用的超市價格表】
(請從以下清單選擇食材，並使用清單內的準確價格)
${priceListString}

【任務】
請設計一日三餐。
1. **Plan A (慳家版)**: 嚴格從上方清單挑選最便宜食材。
2. **Plan B (營養版)**: 可加入其他常見食材，但需自行估算合理價格。

【⚠️ 嚴格計算規則】
1. **絕對禁止** 輸出 "$XX.X" 或 "待定"。
2. 如果清單裡有 "雞蛋: $22"，你的購物清單就必須寫 "$22"。
3. 最後必須做加法，算出 "預計總花費"。

【輸出格式 HTML】
請只輸出 HTML，填入以下結構：

<div class="space-y-3">
    <div class="bg-pink-50 p-3 rounded-lg text-sm text-gray-700 mb-2">
        收到！參考咗超市數據，針對你嘅要求「${userRequirement}」，設計咗呢個餐單！
    </div>

    <details class="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden group">
        <summary class="p-4 font-bold text-pink-600 cursor-pointer bg-white hover:bg-pink-50 transition-colors flex justify-between items-center list-none">
            <span class="flex items-center gap-2">🌞 早餐推介 <span class="text-xs font-normal text-gray-400">(展開)</span></span>
            <span class="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-4 text-sm text-gray-700 space-y-4 border-t border-pink-50">
            <div>
                <span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold mb-1">🅰️ 慳家版</span>
                <p class="font-medium text-gray-800">菜式名稱</p>
                <p class="text-gray-500 text-xs mt-1">介紹...</p>
            </div>
            <div class="border-t border-dashed border-gray-200"></div>
            <div>
                <span class="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold mb-1">🅱️ 營養版</span>
                <p class="font-medium text-gray-800">菜式名稱</p>
                <p class="text-gray-500 text-xs mt-1">介紹...</p>
            </div>
        </div>
    </details>

    <details class="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden group">
        <summary class="p-4 font-bold text-pink-600 cursor-pointer bg-white hover:bg-pink-50 transition-colors flex justify-between items-center list-none">
            <span class="flex items-center gap-2">🍜 午餐推介 <span class="text-xs font-normal text-gray-400">(展開)</span></span>
            <span class="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-4 text-sm text-gray-700 space-y-4 border-t border-pink-50">
             </div>
    </details>

    <details class="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden group">
        <summary class="p-4 font-bold text-pink-600 cursor-pointer bg-white hover:bg-pink-50 transition-colors flex justify-between items-center list-none">
            <span class="flex items-center gap-2">🌙 晚餐推介 <span class="text-xs font-normal text-gray-400">(展開)</span></span>
            <span class="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-4 text-sm text-gray-700 space-y-4 border-t border-pink-50">
             </div>
    </details>

    <div class="bg-white rounded-xl border border-gray-200 shadow-sm mt-5 overflow-hidden">
        <div class="bg-gray-800 text-white px-4 py-2 font-bold text-center flex items-center justify-center gap-2">
            <i class="fas fa-shopping-basket"></i> 是日購物清單
        </div>
        <div class="p-4 space-y-4">
            <div>
                <h4 class="font-bold text-green-700 mb-2 text-sm flex justify-between">
                    <span>💰 Plan A (慳家版)</span>
                </h4>
                <ul class="text-sm text-gray-600 space-y-1 pl-1">
                    <li class="flex justify-between border-b border-gray-50 pb-1"><span>[食材名]</span><span>$[真實價格]</span></li>
                    <li class="flex justify-between border-b border-gray-50 pb-1"><span>[食材名]</span><span>$[真實價格]</span></li>
                </ul>
                <div class="text-right font-bold text-gray-800 text-sm pt-2">
                    總計: <span class="text-green-600 text-lg">$[加總金額]</span>
                </div>
            </div>
            
            <hr class="border-dashed border-gray-300">

            <div>
                <h4 class="font-bold text-purple-700 mb-2 text-sm flex justify-between">
                    <span>🥗 Plan B (營養版)</span>
                </h4>
                <ul class="text-sm text-gray-600 space-y-1 pl-1">
                    <li class="flex justify-between border-b border-gray-50 pb-1"><span>[食材名]</span><span>$[真實價格]</span></li>
                </ul>
                <div class="text-right font-bold text-gray-800 text-sm pt-2">
                    總計: <span class="text-purple-600 text-lg">$[加總金額]</span>
                </div>
            </div>
        </div>
        <div class="bg-gray-50 px-4 py-2 text-xs text-gray-400 text-center">
            *以上價格根據最新市場數據計算
        </div>
    </div>
</div>
`.trim();

        // 5. 呼叫 API
        const result = await callGemini([{ role: "user", parts: [{ text: prompt }] }]);

        // 6. 輸出結果
        removeChatMessage(loadingId);
        // 清理可能出現的 Markdown 符號
        const cleanResult = result.replace(/```html/g, '').replace(/```/g, '');
        appendMessage(cleanResult, 'assistant');

    } catch (error) {
        console.error('Rowena Plan Error:', error);
        removeChatMessage(loadingId);
        appendMessage(`數據連結失敗：${error.message}，請檢查 data.json 是否存在。`, 'assistant');
    } finally {
        setGlobalLoadingState(false);
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