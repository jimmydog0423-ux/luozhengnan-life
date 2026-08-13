(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const roll = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const esc = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const SAVE_KEY = 'jimmidog-sugar-gate-v4';
  const COLLECTION_KEY = 'jimmidog-sugar-gate-endings-v4';

  const STAT_NAMES = { strength: '力道', agility: '身法', vitality: '根骨', insight: '心眼' };
  const STAT_ICONS = { strength: '力', agility: '影', vitality: '骨', insight: '眼' };
  const STAT_EFFECTS = {
    strength: '每 1 點使基礎攻擊 +2，直接提高普攻與糖門滑劍傷害。',
    agility: '每 1 點使暴擊率 +1.2%，並提高普攻與糖門滑劍傷害。',
    vitality: '每 1 點使氣血上限 +7，並逐步提高防禦。',
    insight: '每 1 點使真氣上限 +3、提高看破反擊；達 10 可看清詭計。'
  };
  const ROUTE_NAMES = { discipline: '自律', integrity: '信義', ties: '人情', show: '節目', chaos: '混沌' };

  const LOCATIONS = {
    outer: {
      name: '糖門外院', region: '糖門 · 山腳', danger: 1, stamp: '安', icon: '門',
      description: '糖虧皮斜靠木樁看戲，藥爐旁全是被糖偉健煉壞的丹。這裡最安全，也最容易把一天修掉。',
      effects: ['修行經驗 +20%', '安全休整'], unlock: () => true
    },
    home: {
      name: '北投老家', region: '北投 · 存檔點', danger: 0, stamp: '家', icon: '飯',
      description: '米特姨的飯香比任何丹藥都可靠。回家能養傷，也會讓你想起上山到底是為了什麼。',
      effects: ['恢復氣血', '心火下降', '人情修行'], unlock: () => true
    },
    cave: {
      name: '水蛇洞', region: '糖門 · 禁地', danger: 2, stamp: '亂', icon: '蛇',
      description: '洞裡住著剪輯師、免費仔和大量無法辨識真假的帳號。流量很多，理智很少。',
      effects: ['開台收益 +35%', '心火上升', '稀有怪出沒'], unlock: s => s.level >= 2
    },
    villa: {
      name: '起丘山莊', region: '江湖 · 戰隊舊址', danger: 2, stamp: '練', icon: '丘',
      description: '老蟹的帳本、薛喜的軍師圖與一張永遠沒人照表出席的班表，都還留在山莊。',
      effects: ['身法修行 +1', '任務報酬 +20%'], unlock: s => s.bossIndex >= 1
    },
    market: {
      name: '叉叉市集', region: '江湖 · 商路', danger: 1, stamp: '買', icon: '市',
      description: '武器、飯盒、銅鏡和真假不明的流量法器都能買到。老闆說概不賒帳。',
      effects: ['商城開放', '裝備整備', '奇聞交換'], unlock: s => s.bossIndex >= 1
    },
    cliff: {
      name: '斷腿崖', region: '糖門 · 登山口', danger: 3, stamp: '戰', icon: '崖',
      description: '所有想上泰山的人都要從這裡出發。Boss 不會因為你是實況主就放水。',
      effects: ['Boss 試煉', '悟道效率 +50%', '無法安穩休息'], unlock: () => true
    }
  };

  const CHAPTERS = [
    { number: '第一回', title: '斷腿入糖門', summary: '被聊天室威脅打斷腿後，你陰錯陽差踏進糖門。', goal: '升到 3 級，累積「自律 4」，再擊敗睡魔。真正的第一關不是武功，是準時起床。', cast:['糖之漢','糖虧皮','糖政銘','糖汶銨'] },
    { number: '第二回', title: '綠光不可亂按', summary: '糖偉健遞來一張發著綠光的核心牌，所有人都在等你犯錯。', goal: '將心眼練到 14，並取得「驗牌銅鏡」。黃光沒有確認，任何神抽都只是幻覺。', cast:['糖偉健','糖虧皮','糖汶銨'] },
    { number: '第三回', title: '金銀雙烏壓境', summary: '張家雙煞堵住糖門，掌門糖之漢看到山羌圖案先退了三步。', goal: '根骨達 17、人情達 10。雙王連戰不能只靠自己，先把同門變成真正的隊伍。', cast:['糖之漢','糖負荷','龍耿','金烏上豬','銀烏下豬'] },
    { number: '第四回', title: '一萬個羅正男', summary: '江湖到處都是你的頭像與口頭禪，卻沒有一個人承認自己是假貨。', goal: '俠名達 25、信義達 12。若自己說過的話都不算數，又要如何證明哪一個才是真身？', cast:['峰哥說書人','糖政銘','糖負荷','萬面分身'] },
    { number: '終章', title: '泰山問心', summary: '所有冠軍、失約、朋友與迷因化作山路。泰山沒有血條，只有你走過的選擇。', goal: '升到 14 級、集齊三枚心印，再登泰山。最後一戰會讀取你整輪的養成與選擇。', cast:['夏侯芝','龍耿','糖門眾人','泰山'] }
  ];

  const BOSSES = [
    {
      id: 'sleep', name: '睡魔・棉被精', icon: '🛏️', title: '永遠差五分鐘的心魔', hp: 96, attack: 12,
      mechanic: '蓄力時必須防禦；詭計會吸走真氣。', reward: '破曉腰牌',
      requirements: [
        { label: '等級達 3', check: s => s.level >= 3, value: s => `LV.${s.level}` },
        { label: '自律達 4', check: s => s.routes.discipline >= 4, value: s => `${s.routes.discipline}/4` }
      ]
    },
    {
      id: 'green', name: '綠衣邪僧・拉札', icon: '🟢', title: '亮了就按的致命誘惑', hp: 142, attack: 17,
      mechanic: '詭計頻繁。用「看破」識破綠光，否則心火暴增。', reward: '黃光心印',
      requirements: [
        { label: '心眼達 14', check: s => stat(s, 'insight') >= 14, value: s => `${stat(s,'insight')}/14` },
        { label: '持有驗牌銅鏡', check: s => hasItem(s, 'mirror'), value: s => hasItem(s,'mirror') ? '已持有' : '未取得' }
      ]
    },
    {
      id: 'crows', name: '金烏上豬・銀烏下豬', icon: '🐗', title: '張家雙王的兄弟連擊', hp: 205, attack: 22,
      mechanic: '重擊連發。防住紅色蓄力，才能讓雙王互撞。', reward: '同門心印',
      requirements: [
        { label: '根骨達 17', check: s => stat(s, 'vitality') >= 17, value: s => `${stat(s,'vitality')}/17` },
        { label: '人情達 10', check: s => s.routes.ties >= 10, value: s => `${s.routes.ties}/10` }
      ]
    },
    {
      id: 'copies', name: '萬面分身・演算法', icon: '👥', title: '每一張臉都說自己是本尊', hp: 268, attack: 27,
      mechanic: '會以假話擾亂心神。心眼越高，意圖提示越明確。', reward: '本真心印',
      requirements: [
        { label: '俠名達 25', check: s => s.fame >= 25, value: s => `${s.fame}/25` },
        { label: '信義達 12', check: s => s.routes.integrity >= 12, value: s => `${s.routes.integrity}/12` }
      ]
    },
    {
      id: 'taishan', name: '最終大 Boss・泰山', icon: '⛰️', title: '沒有捷徑的萬丈問心', hp: 360, attack: 33,
      mechanic: '每三招改變架勢；你的心印與最高道路會化成戰鬥加護。', reward: '自己的結局',
      requirements: [
        { label: '等級達 14', check: s => s.level >= 14, value: s => `LV.${s.level}` },
        { label: '取得至少三枚心印', check: s => s.vows.length >= 3, value: s => `${s.vows.length}/3` },
        { label: '前四位守關者全破', check: s => s.defeatedBosses.length >= 4, value: s => `${s.defeatedBosses.length}/4` }
      ]
    }
  ];

  const ITEMS = {
    rice: { name: '米特飯盒', icon: '🍱', kind: 'consumable', price: 28, description: '戰鬥中恢復 38 氣血。' },
    pill: { name: '糖門回氣丹', icon: '🟡', kind: 'consumable', price: 42, description: '戰鬥中恢復 24 真氣。' },
    mirror: { name: '驗牌銅鏡', icon: '🪞', kind: 'key', price: 160, description: '確認核心卡有沒有亮黃。綠衣邪僧的必要物。' },
    clock: { name: '破曉鬧鐘', icon: '⏰', kind: 'charm', price: 90, description: '每日行動 +1，自律修行更穩定。', bonuses: { maxAp: 1 } },
    boneblade: { name: '斷腿骨劍', icon: '🗡️', kind: 'weapon', price: 120, description: '攻擊 +7。名稱很痛，傷害也很痛。', bonuses: { attack: 7 } },
    ankleguard: { name: '玄鐵護踝', icon: '🥾', kind: 'armor', price: 145, description: '防禦 +5、氣血上限 +24。', bonuses: { defense: 5, maxHp: 24 } },
    mic: { name: '萬人法螺', icon: '📣', kind: 'charm', price: 175, description: '開台收益 +30%，但心火也多 2。', bonuses: { stream: .3 } },
    ledger: { name: '老蟹帳本', icon: '📒', kind: 'key', price: 0, description: '不是你的三千萬私人欠款。它記著整個團隊付出的成本。' },
    yellowseal: { name: '黃光心印', icon: '🟨', kind: 'relic', price: 0, description: '先確認，再出手。' },
    bondseal: { name: '同門心印', icon: '🤝', kind: 'relic', price: 0, description: '一個人很會打，不等於能走到最後。' },
    trueseal: { name: '本真心印', icon: '🪪', kind: 'relic', price: 0, description: '你說過的話，終於能替你證明你是誰。' }
  };

  const MISSIONS = [
    { id: 'water', name: '外院挑水', description: '最普通，也最不會大中計的差事。', repeat: true, reward: '糖錢 28、經驗 22、根骨機率 +1', can: () => true,
      run: s => { s.coins += missionReward(s, 28); gainXp(s, 22); if (Math.random() < .45) s.stats.vitality++; s.routes.discipline++; } },
    { id: 'packs', name: '四十包零傳說', description: '替糖偉健拆完四十包，忍住不要先罵。', cost: 35, reward: '心眼 +2、驗牌銅鏡', can: s => s.coins >= 35, reason: '需要 35 糖錢',
      run: s => { s.coins -= 35; s.stats.insight += 2; addItem(s,'mirror'); s.routes.integrity += 2; } },
    { id: 'rice_run', name: '小師妹送飯', description: '糖汶銨被路上的山羌攔住了。', reward: '飯盒 ×2、人情 +3', can: s => s.routes.ties >= 4, reason: '需要人情 4',
      run: s => { addItem(s,'rice',2); s.routes.ties += 3; s.hp = Math.min(maxHp(s), s.hp + 18); } },
    { id: 'ledger', name: '蟹老闆的帳', description: '把「戰隊總投資」和「私人欠款」分清楚。', reward: '老蟹帳本、信義 +3、俠名 +5', can: s => s.bossIndex >= 1 && s.routes.integrity >= 5, reason: '第二回且信義 5',
      run: s => { addItem(s,'ledger'); s.routes.integrity += 3; s.fame += 5; } },
    { id: 'stream_three', name: '水蛇洞三時辰', description: '連續開台，不跳票、不睡著、不亂承諾。', reward: '糖錢 95、節目 +3、自律 +2', can: s => s.metrics.streams >= 3, reason: '累積開台 3 次',
      run: s => { s.coins += missionReward(s,95); s.routes.show += 3; s.routes.discipline += 2; } },
    { id: 'identity', name: '我不是高金生', description: '整理官方帳號、發言時間與證據，對抗冒名分身。', reward: '信義 +4、心眼 +2、俠名 +8', can: s => s.bossIndex >= 3 && hasItem(s,'ledger'), reason: '第四回且持有老蟹帳本',
      run: s => { s.routes.integrity += 4; s.stats.insight += 2; s.fame += 8; } },
    { id: 'krapy', name: '糖虧皮的三招', description: '大師兄嘴上說隨便打，第三招卻完全沒留手。', reward: '身法 +2、斷腿骨劍、人情 +2', can: s => s.bossIndex >= 1 && stat(s,'agility') >= 9, reason: '第二回且身法 9',
      run: s => { s.stats.agility += 2; addItem(s,'boneblade'); s.routes.ties += 2; } },
    { id: 'chicken', name: '龍耿的雞腿', description: '把雞腿安全送過金銀雙烏的封鎖線，不能偷吃。', cost: 45, reward: '根骨 +2、人情 +3、飯盒 ×2', can: s => s.bossIndex >= 2 && s.coins >= 45, reason: '第三回且糖錢 45',
      run: s => { s.coins -= 45; s.stats.vitality += 2; s.routes.ties += 3; addItem(s,'rice',2); } },
    { id: 'snow', name: '夏侯芝的雪山帖', description: '在斷腿崖讀完雪山派的身法訣，不准只看聊天室解答。', reward: '身法 +2、自律 +3、心眼 +1', can: s => s.bossIndex >= 3 && stat(s,'insight') >= 16, reason: '第四回且心眼 16',
      run: s => { s.stats.agility += 2; s.stats.insight += 1; s.routes.discipline += 3; } }
  ];

  const ENEMIES = {
    outer: [
      { name:'欠薪木樁精', icon:'🪵', hp:54, attack:8, reward:22, xp:24, style:'guard', flavor:'皮厚愛防守，適合練習破架。' },
      { name:'山羌斥候', icon:'🦌', hp:66, attack:10, reward:28, xp:28, style:'swift', flavor:'腳程很快，常用普通攻勢與假動作。' },
      { name:'偷飯灰鼠', icon:'🐀', hp:48, attack:9, reward:24, xp:25, style:'swift', flavor:'叼著米特飯盒逃跑，動作又小又快。' },
      { name:'催台紙人', icon:'📜', hp:58, attack:9, reward:27, xp:27, style:'trick', flavor:'每一張紙都寫著「到底開不開」。' },
      { name:'丹爐煤精', icon:'🔥', hp:72, attack:11, reward:31, xp:30, style:'brute', flavor:'糖偉健煉壞的丹氣成精，重擊很燙。' }
    ],
    cave: [
      { name:'免費仔蛇妖', icon:'🐍', hp:82, attack:13, reward:48, xp:34, style:'trick', flavor:'最會用假動作騙你交出真氣。' },
      { name:'剪輯水鬼', icon:'👻', hp:92, attack:14, reward:54, xp:38, style:'swift', flavor:'專挑失誤片段突襲，來得快也去得快。' },
      { name:'斗內寶箱怪', icon:'🎁', hp:104, attack:15, reward:70, xp:40, style:'guard', flavor:'看起來很香，打開前最好先防一手。' },
      { name:'回音蝙蝠', icon:'🦇', hp:76, attack:14, reward:46, xp:35, style:'swift', flavor:'把聊天室同一句話重複到你紅溫。' },
      { name:'演算法陰兵', icon:'🤖', hp:112, attack:16, reward:66, xp:43, style:'brute', flavor:'不講道理，只把高傷害內容一直推給你。' }
    ],
    villa: [
      { name:'遲到執法隊', icon:'⏱️', hp:102, attack:15, reward:58, xp:42, style:'swift', flavor:'班表寫幾點，它就提早幾分鐘來抓人。' },
      { name:'麻將桌精', icon:'🀄', hp:110, attack:16, reward:64, xp:45, style:'trick', flavor:'每一手都像在等你打錯那張。' },
      { name:'合約墨怪', icon:'🖋️', hp:118, attack:17, reward:68, xp:47, style:'trick', flavor:'條款會自己換行，心眼不夠很容易中招。' },
      { name:'戰隊椅妖', icon:'🪑', hp:128, attack:18, reward:70, xp:49, style:'guard', flavor:'坐得比選手久，架勢也穩得離譜。' },
      { name:'軍師沙盤鬼', icon:'♟️', hp:122, attack:18, reward:72, xp:50, style:'brute', flavor:'薛喜沒說話，沙盤倒是自己殺過來了。' }
    ],
    market: [
      { name:'工商刺客', icon:'💼', hp:115, attack:17, reward:72, xp:48, style:'swift', flavor:'開口先報價，拔刀才說品項。' },
      { name:'假貨商人', icon:'🎭', hp:122, attack:18, reward:78, xp:50, style:'trick', flavor:'每一件商品都是真的，除了商品本身。' },
      { name:'退貨怨靈', icon:'📦', hp:132, attack:18, reward:82, xp:52, style:'guard', flavor:'封條纏滿全身，想退它還得先破防。' },
      { name:'黃牛刀客', icon:'🎫', hp:126, attack:20, reward:88, xp:54, style:'brute', flavor:'價格翻倍，刀傷也是。' },
      { name:'折扣狐妖', icon:'🦊', hp:108, attack:19, reward:76, xp:51, style:'swift', flavor:'倒數三秒永遠不結束，出手倒是真的快。' }
    ],
    cliff: [
      { name:'泰山攔路虎', icon:'🐅', hp:138, attack:20, reward:88, xp:58, style:'brute', flavor:'不管你準備好了沒，它都先撲一次。' },
      { name:'斷腿刀客', icon:'🩼', hp:146, attack:21, reward:94, xp:62, style:'swift', flavor:'步法看似不穩，刀路卻專打下盤。' },
      { name:'山風無常', icon:'🌪️', hp:130, attack:22, reward:92, xp:61, style:'trick', flavor:'招式藏在風裡，心眼不夠只會看到殘影。' },
      { name:'石階巨靈', icon:'🗿', hp:172, attack:23, reward:104, xp:68, style:'guard', flavor:'一百八十階石梯合成的硬派守衛。' },
      { name:'登頂執念', icon:'👹', hp:158, attack:24, reward:110, xp:72, style:'brute', flavor:'越接近泰山，越像你自己不肯放下的東西。' }
    ]
  };

  const MONSTER_STYLE_NAMES = { swift:'迅捷型', trick:'詭計型', guard:'防守型', brute:'重擊型' };

  const ACHIEVEMENTS = [
    { id:'first', icon:'👣', name:'不是跑馬燈', description:'完成第一次自主行動。', test:s=>s.metrics.actions>=1 },
    { id:'train10', icon:'🥋', name:'有練真的有差', description:'修行 10 次。', test:s=>s.metrics.training>=10 },
    { id:'hunt5', icon:'⚔️', name:'江湖不是點擊器', description:'擊敗 5 隻野怪。', test:s=>s.metrics.wins>=5 },
    { id:'mission5', icon:'📜', name:'糖門工具人', description:'完成 5 次任務。', test:s=>s.metrics.missions>=5 },
    { id:'rich', icon:'🪙', name:'不是免費仔', description:'同時持有 500 糖錢。', test:s=>s.coins>=500 },
    { id:'redhot', icon:'🔥', name:'紅溫但還活著', description:'心火達到 80。', test:s=>s.stress>=80 },
    { id:'onehp', icon:'🩸', name:'差一點大中計', description:'以 10 點以下氣血贏得戰鬥。', test:s=>s.metrics.oneHpWins>=1 },
    { id:'untouched', icon:'🪶', name:'無傷不是外掛', description:'無傷擊敗一名 Boss。', test:s=>s.metrics.noHitBoss>=1 },
    { id:'sleep', icon:'⏰', name:'今天真的有開', description:'擊敗睡魔・棉被精。', test:s=>s.defeatedBosses.includes('sleep') },
    { id:'green', icon:'🟨', name:'它有亮黃', description:'擊敗綠衣邪僧。', test:s=>s.defeatedBosses.includes('green') },
    { id:'crows', icon:'🐗', name:'兄弟齊心', description:'擊敗金銀雙烏。', test:s=>s.defeatedBosses.includes('crows') },
    { id:'copies', icon:'🪪', name:'本尊已驗證', description:'擊敗萬面分身。', test:s=>s.defeatedBosses.includes('copies') },
    { id:'reborn', icon:'♻️', name:'Local 人不會消失', description:'完成第一次轉生。', test:s=>s.reincarnations>=1 },
    { id:'vows', icon:'🔶', name:'心印收藏家', description:'同一世取得四枚心印。', test:s=>s.vows.length>=4 },
    { id:'taishan', icon:'⛰️', name:'泰山不是終點', description:'擊敗最終 Boss 泰山。', test:s=>s.defeatedBosses.includes('taishan') },
    { id:'five_endings', icon:'🎬', name:'一萬種羅正男', description:'收集 5 種不同結局。', test:()=>endingCollection().length>=5 }
  ];

  const BOSS_CHOICES = {
    sleep: {
      kicker:'第一回・破曉', title:'棉被燒了，門規還在', text:'糖政銘把出席簿放到你面前。糖汶銨在門外等著送飯，聊天室則一致要求「再睡五分鐘」。你要把第一枚心印刻成什麼？',
      choices:[
        { label:'把名字簽在出席簿上', sub:'自律 +5、信義 +2｜取得「破曉心印」', apply:s=>{s.routes.discipline+=5;s.routes.integrity+=2;addVow(s,'破曉心印');} },
        { label:'請小師妹每天踹門', sub:'人情 +5、節目 +2｜取得「同伴心印」', apply:s=>{s.routes.ties+=5;s.routes.show+=2;addVow(s,'同伴心印');} },
        { label:'當場宣布明天一定準時', sub:'節目 +5、混沌 +3、俠名 +6', apply:s=>{s.routes.show+=5;s.routes.chaos+=3;s.fame+=6;} }
      ]
    },
    green: {
      kicker:'第二回・黃光', title:'有些錯誤不能靠神抽洗掉', text:'綠衣邪僧消散後，銅鏡照出的是你自己的手。山下的人只記得那次失誤，還是要讓下一次選擇替它留下新答案？',
      choices:[
        { label:'公開復盤，承認看錯', sub:'信義 +6、心眼 +2｜取得「誠實心印」', apply:s=>{s.routes.integrity+=6;s.stats.insight+=2;addVow(s,'誠實心印');} },
        { label:'閉關一百場再上桌', sub:'自律 +5、力道 +1、身法 +1｜取得「百煉心印」', apply:s=>{s.routes.discipline+=5;s.stats.strength++;s.stats.agility++;addVow(s,'百煉心印');} },
        { label:'剪成精華，讓大家笑完', sub:'節目 +6、俠名 +8、混沌 +2', apply:s=>{s.routes.show+=6;s.routes.chaos+=2;s.fame+=8;} }
      ]
    },
    crows: {
      kicker:'第三回・同門', title:'贏的是糖門，不是單挑王', text:'金銀雙烏倒下時，糖之漢才從山羌屏風後走出來。老蟹的帳、薛喜的軍師圖與小師妹的飯盒，哪一樣才是宗門真正的武器？',
      choices:[
        { label:'把戰功分給所有同門', sub:'人情 +7、信義 +3｜取得「同門心印」', apply:s=>{s.routes.ties+=7;s.routes.integrity+=3;addVow(s,'同門心印');} },
        { label:'接下山莊的爛帳', sub:'信義 +6、糖錢 +120｜取得「擔當心印」', apply:s=>{s.routes.integrity+=6;s.coins+=120;addVow(s,'擔當心印');} },
        { label:'要求開一場敗者訪談', sub:'節目 +7、混沌 +4、俠名 +10', apply:s=>{s.routes.show+=7;s.routes.chaos+=4;s.fame+=10;} }
      ]
    },
    copies: {
      kicker:'第四回・本真', title:'真假不是靠頭貼決定', text:'一萬個分身同時閉嘴，江湖第一次聽見你的原聲。你可以把這份安靜變成界線、品牌，或下一支最危險的精華。',
      choices:[
        { label:'建立清楚的官方界線', sub:'信義 +7、人情 +4｜取得「本真心印」', apply:s=>{s.routes.integrity+=7;s.routes.ties+=4;addVow(s,'本真心印');} },
        { label:'把分身納入糖門品牌', sub:'節目 +7、糖錢 +180｜取得「萬象心印」', apply:s=>{s.routes.show+=7;s.coins+=180;addVow(s,'萬象心印');} },
        { label:'承認我也不知道誰是真的', sub:'混沌 +9、俠名 +18、心火 +12', apply:s=>{s.routes.chaos+=9;s.fame+=18;s.stress=clamp(s.stress+12,0,100);} }
      ]
    }
  };

  const CHATTERS = ['老傑寶2486','免費仔9527','薛喜軍師','米特姨守護者','糖門雜役','高金生本尊','剪輯水鬼','冷靜有料'];
  const CHAT_LINES = ['真假','確實','這把有料','先看需求好嗎','又在明天一定','右手借我','不要貪刀！','先吃飯啦','這可以剪精華','泰山在笑你','所以現在要怎麼辦？'];
  const INTENTS = {
    attack: { icon:'⚔️', name:'平砍', hint:'普通攻勢。防禦可減傷。' },
    heavy: { icon:'🔴', name:'蓄力重擊', hint:'危險紅光！防禦能大幅減傷並使對手踉蹌。' },
    guard: { icon:'🛡️', name:'架勢防守', hint:'下次受擊減半。劍技可以破防。' },
    trick: { icon:'🟣', name:'迷因詭計', hint:'使用「看破」反制，否則失去真氣並增加心火。' }
  };

  let selectedOrigin = 'talent';
  let state = null;
  let busy = false;
  let currentBattle = null;
  let modalClosable = true;
  let toastTimer = null;

  function endingCollection() {
    try { return JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]'); }
    catch (_) { return []; }
  }

  function freshState(name, origin, legacy = {}) {
    const s = {
      version: 4, name, origin, day: 1, location: 'outer', level: 1, xp: 0, points: 0,
      stats: { strength: 5, agility: 5, vitality: 5, insight: 5 },
      routes: { discipline: 1, integrity: 1, ties: 1, show: 1, chaos: 0 },
      hp: 0, qi: 30, stress: 5, coins: 65, fame: 0, ap: 6,
      inventory: { rice: 1 }, owned: [], equipped: { weapon: null, armor: null, charm: null },
      completedMissions: [], defeatedBosses: [], bossIndex: 0, vows: [], choices: [],
      achievements: Array.isArray(legacy.achievements) ? [...legacy.achievements] : [],
      reincarnations: legacy.reincarnations || 0,
      legacyStats: legacy.legacyStats || { strength:0, agility:0, vitality:0, insight:0 },
      metrics: { actions:0, training:0, wins:0, missions:0, streams:0, purchases:0, oneHpWins:0, noHitBoss:0 },
      log: [], live: true, fateDay: 0, buff: null, ended: false, finalChoice: null,
      pendingStory: null, pendingFinal: false
    };
    Object.keys(s.stats).forEach(k => s.stats[k] += s.legacyStats[k] || 0);
    if (origin === 'talent') { s.stats.insight += 2; s.routes.chaos += 1; }
    if (origin === 'local') { s.stats.vitality += 2; s.hp += 8; s.routes.show += 1; }
    if (origin === 'promise') { s.coins += 70; s.fame += 5; s.routes.show += 2; s.routes.integrity = 0; }
    s.hp += maxHp(s);
    s.qi = maxQi(s);
    addLogTo(s, 'gold', '羅瘸踏入糖門', '不是讀時間線，而是決定今天要去哪、練什麼、何時挑戰。', '單角色養成開始');
    return s;
  }

  function normalizeLoaded(s) {
    if (!s || s.version !== 4) return null;
    s.log ||= [];
    s.achievements ||= [];
    s.vows ||= [];
    s.owned ||= [];
    s.inventory ||= {};
    s.equipped ||= { weapon:null, armor:null, charm:null };
    s.metrics ||= { actions:0, training:0, wins:0, missions:0, streams:0, purchases:0, oneHpWins:0, noHitBoss:0 };
    s.buff ||= null;
    s.ended ||= false;
    s.pendingStory ||= null;
    s.pendingFinal ||= false;
    s.hp = clamp(s.hp, 0, maxHp(s));
    s.qi = clamp(s.qi, 0, maxQi(s));
    return s;
  }

  function stat(s, key) {
    let value = s.stats[key] || 0;
    return value;
  }

  function gearBonus(s, key) {
    return Object.values(s.equipped || {}).filter(Boolean).reduce((total, id) => total + (ITEMS[id]?.bonuses?.[key] || 0), 0);
  }

  function maxHp(s = state) { return 58 + stat(s,'vitality') * 7 + gearBonus(s,'maxHp'); }
  function maxQi(s = state) { return 20 + stat(s,'insight') * 3; }
  function maxAp(s = state) { return 6 + gearBonus(s,'maxAp'); }
  function attackPower(s = state) { return 5 + stat(s,'strength') * 2 + Math.floor(stat(s,'agility') * .45) + gearBonus(s,'attack'); }
  function defensePower(s = state) { return 1 + Math.floor(stat(s,'vitality') * .65) + gearBonus(s,'defense'); }
  function xpNeed(s = state) { return 45 + s.level * 20; }
  function hasItem(s, id) { return (s.inventory[id] || 0) > 0 || s.owned.includes(id); }
  function addItem(s, id, count = 1) {
    const item = ITEMS[id];
    if (!item) return;
    if (['weapon','armor','charm','key','relic'].includes(item.kind)) {
      if (!s.owned.includes(id)) s.owned.push(id);
      if (['weapon','armor','charm'].includes(item.kind)) s.equipped[item.kind] = id;
    } else s.inventory[id] = (s.inventory[id] || 0) + count;
  }
  function consumeItem(s, id, count = 1) {
    if ((s.inventory[id] || 0) < count) return false;
    s.inventory[id] -= count;
    return true;
  }
  function addVow(s, vow) { if (!s.vows.includes(vow)) s.vows.push(vow); }
  function missionReward(s, amount) { return Math.round(amount * (s.location === 'villa' ? 1.2 : 1)); }
  function statPreview(s, key) {
    const next = { ...s, stats: { ...s.stats, [key]: (s.stats[key] || 0) + 1 } };
    if (key === 'strength') return `攻擊 ${attackPower(s)} → ${attackPower(next)}`;
    if (key === 'agility') return `暴擊率 ${(stat(s,key) * 1.2).toFixed(1)}% → ${(stat(next,key) * 1.2).toFixed(1)}%`;
    if (key === 'vitality') return `氣血 ${maxHp(s)} → ${maxHp(next)}・防禦 ${defensePower(s)} → ${defensePower(next)}`;
    const insightNote = stat(s,key) < 10 && stat(next,key) >= 10 ? '・解鎖看清詭計' : '';
    return `真氣 ${maxQi(s)} → ${maxQi(next)}・看破傷害 +1.4${insightNote}`;
  }

  function gainXp(s, amount) {
    let gained = amount;
    if (s.buff?.id === 'double') { gained *= 2; useBuff(s); }
    s.xp += Math.round(gained);
    const levels = [];
    while (s.xp >= xpNeed(s)) {
      s.xp -= xpNeed(s); s.level++; s.points += 2; levels.push(s.level);
      s.hp = maxHp(s); s.qi = maxQi(s);
    }
    if (levels.length) {
      toast(`升到 LV.${s.level}，獲得 ${levels.length * 2} 點配點`);
      pushChat('system', `系統：羅瘸升到 LV.${s.level}！聊天室禁止代點。`);
    }
    return Math.round(gained);
  }

  function useBuff(s) {
    if (!s.buff) return;
    s.buff.uses--;
    if (s.buff.uses <= 0) s.buff = null;
  }

  function addLog(type, title, text, delta = '') { addLogTo(state, type, title, text, delta); }
  function addLogTo(s, type, title, text, delta = '') {
    s.log.unshift({ type, title, text, delta, day: s.day });
    s.log = s.log.slice(0, 20);
  }

  function save(showToast = false) {
    if (!state) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      if (showToast) toast('進度已存檔');
    } catch (_) { if (showToast) toast('瀏覽器拒絕存檔'); }
  }

  function loadSave() {
    try { return normalizeLoaded(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')); }
    catch (_) { return null; }
  }

  function toast(message) {
    const el = $('toast');
    el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function pushChat(kind = '', forced = '') {
    if (!state?.live) return;
    const feed = $('chat-feed');
    if (!feed) return;
    const line = document.createElement('div');
    line.className = `chat-message ${kind}`;
    if (kind === 'system') line.textContent = forced || '系統：江湖狀態已更新';
    else line.innerHTML = `<b>${esc(pick(CHATTERS))}：</b>${esc(forced || pick(CHAT_LINES))}`;
    feed.appendChild(line);
    while (feed.children.length > 28) feed.firstChild.remove();
    feed.scrollTop = feed.scrollHeight;
  }

  function seedChat() {
    const feed = $('chat-feed'); feed.innerHTML = '';
    ['開了開了','先看 Boss 要求，不要又送頭','今天一定上泰山吧？','米特姨有送飯嗎'].forEach((text,i) => pushChat(i===0?'system':'', i===0?'系統：糖門台開始實況':text));
  }

  function chapter() { return CHAPTERS[Math.min(state.bossIndex, CHAPTERS.length - 1)]; }
  function currentBoss() { return BOSSES[Math.min(state.bossIndex, BOSSES.length - 1)]; }
  function bossReady(boss = currentBoss()) { return boss.requirements.every(req => req.check(state)); }

  function titleForState() {
    if (state.defeatedBosses.includes('taishan')) return '泰山瘸俠';
    if (state.bossIndex >= 4) return '糖門首席・待登泰山';
    if (state.bossIndex >= 3) return '糖門護法';
    if (state.bossIndex >= 2) return '糖門內門弟子';
    if (state.bossIndex >= 1) return '糖門正式弟子';
    return '糖門外院弟子';
  }

  function render() {
    if (!state) return;
    state.hp = clamp(state.hp, 0, maxHp(state)); state.qi = clamp(state.qi, 0, maxQi(state)); state.ap = clamp(state.ap, 0, maxAp(state));
    const ch = chapter();
    $('player-name-view').textContent = state.name;
    $('title-view').textContent = titleForState();
    $('rebirth-badge').textContent = state.reincarnations ? `${state.reincarnations + 1} 世` : '初世';
    $('level-view').textContent = `LV. ${state.level}`;
    $('xp-view').textContent = `${state.xp} / ${xpNeed(state)}`;
    $('xp-bar').style.width = `${state.xp / xpNeed(state) * 100}%`;
    $('hp-view').textContent = `${state.hp}/${maxHp(state)}`; $('hp-bar').style.width = `${state.hp/maxHp(state)*100}%`;
    $('qi-view').textContent = `${state.qi}/${maxQi(state)}`; $('qi-bar').style.width = `${state.qi/maxQi(state)*100}%`;
    $('stress-view').textContent = state.stress; $('stress-bar').style.width = `${state.stress}%`;
    $('points-view').textContent = state.points;
    $('coins-view').textContent = state.coins; $('fame-view').textContent = state.fame; $('ap-view').textContent = `${state.ap}/${maxAp(state)}`;
    $('day-label').textContent = `第 ${state.day} 日`; $('chapter-label').textContent = ch.number;
    $('chapter-number').textContent = ch.number; $('chapter-title').textContent = ch.title; $('chapter-summary').textContent = ch.summary;
    $('live-toggle').classList.toggle('off', !state.live); $('live-toggle').setAttribute('aria-pressed', String(state.live));
    $('live-toggle').innerHTML = `<span class="live-dot"></span> ${state.live ? '實況中' : '已關台'}`;

    $('stats-grid').innerHTML = Object.entries(STAT_NAMES).map(([key,name]) => `<div class="stat-tile" title="${esc(STAT_EFFECTS[key])}"><span>${name}</span><b>${stat(state,key)}</b></div>`).join('');
    $('equipment-mini').innerHTML = ['weapon','armor','charm'].map(slot => {
      const id = state.equipped[slot], item = ITEMS[id];
      const slotName = {weapon:'兵器',armor:'護具',charm:'法器'}[slot];
      return `<div class="equip-row"><i>${item?.icon || '·'}</i><span>${slotName}　<b>${item?.name || '尚未裝備'}</b></span></div>`;
    }).join('');
    renderLocation(); renderMap(); renderActions(); renderLog(); renderBossPreview(); renderQuestMini(); renderAchievementMini();
    $('viewer-count').textContent = `${Math.max(19, 248 + state.fame * 73 + state.routes.show * 19 + roll(-8,8))} 人觀看`;
  }

  function renderLocation() {
    const loc = LOCATIONS[state.location];
    const stage = document.querySelector('.location-stage'); stage.dataset.location = state.location;
    $('location-region').textContent = loc.region; $('location-name').textContent = loc.name;
    $('location-description').textContent = loc.description; $('danger-stamp').textContent = loc.stamp;
    $('danger-label').textContent = loc.danger ? `凶險 ${'Ⅰ'.repeat(loc.danger)}` : '安全區域';
    $('location-effects').innerHTML = loc.effects.map(effect => `<span class="effect-chip ${/上升|凶險/.test(effect)?'bad':''}">${effect}</span>`).join('') + (state.buff ? `<span class="effect-chip">聖旨：${esc(state.buff.name)}</span>` : '');
  }

  function renderMap() {
    $('map-nav').innerHTML = Object.entries(LOCATIONS).map(([id,loc]) => {
      const unlocked = loc.unlock(state);
      return `<button class="map-button ${state.location===id?'active':''} ${unlocked?'':'locked'}" data-location="${id}" ${unlocked?'':'disabled'} title="${unlocked?loc.description:'尚未解鎖'}"><i>${loc.icon}</i><b>${loc.name}</b></button>`;
    }).join('');
    document.querySelectorAll('[data-location]').forEach(btn => btn.onclick = () => {
      state.location = btn.dataset.location; addLog('','走訪江湖',`來到${LOCATIONS[state.location].name}。`); save(); render(); pushChat();
    });
  }

  function locationActions() {
    const commonEnd = { icon:'月', name:'收功入夜', desc:'結束今天，恢復行動與少量狀態。', cost:'不耗行動', fn:endDay };
    const sets = {
      outer: [
        {icon:'修',name:'自主修行',desc:'選一項四維鍛鍊，穩定獲得經驗。',cost:'行動 -1',fn:openTraining},
        {icon:'獵',name:'外院打野怪',desc:'從多種外院野怪中挑一隻交手；不想打可以免費換一批。',cost:'選擇後行動 -1',fn:openWildEncounter},
        {icon:'帖',name:'承接任務',desc:'完成糖門委託，取得特殊物品與人情。',cost:'依任務',fn:openMissions},
        {icon:'息',name:'調息打坐',desc:'恢復真氣與氣血，稍微降低心火。',cost:'行動 -1',fn:restAction}, commonEnd
      ],
      home: [
        {icon:'飯',name:'吃米特飯',desc:'大幅恢復氣血，這次先不要嫌外觀。',cost:'行動 -1',fn:homeMeal},
        {icon:'心',name:'陪家人說話',desc:'提升人情與信義，降低心火。',cost:'行動 -1',fn:familyTalk},
        {icon:'省',name:'復盤今日',desc:'提升心眼與自律，但會增加一點心火。',cost:'行動 -1',fn:reviewAction},
        {icon:'囊',name:'整理行囊',desc:'查看、使用與裝備現有物品。',cost:'不耗行動',fn:openInventory}, commonEnd
      ],
      cave: [
        {icon:'播',name:'水蛇洞開台',desc:'賺糖錢與俠名，心火與混沌也會上升。',cost:'行動 -1',fn:streamAction},
        {icon:'獵',name:'討伐洞妖',desc:'挑選水蛇洞妖物，高報酬也更凶險。',cost:'選擇後行動 -1',fn:openWildEncounter},
        {icon:'梗',name:'迷因鍊金',desc:'把一次事故煉成流量，結果難以預料。',cost:'行動 -1',fn:memeAlchemy},
        {icon:'帖',name:'承接任務',desc:'查看能推進故事的江湖委託。',cost:'依任務',fn:openMissions}, commonEnd
      ],
      villa: [
        {icon:'影',name:'薛喜陪練',desc:'身法修行必定額外 +1，心火稍高。',cost:'行動 -1',fn:()=>quickTrain('agility')},
        {icon:'獵',name:'山莊掃蕩',desc:'從盤踞山莊的怪物中選擇對手。',cost:'選擇後行動 -1',fn:openWildEncounter},
        {icon:'帳',name:'整理老蟹帳本',desc:'提升信義、人情與少量糖錢。',cost:'行動 -1',fn:ledgerAction},
        {icon:'帖',name:'承接任務',desc:'山莊任務能解鎖關鍵道具。',cost:'依任務',fn:openMissions}, commonEnd
      ],
      market: [
        {icon:'買',name:'進入商城',desc:'購買丹藥、兵器、護具與 Boss 關鍵物。',cost:'不耗行動',fn:openShop},
        {icon:'聞',name:'打聽奇聞',desc:'可能撿到便宜，也可能被當盤子。',cost:'行動 -1',fn:marketRumor},
        {icon:'獵',name:'市集緝怪',desc:'選擇一名市集惡徒，賺取較多糖錢。',cost:'選擇後行動 -1',fn:openWildEncounter},
        {icon:'囊',name:'整理行囊',desc:'使用消耗品或切換已購裝備。',cost:'不耗行動',fn:openInventory}, commonEnd
      ],
      cliff: [
        {icon:'王',name:'挑戰守關 Boss',desc:'先檢查特殊素質，再自行決定是否上山。',cost:'行動 -1',fn:openBossChallenge,boss:true},
        {icon:'悟',name:'斷腿崖悟道',desc:'大量經驗與隨機四維，失敗會受傷。',cost:'行動 -1',fn:cliffMeditate},
        {icon:'虎',name:'清理山路',desc:'從山路強敵中挑選對手，測試目前構築。',cost:'選擇後行動 -1',fn:openWildEncounter},
        {icon:'囊',name:'最後整備',desc:'使用行囊，確認飯盒與回氣丹。',cost:'不耗行動',fn:openInventory}, commonEnd
      ]
    };
    return sets[state.location];
  }

  function renderActions() {
    const actions = locationActions();
    $('actions-grid').innerHTML = '';
    actions.forEach((action,index) => {
      const node = $('action-template').content.firstElementChild.cloneNode(true);
      node.classList.toggle('boss', !!action.boss); node.classList.toggle('shop', action.name.includes('商城'));
      node.querySelector('.action-key').textContent = index + 1;
      node.querySelector('.action-icon').textContent = action.icon;
      node.querySelector('.action-copy b').textContent = action.name;
      node.querySelector('.action-copy small').textContent = action.desc;
      node.querySelector('.action-cost').textContent = action.cost;
      const costsAp = /行動 -1/.test(action.cost);
      node.disabled = busy || state.ended || (costsAp && state.ap <= 0);
      node.onclick = action.fn; $('actions-grid').appendChild(node);
    });
  }

  function renderLog() {
    $('log-list').innerHTML = state.log.slice(0,4).map(entry => `<article class="log-entry ${entry.type}"><time>第 ${entry.day} 日</time><div><b>${esc(entry.title)}</b><p>${esc(entry.text)}</p>${entry.delta?`<div class="delta-line">${esc(entry.delta)}</div>`:''}</div></article>`).join('');
  }

  function renderBossPreview() {
    const boss = currentBoss();
    if (state.defeatedBosses.includes('taishan')) {
      $('boss-progress').textContent = '5 / 5'; $('boss-preview').innerHTML = '<h3 class="boss-name">泰山已破</h3><p class="boss-tagline">結局不只一種。下一世仍能重新選擇。</p>'; return;
    }
    $('boss-progress').textContent = `${state.defeatedBosses.length} / 5`;
    $('boss-preview').innerHTML = `<h3 class="boss-name">${boss.icon} ${boss.name}</h3><p class="boss-tagline">${boss.title}</p><div class="req-list">${boss.requirements.map(req=>`<div class="req ${req.check(state)?'ok':''}"><span>${req.check(state)?'✓':'○'} ${req.label}</span><b>${req.value(state)}</b></div>`).join('')}</div>`;
  }

  function availableMissions() { return MISSIONS.filter(m => m.repeat || !state.completedMissions.includes(m.id)); }
  function renderQuestMini() {
    const list = availableMissions().filter(m => !m.repeat).slice(0,2);
    $('quest-mini').innerHTML = list.length
      ? list.map(m=>`<div class="mini-row ${m.can(state)?'':'locked'}"><i></i><span>${esc(m.name)}${m.can(state)?' · 可承接':' · '+esc(m.reason||'未達條件')}</span></div>`).join('')
      : '<div class="mini-row complete"><i></i><span>本世江湖帖已全數完成</span></div>';
  }
  function renderAchievementMini() {
    const latest = ACHIEVEMENTS.filter(a=>state.achievements.includes(a.id)).slice(-3).reverse();
    $('achievement-mini').innerHTML = latest.length ? latest.map(a=>`<div class="mini-row"><i></i><span>${a.icon} ${a.name}</span></div>`).join('') : '<div class="mini-row done"><i></i><span>第一個成就在等你</span></div>';
  }

  function openModal({ kicker='', title='', body='', actions=[], closable=true, afterOpen=null }) {
    modalClosable = closable;
    $('modal-kicker').textContent = kicker; $('modal-title').textContent = title; $('modal-body').innerHTML = body;
    $('modal-close').hidden = !closable; $('modal-actions').innerHTML = '';
    actions.forEach((action,index) => {
      const btn = document.createElement('button'); btn.className = `modal-action ${action.primary?'primary':''}`;
      btn.disabled = !!action.disabled; btn.innerHTML = `<b>${index+1}. ${esc(action.label)}</b>${action.sub?`<small>${esc(action.sub)}</small>`:''}`;
      btn.onclick = action.onClick; $('modal-actions').appendChild(btn);
    });
    $('modal').hidden = false;
    if (afterOpen) afterOpen();
  }
  function closeModal() { if (!modalClosable) return; $('modal').hidden = true; currentBattle = null; }
  function forceCloseModal() { $('modal').hidden = true; currentBattle = null; modalClosable = true; }

  function openTraining() {
    const locNote = state.location === 'outer' ? '外院修行會多得 20% 經驗。' : state.location === 'villa' ? '山莊修身法會額外 +1。' : '不同場域會改變修行風險。';
    openModal({ kicker:'自主修行', title:'今天磨哪一把刀？', body:`<p>${locNote}每次修行消耗 1 行動；升級後可再自由配點。</p><div class="choice-grid">${Object.entries(STAT_NAMES).map(([key,name])=>`<button class="choice-card" data-train="${key}"><b>${STAT_ICONS[key]}・${name}</b><span>${stat(state,key)}</span><small>${STAT_EFFECTS[key]}</small></button>`).join('')}</div>`, afterOpen:()=>{
      document.querySelectorAll('[data-train]').forEach(btn => btn.onclick = () => { forceCloseModal(); quickTrain(btn.dataset.train); });
    }});
  }

  function quickTrain(key) {
    if (state.ap <= 0) return toast('今日行動已用完');
    runAction(() => {
      let gain = Math.random() < .22 ? 2 : 1;
      if (state.location === 'villa' && key === 'agility') gain++;
      state.stats[key] += gain; state.metrics.training++;
      const baseXp = state.location === 'outer' ? 24 : state.location === 'cliff' ? 28 : 20;
      const gainedXp = gainXp(state, baseXp); state.stress = clamp(state.stress + (state.location==='cliff'?7:4),0,100);
      if (key === 'vitality') state.hp = Math.min(maxHp(state), state.hp + 8);
      if (key === 'insight') state.qi = Math.min(maxQi(state), state.qi + 7);
      addLog('good',`${STAT_NAMES[key]}修行完成`,`你在${LOCATIONS[state.location].name}磨完一輪基本功。`,`${STAT_NAMES[key]} +${gain} · 經驗 +${gainedXp}`);
      pushChat('', gain > 1 ? '爆擊成長！這把有料' : pick(CHAT_LINES));
    });
  }

  function restAction() {
    runAction(() => {
      const heal = 18 + stat(state,'vitality'); state.hp = Math.min(maxHp(state),state.hp+heal); state.qi=maxQi(state); state.stress=clamp(state.stress-8,0,100);
      addLog('good','外院調息','你沒有把休息誤認成怠惰。這也是修行的一部分。',`氣血 +${heal} · 真氣回滿 · 心火 -8`);
    });
  }
  function homeMeal() {
    runAction(() => {
      const heal = 42; state.hp=Math.min(maxHp(state),state.hp+heal); state.stress=clamp(state.stress-12,0,100); state.routes.ties++;
      addLog('good','米特姨今天有煮','你本來想評論擺盤，看到對方眼神後決定先吃。',`氣血 +${heal} · 人情 +1 · 心火 -12`); pushChat('','先吃飯啦！');
    });
  }
  function familyTalk() {
    runAction(()=>{state.routes.ties+=2;state.routes.integrity++;state.stress=clamp(state.stress-15,0,100);gainXp(state,14);addLog('good','家仍是存檔點','沒有斗內、沒有演算法，只有一句「最近還好嗎」。','人情 +2 · 信義 +1 · 心火 -15');});
  }
  function reviewAction() {
    runAction(()=>{state.stats.insight++;state.routes.discipline+=2;state.stress=clamp(state.stress+3,0,100);gainXp(state,20);addLog('gold','關台復盤','這次先確認黃光，也確認自己到底答應過什麼。','心眼 +1 · 自律 +2 · 經驗 +20');});
  }
  function streamAction() {
    runAction(()=>{
      const bonus = 1 + gearBonus(state,'stream'); const coins=Math.round(42*1.35*bonus+roll(0,25));
      state.coins+=coins;state.fame+=roll(2,5);state.routes.show+=2;state.metrics.streams++;
      const extraStress=state.equipped.charm==='mic'?2:0;state.stress=clamp(state.stress+9+extraStress,0,100);
      if(Math.random()<.3){state.routes.chaos+=2;addLog('bad','聊天室突然暴走','一個無害話題被剪成跨台戰爭，但觀看人數確實變多。',`糖錢 +${coins} · 混沌 +2 · 心火 +${9+extraStress}`);}
      else addLog('good','水蛇洞準時開台','你真的在公告時間出現，聊天室一度不知道該刷什麼。',`糖錢 +${coins} · 俠名上升 · 節目 +2`);
      pushChat('hype',pick(['這台居然準時？','大台！大台！','免費仔說話！','斗內了，做效果']));
    });
  }
  function memeAlchemy() {
    runAction(()=>{
      const event=pick([
        {good:true,title:'斷腿杰再起',text:'你把一次失敗剪成精華，觀眾笑完還願意留下。',delta:'俠名 +7 · 節目 +3',fn:()=>{state.fame+=7;state.routes.show+=3;}},
        {good:false,title:'承諾債爆倉',text:'聊天室翻出三年前的「明天一定」，信義當場被追繳。',delta:'信義 -2 · 混沌 +4',fn:()=>{state.routes.integrity=Math.max(0,state.routes.integrity-2);state.routes.chaos+=4;}},
        {good:true,title:'水蛇洞名場面',text:'沒有人知道為什麼好笑，但剪輯已經破萬。',delta:'糖錢 +70 · 俠名 +5',fn:()=>{state.coins+=70;state.fame+=5;}},
        {good:false,title:'紅溫反噬',text:'效果做過頭，氣血和心火一起出事。',delta:'氣血 -22 · 心火 +14',fn:()=>{state.hp-=22;state.stress=clamp(state.stress+14,0,100);}}
      ]);event.fn();gainXp(state,18);addLog(event.good?'good':'bad',event.title,event.text,event.delta);pushChat(event.good?'hype':'',event.good?'這就是我要看的':'大中計');
    });
  }
  function ledgerAction() {
    runAction(()=>{const c=roll(18,38);state.coins+=c;state.routes.integrity+=2;state.routes.ties++;gainXp(state,16);addLog('gold','老蟹的三千萬','你終於把團隊總投入、個人薪資與聊天室玩笑分成三欄。',`糖錢 +${c} · 信義 +2 · 人情 +1`);});
  }
  function marketRumor() {
    runAction(()=>{
      if(Math.random()<.55){const c=roll(45,95);state.coins+=c;state.stats.insight++;addLog('good','撿到商路情報','消息是真的，還順手抓到一個假工商。',`糖錢 +${c} · 心眼 +1`);}
      else{const c=Math.min(state.coins,roll(20,55));state.coins-=c;state.routes.chaos+=2;addLog('bad','被當成盤子','商人保證這是泰山限定，轉身就看到隔壁半價。',`糖錢 -${c} · 混沌 +2`);}
    });
  }
  function cliffMeditate() {
    runAction(()=>{
      if(Math.random()<.68){const key=pick(Object.keys(STAT_NAMES));state.stats[key]++;const xp=gainXp(state,38);state.routes.discipline++;addLog('good','斷腿崖悟道','山風很冷，但你真的想通了一招。',`${STAT_NAMES[key]} +1 · 經驗 +${xp}`);}
      else{const dmg=roll(16,30);state.hp-=dmg;gainXp(state,18);addLog('bad','悟到一半滑倒','這裡叫斷腿崖不是沒有理由。',`氣血 -${dmg} · 經驗 +18`);}
    });
  }

  function runAction(callback) {
    if (busy || state.ended) return;
    if (state.ap <= 0) return toast('今天已經沒有行動力，收功入夜吧');
    busy = true; state.ap--; state.metrics.actions++; render();
    $('cooldown').hidden = false; const bar=$('cooldown').querySelector('i'); bar.style.animation='none'; void bar.offsetWidth; bar.style.animation='';
    setTimeout(()=>{
      callback(); busy=false; $('cooldown').hidden=true;
      checkAchievements(); save(); render();
      if(state.hp<=0) showDeath('你在修行途中倒下，糖門只來得及把遺物寄回北投。');
      else if(state.stress>=100) showDeath('心火攻心。畫面還在直播，人已經先離線。');
      else if(state.ap<=0) pushChat('system','系統：今日行動耗盡，可以收功入夜。');
    }, 850);
  }

  function endDay() {
    if (busy || state.ended) return;
    state.day++; state.ap=maxAp(state);state.qi=maxQi(state);state.hp=Math.min(maxHp(state),state.hp+Math.floor(maxHp(state)*.12));state.stress=clamp(state.stress-10,0,100);
    const events=[
      {title:'米特姨送飯',text:'門口多了一個飯盒。家人不懂江湖，但知道你會餓。',delta:'飯盒 +1 · 人情 +1',fn:()=>{addItem(state,'rice');state.routes.ties++;}},
      {title:'明天一定的代價',text:'你又想發一張宏大的行程表，最後忍住只寫明天幾點開。',delta:'自律 +1 · 信義 +1',fn:()=>{state.routes.discipline++;state.routes.integrity++;}},
      {title:'普通的一晚',text:'沒有炎上、沒有神抽、沒有警察。普通得像一種稀有事件。',delta:'氣血與真氣恢復',fn:()=>{}},
      {title:'高金生路過',text:'一個用你頭貼的人在門外說自己才是本尊。你決定明天再處理。',delta:'俠名 +2 · 混沌 +1',fn:()=>{state.fame+=2;state.routes.chaos++;}}
    ];
    const e=pick(events);e.fn();addLog('gold',e.title,e.text,e.delta);checkAchievements();save();render();pushChat('system',`系統：第 ${state.day} 日開始，行動力已恢復。`);
  }

  function openMissions() {
    const list=availableMissions(), story=list.filter(m=>!m.repeat), daily=list.filter(m=>m.repeat);
    const missionCards = missions => missions.map(m=>`<article class="shop-item"><div class="item-icon">${m.repeat?'日':'帖'}</div><div><h4>${esc(m.name)}${m.repeat?' · 可重複':''}</h4><p>${esc(m.description)}<br>報酬：${esc(m.reward)}</p><button class="buy-button" data-mission="${m.id}" ${m.can(state)&&state.ap>0?'':'disabled'}>${m.can(state)?(state.ap>0?'接下任務':'今日無行動'):(m.reason||'條件不足')}</button></div></article>`).join('');
    openModal({kicker:'糖門江湖帖',title:'今天替誰收拾問題？',body:`<div class="mission-note">右側只追蹤一次性江湖帖；日常委託完成後仍可再次承接，不是卡住。</div><h3 class="mission-group-title">江湖帖・完成後自追蹤移除</h3><div class="item-grid">${story.length?missionCards(story):'<p class="empty-state">本世江湖帖已全數完成。</p>'}</div><h3 class="mission-group-title">日常委託・可重複、不列入追蹤</h3><div class="item-grid">${missionCards(daily)}</div>`,afterOpen:()=>{
      document.querySelectorAll('[data-mission]').forEach(btn=>btn.onclick=()=>{const m=MISSIONS.find(x=>x.id===btn.dataset.mission);forceCloseModal();runAction(()=>{m.run(state);state.metrics.missions++;if(!m.repeat&&!state.completedMissions.includes(m.id))state.completedMissions.push(m.id);addLog('good',`${m.repeat?'完成日常':'完成委託'}・${m.name}`,m.description,m.reward);if(m.repeat)toast('日常委託完成；可再次承接，不列入右側追蹤');pushChat('','工具人有料');});});
    }});
  }

  function openShop() {
    const sell=['rice','pill','mirror','clock','boneblade','ankleguard','mic'];
    openModal({kicker:'叉叉商城',title:'糖錢要花在刀口上',body:`<p>裝備購買後會自動穿上，同部位可以在行囊切換。商城不消耗行動。</p><div class="item-grid">${sell.map(id=>{const item=ITEMS[id],owned=item.kind==='consumable'?false:state.owned.includes(id);return `<article class="shop-item"><div class="item-icon">${item.icon}</div><div><h4>${item.name}</h4><p>${item.description}</p><button class="buy-button" data-buy="${id}" ${owned||state.coins<item.price?'disabled':''}>${owned?'已持有':`${item.price} 糖錢`}</button></div></article>`;}).join('')}</div>`,afterOpen:()=>{
      document.querySelectorAll('[data-buy]').forEach(btn=>btn.onclick=()=>buyItem(btn.dataset.buy));
    }});
  }
  function buyItem(id) {
    const item=ITEMS[id];if(!item||state.coins<item.price)return;
    state.coins-=item.price;addItem(state,id);state.metrics.purchases++;addLog('gold',`購得・${item.name}`,item.description,`糖錢 -${item.price}`);checkAchievements();save();render();pushChat('',id==='mirror'?'終於知道要看黃光了':'課金變強，合理');forceCloseModal();openShop();
  }

  function openInventory() {
    const consumables=Object.entries(state.inventory).filter(([,count])=>count>0);
    const gear=state.owned.filter(id=>['weapon','armor','charm'].includes(ITEMS[id]?.kind));
    const keys=state.owned.filter(id=>['key','relic'].includes(ITEMS[id]?.kind));
    openModal({kicker:'角色行囊',title:'這一世帶了什麼？',body:`<h4>消耗品</h4><div class="item-grid">${consumables.length?consumables.map(([id,count])=>itemInventoryHtml(id,count,true)).join(''):'<p>行囊空空如也。</p>'}</div><h4>裝備</h4><div class="item-grid">${gear.length?gear.map(id=>itemInventoryHtml(id,1,false)).join(''):'<p>尚未購買裝備。</p>'}</div><h4>關鍵物與心印</h4><div class="item-grid">${keys.length?keys.map(id=>itemInventoryHtml(id,1,false,true)).join(''):'<p>尚未取得。</p>'}</div>`,afterOpen:()=>{
      document.querySelectorAll('[data-use]').forEach(btn=>btn.onclick=()=>useInventoryItem(btn.dataset.use));
      document.querySelectorAll('[data-equip]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.equip;state.equipped[ITEMS[id].kind]=id;save();render();forceCloseModal();openInventory();});
    }});
  }
  function itemInventoryHtml(id,count,usable,keyOnly=false){const item=ITEMS[id];const equipped=state.equipped[item.kind]===id;return `<article class="shop-item"><div class="item-icon">${item.icon}</div><div><h4>${item.name}${count>1?` ×${count}`:''}</h4><p>${item.description}</p>${usable?`<button class="buy-button" data-use="${id}">使用</button>`:(!keyOnly&&['weapon','armor','charm'].includes(item.kind)?`<button class="buy-button" data-equip="${id}" ${equipped?'disabled':''}>${equipped?'裝備中':'裝備'}</button>`:'')}</div></article>`;}
  function useInventoryItem(id){if(id==='rice'&&consumeItem(state,id)){state.hp=Math.min(maxHp(state),state.hp+38);addLog('good','吃下米特飯盒','先吃再嫌，氣血總算回來了。','氣血 +38');}if(id==='pill'&&consumeItem(state,id)){state.qi=Math.min(maxQi(state),state.qi+24);addLog('good','服下回氣丹','甜得不太像藥，但確實有用。','真氣 +24');}save();render();forceCloseModal();openInventory();}

  function openAllocate() {
    openModal({kicker:'升級配點',title:`尚有 ${state.points} 點`,body:`<div class="allocation-guide"><b>怎麼選？</b><p>力道打得痛、身法拚暴擊、根骨撐生存、心眼管真氣與看破。每次升級獲得 2 點；Boss 的特殊素質是硬門檻。</p></div><div class="choice-grid">${Object.entries(STAT_NAMES).map(([key,name])=>`<button class="choice-card stat-choice" data-point="${key}" ${state.points?'':'disabled'}><b>${STAT_ICONS[key]}・${name}</b><span>${stat(state,key)} → ${stat(state,key)+1}</span><small>${STAT_EFFECTS[key]}</small><em>${statPreview(state,key)}</em></button>`).join('')}</div>`,afterOpen:()=>{document.querySelectorAll('[data-point]').forEach(btn=>btn.onclick=()=>{if(!state.points)return;const key=btn.dataset.point,beforeHp=maxHp(state),beforeQi=maxQi(state);state.points--;state.stats[key]++;if(key==='vitality')state.hp=Math.min(maxHp(state),state.hp+maxHp(state)-beforeHp);if(key==='insight')state.qi=Math.min(maxQi(state),state.qi+maxQi(state)-beforeQi);save();render();forceCloseModal();openAllocate();});}});
  }

  function openAchievements() {
    openModal({kicker:'跨世圖鑑',title:`成就 ${state.achievements.length} / ${ACHIEVEMENTS.length}`,body:`<div class="achievement-grid">${ACHIEVEMENTS.map(a=>{const unlocked=state.achievements.includes(a.id);return `<article class="achievement-item ${unlocked?'unlocked':''}"><i>${unlocked?a.icon:'？'}</i><div><b>${unlocked?a.name:'尚未解鎖'}</b><small>${a.description}</small></div></article>`;}).join('')}</div>`});
  }

  function openStoryInfo() {
    const ch=chapter(),boss=currentBoss();
    openModal({kicker:`${ch.number}・江湖帖`,title:ch.title,body:`<div class="story-box"><h4>本回故事</h4><p>${ch.summary}</p><p>登場：${ch.cast.join('、')}</p></div><div class="requirements-box"><h4>通關方向</h4><p>${ch.goal}</p></div><div class="requirements-box"><h4>守關者・${boss.name}</h4><ul>${boss.requirements.map(r=>`<li class="${r.check(state)?'ok':''}"><span>${r.check(state)?'✓':'○'} ${r.label}</span><b>${r.value(state)}</b></li>`).join('')}</ul></div><p>你可以繼續修行、打怪、解任務或購物；準備好再去斷腿崖挑戰，不會被劇情強迫推進。</p>`});
  }

  function openBossChallenge() {
    const boss=currentBoss(),ready=bossReady(boss);
    openModal({kicker:`守關試煉・${chapter().number}`,title:`${boss.icon} ${boss.name}`,body:`<p>${boss.title}</p><div class="requirements-box"><h4>特殊素質門檻</h4><ul>${boss.requirements.map(r=>`<li class="${r.check(state)?'ok':''}"><span>${r.check(state)?'✓':'○'} ${r.label}</span><b>${r.value(state)}</b></li>`).join('')}</ul></div><p>特殊機制：${boss.mechanic}</p>${ready?'<p class="warning">Boss 戰會消耗 1 行動。戰敗死亡只能帶著跨世成就與一項根骨轉生。</p>':'<p class="warning">條件未滿時無法靠運氣硬闖。這是門檻，不是成功率。</p>'}`,actions:[{label:ready?'踢館・開始 Boss 戰':'條件不足',sub:ready?'我已看過招式與行囊':'先去修行、接任務或商城整備',primary:ready,disabled:!ready||state.ap<=0,onClick:()=>{forceCloseModal();startEncounter(true);}},{label:'再準備一下',sub:'保留進度，自己決定何時挑戰',onClick:forceCloseModal}]});
  }

  function scaledMonster(monster) {
    const foe = { ...monster }, scale = 1 + state.bossIndex * .08;
    foe.hp = Math.round(foe.hp * scale); foe.attack = Math.round(foe.attack * scale);
    return foe;
  }

  function openWildEncounter() {
    if (busy || state.ap <= 0 || state.ended) return toast(state.ap <= 0 ? '今日行動已用完' : '現在無法戰鬥');
    const pool = ENEMIES[state.location] || ENEMIES.outer;
    const candidates = [...pool].sort(() => Math.random() - .5).slice(0, Math.min(3, pool.length));
    openModal({
      kicker:`${LOCATIONS[state.location].name}・野怪名冊`,
      title:'這一場要打誰？',
      body:`<p>每個場域有五種野怪與不同出招傾向。選定後才消耗 1 行動；不滿意可以免費換一批。</p>`,
      actions:[
        ...candidates.map(monster => {
          const preview = scaledMonster(monster);
          return { label:`${monster.icon} ${monster.name}`, sub:`${MONSTER_STYLE_NAMES[monster.style]}・氣血 ${preview.hp}・攻勢 ${preview.attack}｜${monster.flavor}`, onClick:()=>{forceCloseModal();startEncounter(false,monster);} };
        }),
        { label:'換一批野怪', sub:'不消耗行動，重新抽出三名對手', onClick:()=>{forceCloseModal();openWildEncounter();} }
      ]
    });
  }

  function startEncounter(isBoss, chosenFoe = null) {
    if(busy||state.ap<=0||state.ended)return toast(state.ap<=0?'今日行動已用完':'現在無法戰鬥');
    if(isBoss&&!bossReady())return openBossChallenge();
    state.ap--;state.metrics.actions++;save();render();
    let foe;
    if(isBoss){const b=currentBoss();foe={...b,boss:true,coinReward:100+b.hp,xp:90+b.hp/3};}
    else{const pool=ENEMIES[state.location]||ENEMIES.outer;foe=scaledMonster(chosenFoe||pick(pool));}
    const openingLog=[`${foe.name} 擋住去路。先看招，再出手。`, ...(foe.flavor?[foe.flavor]:[])];
    if(foe.id==='taishan')openingLog.push(`${state.vows.length} 枚心印化為加護：造成傷害提升，信義與人情減少所受傷害。`);
    currentBattle={foe,foeHp:foe.hp,turn:1,intent:nextIntent(foe,1),foeGuard:false,playerGuard:false,damageTaken:0,log:openingLog,busy:false};
    renderBattle();
  }

  function nextIntent(foe,turn) {
    let pool=['attack','attack','heavy','guard','trick'];
    if(foe.style==='swift')pool=['attack','attack','attack','trick','guard'];
    if(foe.style==='trick')pool=['trick','trick','attack','guard','heavy'];
    if(foe.style==='guard')pool=['guard','guard','attack','heavy','trick'];
    if(foe.style==='brute')pool=['heavy','heavy','attack','attack','guard'];
    if(foe.id==='green')pool=['trick','trick','attack','guard','heavy'];
    if(foe.id==='crows')pool=['heavy','heavy','attack','guard','trick'];
    if(foe.id==='copies')pool=['trick','attack','trick','heavy','guard'];
    if(foe.id==='taishan')pool=turn%3===0?['heavy','trick']:pool;
    return pick(pool);
  }

  function intentHint() {
    const info=INTENTS[currentBattle.intent];
    if(stat(state,'insight')>=10||currentBattle.intent!=='trick')return info.hint;
    return '對方的動作真假難辨。心眼 10 可看清完整提示。';
  }

  function renderBattle() {
    const b=currentBattle,foe=b.foe;
    modalClosable=false;$('modal-kicker').textContent=foe.boss?'守關 Boss 戰':'江湖遭遇';$('modal-title').textContent=foe.name;$('modal-close').hidden=true;
    $('modal-body').innerHTML=`<div class="battle"><div class="battle-foes"><div class="fighter player"><div class="avatar">瘸</div><b>${esc(state.name)}</b><div class="battle-hp"><i style="width:${state.hp/maxHp(state)*100}%"></i></div><small>氣血 ${state.hp}/${maxHp(state)} · 真氣 ${state.qi}/${maxQi(state)}</small></div><div class="versus">對</div><div class="fighter"><div class="avatar">${foe.icon}</div><b>${foe.name}</b><div class="battle-hp"><i style="width:${b.foeHp/foe.hp*100}%"></i></div><small>氣血 ${Math.max(0,b.foeHp)}/${foe.hp}</small></div></div><div class="intent-box"><i>${INTENTS[b.intent].icon}</i><div><b>敵方意圖：${INTENTS[b.intent].name}</b><small>${intentHint()}</small></div></div>${state.live?'<div class="poll-hint">實況提示：請觀眾刷 1–5，實況主用數字鍵執行聊天室的選擇。</div>':''}<div class="battle-log">${b.log.slice(-5).map(x=>`<div>${esc(x)}</div>`).join('')}</div><div class="battle-actions"><button class="battle-button" data-battle="attack"><b>1. 普通攻擊</b><small>穩定傷害；敏捷提供暴擊</small></button><button class="battle-button" data-battle="guard"><b>2. 防禦</b><small>重擊剋星；成功會反制</small></button><button class="battle-button" data-battle="skill" ${state.qi<10?'disabled':''}><b>3. 糖門滑劍</b><small>真氣 10；破防、高傷害</small></button><button class="battle-button" data-battle="focus"><b>4. 看破</b><small>破解詭計；回復 7 真氣</small></button><button class="battle-button" data-battle="rice" ${(state.inventory.rice||0)<1?'disabled':''}><b>5. 米特飯盒</b><small>剩 ${state.inventory.rice||0}；恢復 38 氣血</small></button><button class="battle-button" data-battle="flee" ${foe.boss?'disabled':''}><b>6. 戰略撤退</b><small>保命；行動不退還</small></button></div></div>`;
    document.querySelector('.fighter.player .avatar').innerHTML=`<img class="battle-avatar" src="roger.png" alt="${esc(state.name)}">`;
    $('modal-actions').innerHTML='';$('modal').hidden=false;
    document.querySelectorAll('[data-battle]').forEach(btn=>btn.onclick=()=>battleTurn(btn.dataset.battle));
  }

  function battleTurn(action) {
    const b=currentBattle;if(!b||b.busy)return;b.busy=true;
    if(action==='flee'){addLog('bad','戰略撤退',`你從${b.foe.name}面前退回安全處。`,'行動不退還');forceCloseModal();save();render();pushChat('','跑了跑了');return;}
    let damage=0,skipEnemy=false;
    if(action==='attack'){
      damage=attackPower()+roll(-3,5);if(Math.random()<stat(state,'agility')*.012){damage=Math.round(damage*1.7);b.log.push('身法觸發暴擊！');}
      if(b.foeGuard){damage=Math.ceil(damage*.45);b.foeGuard=false;b.log.push('對手的架勢擋掉大半攻勢。');}
    }
    if(action==='skill'){
      state.qi-=10;damage=Math.round(attackPower()*1.55+stat(state,'agility')*.7+roll(0,7));b.foeGuard=false;b.log.push('糖門滑劍破開架勢！');
    }
    if(action==='guard'){b.playerGuard=true;b.log.push('你穩住下盤，等待對方出招。');}
    if(action==='focus'){
      state.qi=Math.min(maxQi(state),state.qi+7);
      if(b.intent==='trick'){damage=Math.round(stat(state,'insight')*1.4+8);skipEnemy=true;b.log.push('你看破假動作，反手命中真身！');}
      else b.log.push('你調整呼吸，真氣回復 7。');
    }
    if(action==='rice'&&consumeItem(state,'rice')){state.hp=Math.min(maxHp(state),state.hp+38);b.log.push('米特飯盒恢復 38 氣血。');}
    if(state.buff?.id==='rage'&&damage>0){damage=Math.round(damage*1.3);state.stress=clamp(state.stress+5,0,100);useBuff(state);b.log.push('紅溫聖旨讓傷害暴增！');}
    if(b.foe.id==='taishan'&&damage>0)damage=Math.round(damage*(1+state.vows.length*.06));
    if(damage>0){b.foeHp=Math.max(0,b.foeHp-damage);b.log.push(`你造成 ${damage} 點傷害。`);}
    if(b.foeHp<=0){battleWin();return;}
    if(!skipEnemy) enemyTurn(action);
    if(!currentBattle)return;
    if(state.hp<=0){save();render();setTimeout(()=>showDeath(`你敗給了「${b.foe.name}」。江湖沒有讀檔鍵，只有下一世。`),250);return;}
    b.turn++;b.intent=nextIntent(b.foe,b.turn);b.busy=false;save();render();renderBattle();
  }

  function enemyTurn(playerAction) {
    const b=currentBattle,intent=b.intent,base=b.foe.attack+roll(-2,4);let dmg=0;
    if(intent==='attack')dmg=base;
    if(intent==='heavy')dmg=Math.round(base*1.75);
    if(intent==='guard'){b.foeGuard=true;b.log.push(`${b.foe.name} 架起防守。`);return;}
    if(intent==='trick'){
      dmg=Math.round(base*.65);state.qi=Math.max(0,state.qi-8);state.stress=clamp(state.stress+(b.foe.id==='copies'?15:8),0,100);b.log.push('詭計命中：真氣流失，心火上升。');
    }
    if(b.playerGuard){const rate=intent==='heavy'?.22:.48;dmg=Math.round(dmg*rate);if(intent==='heavy'){b.foeHp=Math.max(0,b.foeHp-Math.round(defensePower()*.8));b.log.push('完美防住重擊，對手失去平衡！');}b.playerGuard=false;}
    dmg=Math.max(1,dmg-defensePower());
    if(b.foe.id==='taishan')dmg=Math.max(1,Math.round(dmg*(1-Math.min(.3,state.routes.integrity*.008+state.routes.ties*.004))));
    state.hp=Math.max(0,state.hp-dmg);b.damageTaken+=dmg;b.log.push(`${b.foe.name} 造成 ${dmg} 點傷害。`);
    if(b.foeHp<=0){battleWin();}
  }

  function showBattleResult({ foe, xp, coins, levelBefore, newAchievements = [], boss = false, next }) {
    currentBattle = null;
    const leveled = state.level > levelBefore;
    openModal({
      kicker:boss ? '守關突破・戰鬥結算' : '野怪討伐・戰鬥結算',
      title:boss ? `擊破 ${foe.name}` : '戰鬥勝利！',
      body:`<div class="battle-result"><div class="result-seal">勝</div><h3>${foe.icon} ${esc(foe.name)} 已被擊敗</h3><p>${boss?'你跨過了這一回的硬門檻，故事將因這場勝利繼續。':'你看招、出招，活著把戰利品帶回糖門。'}</p><div class="result-rewards"><div><span>糖錢</span><b>+${coins}</b></div><div><span>經驗</span><b>+${xp}</b></div><div><span>剩餘氣血</span><b>${state.hp}/${maxHp(state)}</b></div></div>${leveled?`<div class="result-notice">升級至 LV.${state.level}・目前可用配點 ${state.points}</div>`:''}${newAchievements.length?`<div class="result-notice achievement-pop">新成就：${newAchievements.map(esc).join('、')}</div>`:''}</div>`,
      closable:false,
      actions:[{ label:boss?'繼續本回劇情':'收下戰利品', sub:boss?'查看 Boss 戰後故事選擇':'返回場域，決定下一個行動', primary:true, onClick:()=>{forceCloseModal();next?.();} }]
    });
  }

  function battleWin() {
    const b=currentBattle,foe=b.foe;
    if(!foe.boss){
      const levelBefore=state.level, achievementBefore=[...state.achievements];
      state.metrics.wins++;if(state.hp<=10)state.metrics.oneHpWins++;
      const xp=gainXp(state,Math.round(foe.xp));state.coins+=foe.reward;state.fame+=1;
      addLog('good',`擊敗・${foe.name}`,'你不是靠按下一頁贏的，是看招、出招和活著離開。',`糖錢 +${foe.reward} · 經驗 +${xp}`);
      checkAchievements();const newAchievements=state.achievements.filter(id=>!achievementBefore.includes(id)).map(id=>ACHIEVEMENTS.find(a=>a.id===id)?.name).filter(Boolean);
      save();render();pushChat('hype',state.hp<=10?'一滴血！這能贏？':'打得好！');
      showBattleResult({foe,xp,coins:foe.reward,levelBefore,newAchievements});return;
    }
    const levelBefore=state.level, achievementBefore=[...state.achievements];
    if(b.damageTaken===0)state.metrics.noHitBoss++;
    state.coins+=foe.coinReward;const xp=gainXp(state,Math.round(foe.xp));state.hp=Math.min(maxHp(state),state.hp+Math.floor(maxHp(state)*.28));state.qi=maxQi(state);
    if(!state.defeatedBosses.includes(foe.id))state.defeatedBosses.push(foe.id);
    if(foe.id==='taishan')state.pendingFinal=true;else state.pendingStory=foe.id;
    if(foe.id==='sleep')addItem(state,'clock');
    if(foe.id==='green'){addItem(state,'yellowseal');addVow(state,'黃光心印');}
    if(foe.id==='crows'){addItem(state,'bondseal');addVow(state,'同門心印');}
    if(foe.id==='copies'){addItem(state,'trueseal');addVow(state,'本真心印');}
    addLog('gold',`守關突破・${foe.name}`,`特殊素質不是裝飾。你準備好，才有資格把這一關打過去。`,`糖錢 +${foe.coinReward} · ${foe.reward}`);
    checkAchievements();const newAchievements=state.achievements.filter(id=>!achievementBefore.includes(id)).map(id=>ACHIEVEMENTS.find(a=>a.id===id)?.name).filter(Boolean);
    save();render();pushChat('hype','過了過了過了！');
    showBattleResult({foe,xp,coins:foe.coinReward,levelBefore,newAchievements,boss:true,next:()=>foe.id==='taishan'?openFinalChoice():openBossStory(foe.id)});
  }

  function openBossStory(id) {
    const scene=BOSS_CHOICES[id];
    openModal({kicker:scene.kicker,title:scene.title,body:`<p>${scene.text}</p><p class="warning">這個選擇會刻進泰山最後一戰與結局，不可在本世重選。</p>`,closable:false,actions:scene.choices.map(choice=>({label:choice.label,sub:choice.sub,onClick:()=>{
      choice.apply(state);state.choices.push({boss:id,choice:choice.label});state.pendingStory=null;state.bossIndex++;state.location='outer';state.ap=maxAp(state);state.day++;state.hp=maxHp(state);state.qi=maxQi(state);state.stress=Math.max(0,state.stress-18);
      addLog('gold',`故事選擇・${choice.label}`,scene.title,choice.sub);checkAchievements();save();forceCloseModal();render();pushChat('system',`系統：${chapter().number}「${chapter().title}」已開啟。`);
    }}))});
  }

  function openFinalChoice() {
    openModal({kicker:'泰山之巔・最後選擇',title:'你想成為哪一個羅正男？',body:'<p>泰山倒下後，山頂沒有獎盃，只有一台還亮著的直播機。過去的每個選擇都已經算進結果，但最後要按哪一個鍵，仍然由你決定。</p>',closable:false,actions:[
      {label:'關掉聊天室，重新定義自己',sub:'偏向人情、信義與平衡結局',onClick:()=>finishGame('self')},
      {label:'接掌糖門，把混亂變成制度',sub:'偏向節目、信義與經營結局',onClick:()=>finishGame('brand')},
      {label:'回到牌桌，只用勝負說話',sub:'偏向自律、心眼與競技結局',onClick:()=>finishGame('cards')},
      {label:'什麼都不改，繼續開台',sub:'偏向節目、混沌與迷因結局',onClick:()=>finishGame('live')}
    ]});
  }

  function finishGame(finalChoice) {
    state.finalChoice=finalChoice;state.ended=true;state.pendingFinal=false;state.bossIndex=4;
    const e=calculateEnding(finalChoice),collection=endingCollection();if(!collection.includes(e.id)){collection.push(e.id);localStorage.setItem(COLLECTION_KEY,JSON.stringify(collection));}
    addLog('gold',`結局・${e.title}`,e.text,`評價 ${e.rank}`);checkAchievements();save();render();
    const topRoutes=Object.entries(state.routes).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${ROUTE_NAMES[k]} ${v}`).join('、');
    openModal({kicker:`生涯結算・已收集 ${collection.length} 種結局`,title:e.title,closable:false,body:`<div class="ending-rank">${e.rank}</div><p class="ending-summary">${e.text}</p><div class="ending-stats"><div><span>等級</span><b>LV.${state.level}</b></div><div><span>轉生</span><b>${state.reincarnations} 次</b></div><div><span>俠名</span><b>${state.fame}</b></div><div><span>野怪</span><b>${state.metrics.wins}</b></div><div><span>成就</span><b>${state.achievements.length}</b></div><div><span>最高道路</span><b>${topRoutes}</b></div></div>`,actions:[{label:'複製結算摘要',sub:'貼到實況聊天室或社群',primary:true,onClick:()=>copySummary(e)},{label:'帶著記憶開啟下一世',sub:'保留成就與一項永久四維',onClick:()=>showRebirth(true)}]});
  }

  function calculateEnding(finalChoice) {
    const r=state.routes,balanced=Math.max(...Object.values(r))-Math.min(...Object.values(r))<=8;
    if(state.vows.length>=4&&balanced)return{id:'whole',rank:'SS',title:'瘸俠不是一個人',text:'你沒有把任何一段人生剪掉。冠軍、朋友、家、失敗與聊天室都被留在同一個人身上。泰山承認的不是最強數值，而是一個完整的人。'};
    if(finalChoice==='cards'&&r.discipline+r.integrity>=24&&stat(state,'insight')>=18)return{id:'winter',rank:'S',title:'冬季之王・再臨',text:'你關掉多餘分頁，重新坐回牌桌。這次每一道黃光都看得清楚，世界冠軍不再只是「如果當時」。'};
    if(finalChoice==='brand'&&r.show+r.integrity>=25)return{id:'empire',rank:'S',title:'糖門娛樂帝國',text:'你把迷因變成制度，也終於理解老蟹為什麼每天看帳本嘆氣。新收的天才弟子今天又睡到下午。'};
    if(finalChoice==='self'&&r.ties+r.integrity>=23)return{id:'home',rank:'S',title:'家仍是存檔點',text:'你建立真正能保護家人的直播空間。這是最安靜、最不像精華，卻最不需要重生的結局。'};
    if(finalChoice==='live'&&r.chaos+r.show>=24)return{id:'algorithm',rank:'S?',title:'完全羅正男',text:'本尊、分身與聊天室再也分不開。網路上每一個「真假」都可能是你，也可能不是。你看著鏡頭說：確實，有料。'};
    if(r.discipline===Math.max(...Object.values(r)))return{id:'master',rank:'A+',title:'糖門新掌門',text:'你沒有變成最完美的實況主，卻成為第一個真的照表開門的糖門掌門。門規第一條：明天一定，必須寫時間。'};
    return{id:'stilllive',rank:'A',title:'還在開台',text:'山下聊天室問今天玩什麼。你看一眼走過的路，沒有宣布退休，也沒有再立大願，只說：「等一下啦。」'};
  }

  async function copySummary(e){const text=`《瘸俠傳：糖門再起》\n結局：${e.title}｜評價 ${e.rank}\nLV.${state.level}｜俠名 ${state.fame}｜轉生 ${state.reincarnations}\n${e.text}`;try{await navigator.clipboard.writeText(text);toast('結算摘要已複製');}catch(_){prompt('手動複製：',text);}}

  function showDeath(reason) {
    currentBattle=null;modalClosable=false;
    openModal({kicker:'死亡・本世修行中止',title:'羅瘸倒下了',body:`<p>${reason}</p><div class="story-box"><h4>死亡規則</h4><p>等級、裝備、糖錢與本世故事歸零；已解鎖成就、結局圖鑑與轉生次數保留。你還能選一項四維，永久 +2 帶進下一世。</p></div>`,closable:false,actions:[{label:'接受死亡，選擇轉生根骨',sub:'這不是讀檔；下一世會更強',primary:true,onClick:()=>showRebirth(false)}]});
  }

  function showRebirth(fromEnding=false) {
    openModal({kicker:fromEnding?'New Game+・功成轉生':'轉生・帶著傷疤重來',title:'下一世留下什麼？',body:`<div class="choice-grid">${Object.entries(STAT_NAMES).map(([key,name])=>`<button class="choice-card" data-rebirth="${key}"><b>${STAT_ICONS[key]}・${name}</b><span>永久 +2</span><small>目前跨世加成 ${state.legacyStats[key]||0}</small></button>`).join('')}</div>`,closable:false,afterOpen:()=>document.querySelectorAll('[data-rebirth]').forEach(btn=>btn.onclick=()=>rebirth(btn.dataset.rebirth))});
  }
  function rebirth(key) {
    const legacyStats={...state.legacyStats,[key]:(state.legacyStats[key]||0)+2};
    const legacy={achievements:[...state.achievements],reincarnations:state.reincarnations+1,legacyStats};
    const oldName=state.name,oldOrigin=state.origin;state=freshState(oldName,oldOrigin,legacy);state.routes.chaos+=1;
    addLog('gold',`第 ${state.reincarnations+1} 世・傷疤還在`,`你帶著上一世的${STAT_NAMES[key]}回到糖門門口。`,`永久${STAT_NAMES[key]} +2`);
    save();forceCloseModal();$('game').hidden=false;render();seedChat();pushChat('system',`系統：第 ${state.reincarnations+1} 世開始。死亡紀錄不會被刪除。`);
  }

  function checkAchievements() {
    if(!state)return;const unlocked=[];
    ACHIEVEMENTS.forEach(a=>{if(!state.achievements.includes(a.id)&&a.test(state)){state.achievements.push(a.id);state.coins+=18;unlocked.push(a);}});
    unlocked.forEach(a=>{addLog('gold',`成就解鎖・${a.name}`,a.description,'糖錢 +18');toast(`成就解鎖：${a.name}`);pushChat('hype',`成就「${a.name}」！`);});
  }

  function drawFate() {
    if(state.fateDay===state.day)return toast('聊天室今天已經下過一次聖旨');
    state.fateDay=state.day;
    const f=pick([
      {id:'double',name:'今天練雙倍',desc:'下一次獲得的經驗加倍。',uses:1,apply:()=>{}},
      {id:'rage',name:'紅溫輸出',desc:'下一次造成傷害 +30%，但心火也會上升。',uses:1,apply:()=>{}},
      {id:'coins',name:'免費仔撒糖',desc:'不知道為什麼，免費仔集資了 80 糖錢。',uses:0,apply:()=>state.coins+=80},
      {id:'limp',name:'斷腿祝福',desc:'立刻失去 18 氣血，但下一次經驗加倍。',uses:1,apply:()=>{state.hp-=18;}}
    ]);f.apply();state.buff=f.uses?{id:f.id,name:f.name,uses:f.uses}:null;addLog(f.id==='limp'?'bad':'gold',`聊天室聖旨・${f.name}`,f.desc,f.id==='coins'?'糖錢 +80':'');save();render();pushChat('hype',f.name);if(state.hp<=0)showDeath('聊天室抽到斷腿祝福，而你真的只剩一點氣血。');
  }

  function initializeGame(newState, showTutorial = true) {
    state=newState;$('start-screen').hidden=true;$('game').hidden=false;window.scrollTo(0,0);render();seedChat();save();
    if(state.ended){
      const e=calculateEnding(state.finalChoice);
      openModal({kicker:'已完成的本世存檔',title:e.title,body:`<div class="ending-rank">${e.rank}</div><p class="ending-summary">${e.text}</p>`,closable:false,actions:[{label:'帶著記憶開啟下一世',sub:'保留成就與一項永久四維',primary:true,onClick:()=>showRebirth(true)}]});
      return;
    }
    if(state.hp<=0||state.stress>=100){showDeath('上次關閉頁面時，本世已經倒下。死亡紀錄仍然有效。');return;}
    if(state.pendingStory){openBossStory(state.pendingStory);return;}
    if(state.pendingFinal){openFinalChoice();return;}
    if(!showTutorial)return;
    openModal({kicker:'序章・糖門招生',title:'不是每次失敗都叫大中計',body:`<p>${esc(state.name)}，糖門不問你過去遲到幾次、按錯幾張牌，只問一件事：下一招要不要自己選？</p><div class="story-box"><h4>遊玩循環</h4><p>每一天有有限行動。到不同場域修行、打怪、接任務、開台與購物；Boss 條件達成後，再自行決定何時去斷腿崖。</p></div><p>戰鬥時先看敵人意圖：紅光要防禦、紫光要看破。死亡後必須轉生，但能永久帶走一項根骨與所有成就。</p>`,actions:[{label:'我自己選路',sub:'開始第一天的糖門修行',primary:true,onClick:forceCloseModal}]});
  }

  document.querySelectorAll('.origin').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.origin').forEach(x=>x.classList.remove('active'));btn.classList.add('active');selectedOrigin=btn.dataset.origin;});
  $('start-form').onsubmit=e=>{e.preventDefault();const old=loadSave();if(old&&!confirm('開始新遊戲會覆蓋目前本機存檔，確定嗎？'))return;initializeGame(freshState($('player-name').value.trim()||'羅正男',selectedOrigin));};
  $('continue-game').onclick=()=>{const saved=loadSave();if(saved)initializeGame(saved,false);};
  $('save-button').onclick=()=>save(true);
  $('restart-button').onclick=()=>{if(confirm('確定放棄本世進度並回到標題？跨世結局圖鑑仍會保留。')){localStorage.removeItem(SAVE_KEY);location.reload();}};
  $('live-toggle').onclick=()=>{state.live=!state.live;render();if(state.live)pushChat('system','系統：糖門台恢復實況。');save();};
  $('fate-button').onclick=drawFate;
  $('story-button').onclick=openStoryInfo;$('allocate-open').onclick=openAllocate;$('inventory-open').onclick=openInventory;$('quests-open').onclick=openMissions;$('achievements-open').onclick=openAchievements;
  $('clear-log').onclick=()=>{state.log=state.log.slice(0,3);save();render();};
  $('modal-close').onclick=closeModal;document.querySelector('[data-close-modal]').onclick=closeModal;
  function setMobilePanel(open) {
    $('character-panel').classList.toggle('open', open);
    $('mobile-panel-backdrop').classList.toggle('open', open);
    document.body.classList.toggle('panel-open', open);
  }
  $('mobile-menu').onclick=()=>setMobilePanel(true);$('close-mobile-menu').onclick=()=>setMobilePanel(false);$('mobile-panel-backdrop').onclick=()=>setMobilePanel(false);
  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select,[contenteditable="true"]')||e.ctrlKey||e.metaKey||e.altKey)return;
    const n=Number(e.key);if(!n)return;
    if(!$('modal').hidden){const targets=[...$('modal').querySelectorAll('button:not(:disabled)')].filter(btn=>!btn.classList.contains('modal-close'));targets[n-1]?.click();}
    else [...$('actions-grid').querySelectorAll('button:not(:disabled)')][n-1]?.click();
  });

  const saved=loadSave();$('continue-game').hidden=!saved;
  if(saved)$('continue-game').textContent=`繼續第 ${saved.day} 日・${CHAPTERS[Math.min(saved.bossIndex,4)].title}`;

})();
