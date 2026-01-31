// crawler.js - 官方文件對應版 (合併價格與優惠)
const fs = require('fs');

const JSON_URL = "https://online-price-watch.consumer.org.hk/opw/opendata/pricewatch.json";

// 根據官方 PDF Page 2 & 6 定義的超市代碼對照表 
const STORE_MAP = {
    'PARKNSHOP': '百佳 PARKnSHOP',
    'WELLCOME': '惠康 Wellcome',
    'JASONS': 'Market Place by Jasons', // PDF 指定 JASONS 對應 Market Place 
    'WATSONS': '屈臣氏 Watsons',
    'AEON': 'AEON',
    'DCHFOOD': '大昌食品 DCH Food Mart', // PDF 指定代碼 
    'MANNINGS': '萬寧 Mannings' // 雖然 PDF 沒列出，但通常會有
};

async function fetchAndParseJSON() {
    console.log("正在下載並解析政府數據...");
    
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
                if (item.prices && item.prices.length > 0) {
                    
                    // 1. 解析基本資訊 (根據 JSON 截圖結構)
                    // 優先讀取 zh-Hant (繁體)，沒有則讀取 en 
                    const name = item.name['zh-Hant'] || item.name['en']; 
                    const brand = item.brand['zh-Hant'] || item.brand['en'];
                    
                    // PDF Page 4 確認 cat2Name 為第二層分類 (如: 蛋糕) [cite: 11]
                    const category = item.cat2Name ? item.cat2Name['zh-Hant'] : '其他';

                    // 2. 處理價格與優惠的合併
                    item.prices.forEach(priceEntry => {
                        const storeCode = priceEntry.supermarketCode; // PDF 確認欄位名為 supermarketCode [cite: 12]
                        const storeName = STORE_MAP[storeCode] || storeCode;

                        // **關鍵邏輯**：從 offers 陣列中尋找對應這間超市的優惠
                        // PDF Page 6 顯示 offers 是一個獨立陣列 
                        let discountText = "";
                        if (item.offers && item.offers.length > 0) {
                            // 尋找 supermarketCode 相同的優惠物件
                            const matchingOffer = item.offers.find(o => o.supermarketCode === storeCode);
                            if (matchingOffer) {
                                // PDF Page 6 確認優惠文字在 zh-Hant 欄位 
                                discountText = matchingOffer['zh-Hant'] || matchingOffer['en'];
                            }
                        }

                        processedData.push({
                            id: item.code,
                            name: name,
                            brand: brand,
                            category: category,
                            store: storeName,
                            price: parseFloat(priceEntry.price), // PDF 確認欄位名為 price [cite: 12]
                            discount: discountText, // 成功合併過來的優惠資訊！
                            image: "📦", 
                            // 搜尋關鍵字
                            searchKey: `${name} ${brand} ${category}`.toLowerCase()
                        });
                    });
                }
            });
        }

        // 3. 隨機排序並存檔
        const shuffled = processedData.sort(() => 0.5 - Math.random());
        fs.writeFileSync('data.json', JSON.stringify(shuffled, null, 2));
        
        console.log(`✅ 轉換完成！`);
        console.log(`共處理了 ${processedData.length} 筆價格資料。`);
        
        // 檢查第一筆資料，看看優惠是否有成功抓進來
        const sampleWithDiscount = shuffled.find(i => i.discount !== "");
        if (sampleWithDiscount) {
            console.log(`範例 (含優惠): ${sampleWithDiscount.store} 的 ${sampleWithDiscount.name} - 優惠: ${sampleWithDiscount.discount}`);
        } else {
            console.log(`範例 (無優惠):`, shuffled[0]);
        }

    } catch (error) {
        console.error("❌ 錯誤:", error.message);
    }
}

fetchAndParseJSON();