// 音乐播放器类
class MusicPlayer {
    constructor() {
        console.log('初始化音乐播放器');
        this.audio = new Audio();
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.volume = 0.5;
        this.loop = true;
        this.autoplay = false;
        this.isInitialized = false;
        this.zipResources = {}; // 存储从ZIP解压的资源
    }

    async init() {
        console.log('开始初始化音乐播放器');
        
        // 先确保DOM元素存在
        this.ensureDOMExists();
        
        try {
            // 先加载ZIP文件
            await this.loadZipResources();
            // 然后加载播放列表
            await this.loadDefaultPlaylist();
            console.log('播放列表加载完成:', this.playlist);
            
            this.setupAudio();
            this.bindEvents();
            this.loadPlaylist();
            this.isInitialized = true;
            
            console.log('音乐播放器初始化完成');
            
            // 初始化显示
            this.updateVolumeDisplay();
            this.updatePlayState();
            
        } catch (error) {
            console.error('音乐播放器初始化失败:', error);
        }
    }

    async loadZipResources() {
        console.log('开始加载ZIP资源');
        
        try {
            // 使用fetch获取ZIP文件
            const response = await fetch('music.zip');
            if (!response.ok) {
                throw new Error(`无法加载ZIP文件: ${response.status}`);
            }
            
            const zipBlob = await response.blob();
            console.log('ZIP文件加载成功，大小:', zipBlob.size);
            
            // 使用JSZip解压
            const zip = new JSZip();
            const zipData = await zip.loadAsync(zipBlob);
            console.log('ZIP文件解压成功，包含文件:', Object.keys(zipData.files));
            
            // 存储所有资源
            this.zipResources = {};
            
            // 遍历所有文件并转换为可用的URL
            for (const [relativePath, zipEntry] of Object.entries(zipData.files)) {
                if (!zipEntry.dir) {
                    // 根据文件类型处理
                    if (relativePath.endsWith('.mp3')) {
                        // 音频文件转换为Blob URL
                        const blob = await zipEntry.async('blob');
                        this.zipResources[relativePath] = URL.createObjectURL(blob);
                    } else if (relativePath.match(/\.(jpg|jpeg|png|gif)$/i)) {
                        // 图片文件转换为Blob URL
                        const blob = await zipEntry.async('blob');
                        this.zipResources[relativePath] = URL.createObjectURL(blob);
                    } else {
                        // 其他文件暂时按文本处理
                        const content = await zipEntry.async('text');
                        this.zipResources[relativePath] = content;
                    }
                }
            }
            
            console.log('ZIP资源处理完成，共处理文件数:', Object.keys(this.zipResources).length);
            
        } catch (error) {
            console.error('加载ZIP资源失败:', error);
            throw error;
        }
    }

    getResourcePath(originalPath) {
        // 将原来的music/路径转换为ZIP中的相对路径
        if (originalPath.startsWith('music/')) {
            return originalPath.substring(6); // 移除'music/'前缀
        }
        return originalPath;
    }

    ensureDOMExists() {
        console.log('检查DOM元素...');
        
        // 如果音乐播放器容器不存在，创建它
        if (!document.getElementById('musicPlayer')) {
            console.log('创建音乐播放器DOM...');
            const musicPlayerContainer = document.createElement('div');
            musicPlayerContainer.innerHTML = `
                <style>
                    /* 音乐播放器基础样式 */
                    #musicPlayer {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        width: 60px;
                        height: 60px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        border-radius: 50%;
                        cursor: pointer;
                        z-index: 1000;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                        overflow: hidden;
                        border: 2px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    #musicPlayer:hover {
                        transform: scale(1.1) rotate(5deg);
                        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                    }
                    
                    #recordDisc {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        border-radius: 50%;
                        background: radial-gradient(circle at center, #222 0%, #000 70%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        border: 3px solid #333;
                    }
                    
                    .record-cover {
                        width: 80%;
                        height: 80%;
                        border-radius: 50%;
                        background-size: cover;
                        background-position: center;
                        background-repeat: no-repeat;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                        color: white;
                    }
                    
                    .record-cover.default-cover {
                        background: linear-gradient(135deg, #667eea, #764ba2);
                    }
                    
                    @keyframes rotate {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    
                    #recordDisc.playing {
                        animation: rotate 20s linear infinite;
                    }
                    
                    /* 控制面板 */
                    #playerControls {
                        position: absolute;
                        bottom: 80px;
                        right: 0;
                        width: 300px;
                        background: rgba(30, 30, 40, 0.95);
                        border-radius: 15px;
                        padding: 20px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        z-index: 1001;
                        opacity: 0;
                        visibility: hidden;
                        transform: translateY(20px);
                        transition: all 0.3s ease;
                    }
                    
                    #musicPlayer:hover #playerControls {
                        opacity: 1;
                        visibility: visible;
                        transform: translateY(0);
                    }
                    
                    /* 播放列表模态框 */
                    .playlist-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.8);
                        z-index: 9999;
                        display: none;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .playlist-modal.active {
                        display: flex;
                    }
                    
                    .playlist-content {
                        width: 90%;
                        max-width: 500px;
                        max-height: 80vh;
                        background: rgba(30, 30, 40, 0.95);
                        border-radius: 20px;
                        overflow: hidden;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .playlist-header {
                        padding: 20px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: rgba(0, 0, 0, 0.3);
                    }
                    
                    .playlist-header h3 {
                        color: white;
                        font-size: 20px;
                        font-weight: 600;
                        margin: 0;
                    }
                    
                    .close-btn {
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.1);
                        border: none;
                        color: white;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                        font-size: 18px;
                    }
                    
                    .close-btn:hover {
                        background: rgba(255, 255, 255, 0.2);
                        transform: rotate(90deg);
                    }
                    
                    .playlist-items {
                        flex: 1;
                        overflow-y: auto;
                        padding: 20px;
                        max-height: calc(80vh - 100px);
                    }
                    
                    /* 播放列表项 */
                    .playlist-item {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        padding: 12px 15px;
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        margin-bottom: 8px;
                        background: rgba(255, 255, 255, 0.05);
                    }
                    
                    .playlist-item:hover {
                        background: rgba(255, 255, 255, 0.1);
                        transform: translateX(5px);
                    }
                    
                    .playlist-item.active {
                        background: rgba(102, 126, 234, 0.2);
                        border-left: 3px solid #667eea;
                    }
                </style>
                
                <div id="musicPlayer">
                    <div id="recordDisc">
                        <div id="recordCover" class="record-cover default-cover">🎵</div>
                    </div>
                    <div id="playerControls">
                        <div class="now-playing">
                            <div id="currentCover" class="cover-image default-cover">🎵</div>
                            <div class="track-info">
                                <div id="currentTitle">未选择歌曲</div>
                                <div id="currentArtist">请选择一首歌曲</div>
                            </div>
                        </div>
                        <div class="controls">
                            <button id="prevBtn" class="control-btn">⏮️</button>
                            <button id="playBtn" class="control-btn">▶️</button>
                            <button id="nextBtn" class="control-btn">⏭️</button>
                        </div>
                        <div class="progress-container">
                            <div class="time-display">
                                <span id="currentTime">0:00</span>
                                <span id="totalTime">0:00</span>
                            </div>
                            <div id="progressBar" class="progress-bar">
                                <div id="progressFill"></div>
                            </div>
                        </div>
                        <div class="volume-control">
                            <div class="volume-icon">🔊</div>
                            <div id="volumeSlider" class="volume-slider">
                                <div id="volumeFill"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="playlistModal" class="playlist-modal">
                    <div class="playlist-content">
                        <div class="playlist-header">
                            <h3>播放列表 (${this.playlist.length})</h3>
                            <button id="closePlaylist" class="close-btn">✕</button>
                        </div>
                        <div id="playlist" class="playlist-items"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(musicPlayerContainer);
            console.log('音乐播放器DOM创建完成');
        }
    }

    async loadDefaultPlaylist() {
        console.log('加载默认播放列表');
        
        this.playlist = [
            {
                title: 'TALIA\'S THEME',
                artist: '大厅背景音乐',
                file: 'TALIA\'S THEME V1.mp3',
                cover: 'covers/TALIA.jpg',
                duration: 190
            },
            {
                title: 'TALIA\'S THEME(备战)',
                artist: '大厅背景音乐',
                file: 'TALIA\'S THEME V2.mp3',
                cover: 'covers/TALIA2.jpg',
                duration: 189
            },
            {
                title: 'Detonation',
                artist: '大厅背景音乐',
                file: 'BGM_Main_UI_Loop_V3.mp3',
                cover: 'covers/BGM_Main_UI_Loop_V3.jpg',
                duration: 177
            },
            {
                title: 'DeadPoint',
                artist: '大厅背景音乐',
                file: 'BGM_Main_UI_Loop_V4.mp3',
                cover: 'covers/BGM_Main_UI_Loop_V4.jpg',
                duration: 174
            },
            {
                title: 'DayBreak',
                artist: '大厅背景音乐',
                file: 'BGM_Main_UI_Loop_V2.mp3',
                cover: 'covers/BGM_Main_UI_Loop_V2.jpg',
                duration: 188
            },
            {
                title: '欢迎上暗',
                artist: '注册角色背景音乐',
                file: 'BGM_Login_Guide_V1.mp3',
                cover: 'covers/BGM_Login_Guide_V1.jpg',
                duration: 94
            },
            {
                title: '币币机',
                artist: '环境音乐',
                file: '币币机.mp3',
                cover: 'covers/币币机.jpg',
                duration: 18
            },            
            {
                title: '奥特卡片机',
                artist: '环境音乐',
                file: '奥特卡片机.mp3',
                cover: 'covers/奥特卡片机.jpg',
                duration: 31
            }
        ];
        
        console.log('默认播放列表加载完成，共', this.playlist.length, '首歌曲');
    }

    setupAudio() {
        console.log('设置音频属性');
        this.audio.volume = this.volume;
        this.audio.loop = this.loop;

        this.audio.addEventListener('loadedmetadata', () => {
            console.log('音频元数据加载完成，时长:', this.audio.duration);
            this.updateDuration();
        });

        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audio.addEventListener('ended', () => {
            console.log('歌曲播放结束');
            this.nextTrack();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('音频错误:', e, this.audio.error, this.audio.src);
        });

        this.audio.addEventListener('play', () => {
            console.log('音频开始播放');
            this.isPlaying = true;
            this.updatePlayState();
        });

        this.audio.addEventListener('pause', () => {
            console.log('音频暂停');
            this.isPlaying = false;
            this.updatePlayState();
        });
    }

    bindEvents() {
        console.log('绑定播放器事件');
        
        // 音乐播放器点击事件
        const musicPlayer = document.getElementById('musicPlayer');
        if (musicPlayer) {
            musicPlayer.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('点击音乐播放器');
                this.togglePlaylist();
            });
        }
        
        // 关闭按钮事件
        const closeBtn = document.getElementById('closePlaylist');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('点击关闭按钮');
                this.closePlaylist();
            });
        }
        
        // 模态框背景点击关闭
        const modal = document.getElementById('playlistModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    console.log('点击模态框背景');
                    this.closePlaylist();
                }
            });
        }

        // 绑定控制按钮事件
        this.bindControlEvents();

        console.log('播放器事件绑定完成');
    }

    bindControlEvents() {
        console.log('绑定控制按钮事件');
        
        const playBtn = document.getElementById('playBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const progressBar = document.getElementById('progressBar');
        const volumeSlider = document.getElementById('volumeSlider');

        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('点击播放按钮');
                this.togglePlay();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('点击上一首');
                this.previousTrack();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('点击下一首');
                this.nextTrack();
            });
        }

        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                console.log('点击进度条');
                e.stopPropagation();
                this.seek(e);
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('click', (e) => {
                console.log('点击音量条');
                e.stopPropagation();
                this.setVolume(e);
            });
        }
    }

    loadPlaylist() {
        console.log('开始加载播放列表到界面');
        
        if (this.playlist && this.playlist.length > 0) {
            console.log('渲染播放列表，共', this.playlist.length, '首歌曲');
            this.renderPlaylist();
            this.loadTrack(0);
        } else {
            console.warn('播放列表为空');
        }
    }

    renderPlaylist() {
        console.log('开始渲染播放列表界面');
        const playlistElement = document.getElementById('playlist');
        if (!playlistElement) {
            console.error('未找到播放列表容器元素 #playlist');
            return;
        }

        // 清空现有内容
        playlistElement.innerHTML = '';
        
        console.log('清空播放列表，准备添加', this.playlist.length, '个曲目');
        
        // 渲染每个曲目
        this.playlist.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = 'playlist-item';
            if (index === this.currentTrackIndex) {
                trackElement.classList.add('active');
            }

            // 获取封面URL（从ZIP资源中）
            const coverUrl = track.cover && this.zipResources[track.cover] ? 
                this.zipResources[track.cover] : '';

            // 创建曲目内容
            trackElement.innerHTML = `
                <div class="track-cover" 
                     style="width: 45px; height: 45px; border-radius: 6px; background: ${coverUrl ? `url('${coverUrl}')` : 'linear-gradient(135deg, #667eea, #764ba2)'}; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center;">
                    ${!coverUrl ? '🎵' : ''}
                </div>
                <div class="track-info" style="flex: 1; min-width: 0;">
                    <div class="track-title" style="color: white; font-size: 14px; font-weight: 500; margin-bottom: 3px;">${track.title}</div>
                    <div class="track-artist" style="color: rgba(255,255,255,0.7); font-size: 12px;">${track.artist}</div>
                </div>
                <div class="track-duration" style="color: rgba(255,255,255,0.7); font-size: 12px;">
                    ${index === this.currentTrackIndex ? '<span style="margin-right:5px;">▶</span>' : ''}
                    ${this.formatTime(track.duration)}
                </div>
            `;

            trackElement.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('点击曲目:', index, track.title);
                this.loadTrack(index);
                this.play();
            });

            playlistElement.appendChild(trackElement);
        });
        
        console.log('播放列表渲染完成，共添加', playlistElement.children.length, '个曲目');
    }

    loadTrack(index) {
        console.log('加载曲目，索引:', index);
        
        if (!this.playlist || this.playlist.length === 0) {
            console.error('播放列表为空');
            return;
        }
        
        if (index < 0 || index >= this.playlist.length) {
            console.error('无效的曲目索引:', index);
            return;
        }

        const track = this.playlist[index];
        console.log('加载歌曲:', track.title, '文件:', track.file);
        
        // 检查ZIP资源中是否存在该文件
        if (!this.zipResources[track.file]) {
            console.error('ZIP资源中未找到文件:', track.file);
            console.log('可用的资源:', Object.keys(this.zipResources));
            return;
        }
        
        this.currentTrackIndex = index;
        
        // 更新音频源（使用ZIP资源中的Blob URL）
        this.audio.src = this.zipResources[track.file];
        this.audio.load(); // 预加载音频
        
        // 更新界面信息
        this.updateTrackInfo(track);
        
        // 重新渲染播放列表以更新active状态
        this.renderPlaylist();
        
        // 尝试自动播放
        if (this.autoplay) {
            setTimeout(() => {
                this.play();
            }, 100);
        }
    }

    updateTrackInfo(track) {
        console.log('更新曲目信息:', track.title);
        
        // 获取封面URL（从ZIP资源中）
        const coverUrl = track.cover && this.zipResources[track.cover] ? 
            this.zipResources[track.cover] : '';
        
        // 更新当前播放信息
        const currentTitle = document.getElementById('currentTitle');
        const currentArtist = document.getElementById('currentArtist');
        const totalTime = document.getElementById('totalTime');
        const currentCover = document.getElementById('currentCover');
        const recordCover = document.getElementById('recordCover');
        
        if (currentTitle) {
            currentTitle.textContent = track.title;
        }
        
        if (currentArtist) {
            currentArtist.textContent = track.artist;
        }
        
        if (totalTime) {
            totalTime.textContent = this.formatTime(track.duration);
        }
        
        // 更新控制面板封面
        if (currentCover) {
            if (coverUrl) {
                currentCover.style.backgroundImage = `url('${coverUrl}')`;
                currentCover.classList.remove('default-cover');
                currentCover.textContent = '';
            } else {
                currentCover.style.backgroundImage = 'none';
                currentCover.classList.add('default-cover');
                currentCover.textContent = '🎵';
            }
        }
        
        // 更新黑胶唱片封面
        if (recordCover) {
            if (coverUrl) {
                recordCover.style.backgroundImage = `url('${coverUrl}')`;
                recordCover.classList.remove('default-cover');
                recordCover.textContent = '';
            } else {
                recordCover.style.backgroundImage = 'none';
                recordCover.classList.add('default-cover');
                recordCover.textContent = '🎵';
            }
        }
    }

    play() {
        console.log('尝试播放音乐');
        console.log('音频源:', this.audio.src);
        
        this.audio.play().then(() => {
            console.log('音乐开始播放');
            this.isPlaying = true;
            this.updatePlayState();
        }).catch(error => {
            console.error('播放失败:', error);
        });
    }

    pause() {
        console.log('暂停音乐');
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayState();
    }

    togglePlay() {
        console.log('切换播放状态，当前:', this.isPlaying);
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    previousTrack() {
        console.log('上一首');
        let newIndex = this.currentTrackIndex - 1;
        if (newIndex < 0) {
            newIndex = this.playlist.length - 1;
        }
        this.loadTrack(newIndex);
    }

    nextTrack() {
        console.log('下一首');
        let newIndex = this.currentTrackIndex + 1;
        if (newIndex >= this.playlist.length) {
            newIndex = 0;
        }
        this.loadTrack(newIndex);
    }

    seek(e) {
        const progressBar = document.getElementById('progressBar');
        if (!progressBar) {
            console.error('进度条元素不存在');
            return;
        }
        
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = progressBar.offsetWidth;
        const duration = this.audio.duration || 0;
        
        console.log('点击进度条位置:', clickX, '宽度:', width, '时长:', duration);
        
        if (duration > 0) {
            const seekTime = (clickX / width) * duration;
            console.log('跳转到时间:', seekTime);
            this.audio.currentTime = seekTime;
        } else {
            console.warn('音频时长不可用');
        }
    }

    setVolume(e) {
        const volumeSlider = document.getElementById('volumeSlider');
        if (!volumeSlider) {
            console.error('音量条元素不存在');
            return;
        }
        
        const rect = volumeSlider.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = volumeSlider.offsetWidth;
        const volume = Math.max(0, Math.min(1, clickX / width));
        
        console.log('设置音量:', volume);
        
        this.volume = volume;
        this.audio.volume = volume;
        this.updateVolumeDisplay();
    }

    updatePlayState() {
        console.log('更新播放状态:', this.isPlaying);
        const recordDisc = document.getElementById('recordDisc');
        const playBtn = document.getElementById('playBtn');

        if (recordDisc) {
            if (this.isPlaying) {
                recordDisc.classList.add('playing');
                console.log('添加旋转动画');
            } else {
                recordDisc.classList.remove('playing');
                console.log('移除旋转动画');
            }
        }

        if (playBtn) {
            playBtn.innerHTML = this.isPlaying ? '⏸️' : '▶️';
            console.log('更新播放按钮:', playBtn.innerHTML);
        }
    }

    updateProgress() {
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration || 0;
        const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

        const currentTimeElement = document.getElementById('currentTime');
        const progressFill = document.getElementById('progressFill');
        
        if (currentTimeElement) {
            currentTimeElement.textContent = this.formatTime(currentTime);
        }
        if (progressFill) {
            progressFill.style.width = `${progressPercent}%`;
        }
    }

    updateDuration() {
        const duration = this.audio.duration || 0;
        const totalTime = document.getElementById('totalTime');
        if (totalTime) {
            totalTime.textContent = this.formatTime(duration);
        }
    }

    updateVolumeDisplay() {
        const volumeFill = document.getElementById('volumeFill');
        if (volumeFill) {
            volumeFill.style.width = `${this.volume * 100}%`;
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    togglePlaylist() {
        console.log('切换播放列表显示');
        const modal = document.getElementById('playlistModal');
        if (modal) {
            const isActive = modal.classList.contains('active');
            console.log('当前状态:', isActive ? '显示' : '隐藏');
            if (isActive) {
                this.closePlaylist();
            } else {
                this.openPlaylist();
            }
        } else {
            console.error('未找到播放列表模态框 #playlistModal');
        }
    }

    openPlaylist() {
        console.log('打开播放列表');
        const modal = document.getElementById('playlistModal');
        if (modal) {
            modal.classList.add('active');
            console.log('添加active类');
            // 更新标题中的歌曲数量
            const headerTitle = modal.querySelector('h3');
            if (headerTitle) {
                headerTitle.textContent = `播放列表 (${this.playlist.length})`;
            }
            // 重新渲染播放列表
            this.renderPlaylist();
        }
    }

    closePlaylist() {
        console.log('关闭播放列表');
        const modal = document.getElementById('playlistModal');
        if (modal) {
            modal.classList.remove('active');
            console.log('移除active类');
        }
    }

    // 清理资源的方法
    cleanup() {
        // 清理Blob URL以防止内存泄漏
        Object.values(this.zipResources).forEach(url => {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        this.zipResources = {};
    }
}

// 初始化音乐播放器
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM内容加载完成，初始化音乐播放器 ===');
    
    // 检查是否已加载JSZip库
    if (typeof JSZip === 'undefined') {
        console.error('JSZip库未加载，请确保在页面中引入了JSZip库');
        console.log('建议在<head>中添加: <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>');
        return;
    }
    
    // 创建全局音乐播放器实例
    window.musicPlayer = new MusicPlayer();
    
    // 延迟初始化，确保页面完全加载
    setTimeout(() => {
        window.musicPlayer.init().then(() => {
            console.log('音乐播放器初始化成功');
        }).catch(error => {
            console.error('音乐播放器初始化失败:', error);
        });
    }, 1000);
});
