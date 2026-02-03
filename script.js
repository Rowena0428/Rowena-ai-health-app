// ============================================
// Rowena 智能健康 App - 終極修復版 script.js
// ============================================

// 1. 設定 API (GitHub 安全版)
let GEMINI_API_KEY = ''; 
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// 2. 全域變數
let allProductData = [];
let currentTab = 'tab-home';

// ============================================
// 核心啟動邏輯 (加了保險絲，防止卡死)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 App 啟動中...");
    
    // 🛡️ 保險絲：如果 3 秒後還在載入，強制關閉載入動畫
    setTimeout(() => {
        const loader = document.getElementById('price-loading');
        if (loader && !loader.classList.contains('hidden')) {
            console.warn("⚠️ 載入逾時，強制顯示介面");
            loader.classList.add('hidden');
            // 如果沒資料，顯示錯誤提示，但不會卡死
            if (allProductData.length === 0) {
                const errorMsg = document.getElementById('price-error');
                if (errorMsg) errorMsg.classList.remove('hidden');
            }
        }
    }, 3000);

    // 1. 檢查 API Key
    checkApiKey();

    // 2. 啟動所有功能
    try {
        initTabSwitching();
        initPriceSearch(); // 這裡會載入資料
        initProfile();
        initChat();
        initCamera();
        console.log("✨ 功能初始化完成");
    } catch (e) {
        console.error("❌ 初始化錯誤:", e);
        alert("程式發生錯誤，請檢查 Console (F12)");
    }
});

// ============================================
// 功能 1: API Key 檢查
// ============================================
function checkApiKey() {
    const cachedKey = localStorage.getItem('my_gemini_key');
    if (cachedKey) {
        GEMINI_API_KEY = cachedKey;
        console.log("✅ 已載入 API Key");
    } else {
        // 延遲一點點跳出，避免畫面卡頓
        setTimeout(() => {
            const userKey = prompt("👋 哈囉！首次使用請輸入 Google Gemini API Key：\n(不會上傳伺服器，僅存於瀏覽器)");
            if (userKey && userKey.trim()) {
                GEMINI_API_KEY = userKey.trim();
                localStorage.setItem('my_gemini_key', GEMINI_API_KEY);
                alert("設定成功！請重新整理網頁生效 🔄");
                location.reload(); 
            }
        }, 1000);
    }
}

// ============================================
// 功能 2: Tab 切換
// ============================================
function initTabSwitching() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // 變更按鈕顏色
            navButtons.forEach(btn => {
                btn.classList.remove('active', 'text-green-600');
                btn.classList.add('text-gray-400');
            });
            button.classList.add('active', 'text-green-600');
            button.classList.remove('text-gray-400');

            // 切換頁面
            tabContents.forEach(tab => tab.classList.add('hidden'));
            const targetContent = document.getElementById(targetTab);
            if (targetContent) targetContent.classList.remove('hidden');
        });
    });
}

// ============================================
// 功能 3: 價格搜尋 (讀取 data.json)
// ============================================
async function initPriceSearch() {
    const priceList = document.getElementById('price-list');
    const priceLoading = document.getElementById('price-loading');
    const priceError = document.getElementById('price-error');

    try {
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error("找不到 data.json");

        const rawData = await response.json();
        
        // 兼容舊格式和新格式
        if (Array.isArray(rawData)) {
            allProductData = rawData;
        } else if (rawData.products) {
            allProductData = rawData.products;
        }

        console.log(`✅ 成功載入 ${allProductData.length} 筆資料`);

        // 隱藏載入動畫，顯示列表
        if (priceLoading) priceLoading.classList.add('hidden');
        if (priceList) priceList.classList.remove('hidden');
        if (priceError) priceError.classList.add('hidden');

        // 啟動搜尋監聽
        initSearch();
        displayRandomProducts(20);

    } catch (error) {
        console.error("載入失敗:", error);
        // 就算失敗，也要隱藏載入動畫！
        if (priceLoading) priceLoading.classList.add('hidden');
        if (priceError) priceError.classList.remove('hidden');
        
        // 給一點假資料測試用 (防止畫面全白)
        allProductData = [
            {name: "範例蘋果 (測試用)", price: 5, cat: "水果", brand: "Demo"},
            {name: "範例牛奶 (測試用)", price: 20, cat: "乳製品", brand: "Demo"}
        ];
        displayRandomProducts(2);
    }
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn'); // 記得在 HTML 加 id="search-btn"

    const doSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return displayRandomProducts(20);
        
        const filtered = allProductData.filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.cat && p.cat.toLowerCase().includes(query))
        );
        displayProducts(filtered);
    };

    if (searchBtn) searchBtn.addEventListener('click', doSearch);
    if (searchInput) searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSearch();
    });
}

function displayRandomProducts(count) {
    if (!allProductData.length) return;
    const shuffled = [...allProductData].sort(() => 0.5 - Math.random());
    displayProducts(shuffled.slice(0, count));
}

function displayProducts(products) {
    const list = document.getElementById('price-list');
    if (!list) return;
    list.innerHTML = '';

    if (products.length === 0) {
        list.innerHTML = '<div class="text-center py-8 text-gray-500">搵唔到相關商品 😢</div>';
        return;
    }

    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center mb-2 animate-fade-in';
        div.innerHTML = `
            <div>
                <div class="font-bold text-gray-800">${p.name}</div>
                <div class="text-xs text-gray-400">${p.cat || ''} | ${p.brand || ''}</div>
            </div>
            <div class="font-bold text-green-600">$${p.price}</div>
        `;
        list.appendChild(div);
    });
}

// ============================================
// 功能 4: Rowena 聊天 & 餐單 (AI 核心)
// ============================================
function initChat() {
    const sendBtn = document.getElementById('chat-send');
    const input = document.getElementById('chat-input');
    
    // 歡迎語
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages && chatMessages.children.length === 0) {
        appendMessage("哈囉！我係 Rowena 💖 想食得健康又想慳錢？同我講你想食咩啦！", 'assistant');
    }

    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;
        
        input.value = '';
        appendMessage(text, 'user');
        
        // 呼叫 AI
        await callGemini(text);
    };

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

async function callGemini(promptText) {
    if (!GEMINI_API_KEY) return appendMessage("⚠️ 請重新整理並輸入 API Key", 'assistant');
    
    const loadingId = appendMessage("Rowena 諗緊野... 🤔", 'assistant');
    
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const data = await response.json();
        
        // 移除載入中
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "對唔住，我暫時無法回應。";
        appendMessage(reply, 'assistant');

    } catch (e) {
        console.error(e);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        appendMessage(`連線錯誤 😢 (${e.message})`, 'assistant');
    }
}

// 統一的訊息顯示函數
function appendMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const div = document.createElement('div');
    const isUser = sender === 'user';
    const id = 'msg-' + Date.now();
    div.id = id;
    
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;
    
    // 支援 Markdown 格式 (如果 HTML 有引入 marked.js)
    let content = text;
    if (typeof marked !== 'undefined' && !isUser) {
        content = marked.parse(text);
    } else {
        // 簡單轉義防止亂碼
        content = text.replace(/\n/g, '<br>');
    }

    div.innerHTML = `
        <div class="max-w-[85%] p-3 rounded-2xl text-sm ${isUser ? 'bg-green-500 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'}">
            ${content}
        </div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

// 兼容舊函數名稱 (防止報錯)
const addChatMessage = appendMessage;

// ============================================
// 功能 5: 其他佔位符
// ============================================
function initProfile() {}
function initCamera() {
    const btn = document.getElementById('camera-input');
    if (btn) btn.addEventListener('change', () => alert("相機功能開發中！📸"));
}
