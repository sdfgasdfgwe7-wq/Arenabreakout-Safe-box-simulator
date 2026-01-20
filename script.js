// 游戏配置和状态管理
const gameSettings = {
    soundEnabled: true,
    musicEnabled: true,
    darkMode: true
};

const versionInfo = {
    version: "0.4.0",
    groupNumber: "457332319",
    bilibiliUrl: "https://m.bilibili.com/space/3546967852452617"
};

const gridConfig = {
    rows: 5,
    cols: 6,
    cellSize: 60,
    gridWidth: 400,
    gridHeight: 333
};

const itemConfig = {
    baseSize: 50,
    scaleFactor: 0.85,
    borderWidth: 2,
    padding: 4,
    fontSize: 12,
    spacing: 0,
    widthOffset: 0,
    imageEnabled: true,
    imageBaseSize: 32,
    imageScaleFactor: 1.0
};

const coinRules = {
    positions: 4,
    chances: [100, 100, 100, 0],
    minValue: 1000,
    maxValue: 3000
};

// 调整稀有度概率：降低金色橙色红色概率，提高紫色概率
const spawnRules = {
    redChance: 0.5,      // 降低红色概率
    orangeChance: 2,     // 降低橙色概率
    goldChance: 10,      // 降低金色概率
    purpleChance: 50,    // 提高紫色概率
    whiteChance: 37.5    // 调整白色概率
};

const gameData = {
    items: [],
    searchQueue: [],
    currentSearch: null,
    searchedItems: 0,
    totalValue: 0,
    highestValue: 0,
    searchTime: 0,
    inventory: [],
    grid: [],
    isSearching: false,
    isPaused: false,
    searchTimer: null,
    currentSearchTime: 0,
    isFirstOpen: true,
    isOpenSafeBtnDisabled: false
};

let itemsConfig = [];

// 音频播放函数
function playClickSound() {
    if (!gameSettings.soundEnabled) return;
    
    const audio = document.getElementById('click-audio');
    if (!audio) return;
    
    try {
        audio.currentTime = 0;
        audio.volume = 0.5;
        audio.play().catch(() => {});
    } catch (e) {
        // 静默处理音频错误
    }
}

function playSpecialSound() {
    if (!gameSettings.soundEnabled) return;
    
    const audio = document.getElementById('special-audio');
    if (!audio) return;
    
    try {
        audio.currentTime = 0;
        audio.volume = 0.7;
        audio.play().catch(() => {});
    } catch (e) {
        // 静默处理音频错误
    }
}

function playOpenSafeSound() {
    if (!gameSettings.soundEnabled) return;
    
    const audio = document.getElementById('open-safe-audio');
    if (!audio) return;
    
    try {
        audio.currentTime = 0;
        audio.volume = 0.8;
        audio.play().catch(() => {});
    } catch (e) {
        // 静默处理音频错误
    }
}

function playResetSound() {
    if (!gameSettings.soundEnabled) return;
    
    const audio = document.getElementById('reset-game-audio');
    if (!audio) return;
    
    try {
        audio.currentTime = 0;
        audio.volume = 0.8;
        audio.play().catch(() => {});
    } catch (e) {
        // 静默处理音频错误
    }
}

function stopOpenSafeSound() {
    const audio = document.getElementById('open-safe-audio');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

function playBackgroundMusic() {
    if (!gameSettings.musicEnabled) return;
    
    const audio = document.getElementById('background-music');
    if (!audio) return;
    
    try {
        audio.volume = 0.3;
        audio.loop = true;
        audio.play().catch(() => {});
    } catch (e) {
        // 静默处理音频错误
    }
}

function stopBackgroundMusic() {
    const audio = document.getElementById('background-music');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

// 配置加载
async function loadConfigFromXML() {
    try {
        const response = await fetch('config.xml');
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        
        // 加载网格配置
        const uiConfig = xmlDoc.getElementsByTagName('ui')[0];
        if (uiConfig) {
            const safeConfig = uiConfig.getElementsByTagName('safe')[0];
            if (safeConfig) {
                const rows = safeConfig.getElementsByTagName('rows')[0]?.textContent;
                const cols = safeConfig.getElementsByTagName('cols')[0]?.textContent;
                const cellSize = safeConfig.getElementsByTagName('cellSize')[0]?.textContent;
                
                if (rows) gridConfig.rows = parseInt(rows);
                if (cols) gridConfig.cols = parseInt(cols);
                if (cellSize) gridConfig.cellSize = parseInt(cellSize);
            }
        }
    } catch (e) {
        // 使用默认配置
    }
}

// 物品配置加载
async function loadItemsFromXML() {
    try {
        const response = await fetch('items.xml');
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const items = [];
        const nodes = xmlDoc.getElementsByTagName('item');
        
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const item = {
                id: parseInt(node.getElementsByTagName('id')[0].textContent),
                name: node.getElementsByTagName('name')[0].textContent,
                width: parseInt(node.getElementsByTagName('width')[0].textContent),
                height: parseInt(node.getElementsByTagName('height')[0].textContent),
                value: parseInt(node.getElementsByTagName('value')[0]?.textContent || "0"),
                icon: node.getElementsByTagName('icon')[0]?.textContent || "fa-question",
                image: node.getElementsByTagName('image')[0]?.textContent || "",
                rarity: node.getElementsByTagName('rarity')[0]?.textContent || "white"
            };
            item.searchTime = item.rarity === 'red' ? 3 : (item.rarity === 'orange' ? 3 : 0.5);
            items.push(item);
        }
        return items;
    } catch (e) {
        return getDefaultItems();
    }
}

function getDefaultItems() {
    return [
        { id: 1, name: "能量饮料", width: 1, height: 1, value: 4000, icon: "fa-wine-bottle", image: "", rarity: "white", searchTime: 1.25 },
        { id: 2, name: "子弹", width: 1, height: 1, value: 3000, icon: "fa-crosshairs", image: "", rarity: "white", searchTime: 1.25 },
        { id: 3, name: "急救包", width: 1, height: 1, value: 8000, icon: "fa-first-aid", image: "", rarity: "white", searchTime: 1.25 },
        { id: 5, name: "手雷", width: 1, height: 1, value: 12000, icon: "fa-bomb", image: "", rarity: "purple", searchTime: 1.25 },
        { id: 6, name: "手枪", width: 1, height: 2, value: 15000, icon: "fa-gun", image: "", rarity: "purple", searchTime: 1.25 },
        { id: 7, name: "2级防弹衣", width: 2, height: 2, value: 20000, icon: "fa-vest", image: "", rarity: "purple", searchTime: 1.25 },
        { id: 8, name: "医疗箱", width: 2, height: 1, value: 20000, icon: "fa-briefcase-medical", image: "", rarity: "gold", searchTime: 1.25 },
        { id: 9, name: "3级防弹衣", width: 2, height: 2, value: 35000, icon: "fa-vest", image: "", rarity: "gold", searchTime: 1.25 },
        { id: 10, name: "AKM步枪", width: 2, height: 2, value: 45000, icon: "fa-gun", image: "", rarity: "gold", searchTime: 1.25 },
        { id: 11, name: "4级防弹衣", width: 2, height: 3, value: 65000, icon: "fa-vest", image: "", rarity: "red", searchTime: 3.8 }
    ];
}

function getRandomItem() {
    if (!itemsConfig.length) return getDefaultItems()[0];
    
    const roll = Math.random() * 100;
    let accumulated = 0;
    
    if (roll < (accumulated += spawnRules.redChance)) {
        const redItems = itemsConfig.filter(it => it.rarity === 'red');
        if (redItems.length > 0) return { ...redItems[Math.floor(Math.random() * redItems.length)] };
    } else if (roll < (accumulated += spawnRules.orangeChance)) {
        const orangeItems = itemsConfig.filter(it => it.rarity === 'orange');
        if (orangeItems.length > 0) return { ...orangeItems[Math.floor(Math.random() * orangeItems.length)] };
    } else if (roll < (accumulated += spawnRules.goldChance)) {
        const goldItems = itemsConfig.filter(it => it.rarity === 'gold');
        if (goldItems.length > 0) return { ...goldItems[Math.floor(Math.random() * goldItems.length)] };
    } else if (roll < (accumulated += spawnRules.purpleChance)) {
        const purpleItems = itemsConfig.filter(it => it.rarity === 'purple');
        if (purpleItems.length > 0) return { ...purpleItems[Math.floor(Math.random() * purpleItems.length)] };
    } else {
        const whiteItems = itemsConfig.filter(it => it.rarity === 'white');
        if (whiteItems.length > 0) return { ...whiteItems[Math.floor(Math.random() * whiteItems.length)] };
    }
    
    return { ...itemsConfig[Math.floor(Math.random() * itemsConfig.length)] };
}

// 设置管理
function loadSettings() {
    const darkMode = localStorage.getItem('darkMode');
    const soundEnabled = localStorage.getItem('soundEnabled');
    const musicEnabled = localStorage.getItem('musicEnabled');
    
    if (darkMode !== null) gameSettings.darkMode = darkMode === 'true';
    if (soundEnabled !== null) gameSettings.soundEnabled = soundEnabled === 'true';
    if (musicEnabled !== null) gameSettings.musicEnabled = musicEnabled === 'true';
    
    const darkModeToggle = document.getElementById('darkmode-toggle');
    const soundToggle = document.getElementById('sound-toggle');
    const musicToggle = document.getElementById('music-toggle');
    
    if (darkModeToggle) darkModeToggle.checked = gameSettings.darkMode;
    if (soundToggle) soundToggle.checked = gameSettings.soundEnabled;
    if (musicToggle) musicToggle.checked = gameSettings.musicEnabled;
    
    if (gameSettings.darkMode) {
        document.body.setAttribute('data-theme', 'dark');
    }
    
    // 根据音乐设置控制背景音乐
    if (gameSettings.musicEnabled) {
        playBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
}

function toggleDarkMode() {
    const toggle = document.getElementById('darkmode-toggle');
    if (!toggle) return;
    
    gameSettings.darkMode = toggle.checked;
    localStorage.setItem('darkMode', gameSettings.darkMode);
    document.body.setAttribute('data-theme', gameSettings.darkMode ? 'dark' : '');
}

function toggleSound() {
    const toggle = document.getElementById('sound-toggle');
    if (!toggle) return;
    
    gameSettings.soundEnabled = toggle.checked;
    localStorage.setItem('soundEnabled', gameSettings.soundEnabled);
}

function toggleMusic() {
    const toggle = document.getElementById('music-toggle');
    if (!toggle) return;
    
    gameSettings.musicEnabled = toggle.checked;
    localStorage.setItem('musicEnabled', gameSettings.musicEnabled);
    
    // 切换背景音乐
    if (gameSettings.musicEnabled) {
        playBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
}

// 游戏核心逻辑
function openSafe() {
    // 防二次点击检查
    if (gameData.isOpenSafeBtnDisabled) {
        console.log('按钮已禁用，防止二次点击');
        return;
    }
    
    // 立即禁用按钮
    gameData.isOpenSafeBtnDisabled = true;
    const openButton = document.getElementById('open-safe-btn');
    if (openButton) {
        openButton.disabled = true;
        openButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
    }
    
    // 播放打开保险箱音效
    playOpenSafeSound();
    
    // 重置游戏状态
    resetGameState();
    gameData.grid = Array(gridConfig.rows).fill().map(() => Array(gridConfig.cols).fill(0));
    
    let itemId = 1;
    const items = [];
    
    // 生成科恩币
    for (let col = 0; col < 4; col++) {
        let itemPlaced = false;
        
        if (col < coinRules.chances.length) {
            const coinChance = coinRules.chances[col];
            const roll = Math.random() * 100;
            
            if (roll < coinChance) {
                const value = Math.floor(Math.random() * (coinRules.maxValue - coinRules.minValue)) + coinRules.minValue;
                const coinItem = { 
                    name: "科恩币", 
                    width: 1, 
                    height: 1, 
                    value: value, 
                    icon: "fa-coins", 
                    image: "images/科恩币.png",
                    rarity: "white", 
                    searchTime: 0.4, 
                    id: itemId++, 
                    row: 0, 
                    col: col, 
                    isCoin: true 
                };
                
                if (canPlaceItem(coinItem, 0, col, gameData.grid)) {
                    placeItem(coinItem, 0, col, gameData.grid);
                    items.push(coinItem);
                    itemPlaced = true;
                }
            }
        }
        
        // 移除生成普通物品的逻辑，只保留科恩币
        if (!itemPlaced) {
            // 这里不再生成普通物品
        }
    }
    
    // 生成高品质物品
    const highQualityItems = itemsConfig.filter(it => 
        it.rarity === 'purple' || it.rarity === 'gold' || it.rarity === 'orange' || it.rarity === 'red'
    );
    const hqCount = Math.floor(Math.random() * 2) + 2; // 2-3个高品质物品
    
    for (let i = 0; i < hqCount; i++) {
        if (highQualityItems.length > 0) {
            const hqItem = { ...highQualityItems[Math.floor(Math.random() * highQualityItems.length)] };
            hqItem.id = itemId++;
            
            const placedItem = tryPlaceItem(hqItem, gameData.grid);
            if (placedItem) {
                items.push(placedItem);
            }
        }
    }
    
    // 补充物品到总数
    const totalTarget = Math.floor(Math.random() * 3) + 4; // 4-6个物品
    const remaining = Math.max(0, totalTarget - items.length);
    
    for (let i = 0; i < remaining; i++) {
        const randomItem = getRandomItem();
        randomItem.id = itemId++;
        
        const placedItem = tryPlaceItem(randomItem, gameData.grid);
        if (placedItem) {
            items.push(placedItem);
        }
    }
    
    gameData.items = items;
    createSearchQueue();
    renderAllItems();
    updateStats();
    updateSearchStatus();
    updateInventory();
    
    const gridInfo = document.getElementById('grid-info');
    if (gridInfo) gridInfo.textContent = `${gameData.items.length}个物品已生成，开始搜索...`;
    
    gameData.isFirstOpen = false;
    
    // 恢复按钮文字（保持禁用状态）
    if (openButton) {
        openButton.innerHTML = '<i class="fas fa-check"></i> 打开保险箱';
    }
    
    setTimeout(startSearch, 1000);
}

function canPlaceItem(item, row, col, grid) {
    if (row + item.height > gridConfig.rows || col + item.width > gridConfig.cols) return false;
    for (let r = row; r < row + item.height; r++) {
        for (let c = col; c < col + item.width; c++) {
            if (grid[r][c] !== 0) return false;
        }
    }
    return true;
}

function placeItem(item, row, col, grid) {
    for (let r = row; r < row + item.height; r++) {
        for (let c = col; c < col + item.width; c++) {
            grid[r][c] = item.id;
        }
    }
    item.row = row;
    item.col = col;
    return item;
}

function tryPlaceItem(item, grid) {
    for (let r = 0; r < gridConfig.rows; r++) {
        for (let c = 0; c < gridConfig.cols; c++) {
            if (canPlaceItem(item, r, c, grid)) {
                return placeItem(item, r, c, grid);
            }
        }
    }
    return null;
}

function createSearchQueue() {
    gameData.searchQueue = [...gameData.items]
        .sort((a, b) => a.row - b.row || a.col - b.col)
        .map(item => ({ ...item }));
}

function startSearch() {
    if (gameData.isSearching || gameData.searchQueue.length === 0) return;
    
    gameData.currentSearch = { ...gameData.searchQueue[0] };
    gameData.isSearching = true;
    gameData.isPaused = false;
    gameData.currentSearchTime = gameData.currentSearch.searchTime;
    
    updateSearchStatus();
    renderAllItems();
    startSearchTimer();
}

function startSearchTimer() {
    if (gameData.searchTimer) cancelAnimationFrame(gameData.searchTimer);
    
    let startTime = Date.now();
    let remainingTime = gameData.currentSearchTime;
    
    function updateTimer() {
        if (gameData.isPaused) return;
        
        const elapsed = (Date.now() - startTime) / 1000;
        remainingTime = Math.max(0, gameData.currentSearchTime - elapsed);
        
        updateSearchTimeDisplay(remainingTime);
        
        if (remainingTime <= 0) {
            completeSearch();
        } else {
            gameData.searchTimer = requestAnimationFrame(updateTimer);
        }
    }
    
    gameData.searchTimer = requestAnimationFrame(updateTimer);
}

function completeSearch() {
    if (gameData.searchTimer) {
        cancelAnimationFrame(gameData.searchTimer);
        gameData.searchTimer = null;
    }
    
    const itemIndex = gameData.items.findIndex(item => item.id === gameData.currentSearch.id);
    if (itemIndex !== -1) {
        gameData.items[itemIndex].searched = true;
    }
    
    gameData.searchQueue.shift();
    gameData.searchedItems++;
    gameData.totalValue += gameData.currentSearch.value;
    gameData.searchTime += gameData.currentSearch.searchTime;
    
    if (gameData.currentSearch.value > gameData.highestValue) {
        gameData.highestValue = gameData.currentSearch.value;
    }
    
    const searchTime = new Date().toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    gameData.inventory.unshift({ 
        ...gameData.currentSearch, 
        searchedAt: searchTime 
    });
    
    // 注意：这里不播放出货音效，出货音效只在点击"我出货了"按钮时播放
    updateStats();
    updateInventory();
    renderAllItems();
    
    gameData.currentSearch = null;
    gameData.isSearching = false;
    updateSearchStatus();
    
    // 全部物品搜索完毕时停止播放打开保险箱音效
    if (gameData.searchQueue.length === 0) {
        stopOpenSafeSound();
        const gridInfo = document.getElementById('grid-info');
        if (gridInfo) gridInfo.textContent = '所有物品搜索完成！点击"重置"重新开始';
    } else {
        setTimeout(startSearch, 500);
    }
}

function updateSearchTimeDisplay(time) {
    const searchTimeElement = document.getElementById('current-search-time');
    if (searchTimeElement) {
        searchTimeElement.textContent = `${time.toFixed(1)}s`;
    }
}

// 物品渲染逻辑
function renderAllItems() {
    const safeGrid = document.getElementById('safe-grid');
    if (!safeGrid) return;
    
    // 清空现有物品
    safeGrid.querySelectorAll('.item').forEach(element => element.remove());
    safeGrid.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('searching', 'searched');
    });
    
    const cellWidth = gridConfig.gridWidth / gridConfig.cols;
    const cellHeight = gridConfig.gridHeight / gridConfig.rows;
    
    gameData.items.forEach(item => {
        const itemElement = createItemElement(item, cellWidth, cellHeight);
        safeGrid.appendChild(itemElement);
        markGridCells(item);
        
        if (item.searched) {
            showItemContent(itemElement, item);
        } else if (gameData.currentSearch && gameData.currentSearch.id === item.id && gameData.isSearching) {
            showSearchingOverlay(itemElement, item, true);
        } else {
            showUnsearchedItem(itemElement, item);
        }
    });
}

function createItemElement(item, cellWidth, cellHeight) {
    const element = document.createElement('div');
    
    if (item.searched) {
        element.className = `item item-${item.rarity}`;
    } else {
        element.className = `item item-white`;
    }
    element.dataset.id = item.id;
    
    const left = item.col * cellWidth;
    const top = item.row * cellHeight;
    const gridWidth = item.width * cellWidth;
    const gridHeight = item.height * cellHeight;
    
    const actualWidth = Math.max(10, gridWidth - itemConfig.spacing * 2);
    const actualHeight = Math.max(10, gridHeight - itemConfig.spacing * 2);
    
    const itemLeft = left + (gridWidth - actualWidth) / 2;
    const itemTop = top + (gridHeight - actualHeight) / 2;
    
    element.style.left = `${Math.floor(itemLeft)}px`;
    element.style.top = `${Math.floor(itemTop)}px`;
    element.style.width = `${Math.floor(actualWidth)}px`;
    element.style.height = `${Math.floor(actualHeight)}px`;
    element.style.fontSize = `${itemConfig.fontSize}px`;
    element.style.opacity = '1';
    
    return element;
}

function markGridCells(item) {
    for (let r = item.row; r < item.row + item.height; r++) {
        for (let c = item.col; c < item.col + item.width; c++) {
            const cell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
            if (cell) {
                if (item.searched) {
                    cell.classList.add('searched');
                } else if (gameData.currentSearch && gameData.currentSearch.id === item.id && gameData.isSearching) {
                    cell.classList.add('searching');
                }
            }
        }
    }
}

function showUnsearchedItem(element, item) {
    element.innerHTML = '';
    element.classList.remove('searched');
    
    const overlay = document.createElement('div');
    overlay.className = 'searching-overlay';
    overlay.innerHTML = `
        <div class="searching-icon"><i class="fas fa-search"></i></div>
        <div class="searching-text">未搜索</div>
    `;
    element.appendChild(overlay);
}

function showItemContent(element, item) {
    element.classList.add('searched');
    element.innerHTML = '';
    
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; position: relative;';
    
    const shouldShowImage = item.image && 
                           item.image.trim() !== '' && 
                           item.image !== 'undefined' &&
                           !item.image.startsWith('fa-') &&
                           !item.image.startsWith('<i');
    
    if (shouldShowImage) {
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 60%; width: 100%; margin-bottom: 4px; margin-top: 8px;';
        
        const image = document.createElement('img');
        image.src = item.image;
        image.alt = item.name;
        image.className = 'item-image';
        image.style.width = `${itemConfig.imageBaseSize}px`;
        image.style.height = `${itemConfig.imageBaseSize}px`;
        image.style.objectFit = 'contain';
        image.style.maxWidth = '100%';
        image.style.maxHeight = '100%';
        
        image.onerror = function() {
            this.style.display = 'none';
            const icon = document.createElement('div');
            icon.className = 'item-icon';
            icon.innerHTML = `<i class="fas ${item.icon}"></i>`;
            icon.style.cssText = 'font-size: 1.2em; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;';
            imageContainer.appendChild(icon);
        };
        
        imageContainer.appendChild(image);
        contentContainer.appendChild(imageContainer);
    } else {
        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 60%; width: 100%; margin-bottom: 4px; margin-top: 8px;';
        
        const icon = document.createElement('div');
        icon.className = 'item-icon';
        icon.innerHTML = `<i class="fas ${item.icon}"></i>`;
        icon.style.cssText = 'font-size: 1.2em; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;';
        iconContainer.appendChild(icon);
        
        contentContainer.appendChild(iconContainer);
    }
    
    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = item.name;
    name.style.cssText = 'font-weight: bold; text-align: center; width: 100%; height: 40%; display: flex; align-items: center; justify-content: center; font-size: 0.9em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
    contentContainer.appendChild(name);
    
    element.appendChild(contentContainer);
    
    if (item.isCoin) {
        const amount = document.createElement('div');
        amount.className = 'coin-amount';
        amount.textContent = item.value.toLocaleString();
        amount.style.cssText = 'position: absolute; top: 2px; right: 2px; background: transparent; color: white; padding: 1px 3px; font-weight: bold; font-size: 0.7em; text-shadow: 0 0 2px black, 0 0 2px black, 0 0 2px black;';
        element.appendChild(amount);
    }
}

function showSearchingOverlay(element, item, animate) {
    const animateClass = animate ? 'searching-icon-animate' : '';
    element.innerHTML = `
        <div class="searching-overlay">
            <div class="searching-icon ${animateClass}"><i class="fas fa-search"></i></div>
            <div class="searching-text">搜索中(${item.searchTime}s)</div>
        </div>
    `;
}

// 界面更新函数
function updateStats() {
    const searchedCount = document.getElementById('searched-count');
    const totalValue = document.getElementById('total-value');
    const highestValue = document.getElementById('highest-value');
    const totalSearchTime = document.getElementById('total-search-time');
    
    if (searchedCount) searchedCount.textContent = gameData.searchedItems;
    if (totalValue) {
        const value = gameData.totalValue;
        totalValue.textContent = `¥${(value / 10000).toFixed(2)}w`;
    }
    if (highestValue) {
        const value = gameData.highestValue;
        highestValue.textContent = `¥${(value / 10000).toFixed(2)}w`;
    }
    if (totalSearchTime) totalSearchTime.textContent = `${gameData.searchTime.toFixed(2)}s`;
}

function updateSearchStatus() {
    const searchProgress = document.getElementById('search-progress');
    if (!searchProgress) return;
    
    if (gameData.isSearching && gameData.currentSearch) {
        const total = gameData.items.length;
        const searched = total - gameData.searchQueue.length;
        searchProgress.textContent = `${searched + 1}/${total}`;
    } else if (gameData.searchQueue.length > 0) {
        const total = gameData.items.length;
        const searched = total - gameData.searchQueue.length;
        searchProgress.textContent = `${searched}/${total}`;
    } else {
        searchProgress.textContent = '0/0';
    }
}

function updateInventory() {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    
    if (gameData.inventory.length === 0) {
        inventoryList.innerHTML = '<div class="inventory-empty">尚未发现任何物品</div>';
        return;
    }
    
    inventoryList.innerHTML = '';
    gameData.inventory.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        
        let borderColor = '#cccccc';
        if (item.rarity === 'purple') borderColor = '#9b59b6';
        else if (item.rarity === 'gold') borderColor = '#f39c12';
        else if (item.rarity === 'orange') borderColor = '#ff7f00';
        else if (item.rarity === 'red') borderColor = '#e74c3c';
        
        itemElement.style.cssText = `
            display: flex;
            align-items: center;
            background: var(--panel-inner-bg);
            padding: 10px 12px;
            border-radius: 6px;
            border-left: 4px solid ${borderColor};
            gap: 10px;
        `;
        
        const icon = document.createElement('div');
        icon.innerHTML = `<i class="fas ${item.icon}"></i>`;
        icon.style.cssText = `font-size: 18px; color: ${borderColor};`;
        
        const info = document.createElement('div');
        info.style.cssText = `flex: 1; min-width: 0;`;
        
        const name = document.createElement('div');
        name.textContent = item.name;
        name.style.cssText = `font-weight: bold; font-size: 14px; color: var(--text-color); margin-bottom: 4px;`;
        
        const details = document.createElement('div');
        details.style.cssText = `display: flex; justify-content: space-between; font-size: 12px; color: var(--text-light);`;
        
        const value = document.createElement('div');
        value.textContent = `¥${(item.value / 10000).toFixed(2)}w`;
        value.style.cssText = `color: var(--value-color); font-weight: bold;`;
        
        const size = document.createElement('div');
        size.textContent = `大小:${item.width}×${item.height}|${item.searchedAt}`;
        
        details.appendChild(value);
        details.appendChild(size);
        info.appendChild(name);
        info.appendChild(details);
        itemElement.appendChild(icon);
        itemElement.appendChild(info);
        inventoryList.appendChild(itemElement);
    });
}

function updateVersionInfo() {
    const versionElement = document.getElementById('version-info');
    if (versionElement) {
        versionElement.innerHTML = `
            <div>版本号: ${versionInfo.version}</div>
            <div style="margin-top:5px;">交流群: ${versionInfo.groupNumber}</div>
        `;
    }
}

function updateGridSizeInfo() {
    const gridInfo = document.getElementById('grid-size-info');
    const currentGridSize = document.getElementById('current-grid-size');
    
    if (gridInfo) gridInfo.textContent = `${gridConfig.cols}×${gridConfig.rows}`;
    if (currentGridSize) currentGridSize.textContent = `${gridConfig.cols}×${gridConfig.rows}`;
}

function resetGame() {
    if (gameData.searchTimer) {
        cancelAnimationFrame(gameData.searchTimer);
        gameData.searchTimer = null;
    }
    
    // 停止打开保险箱音效
    stopOpenSafeSound();
    
    // 播放重置音效
    playResetSound();
    
    // 重置游戏数据
    gameData.items = [];
    gameData.searchQueue = [];
    gameData.currentSearch = null;
    gameData.searchedItems = 0;
    gameData.totalValue = 0;
    gameData.highestValue = 0;
    gameData.searchTime = 0;
    gameData.inventory = [];
    gameData.grid = Array(gridConfig.rows).fill().map(() => Array(gridConfig.cols).fill(0));
    gameData.isSearching = false;
    gameData.isPaused = false;
    gameData.isFirstOpen = true;
    
    // 重置时重新启用打开保险箱按钮
    gameData.isOpenSafeBtnDisabled = false;
    
    const openButton = document.getElementById('open-safe-btn');
    const gridInfo = document.getElementById('grid-info');
    
    if (openButton) {
        openButton.disabled = false;
        openButton.innerHTML = '<i class="fas fa-check"></i> 打开保险箱';
    }
    if (gridInfo) gridInfo.textContent = '点击"打开保险箱"按钮生成物品布局';
    
    createGridCells();
    updateStats();
    updateSearchStatus();
    updateInventory();
}

function resetGameState() {
    // 重置游戏状态但不重置按钮状态
    gameData.items = [];
    gameData.searchQueue = [];
    gameData.currentSearch = null;
    gameData.searchedItems = 0;
    gameData.totalValue = 0;
    gameData.highestValue = 0;
    gameData.searchTime = 0;
    gameData.inventory = [];
    gameData.grid = Array(gridConfig.rows).fill().map(() => Array(gridConfig.cols).fill(0));
    gameData.isSearching = false;
    gameData.isPaused = false;
    gameData.searchTimer = null;
    gameData.currentSearchTime = 0;
}

function createGridCells() {
    const safeGrid = document.getElementById('safe-grid');
    if (!safeGrid) return;
    
    safeGrid.innerHTML = '';
    safeGrid.style.gridTemplateColumns = `repeat(${gridConfig.cols}, 1fr)`;
    safeGrid.style.gridTemplateRows = `repeat(${gridConfig.rows}, 1fr)`;
    safeGrid.style.width = `${gridConfig.gridWidth}px`;
    safeGrid.style.height = `${gridConfig.gridHeight}px`;
    
    for (let row = 0; row < gridConfig.rows; row++) {
        for (let col = 0; col < gridConfig.cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            safeGrid.appendChild(cell);
        }
    }
}

// 模态框管理
function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function openCredits() {
    closeSettings();
    const modal = document.getElementById('credits-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeCredits() {
    const modal = document.getElementById('credits-modal');
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function openAnnouncement() {
    const modal = document.getElementById('announcement-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeAnnouncement() {
    const modal = document.getElementById('announcement-modal');
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function openBilibili() {
    window.open(versionInfo.bilibiliUrl, '_blank');
}

// 事件绑定函数
function bindEvent(id, callback) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('click', () => {
            playClickSound(); // 所有按钮点击时播放点击音效
            callback();
        });
    }
}

// 游戏初始化
async function initGame() {
    await loadConfigFromXML();
    itemsConfig = await loadItemsFromXML();
    
    // 设置CSS变量
    document.documentElement.style.setProperty('--grid-rows', gridConfig.rows);
    document.documentElement.style.setProperty('--grid-cols', gridConfig.cols);
    document.documentElement.style.setProperty('--grid-width', `${gridConfig.gridWidth}px`);
    document.documentElement.style.setProperty('--grid-height', `${gridConfig.gridHeight}px`);
    document.documentElement.style.setProperty('--item-base-size', `${itemConfig.baseSize}px`);
    document.documentElement.style.setProperty('--item-scale-factor', itemConfig.scaleFactor);
    document.documentElement.style.setProperty('--item-border-width', `${itemConfig.borderWidth}px`);
    document.documentElement.style.setProperty('--item-padding', `${itemConfig.padding}px`);
    document.documentElement.style.setProperty('--item-font-size', `${itemConfig.fontSize}px`);
    document.documentElement.style.setProperty('--item-spacing', `${itemConfig.spacing}px`);
    document.documentElement.style.setProperty('--item-width-offset', `${itemConfig.widthOffset}px`);
    document.documentElement.style.setProperty('--item-image-base-size', `${itemConfig.imageBaseSize}px`);
    document.documentElement.style.setProperty('--item-image-scale-factor', itemConfig.imageScaleFactor);
    
    const cellWidth = gridConfig.gridWidth / gridConfig.cols;
    const cellHeight = gridConfig.gridHeight / gridConfig.rows;
    document.documentElement.style.setProperty('--cell-width', `${cellWidth}px`);
    document.documentElement.style.setProperty('--cell-height', `${cellHeight}px`);
    
    gameData.grid = Array(gridConfig.rows).fill().map(() => Array(gridConfig.cols).fill(0));
    
    loadSettings();
    createGridCells();
    updateStats();
    updateSearchStatus();
    updateInventory();
    updateVersionInfo();
    updateGridSizeInfo();
    
    // 绑定事件
    bindEvent('open-safe-btn', openSafe);
    bindEvent('reset-btn', resetGame);
    bindEvent('play-sound-btn', playSpecialSound); // 我出货了按钮
    bindEvent('settings-button', openSettings);
    bindEvent('settings-close', closeSettings);
    bindEvent('bilibili-button', openBilibili);
    bindEvent('credits-button', openCredits);
    bindEvent('credits-close', closeCredits);
    bindEvent('announcement-button', openAnnouncement);
    bindEvent('announcement-close', closeAnnouncement);
    
    // 绑定开关事件
    const darkModeToggle = document.getElementById('darkmode-toggle');
    const soundToggle = document.getElementById('sound-toggle');
    const musicToggle = document.getElementById('music-toggle');
    
    if (darkModeToggle) darkModeToggle.addEventListener('change', toggleDarkMode);
    if (soundToggle) soundToggle.addEventListener('change', toggleSound);
    if (musicToggle) musicToggle.addEventListener('change', toggleMusic);
    
    // 模态框点击外部关闭
    ['settings-modal', 'credits-modal', 'announcement-modal'].forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === modalId && modal.classList.contains('show')) {
                    if (modalId === 'settings-modal') closeSettings();
                    else if (modalId === 'credits-modal') closeCredits();
                    else if (modalId === 'announcement-modal') closeAnnouncement();
                }
            });
        }
    });
    
    // 防止双击缩放
    document.addEventListener('dblclick', (e) => {
        e.preventDefault();
    }, { passive: false });
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    initGame().catch(() => {
        // 静默处理初始化错误
    });
});
