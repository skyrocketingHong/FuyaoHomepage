/**
 * 马赛克背景配置与数据
 * 
 * 包含 MTR 车站列表和颜色预设。
 */

// 港铁车站接口
export interface MtrStation {
    name: string; // 英文名称
    nameZh: string; // 中文名称
    color: string; // 代表颜色 (十六进制)
    isRainbow?: boolean; // 是否应用彩虹特效 (Choi Hung 站专用)
}

// 马赛克配置接口
export interface MosaicConfig {
    baseTileSize: number; // 目标方块物理大小 (px)
    gap: number; // 磁砖间缝隙大小 (px)
    gapColor: string; // 缝隙填充颜色
    randomness: number; // 颜色随机扰动程度 (0-1)
    duration: number; // 颜色更新周期 (秒)，0 表示静态不更新
    transitionSpeed: number; // 颜色插值过渡速度 (0-1)，越高过渡越快
    fps: number; // 动画帧率限制
}

export const MOSAIC_DEFAULT_CONFIG: MosaicConfig = {
    baseTileSize: 8, // 固定物理大小约 32px
    gap: 0.2, // 较窄的缝隙以增强真实感
    gapColor: '#1111111c',
    randomness: 0.15, // 轻微的变化
    duration: 0,
    transitionSpeed: 0.05,
    fps: 60
};

// 港铁车站颜色预设
// 数据按排版颜色分类：
// 黑色文字 -> 亮色背景 -> 日间模式
// 白色文字 -> 暗色背景 -> 夜间模式

// 日间模式 (亮色背景，黑色文字)
export const MTR_PRESETS_DAY: MtrStation[] = [
    // 荃湾线
    { name: 'Tsim Sha Tsui', nameZh: '尖沙咀', color: '#FFEF00' },
    { name: 'Jordan', nameZh: '佐敦', color: '#69B72B' }, 
    { name: 'Yau Ma Tei', nameZh: '油麻地', color: '#CCCCCC' },
    { name: 'Cheung Sha Wan', nameZh: '長沙灣', color: '#B5A265' },
    { name: 'Kwai Hing', nameZh: '葵興', color: '#F1CC00' },
    // 观塘线
    { name: 'Whampoa', nameZh: '黃埔', color: '#AECFF0' },
    { name: 'Ho Man Tin', nameZh: '何文田', color: '#A2CF5A' },
    // Yau Ma Tei repeated
    { name: 'Lok Fu', nameZh: '樂富', color: '#579E2F' },
    { name: 'Wong Tai Sin', nameZh: '黃大仙', color: '#FFFF00' },
    { name: 'Kwun Tong', nameZh: '觀塘', color: '#FFFFFF' },
    { name: 'Lam Tin', nameZh: '藍田', color: '#0083BE' },
    { name: 'Yau Tong', nameZh: '油塘', color: '#FFEF00' },
    { name: 'Tiu Keng Leng', nameZh: '調景嶺', color: '#DCD144' },
    // 港岛线
    { name: 'Kennedy Town', nameZh: '堅尼地城', color: '#95D0D0' },
    { name: 'HKU', nameZh: '香港大學', color: '#B8DA89' },
    { name: 'Sai Ying Pun', nameZh: '西營盤', color: '#8B7BA0' },
    // Sheung Wan #FFD280 #6B4513 (Brown text, treat as Day)
    { name: 'Sheung Wan', nameZh: '上環', color: '#FFD280' },
    { name: 'Wan Chai', nameZh: '灣仔', color: '#E1EB2B' },
    { name: 'Causeway Bay', nameZh: '銅鑼灣', color: '#C8A2C8' },
    { name: 'Tin Hau', nameZh: '天后', color: '#FF7D00' },
    { name: 'North Point', nameZh: '北角', color: '#E86220' },
    { name: 'Sai Wan Ho', nameZh: '西灣河', color: '#FFCC00' },
    // 将军澳线
    // North Point, Yau Tong, Tiu Keng Leng repeated
    { name: 'Hang Hau', nameZh: '坑口', color: '#2EA9DF' },
    { name: 'Po Lam', nameZh: '寶琳', color: '#F28500' },
    // 东涌线 & 机场快线
    { name: 'Hong Kong', nameZh: '香港', color: '#FFFAFA' },
    { name: 'Kowloon', nameZh: '九龍', color: '#ACA28A' },
    { name: 'Olympic', nameZh: '奧運', color: '#4584C4' },
    { name: 'Nam Cheong', nameZh: '南昌', color: '#F0EE86' },
    { name: 'Tsing Yi', nameZh: '青衣', color: '#A1C6CA' },
    { name: 'Tung Chung', nameZh: '東涌', color: '#6A5ACD' },
    { name: 'Airport', nameZh: '機場', color: '#808080' },
    { name: 'AsiaWorld-Expo', nameZh: '博覽館', color: '#FFFFFF' },
    // 东铁线
    { name: 'Hung Hom', nameZh: '紅磡', color: '#F08080' },
    // 屯马线
    { name: 'Ma On Shan', nameZh: '馬鞍山', color: '#E0B0FF' },
    { name: 'Heng On', nameZh: '恆安', color: '#87CEFA' },
    { name: 'Tai Shui Hang', nameZh: '大水坑', color: '#48D1CC' },
    { name: 'Shek Mun', nameZh: '石門', color: '#FBEC5D' },
    { name: 'City One', nameZh: '第一城', color: '#FFBF00' },
    { name: 'Sha Tin Wai', nameZh: '沙田圍', color: '#FFC0CB' },
    { name: 'Che Kung Temple', nameZh: '車公廟', color: '#FFD280' },
    { name: 'Kai Tak', nameZh: '啟德', color: '#FF8C00' },
    { name: 'Sung Wong Toi', nameZh: '宋皇臺', color: '#D08A00' },
    { name: 'To Kwa Wan', nameZh: '土瓜灣', color: '#A9E2F3' },
    { name: 'East Tsim Sha Tsui', nameZh: '尖東', color: '#FFFF00' },
    { name: 'Yuen Long', nameZh: '元朗', color: '#40F5F5' },
    { name: 'Long Ping', nameZh: '朗屏', color: '#FFB3BF' },
    { name: 'Tin Shui Wai', nameZh: '天水圍', color: '#FC8A17' },
    { name: 'Siu Hong', nameZh: '兆康', color: '#7FFFD4' },
    // 南港岛线
    { name: 'Wong Chuk Hang', nameZh: '黃竹坑', color: '#FFFF00' },
    // 广深港
    { name: 'Hong Kong West Kowloon', nameZh: '香港西九龍', color: '#808080' },
    
    // 特殊请求：彩虹特效（用于彩虹站）
    { name: 'Choi Hung', nameZh: '彩虹', color: '#27408B', isRainbow: true }
];

// 夜间模式 (暗色背景，白色文字)
export const MTR_PRESETS_NIGHT: MtrStation[] = [
    // 荃湾线
    { name: 'Central', nameZh: '中環', color: '#AA0000' },
    { name: 'Admiralty', nameZh: '金鐘', color: '#3A86D4' },
    { name: 'Jordan', nameZh: '佐敦', color: '#69B72B' },
    { name: 'Mong Kok', nameZh: '旺角', color: '#BE2700' },
    { name: 'Prince Edward', nameZh: '太子', color: '#8674A1' },
    { name: 'Sham Shui Po', nameZh: '深水埗', color: '#016258' },
    { name: 'Lai Chi Kok', nameZh: '荔枝角', color: '#E04300' },
    { name: 'Mei Foo', nameZh: '美孚', color: '#1E90FF' },
    { name: 'Lai King', nameZh: '荔景', color: '#BB2200' },
    { name: 'Kwai Fong', nameZh: '葵芳', color: '#233D3A' },
    { name: 'Tai Wo Hau', nameZh: '大窩口', color: '#A2B741' },
    { name: 'Tsuen Wan', nameZh: '荃灣', color: '#BB2200' },
    // 观塘线
    { name: 'Shek Kip Mei', nameZh: '石硤尾', color: '#669933' },
    { name: 'Kowloon Tong', nameZh: '九龍塘', color: '#007FFF' },
    { name: 'Diamond Hill', nameZh: '鑽石山', color: '#241704' },
    { name: 'Kowloon Bay', nameZh: '九龍灣', color: '#C80815' },
    { name: 'Ngau Tau Kok', nameZh: '牛頭角', color: '#92B6A3' },
    // 港岛线
    { name: 'Fortress Hill', nameZh: '炮台山', color: '#4B8842' },
    { name: 'Quarry Bay', nameZh: '鰂魚涌', color: '#00918C' },
    { name: 'Tai Koo', nameZh: '太古', color: '#BB2200' },
    { name: 'Shau Kei Wan', nameZh: '筲箕灣', color: '#191970' },
    { name: 'Heng Fa Chuen', nameZh: '杏花邨', color: '#C01204' },
    { name: 'Chai Wan', nameZh: '柴灣', color: '#38510E' },
    // 将军澳线
    { name: 'Tseung Kwan O', nameZh: '將軍澳', color: '#E60012' },
    { name: 'LOHAS Park', nameZh: '康城', color: '#826F79' },
    // 迪士尼 & 欣澳
    { name: 'Sunny Bay', nameZh: '欣澳', color: '#808080' },
    { name: 'Disneyland Resort', nameZh: '迪士尼', color: '#005533' },
    // 东铁线
    { name: 'Exhibition Centre', nameZh: '會展', color: '#94A8B0' },
    { name: 'Mong Kok East', nameZh: '旺角東', color: '#006400' },
    { name: 'Tai Wai', nameZh: '大圍', color: '#05117E' },
    { name: 'Sha Tin', nameZh: '沙田', color: '#BB7796' },
    { name: 'Fo Tan', nameZh: '火炭', color: '#FFA500' },
    { name: 'Racecourse', nameZh: '馬場', color: '#15AE69' },
    { name: 'University', nameZh: '大學', color: '#A2D7DD' },
    { name: 'Tai Po Market', nameZh: '大埔墟', color: '#976E9A' },
    { name: 'Tai Wo', nameZh: '太和', color: '#C89F05' },
    { name: 'Fanling', nameZh: '粉嶺', color: '#9ACD32' },
    { name: 'Sheung Shui', nameZh: '上水', color: '#F6A600' },
    { name: 'Lo Wu', nameZh: '羅湖', color: '#8DC476' },
    { name: 'Lok Ma Chau', nameZh: '落馬洲', color: '#009E9B' },
    // 屯马线
    { name: 'Wu Kai Sha', nameZh: '烏溪沙', color: '#954535' },
    { name: 'Hin Keng', nameZh: '顯徑', color: '#8FBE6C' },
    { name: 'Austin', nameZh: '柯士甸', color: '#B45529' },
    { name: 'Tsuen Wan West', nameZh: '荃灣西', color: '#A81C07' },
    { name: 'Kam Sheung Road', nameZh: '錦上路', color: '#CC5500' },
    { name: 'Tuen Mun', nameZh: '屯門', color: '#035F94' },
    // 南港岛线
    { name: 'Ocean Park', nameZh: '海洋公園', color: '#00BFFF' },
    { name: 'Lei Tung', nameZh: '利東', color: '#FF7F00' },
    { name: 'South Horizons', nameZh: '海怡半島', color: '#74B11B' },
    // 昂坪 360
    { name: 'Tung Chung', nameZh: '東涌', color: '#274060' }
];

export const RAINBOW_COLORS = ['#EE2200', '#EE7F00', '#EEEE00', '#229922', '#2222EE', '#4B2282', '#8B00EE'];
