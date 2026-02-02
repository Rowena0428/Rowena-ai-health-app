const fs = require('fs');

const JSON_URL = "https://online-price-watch.consumer.org.hk/opw/opendata/pricewatch.json";

// --- 1. 設定對照表與關鍵字 ---

// 超市代碼對照表
const STORE_MAP = {
    'PARKNSHOP': '百佳 PARKnSHOP',
    'WELLCOME': '惠康 Wellcome',
    'JASONS': 'Market Place by Jasons',
    'WATSONS': '屈臣氏 Watsons',
    'AEON': 'AEON',
    'DCHFOOD': '大昌食品 DCH Food Mart',
    'MANNINGS': '萬寧 Mannings'
};

// 食品類別保留清單 (白名單)
// 只要類別名稱包含這些字，預設為食品
const FOOD_CATEGORY_KEYWORDS = [
    '食品', '飲品', '菜', '果', '肉', '魚', '蛋', '奶', '米', '麵', 
    '油', '零食', '罐頭', '急凍', '酒', '茶', '咖啡', '湯', '醬', 
    '豆', '糧', '餅', '糖', '鹽', '主要糧食'
];

// 非食品排除清單 (黑名單)
// 只要類別或名稱包含這些字，強制移除
const NON_FOOD_BLACKLIST = [
    '護理', '清潔', '紙巾', '家居', '寵物', '藥', '洗', '廚具', 
    '電器', '嬰兒用品', '口罩', '消毒', '殺菌', '衛生', '牙刷', 
    '牙膏', '沐浴', '洗髮', '護髮', '染髮', '潤膚', '防曬', '嬰'
];

/**
 * 判斷是否為食品的過濾器
 * @param {string} category - 產品類別
 * @param {string} name - 產品名稱
 */
function isFoodItem(category, name) {
    const cat = category || "";
    const n = name || "";

    // 1. 強制排除黑名單 (優先級最高)
    const isBlacklisted = NON_FOOD_BLACKLIST.some(keyword => 
        cat.includes(keyword) || n.includes(keyword)
    );
    if (isBlacklisted) return false;

    // 2. 檢查類別白名單
    const isWhitelisted = FOOD_CATEGORY_KEYWORDS.some(keyword => 
        cat.includes(keyword)
    );
    if (isWhitelisted) return true;

    // 3. 邊緣情況：如果類別不明確，但名稱看起來像吃的 (可以根據需要開啟)
    // 目前保持嚴謹，若類別不符則不收錄
    return false; 
}

// --- 2. 主爬蟲邏輯 ---

async function fetchAndParseJSON() {
    console.log("🚀 正在下載並解析政府數據...");

    try {
        const response = await fetch(JSON_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) throw new Error(`下載失敗: ${response.status}`);
        
        const rawData = await response.json();
        let processedData = [];

        if (Array.isArray(rawData)) {
            rawData.forEach(item => {
                // 必須要有價格資訊才處理
                if (!item.prices || item.prices.length === 0) return;

                // 取得基本資訊
                const name = item.name['zh-Hant'] || item.name['en'];
                const brand = item.brand['zh-Hant'] || item.brand['en'] || '';
                const category = item.cat2Name ? item.cat2Name['zh-Hant'] : '其他';

                // **步驟 A: 過濾非食品**
                if (!isFoodItem(category, name)) {
                    // console.log(`已過濾非食品: ${name} (${category})`); // 除錯用，不想看太多字可註解掉
                    return; 
                }

                // **步驟 B: 展開價格與合併優惠**
                // 如果一個產品在百佳和惠康都有，這裡會變成兩筆資料，方便 Rowena 比較
                item.prices.forEach(priceEntry => {
                    const storeCode = priceEntry.supermarketCode;
                    const storeName = STORE_MAP[storeCode] || storeCode;
                    
                    // 找優惠
                    let discountText = "";
                    if (item.offers && item.offers.length > 0) {
                        const matchingOffer = item.offers.find(o => o.supermarketCode === storeCode);
                        if (matchingOffer) {
                            discountText = matchingOffer['zh-Hant'] || matchingOffer['en'];
                        }
                    }

                    // 建立乾淨的資料物件 (Flat Object)
                    processedData.push({
                        name: name,
                        brand: brand,
                        category: category,
                        store: storeName,
                        price: parseFloat(priceEntry.price),
                        discount: discountText
                    });
                });
            });
        }

        // 統計結果
        console.log(`📊 統計: 原始商品 ${rawData.length} 件 -> 過濾後剩餘 ${processedData.length} 筆食品價格資料。`);

        // --- 3. 格式化輸出 ---
        
        // 隨機打亂 (讓 Rowena 每次有些變化)
        const shuffled = processedData.sort(() => 0.5 - Math.random());

        // 構建最終 JSON 結構
        const outputData = {
            lastUpdated: new Date().toLocaleString('zh-HK', { hour12: false }), // 例如: "2024/2/2 10:00:00"
            products: shuffled
        };

        // 寫入檔案
        fs.writeFileSync('data.json', JSON.stringify(outputData, null, 2));
        
        console.log(`✅ 成功！資料已寫入 data.json`);
        
        // 測試顯示一筆含優惠的資料
        const sample = shuffled.find(p => p.discount !== "");
        if (sample) {
            console.log(`📝 範例數據: [${sample.store}] ${sample.name} - $${sample.price} (${sample.discount})`);
        }

    } catch (error) {
        console.error("❌ 發生錯誤:", error.message);
    }
}

// 執行
fetchAndParseJSON();