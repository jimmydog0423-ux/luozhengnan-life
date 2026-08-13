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
  const ORIGIN_BUILDS = {
    talent: { name:'六天傳說', icon:'眼', passive:'看破詭計傷害 +35%；每成功看破 3 次，本世心眼 +1。' },
    local: { name:'大中計體質', icon:'骨', passive:'氣血上限額外 +8；氣血低於 30% 時，所有輸出 +40%。' },
    promise: { name:'明天一定', icon:'約', passive:'每日首次開台收益 +25%、俠名 +2、信義 +1；未開台便會反噬。' }
  };
  const METRIC_DEFAULTS = { actions:0, training:0, wins:0, missions:0, streams:0, purchases:0, oneHpWins:0, noHitBoss:0, masterSessions:0, mentorMeals:0, brotherTraining:0, mountainGoat:0, eliteWins:0, forcedWins:0, hiddenEvents:0, streamIncidents:0, talentReads:0, mysteryWins:0, eldenClears:0, sentinelWins:0 };
  const MOUNTAIN_GOAT_RATE = .00001;
  const TREE_SENTINEL_RATE = .00001;

  const CHARACTER_ART = {
    master: { src:'糖之漢.png', name:'糖之漢', focus:'50% 20%' },
    krapy: { src:'大師兄.png', name:'糖虧皮', focus:'50% 18%' },
    toyz: { src:'2師兄.png', name:'糖偉健', focus:'50% 23%' },
    eason: { src:'3師兄.png', name:'糖政銘', focus:'50% 17%' },
    overload: { src:'四師兄.png', name:'糖負荷', focus:'50% 17%' },
    nl: { src:'小師妹nl.png', name:'糖汶銨', focus:'50% 18%' },
    vivi: { src:'夏侯芝.png', name:'夏侯芝', focus:'50% 18%' },
    tangxi: { src:'糖喜.png', name:'糖喜', focus:'50% 15%' },
    longgeng: { src:'龍耿.png', name:'龍耿', focus:'50% 20%' }
  };
  const CAST_ART = {
    '糖之漢':'master', '糖虧皮':'krapy', '糖偉健':'toyz', '糖政銘':'eason', '糖負荷':'overload',
    '糖汶銨':'nl', '夏侯芝':'vivi', '糖喜':'tangxi', '龍耿':'longgeng'
  };

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
      description: '老蟹的帳本、糖喜拿來整人的軍師圖與一張永遠沒人照表出席的班表，都還留在山莊。',
      effects: ['身法修行 +1', '任務報酬 +20%'], unlock: s => s.bossIndex >= 1
    },
    market: {
      name: '叉叉市集', region: '江湖 · 商路', danger: 1, stamp: '買', icon: '市',
      description: '武器、飯盒、銅鏡和真假不明的流量法器都能買到。老闆說概不賒帳。',
      effects: ['商城開放', '裝備整備', '奇聞交換'], unlock: s => s.level >= 3
    },
    cliff: {
      name: '斷腿崖', region: '糖門 · 登山口', danger: 3, stamp: '戰', icon: '崖',
      description: '所有想上泰山的人都要從這裡出發。Boss 不會因為你是實況主就放水。',
      effects: ['Boss 試煉', '悟道效率 +50%', '無法安穩休息'], unlock: () => true
    }
  };

  const CHAPTERS = [
    {
      number:'第一章', title:'斷腿入糖門', summary:'從糖門外院站穩腳步，先證明自己不是只會按下一頁。', cast:['糖之漢','糖虧皮','糖政銘','糖汶銨'],
      sections:[
        { number:'第一回', title:'招生之夜', summary:'糖政銘把門規丟到桌上：先練、先做，再談上山。', requirements:[
          {label:'完成 3 次自主行動',check:s=>s.metrics.actions>=3,value:s=>`${s.metrics.actions}/3`},
          {label:'至少修行 1 次',check:s=>s.metrics.training>=1,value:s=>`${s.metrics.training}/1`}
        ]},
        { number:'第二回', title:'外院晨課', summary:'想留在糖門，先讓大師兄看到你能準時，也能打。', requirements:[
          {label:'擊敗 3 隻野怪',check:s=>s.metrics.wins>=3,value:s=>`${s.metrics.wins}/3`},
          {label:'活到第 3 日',check:s=>s.day>=3,value:s=>`第 ${s.day} 日`},
          {label:'完成「外院點名簿」',check:s=>s.completedMissions.includes('rollcall'),value:s=>s.completedMissions.includes('rollcall')?'已完成':'未完成'}
        ]},
        { number:'第三回', title:'四十包試煉', summary:'糖偉健端出整箱卡包；先學會確認，才有資格碰綠光。', requirements:[
          {label:'完成 3 張江湖帖',check:s=>s.completedMissions.length>=3,value:s=>`${s.completedMissions.length}/3`},
          {label:'持有驗牌銅鏡',check:s=>hasItem(s,'mirror'),value:s=>hasItem(s,'mirror')?'已持有':'未取得'},
          {label:'等級達 4',check:s=>s.level>=4,value:s=>`LV.${s.level}`}
        ]},
        { number:'第四回', title:'破曉斷腿崖', summary:'睡魔盤踞山門。這次不是鬧鐘響了就算贏。', boss:true }
      ]
    },
    {
      number:'第二章', title:'綠光不可亂按', summary:'一次失誤會被記很久；真正的試煉，是你願不願意把它重新看清。', cast:['糖偉健','糖虧皮','糖汶銨','蟹老闆'],
      sections:[
        { number:'第一回', title:'水蛇洞開台', summary:'洞裡的回音專挑你最想逃避的話重播。', requirements:[
          {label:'累積開台 3 次',check:s=>s.metrics.streams>=3,value:s=>`${s.metrics.streams}/3`},
          {label:'累積擊敗 6 隻野怪',check:s=>s.metrics.wins>=6,value:s=>`${s.metrics.wins}/6`}
        ]},
        { number:'第二回', title:'三招與一本帳', summary:'大師兄的第三招和老蟹的帳本，都不能只看表面。', requirements:[
          {label:'完成「糖虧皮的三招」',check:s=>s.completedMissions.includes('krapy'),value:s=>s.completedMissions.includes('krapy')?'已完成':'未完成'},
          {label:'完成「蟹老闆的帳」',check:s=>s.completedMissions.includes('ledger'),value:s=>s.completedMissions.includes('ledger')?'已完成':'未完成'},
          {label:'身法達 11',check:s=>stat(s,'agility')>=11,value:s=>`${stat(s,'agility')}/11`}
        ]},
        { number:'第三回', title:'黃光復盤', summary:'你把每一步重新演過，直到綠光再也騙不了你。', requirements:[
          {label:'完成 6 張江湖帖',check:s=>s.completedMissions.length>=6,value:s=>`${s.completedMissions.length}/6`},
          {label:'心眼達 15',check:s=>stat(s,'insight')>=15,value:s=>`${stat(s,'insight')}/15`},
          {label:'活到第 7 日',check:s=>s.day>=7,value:s=>`第 ${s.day} 日`}
        ]},
        { number:'第四回', title:'邪僧試牌', summary:'拉札舉起綠色核心牌。這一次，你要先看見真相。', boss:true }
      ]
    },
    {
      number:'第三章', title:'金銀雙烏壓境', summary:'張家雙煞封住山路。單人數值再高，也頂不住兩個人的連招。', cast:['糖之漢','糖負荷','糖喜','龍耿','金烏上豬','銀烏下豬'],
      sections:[
        { number:'第一回', title:'雙烏封山', summary:'山路斷糧，外院每個人都得先學會自保。', requirements:[
          {label:'累積擊敗 10 隻野怪',check:s=>s.metrics.wins>=10,value:s=>`${s.metrics.wins}/10`},
          {label:'根骨達 15',check:s=>stat(s,'vitality')>=15,value:s=>`${stat(s,'vitality')}/15`}
        ]},
        { number:'第二回', title:'雞腿糧道', summary:'龍耿把最後一袋糧交給你。路上不能少一根雞腿。', requirements:[
          {label:'完成「龍耿的雞腿」',check:s=>s.completedMissions.includes('chicken'),value:s=>s.completedMissions.includes('chicken')?'已完成':'未完成'},
          {label:'人情達 10',check:s=>s.routes.ties>=10,value:s=>`${s.routes.ties}/10`},
          {label:'完成 8 張江湖帖',check:s=>s.completedMissions.length>=8,value:s=>`${s.completedMissions.length}/8`}
        ]},
        { number:'第三回', title:'同門血戰前夜', summary:'糖門眾人終於站成一排。今晚沒有人能只顧自己。', requirements:[
          {label:'等級達 10',check:s=>s.level>=10,value:s=>`LV.${s.level}`},
          {label:'累積擊敗 14 隻野怪',check:s=>s.metrics.wins>=14,value:s=>`${s.metrics.wins}/14`},
          {label:'活到第 12 日',check:s=>s.day>=12,value:s=>`第 ${s.day} 日`}
        ]},
        { number:'第四回', title:'金銀合擊', summary:'雙烏同時出手；只有真正的同門才能拆掉這一招。', boss:true }
      ]
    },
    {
      number:'第四章', title:'一萬個羅正男', summary:'江湖到處都是你的臉。要證明本尊，靠的不是音量而是留下的證據。', cast:['峰哥說書人','糖政銘','糖負荷','萬面分身'],
      sections:[
        { number:'第一回', title:'真假本尊', summary:'每個分身都比你更準時，還比你更會發文。', requirements:[
          {label:'俠名達 22',check:s=>s.fame>=22,value:s=>`${s.fame}/22`},
          {label:'累積開台 6 次',check:s=>s.metrics.streams>=6,value:s=>`${s.metrics.streams}/6`}
        ]},
        { number:'第二回', title:'證據鏈', summary:'峰哥要的不是感覺，是時間、帳本與完整前因後果。', requirements:[
          {label:'完成「我不是高金生」',check:s=>s.completedMissions.includes('identity'),value:s=>s.completedMissions.includes('identity')?'已完成':'未完成'},
          {label:'完成「平台舊檔案」',check:s=>s.completedMissions.includes('archive'),value:s=>s.completedMissions.includes('archive')?'已完成':'未完成'},
          {label:'信義達 13',check:s=>s.routes.integrity>=13,value:s=>`${s.routes.integrity}/13`}
        ]},
        { number:'第三回', title:'演算法風暴', summary:'分身開始互相複製。你只能用持續累積的選擇穿過風暴。', requirements:[
          {label:'完成 12 張江湖帖',check:s=>s.completedMissions.length>=12,value:s=>`${s.completedMissions.length}/12`},
          {label:'累積擊敗 19 隻野怪',check:s=>s.metrics.wins>=19,value:s=>`${s.metrics.wins}/19`},
          {label:'心眼達 19',check:s=>stat(s,'insight')>=19,value:s=>`${stat(s,'insight')}/19`}
        ]},
        { number:'第四回', title:'萬面照真身', summary:'一萬張臉同時開口。只有你的選擇無法被複製。', boss:true }
      ]
    },
    {
      number:'第五章', title:'泰山問心', summary:'冠軍、失約、朋友與迷因化作山路。這次沒有捷徑，也沒有代打。', cast:['夏侯芝','龍耿','糖門眾人','泰山'],
      sections:[
        { number:'第一回', title:'四印會盟', summary:'前四戰留下的不是戰利品，而是你願意承認的自己。', requirements:[
          {label:'前四位守關者全破',check:s=>s.defeatedBosses.length>=4,value:s=>`${s.defeatedBosses.length}/4`},
          {label:'取得至少三枚心印',check:s=>s.vows.length>=3,value:s=>`${s.vows.length}/3`}
        ]},
        { number:'第二回', title:'山路十八盤', summary:'越靠近山頂，攔路怪越像你不肯放下的執念。', requirements:[
          {label:'累積擊敗 25 隻野怪',check:s=>s.metrics.wins>=25,value:s=>`${s.metrics.wins}/25`},
          {label:'等級達 15',check:s=>s.level>=15,value:s=>`LV.${s.level}`}
        ]},
        { number:'第三回', title:'登頂前夜', summary:'把糧、心印與最後一句話帶齊。天亮後只剩泰山。', requirements:[
          {label:'完成「泰山路引」',check:s=>s.completedMissions.includes('taishan_route'),value:s=>s.completedMissions.includes('taishan_route')?'已完成':'未完成'},
          {label:'活到第 20 日',check:s=>s.day>=20,value:s=>`第 ${s.day} 日`},
          {label:'解鎖 8 項成就',check:s=>s.achievements.length>=8,value:s=>`${s.achievements.length}/8`}
        ]},
        { number:'第四回', title:'泰山問心', summary:'山頂沒有血條之外的答案。你一路做過的選擇，就是最後一招。', boss:true }
      ]
    }
  ];

  const BOSSES = [
    {
      id: 'sleep', name: '睡魔・棉被精', icon: '🛏️', title: '永遠差五分鐘的心魔', hp: 96, attack: 12,
      mechanic: '棉被結界會封死沒有攻勢的配點；蓄力重擊還會穿透防禦並留下破甲。',
      combatRule: '力道達 10 或身法達 9，才能對棉被精造成傷害；否則所有攻勢都是 0。紅光重擊穿透 75% 防禦，命中後再破甲 2 次。',
      combatCheck: s => stat(s,'strength') >= 10 || stat(s,'agility') >= 9,
      combatValue: s => `力道 ${stat(s,'strength')}/10・身法 ${stat(s,'agility')}/9（擇一）`, reward: '破曉腰牌',
      requiredItem:'clock', itemHint:'叉叉市集有個賣舊鐘的攤販，聲稱那只鐘連死人都叫得醒。',
      requirements: [
        { label: '等級達 4', check: s => s.level >= 4, value: s => `LV.${s.level}` },
        { label: '自律達 6', check: s => s.routes.discipline >= 6, value: s => `${s.routes.discipline}/6` },
        { label: '完成本章前三回', check: s => s.chapterStep >= 3, value: s => `${s.chapterStep}/3` }
      ]
    },
    {
      id: 'green', name: '綠衣邪僧・拉札', icon: '🟢', title: '亮了就按的致命誘惑', hp: 142, attack: 17,
      mechanic: '黃光法衣常駐免傷，必須先在紫色詭計時成功「看破」才能打開破綻。',
      combatRule: '法衣閉合時所有傷害為 0。對紫光使用「看破」後，當回合與接下來 2 回合可正常造成傷害；詭計另穿透 45% 防禦。', reward: '黃光心印',
      requiredItem:'purplefilter', itemHint:'驗牌銅鏡只是線索，不是答案。帶銅鏡去叉叉市集找拆鏡匠，才能從鏡背夾層取出「紫光濾片」。',
      requirements: [
        { label: '心眼達 16', check: s => stat(s, 'insight') >= 16, value: s => `${stat(s,'insight')}/16` },
        { label: '完成本章前三回', check: s => s.chapterStep >= 3, value: s => `${s.chapterStep}/3` }
      ]
    },
    {
      id: 'crows', name: '金烏上豬・銀烏下豬', icon: '🐗', title: '張家雙王的兄弟連擊', hp: 205, attack: 22,
      mechanic: '雙王陣會互相代擋，必須用糖門滑劍破陣；每三回合還會發動無視防禦的夾擊。',
      combatRule: '陣形閉合時所有傷害為 0。「糖門滑劍」可破陣，當回合與接下來 2 回合可輸出。每第 3 回合的雙烏夾擊造成至少 18% 最大氣血傷害，防禦只能減半。', reward: '同門心印',
      requiredItem:'crowpin', itemHint:'斷腿骨劍只能破開石壁。帶劍回斷腿崖追查雙烏羽痕，才能找出真正鎖住陣眼的「逆羽陣釘」。',
      requirements: [
        { label: '根骨達 20', check: s => stat(s, 'vitality') >= 20, value: s => `${stat(s,'vitality')}/20` },
        { label: '人情達 14', check: s => s.routes.ties >= 14, value: s => `${s.routes.ties}/14` },
        { label: '完成本章前三回', check: s => s.chapterStep >= 3, value: s => `${s.chapterStep}/3` }
      ]
    },
    {
      id: 'copies', name: '萬面分身・演算法', icon: '👥', title: '每一張臉都說自己是本尊', hp: 268, attack: 27,
      mechanic: '演算法會記住你上一個命中的招式；連續使用同一種輸出，第二次起傷害歸零。',
      combatRule: '普通攻擊、糖門滑劍與看破反擊必須交替使用；重複上一個命中招式會被分身完整複製，傷害變成 0。詭計穿透 60% 防禦。', reward: '本真心印',
      requiredItem:'mastertape', itemHint:'老蟹帳本只記著檔案編號。拿它對照平台舊檔案，找回未經剪輯的「初代聲紋母帶」，分身才無法冒充。',
      requirements: [
        { label: '俠名達 35', check: s => s.fame >= 35, value: s => `${s.fame}/35` },
        { label: '信義達 16', check: s => s.routes.integrity >= 16, value: s => `${s.routes.integrity}/16` },
        { label: '完成本章前三回', check: s => s.chapterStep >= 3, value: s => `${s.chapterStep}/3` }
      ]
    },
    {
      id: 'taishan', name: '最終大 Boss・泰山', icon: '⛰️', title: '沒有捷徑的萬丈問心', hp: 360, attack: 33,
      mechanic: '泰山拒絕極端配點。四維失衡時完全無法造成傷害，每三回合還會降下無視防禦的問心天劫。',
      combatRule: '四維最高值與最低值相差不得超過 12，否則所有傷害為 0。每第 3 回合至少造成 20% 最大氣血傷害，防禦只能減少 35%；心印仍會提高你的輸出。',
      combatCheck: s => Math.max(...Object.keys(STAT_NAMES).map(k=>stat(s,k)))-Math.min(...Object.keys(STAT_NAMES).map(k=>stat(s,k))) <= 12,
      combatValue: s => { const values=Object.keys(STAT_NAMES).map(k=>stat(s,k));return `目前差距 ${Math.max(...values)-Math.min(...values)}/12`; }, reward: '自己的結局',
      requiredItem:'blanklot', itemHint:'泰山路引只能開路，不能問心。持路引回斷腿崖守到破曉，背面才會浮出真正能直面泰山的「無字山籤」。',
      requirements: [
        { label: '等級達 17', check: s => s.level >= 17, value: s => `LV.${s.level}` },
        { label: '取得至少三枚心印', check: s => s.vows.length >= 3, value: s => `${s.vows.length}/3` },
        { label: '前四位守關者全破', check: s => s.defeatedBosses.length >= 4, value: s => `${s.defeatedBosses.length}/4` },
        { label: '完成 15 張江湖帖', check: s => s.completedMissions.length >= 15, value: s => `${s.completedMissions.length}/15` },
        { label: '完成本章前三回', check: s => s.chapterStep >= 3, value: s => `${s.chapterStep}/3` }
      ]
    }
  ];

  const ITEMS = {
    rice: { name: '米特飯盒', icon: '🍱', kind: 'consumable', price: 28, description: '戰鬥中恢復 38 氣血。' },
    pill: { name: '糖門回氣丹', icon: '🟡', kind: 'consumable', price: 42, description: '戰鬥中恢復 24 真氣。' },
    mirror: { name: '驗牌銅鏡', icon: '🪞', kind: 'key', price: 160, description: '確認核心卡有沒有亮黃。真正的用途得在江湖裡自己試。' },
    clock: { name: '破曉鬧鐘', icon: '⏰', kind: 'charm', price: 90, description: '每日行動 +1，自律修行更穩定。', bonuses: { maxAp: 1 } },
    boneblade: { name: '斷腿骨劍', icon: '🗡️', kind: 'weapon', price: 120, description: '攻擊 +7。名稱很痛，傷害也很痛。', bonuses: { attack: 7 } },
    ankleguard: { name: '玄鐵護踝', icon: '🥾', kind: 'armor', price: 145, description: '防禦 +5、氣血上限 +24。', bonuses: { defense: 5, maxHp: 24 } },
    mic: { name: '萬人法螺', icon: '📣', kind: 'charm', price: 175, description: '開台收益 +30%，但心火也多 2。', bonuses: { stream: .3 } },
    ledger: { name: '老蟹帳本', icon: '📒', kind: 'key', price: 0, description: '不是你的三千萬私人欠款。它記著整個團隊付出的成本。' },
    purplefilter: { name: '紫光濾片', icon: '🟣', kind: 'key', price: 0, description: '從驗牌銅鏡背面拆出的薄片，只讓真正的紫光穿過。' },
    crowpin: { name: '逆羽陣釘', icon: '🪶', kind: 'key', price: 0, description: '雙烏自己拔掉的一根逆羽，能讓互相代擋的陣眼短暫錯位。' },
    mastertape: { name: '初代聲紋母帶', icon: '📼', kind: 'key', price: 0, description: '未經剪輯、沒有演算法補幀的原始聲紋，只有本尊能完整對上。' },
    blanklot: { name: '無字山籤', icon: '🎋', kind: 'key', price: 0, description: '路引背面浮出的無字籤。答案不寫在紙上，只記在走過的路裡。' },
    yellowseal: { name: '黃光心印', icon: '🟨', kind: 'relic', price: 0, description: '先確認，再出手。' },
    bondseal: { name: '同門心印', icon: '🤝', kind: 'relic', price: 0, description: '一個人很會打，不等於能走到最後。' },
    trueseal: { name: '本真心印', icon: '🪪', kind: 'relic', price: 0, description: '你說過的話，終於能替你證明你是誰。' },
    taishanpass: { name: '泰山路引', icon: '🗺️', kind: 'key', price: 0, description: '十五張江湖帖與二十五場實戰換來的登頂資格。' },
    nlbell: { name:'小師妹的靜音鈴', icon:'🔔', kind:'relic', price:0, description:'鈴不響，不代表沒有人在等你回糖門。' },
    viviribbon: { name:'雪山紅緞', icon:'🎀', kind:'relic', price:0, description:'被雪浸過仍沒有褪色，像一句終於沒有被收回的約定。' },
    rogercrown: { name:'羅傑的王冠', icon:'👑', kind:'relic', price:0, description:'站上規則之上的冠冕。持有者的一次有效攻勢足以終結任何敵人。' }
  };

  const MARTIAL_ARTS = {
    sugar_slash:{name:'糖門滑劍',icon:'🍬',qi:10,price:0,description:'糖門入門劍技。能破架，也能切開部分陣勢。',unlocked:()=>true},
    limp_whirl:{name:'斷腿旋風斬',icon:'🩼',qi:16,price:135,description:'以身法帶動連斬；威力高但反震會損失 6% 最大氣血。',unlocked:s=>s.level>=5&&stat(s,'agility')>=10,requirement:s=>`需要 LV.5、身法 10｜目前 LV.${s.level}、身法 ${stat(s,'agility')}`},
    iron_body:{name:'糖門鐵骨功',icon:'🪨',qi:12,price:150,description:'以根骨震傷對手，同時架起兩回合護體。',unlocked:s=>stat(s,'vitality')>=14,requirement:s=>`需要根骨 14｜目前 ${stat(s,'vitality')}`},
    yellow_flash:{name:'黃光照破',icon:'🟨',qi:18,price:190,description:'以心眼反照虛招；撞上詭計時能免去敵方回合。',unlocked:s=>stat(s,'insight')>=15&&hasItem(s,'mirror'),requirement:s=>`需要心眼 15 與一面能辨黃光的鏡子`},
    forbidden:{name:'盜版易筋經・逆頁',icon:'📕',qi:24,price:0,secret:true,description:'來路不明的禁招。威力極高，每次施展都會累積大量心火。',unlocked:()=>false}
  };

  const MASTER_WORKOUTS = [
    { id:'squat', icon:'🏋️', name:'巨石深蹲', focus:'根骨主修・力道機率成長', stat:'vitality', secondary:'strength', xp:28, stress:6, damage:[4,10], quote:'糖之漢把巨石往你肩上一放：「站不起來就不要說是糖門弟子。」' },
    { id:'bench', icon:'🪨', name:'玄鐵臥推', focus:'力道主修・根骨機率成長', stat:'strength', secondary:'vitality', xp:30, stress:7, damage:[6,12], quote:'槓上沒有刻重量，只刻著一句：山羌比這個重。' },
    { id:'sprint', icon:'🩼', name:'斷腿折返跑', focus:'身法主修・力道機率成長', stat:'agility', secondary:'strength', xp:27, stress:6, damage:[4,9], quote:'糖之漢騎車在後面追，你第一次發現瘸也能跑出殘影。' },
    { id:'ropes', icon:'⛓️', name:'戰繩甩鍊', focus:'力道主修・身法機率成長', stat:'strength', secondary:'agility', xp:29, stress:8, damage:[5,11], quote:'兩條玄鐵戰繩像聊天室一樣永遠停不下來。' },
    { id:'stance', icon:'🧘', name:'掌門核心馬步', focus:'心眼主修・根骨機率成長', stat:'insight', secondary:'vitality', xp:26, stress:4, damage:[2,7], quote:'糖之漢端著盤子坐在你腿上，並堅稱這叫核心穩定。' }
  ];

  const MASTER_FOODS = [
    { id:'steak', icon:'🥩', name:'糖之漢煎牛排', effect:'大補氣血・35% 力道 +1', heal:55, stat:'strength', chance:.35, stress:-4, quote:'外焦內嫩，掌門說火候跟出拳一樣不能猶豫。' },
    { id:'chicken', icon:'🍗', name:'蒜香雞腿排', effect:'恢復氣血・25% 身法 +1', heal:45, stat:'agility', chance:.25, stress:-5, quote:'雞腿才剛落盤，龍耿在門外忽然打了個噴嚏。' },
    { id:'salmon', icon:'🐟', name:'鐵板鮭魚', effect:'回復真氣・35% 心眼 +1', heal:38, qi:24, stat:'insight', chance:.35, stress:-6, quote:'魚皮煎得會發出黃光，但糖偉健叫你先確認再吃。' },
    { id:'burger', icon:'🍔', name:'巨無霸漢堡排', effect:'大量回血・35% 根骨 +1', heal:70, stat:'vitality', chance:.35, stress:4, quote:'份量大到像健身器材，吃完連呼吸都算負重訓練。' },
    { id:'egg', icon:'🍳', name:'焦糖荷包蛋', effect:'降低心火・補充飯盒', heal:30, rice:1, stress:-12, quote:'掌門把糖撒成太極圖，你不敢問這算甜點還是蛋。' },
    { id:'broccoli', icon:'🥦', name:'清燙花椰菜', effect:'自律 +1・20% 根骨 +1', heal:24, stat:'vitality', chance:.2, stress:-7, discipline:1, quote:'這是整桌最安靜的一盤，也是掌門最不想承認有煮的一盤。' }
  ];

  const BROTHER_SESSIONS = [
    { id:'krapy', art:'krapy', icon:'🗡️', role:'大師兄', name:'糖虧皮', title:'三招滑劍拆解', effect:'身法 +1・35% 心眼 +1', quote:'大師兄先笑你三次，第四次才把真正的步法教給你。' },
    { id:'toyz', art:'toyz', icon:'🧪', role:'二師兄', name:'糖偉健', title:'藥爐辨丹', effect:'心眼 +1・機率獲得回氣丹', quote:'桌上四十顆丹只有一顆是真的；這次不准看到亮光就吞。' },
    { id:'eason', art:'eason', icon:'📋', role:'三師兄', name:'糖政銘', title:'門規晨操', effect:'力道或根骨 +1・自律 +2', quote:'他拿著點名簿站在旁邊，動作做錯可以重來，遲到不行。' },
    { id:'overload', art:'overload', icon:'📦', role:'四師兄', name:'糖負荷', title:'黑心搬貨術', effect:'根骨 +1・賺糖錢・心火上升', quote:'箱子寫著易碎，他說真正易碎的是免費仔的錢包。' },
    { id:'nl', art:'nl', icon:'🪭', role:'小師妹・NL', name:'糖汶銨', title:'閃刀步法陪練', effect:'身法或心眼 +1・人情 +2', quote:'小師妹一句「再來一次」，比掌門吼十句都有用。', unlock:()=>true },
    { id:'vivi', art:'vivi', icon:'☂️', role:'雪山師姐・VIVI', name:'夏侯芝', title:'雪傘逆風課', effect:'心眼 +1・身法機率 +1・自律 +2', quote:'夏侯芝把傘尖抵在你腳邊：「再碎念一句，就自己滾下山。」', unlock:s=>s.bossIndex>=2 }
  ];

  const MISSIONS = [
    { id: 'water', name: '外院挑水', description: '日常差事，可反覆完成，但不會算進十五張主線江湖帖。', repeat: true, reward: '糖錢 28、經驗 22、根骨機率 +1', can: () => true,
      run: s => { s.coins += missionReward(s, 28); gainXp(s, 22); if (Math.random() < .45) s.stats.vitality++; s.routes.discipline++; } },
    { id:'rollcall', chapter:0, name:'外院點名簿', description:'連續完成晨課，讓糖政銘第一次把你寫進正式名冊。', reward:'經驗 55、自律 +2、信義 +1', can:()=>true, requirements:[
      {label:'自主行動',check:s=>s.metrics.actions>=2,value:s=>`${s.metrics.actions}/2`}, {label:'修行',check:s=>s.metrics.training>=1,value:s=>`${s.metrics.training}/1`}
    ], run:s=>{gainXp(s,55);s.routes.discipline+=2;s.routes.integrity++;} },
    { id: 'rice_run', chapter:0, name: '小師妹送飯', description: '糖汶銨在山路遇到野怪；先把路清乾淨，飯才送得到。', reward: '飯盒 ×2、人情 +3', can: s => s.routes.ties >= 3, reason: '需要人情 3', requirements:[
      {label:'擊敗野怪',check:s=>s.metrics.wins>=2,value:s=>`${s.metrics.wins}/2`}
    ],
      run: s => { addItem(s,'rice',2); s.routes.ties += 3; s.hp = Math.min(maxHp(s), s.hp + 18); } },
    { id: 'packs', chapter:0, name: '四十包零傳說', description: '先打怪湊齊卡包錢，再替糖偉健逐包驗牌。', cost: 55, reward: '心眼 +2、驗牌銅鏡、信義 +2', can: s => s.coins >= 55, reason: '需要 55 糖錢', requirements:[
      {label:'擊敗野怪',check:s=>s.metrics.wins>=3,value:s=>`${s.metrics.wins}/3`}
    ], run: s => { s.coins -= 55; s.stats.insight += 2; addItem(s,'mirror'); s.routes.integrity += 2; } },

    { id: 'ledger', chapter:1, name: '蟹老闆的帳', description: '把戰隊總投資、私人欠款與那些說不清的承諾逐筆對完。', reward: '老蟹帳本、信義 +3、俠名 +5', can: s => s.routes.integrity >= 5, reason: '需要信義 5', requirements:[
      {label:'已完成四十包試煉',check:s=>s.completedMissions.includes('packs'),value:s=>s.completedMissions.includes('packs')?'完成':'未完成'}
    ],
      run: s => { addItem(s,'ledger'); s.routes.integrity += 3; s.fame += 5; } },
    { id: 'stream_three', chapter:1, name: '水蛇洞三時辰', description: '分三次撐完洞中直播，不跳票、不睡著、不亂承諾。', reward: '糖錢 95、節目 +3、自律 +2', can:()=>true, requirements:[
      {label:'累積開台',check:s=>s.metrics.streams>=3,value:s=>`${s.metrics.streams}/3`}, {label:'存活日數',check:s=>s.day>=5,value:s=>`第 ${s.day} 日 / 5`}
    ],
      run: s => { s.coins += missionReward(s,95); s.routes.show += 3; s.routes.discipline += 2; } },
    { id: 'krapy', chapter:1, name: '糖虧皮的三招', description: '先在野外累積實戰，再接大師兄沒有留手的第三招。', reward: '身法 +2、斷腿骨劍、人情 +2', can: s => stat(s,'agility') >= 11, reason: '需要身法 11', requirements:[
      {label:'累積擊敗野怪',check:s=>s.metrics.wins>=7,value:s=>`${s.metrics.wins}/7`}
    ],
      run: s => { s.stats.agility += 2; addItem(s,'boneblade'); s.routes.ties += 2; } },
    { id:'yellow_review', chapter:1, name:'黃光逐格復盤', description:'把三次錯誤操作逐格標註，不能用「手滑」帶過。', reward:'心眼 +2、信義 +2、經驗 80', can:s=>hasItem(s,'mirror'), reason:'需要驗牌銅鏡', requirements:[
      {label:'心眼',check:s=>stat(s,'insight')>=14,value:s=>`${stat(s,'insight')}/14`}, {label:'第二章江湖帖',check:s=>['ledger','stream_three','krapy'].every(id=>s.completedMissions.includes(id)),value:s=>`${['ledger','stream_three','krapy'].filter(id=>s.completedMissions.includes(id)).length}/3`}
    ], run:s=>{s.stats.insight+=2;s.routes.integrity+=2;gainXp(s,80);} },
    { id:'secret_green', chapter:1, secret:true, name:'拆開銅鏡背板', description:'循前世殘影找到叉叉市集的拆鏡匠，驗牌銅鏡背後果然還夾著另一層。', reward:'紫光濾片', unlock:s=>s.bossItemHints.includes('green'), can:s=>hasItem(s,'mirror'), reason:'需要驗牌銅鏡', requirements:[
      {label:'心眼',check:s=>stat(s,'insight')>=16,value:s=>`${stat(s,'insight')}/16`}
    ], run:s=>addItem(s,'purplefilter') },

    { id: 'chicken', chapter:2, name: '龍耿的雞腿', description: '把糧食送過雙烏封鎖線；沿途至少清掉十隻山怪。', cost: 60, reward: '根骨 +2、人情 +3、飯盒 ×2', can: s => s.coins >= 60, reason: '需要 60 糖錢', requirements:[
      {label:'累積擊敗野怪',check:s=>s.metrics.wins>=10,value:s=>`${s.metrics.wins}/10`}
    ], run: s => { s.coins -= 60; s.stats.vitality += 2; s.routes.ties += 3; addItem(s,'rice',2); } },
    { id:'gate_watch', chapter:2, name:'糖門守夜三更', description:'在封山期間守完整夜，不能因聊天室一句話離開崗位。', reward:'根骨 +2、自律 +3、經驗 100', can:()=>true, requirements:[
      {label:'根骨',check:s=>stat(s,'vitality')>=16,value:s=>`${stat(s,'vitality')}/16`}, {label:'累積擊敗野怪',check:s=>s.metrics.wins>=12,value:s=>`${s.metrics.wins}/12`}
    ], run:s=>{s.stats.vitality+=2;s.routes.discipline+=3;gainXp(s,100);} },
    { id:'brother_riddle', chapter:2, name:'雙烏口供對照', description:'把兩兄弟互相矛盾的說法整理成一份能看的證詞。', reward:'人情 +3、信義 +3、俠名 +6', can:s=>s.routes.ties>=11, reason:'需要人情 11', requirements:[
      {label:'已完成第三章前兩帖',check:s=>['chicken','gate_watch'].every(id=>s.completedMissions.includes(id)),value:s=>`${['chicken','gate_watch'].filter(id=>s.completedMissions.includes(id)).length}/2`}
    ], run:s=>{s.routes.ties+=3;s.routes.integrity+=3;s.fame+=6;} },
    { id:'secret_crows', chapter:2, secret:true, name:'追查斷崖逆羽', description:'用斷腿骨劍剖開前世看見的羽痕，從石縫拔出一根方向完全相反的陣釘。', reward:'逆羽陣釘', unlock:s=>s.bossItemHints.includes('crows'), can:s=>hasItem(s,'boneblade'), reason:'需要斷腿骨劍', requirements:[
      {label:'人情',check:s=>s.routes.ties>=14,value:s=>`${s.routes.ties}/14`}
    ], run:s=>addItem(s,'crowpin') },

    { id: 'identity', chapter:3, name: '我不是高金生', description: '整理官方帳號、發言時間與證據，對抗冒名分身。', reward: '信義 +4、心眼 +2、俠名 +8', can: s => hasItem(s,'ledger'), reason: '需要老蟹帳本', requirements:[
      {label:'俠名',check:s=>s.fame>=22,value:s=>`${s.fame}/22`}
    ], run: s => { s.routes.integrity += 4; s.stats.insight += 2; s.fame += 8; } },
    { id:'archive', chapter:3, name:'平台舊檔案', description:'找回被演算法壓下去的原始影片、時間戳與完整上下文。', reward:'心眼 +2、信義 +3、俠名 +7', can:()=>true, requirements:[
      {label:'累積開台',check:s=>s.metrics.streams>=6,value:s=>`${s.metrics.streams}/6`}, {label:'心眼',check:s=>stat(s,'insight')>=17,value:s=>`${stat(s,'insight')}/17`}
    ], run:s=>{s.stats.insight+=2;s.routes.integrity+=3;s.fame+=7;} },
    { id: 'snow', chapter:3, name: '夏侯芝的雪山帖', description: '在斷腿崖讀完雪山派身法訣，還得親自打贏十九場證明。', reward: '身法 +2、自律 +3、心眼 +1', can: s => stat(s,'insight') >= 18, reason: '需要心眼 18', requirements:[
      {label:'累積擊敗野怪',check:s=>s.metrics.wins>=19,value:s=>`${s.metrics.wins}/19`}
    ], run: s => { s.stats.agility += 2; s.stats.insight += 1; s.routes.discipline += 3; } },
    { id:'true_voice', chapter:3, name:'本尊公開辯證', description:'不刪留言、不換帳號，完整回答三輪質疑。', reward:'信義 +4、俠名 +10、節目 +2', can:s=>s.routes.integrity>=13, reason:'需要信義 13', requirements:[
      {label:'完成身分證據',check:s=>['identity','archive'].every(id=>s.completedMissions.includes(id)),value:s=>`${['identity','archive'].filter(id=>s.completedMissions.includes(id)).length}/2`}
    ], run:s=>{s.routes.integrity+=4;s.fame+=10;s.routes.show+=2;} },
    { id:'secret_copies', chapter:3, secret:true, name:'帳號對上母帶', description:'照前世線索把老蟹帳本的檔案編號逐筆對上平台舊檔，找出沒有被演算法加工的聲音。', reward:'初代聲紋母帶', unlock:s=>s.bossItemHints.includes('copies'), can:s=>hasItem(s,'ledger'), reason:'需要老蟹帳本', requirements:[
      {label:'完成「平台舊檔案」',check:s=>s.completedMissions.includes('archive'),value:s=>s.completedMissions.includes('archive')?'已完成':'未完成'}
    ], run:s=>addItem(s,'mastertape') },

    { id:'summit_supplies', chapter:4, name:'十八盤行囊', description:'替登頂準備補給；沒有飯盒與回氣丹就不准出發。', reward:'玄鐵護踝、根骨 +1、經驗 120', can:s=>hasItem(s,'rice')&&hasItem(s,'pill'), reason:'需要飯盒與回氣丹', requirements:[
      {label:'等級',check:s=>s.level>=15,value:s=>`LV.${s.level}/15`}
    ], run:s=>{consumeItem(s,'rice');consumeItem(s,'pill');addItem(s,'ankleguard');s.stats.vitality++;gainXp(s,120);} },
    { id:'seal_council', chapter:4, name:'糖門心印會盟', description:'讓三枚心印各自說出代價，不能只挑最好聽的答案。', reward:'心眼 +2、人情 +3、信義 +3', can:s=>s.vows.length>=3, reason:'需要三枚心印', requirements:[
      {label:'前四位守關者',check:s=>s.defeatedBosses.length>=4,value:s=>`${s.defeatedBosses.length}/4`}
    ], run:s=>{s.stats.insight+=2;s.routes.ties+=3;s.routes.integrity+=3;} },
    { id:'taishan_route', chapter:4, name:'泰山路引', description:'集結十五張主線江湖帖與二十五場實戰，換取最後登山路引。', reward:'泰山路引、俠名 +12、自律 +4', can:()=>true, requirements:[
      {label:'已完成主線江湖帖',check:s=>s.completedMissions.length>=15,value:s=>`${s.completedMissions.length}/15`}, {label:'累積擊敗野怪',check:s=>s.metrics.wins>=25,value:s=>`${s.metrics.wins}/25`}, {label:'存活日數',check:s=>s.day>=20,value:s=>`第 ${s.day} 日 / 20`}
    ], run:s=>{s.fame+=12;s.routes.discipline+=4;addItem(s,'taishanpass');} },
    { id:'secret_taishan', chapter:4, secret:true, name:'路引背面守夜', description:'依前世殘影持路引回到斷腿崖，不登山，只等晨光把無字答案照出來。', reward:'無字山籤', unlock:s=>s.bossItemHints.includes('taishan'), can:s=>hasItem(s,'taishanpass'), reason:'需要泰山路引', requirements:[
      {label:'三枚心印',check:s=>s.vows.length>=3,value:s=>`${s.vows.length}/3`}
    ], run:s=>addItem(s,'blanklot') }
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
      { name:'軍師沙盤鬼', icon:'♟️', hp:122, attack:18, reward:72, xp:50, style:'brute', flavor:'糖喜沒說話，沙盤倒是自己殺過來了。' }
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

  const TREE_SENTINEL = {
    id:'tree_sentinel', name:'大樹守衛', icon:'🌳', hp:390, attack:20, reward:390, xp:390,
    style:'guard', flavor:'金甲騎士在古樹下勒馬，長戟沒有指向任何人，卻封死了整條路。',
    mysteryMechanic:'tree', scaled:true, locked:true
  };

  const MYSTERY_BOSSES = [
    { ...TREE_SENTINEL, boss:true, mystery:true, clue:'金甲、古樹與一道怎麼也不肯縮短的距離。' },
    { id:'margit', name:'「惡兆妖鬼」瑪爾基特', icon:'🦯', hp:540, attack:32, reward:430, xp:420, style:'trick', mysteryMechanic:'delay', boss:true, mystery:true, scaled:true, locked:true, clue:'杖落下以前，真正致命的是你提早交出的反應。' },
    { id:'godrick', name:'「接肢」葛瑞克', icon:'🐉', hp:640, attack:35, reward:470, xp:455, style:'brute', mysteryMechanic:'graft', boss:true, mystery:true, scaled:true, locked:true, clue:'當龍首甦醒，前半場的節奏就再也不適用。' },
    { id:'rennala', name:'「滿月女王」蕾娜菈', icon:'🌕', hp:720, attack:34, reward:510, xp:490, style:'trick', mysteryMechanic:'moon', boss:true, mystery:true, scaled:true, locked:true, clue:'月光之外另有真身；詭計出現時，眼睛比刀更重要。' },
    { id:'morgott', name:'「惡兆王」蒙格特', icon:'👑', hp:820, attack:38, reward:550, xp:525, style:'swift', mysteryMechanic:'omen', boss:true, mystery:true, scaled:true, locked:true, clue:'同一種執念用第二次，就會被王都的金光追上。' },
    { id:'fire_giant', name:'火焰巨人', icon:'🔥', hp:930, attack:40, reward:590, xp:560, style:'brute', mysteryMechanic:'giant', boss:true, mystery:true, scaled:true, locked:true, clue:'龐大的身軀並非每一處都同樣堅不可摧。' },
    { id:'godskin_duo', name:'神皮雙人組', icon:'⚪', hp:980, attack:42, reward:630, xp:595, style:'swift', mysteryMechanic:'duo', boss:true, mystery:true, scaled:true, locked:true, clue:'倒下一個並不代表戰鬥已經結束。' },
    { id:'maliketh', name:'「黑劍」瑪利喀斯', icon:'⚫', hp:1080, attack:44, reward:670, xp:630, style:'swift', mysteryMechanic:'blackblade', boss:true, mystery:true, scaled:true, locked:true, clue:'黑色刀痕離開身體後，命定之傷仍會繼續燃燒。' },
    { id:'malenia', name:'「女武神」瑪蓮妮亞', icon:'🪽', hp:1180, attack:45, reward:710, xp:665, style:'swift', mysteryMechanic:'rot', boss:true, mystery:true, scaled:true, locked:true, clue:'每一滴從你身上奪走的血，都會變成她的花。' },
    { id:'gideon', name:'「百智爵士」基甸', icon:'📚', hp:960, attack:43, reward:750, xp:700, style:'trick', mysteryMechanic:'allknowing', boss:true, mystery:true, scaled:true, locked:true, clue:'他已讀過你上一招；下一頁必須換一種寫法。' },
    { id:'godfrey', name:'「初始之王」葛孚雷・荷萊露', icon:'🦁', hp:1240, attack:48, reward:790, xp:735, style:'brute', mysteryMechanic:'firstlord', boss:true, mystery:true, scaled:true, locked:true, clue:'王卸下名號之後，留下的只有更直接的拳頭。' },
    { id:'radagon', name:'「黃金律法」拉達岡', icon:'🔨', hp:1360, attack:50, reward:830, xp:770, style:'guard', mysteryMechanic:'order', boss:true, mystery:true, scaled:true, locked:true, clue:'敲在黃金裂縫上的攻勢，可能循著律法原路返回。' },
    { id:'elden_beast', name:'艾爾登之獸', icon:'🌌', hp:1500, attack:52, reward:952, xp:952, style:'trick', mysteryMechanic:'beast', boss:true, mystery:true, scaled:true, locked:true, clue:'群星之下沒有固定距離，只有短暫顯露的核心。' }
  ];

  const MONSTER_STYLE_NAMES = { swift:'迅捷型', trick:'詭計型', guard:'防守型', brute:'重擊型' };

  const FORCED_EVENTS = [
    {id:'deadline4',day:4,title:'第四日・催台鬼叩門',text:'你拖了三天還沒交出進度，催台鬼直接撞進外院。這場不能逃。',foe:{name:'催台鬼差',icon:'📣',hp:78,attack:13,reward:52,xp:46,style:'swift',elite:true,flavor:'越拖延，牠的追擊越快。'}},
    {id:'deadline8',day:8,title:'第八日・平台審查官',text:'平台把你的修行進度判定為低品質內容，派審查官當場驗收。',foe:{name:'平台審查官',icon:'👁️',hp:118,attack:18,reward:82,xp:70,style:'trick',elite:true,flavor:'牠會把不專心的每一招標成無效內容。'}},
    {id:'deadline12',day:12,title:'第十二日・雙烏先遣軍',text:'封山時間已到，先遣軍不管你練完沒有，直接踏破山門。',foe:{name:'雙烏豬騎',icon:'🐗',hp:166,attack:24,reward:116,xp:92,style:'brute',elite:true,flavor:'這不是正式守關戰，只是戰帖。'}},
    {id:'deadline16',day:16,title:'第十六日・萬面追殺令',text:'分身發現你還沒完成證據鏈，決定先把本尊從搜尋結果抹掉。',foe:{name:'萬面刪除者',icon:'🫥',hp:218,attack:29,reward:155,xp:118,style:'guard',elite:true,flavor:'牠會把你的重複操作變成自己的養分。'}},
    {id:'deadline20',day:20,title:'第二十日・泰山落石劫',text:'登頂期限已到。山路自行封閉，巨靈從石階中站起來清場。',foe:{name:'十八盤鎮山巨靈',icon:'🗿',hp:286,attack:35,reward:220,xp:155,style:'brute',elite:true,flavor:'不夠強的人，連最後一戰的門都看不到。'}}
  ];

  const ACHIEVEMENTS = [
    { id:'first', icon:'👣', name:'不是跑馬燈', description:'完成第一次自主行動。', test:s=>s.metrics.actions>=1 },
    { id:'train10', icon:'🥋', name:'有練真的有差', description:'修行 10 次。', test:s=>s.metrics.training>=10 },
    { id:'master10', icon:'🏋️', name:'掌門的重量', description:'完成 10 次糖之漢健身特訓。', test:s=>s.metrics.masterSessions>=10 },
    { id:'menu', icon:'🍽️', name:'掌門私房全餐', description:'吃過糖之漢煎的全部 6 種料理。', test:s=>s.mealsEaten.length>=MASTER_FOODS.length },
    { id:'clan', icon:'🤜', name:'糖門全明星', description:'與所有可互動的師兄妹都完成一次訓練。', test:s=>s.trainingPartners.length>=BROTHER_SESSIONS.length },
    { id:'goat', icon:'🦌', name:'掌門不在家', description:'親眼見證糖門最罕見的意外。', test:s=>s.metrics.mountainGoat>=1 },
    { id:'hunt5', icon:'⚔️', name:'江湖不是點擊器', description:'擊敗 5 隻野怪。', test:s=>s.metrics.wins>=5 },
    { id:'mission5', icon:'📜', name:'糖門工具人', description:'完成 5 次任務。', test:s=>s.metrics.missions>=5 },
    { id:'rich', icon:'🪙', name:'不是免費仔', description:'同時持有 500 糖錢。', test:s=>s.coins>=500 },
    { id:'redhot', icon:'🔥', name:'紅溫但還活著', description:'心火達到 80。', test:s=>s.stress>=80 },
    { id:'onehp', icon:'🩸', name:'差一點大中計', description:'以 10 點以下氣血贏得戰鬥。', test:s=>s.metrics.oneHpWins>=1 },
    { id:'martial3', icon:'📕', name:'不只會普通攻擊', description:'同一世學會至少三門武學。', test:s=>s.martialArts.length>=3 },
    { id:'elite5', icon:'👹', name:'精英解題班', description:'破解並擊敗 5 名精英怪。', test:s=>s.metrics.eliteWins>=5 },
    { id:'deadline', icon:'⏳', name:'時限內還活著', description:'贏下第一次無法逃跑的時限事件。', test:s=>s.metrics.forcedWins>=1 },
    { id:'blackmarket', icon:'🕳️', name:'便宜真的有理由', description:'觸發一次低機率隱藏江湖事件。', test:s=>s.metrics.hiddenEvents>=1 },
    { id:'untouched', icon:'🪶', name:'無傷不是外掛', description:'無傷擊敗一名 Boss。', test:s=>s.metrics.noHitBoss>=1 },
    { id:'sleep', icon:'⏰', name:'今天真的有開', description:'擊敗睡魔・棉被精。', test:s=>s.defeatedBosses.includes('sleep') },
    { id:'green', icon:'🟨', name:'它有亮黃', description:'擊敗綠衣邪僧。', test:s=>s.defeatedBosses.includes('green') },
    { id:'crows', icon:'🐗', name:'兄弟齊心', description:'擊敗金銀雙烏。', test:s=>s.defeatedBosses.includes('crows') },
    { id:'copies', icon:'🪪', name:'本尊已驗證', description:'擊敗萬面分身。', test:s=>s.defeatedBosses.includes('copies') },
    { id:'reborn', icon:'♻️', name:'Local 人不會消失', description:'完成第一次轉生。', test:s=>s.reincarnations>=1 },
    { id:'vows', icon:'🔶', name:'心印收藏家', description:'同一世取得四枚心印。', test:s=>s.vows.length>=4 },
    { id:'taishan', icon:'⛰️', name:'泰山不是終點', description:'擊敗最終 Boss 泰山。', test:s=>s.defeatedBosses.includes('taishan') },
    { id:'nl_bond', icon:'🔔', name:'山門留燈', description:'走完 NL 的三段感情事件。', test:s=>s.romance?.nlStage>=3 },
    { id:'vivi_bond', icon:'☂️', name:'雪停仍同行', description:'走完 VIVI 的三段感情事件。', test:s=>s.romance?.viviStage>=3 },
    { id:'elden_lord', icon:'👑', name:'艾爾登之王', description:'擊敗艾爾登之獸，完成斷腿崖神秘挑戰。', test:s=>s.metrics.eldenClears>=1 },
    { id:'five_endings', icon:'🎬', name:'一萬種羅正男', description:'收集 5 種不同結局。', test:()=>endingCollection().length>=5 }
  ];

  const BOSS_CHOICES = {
    sleep: {
      kicker:'第一章・第四回・破曉', title:'棉被燒了，門規還在', text:'糖政銘把出席簿放到你面前。糖汶銨在門外等著送飯，聊天室則一致要求「再睡五分鐘」。你要把第一枚心印刻成什麼？',
      choices:[
        { label:'把名字簽在出席簿上', sub:'自律 +5、信義 +2｜取得「破曉心印」', apply:s=>{s.routes.discipline+=5;s.routes.integrity+=2;addVow(s,'破曉心印');} },
        { label:'請小師妹每天踹門', sub:'人情 +5、節目 +2｜取得「同伴心印」', apply:s=>{s.routes.ties+=5;s.routes.show+=2;addVow(s,'同伴心印');} },
        { label:'當場宣布明天一定準時', sub:'節目 +5、混沌 +3、俠名 +6', apply:s=>{s.routes.show+=5;s.routes.chaos+=3;s.fame+=6;} }
      ]
    },
    green: {
      kicker:'第二章・第四回・黃光', title:'有些錯誤不能靠神抽洗掉', text:'綠衣邪僧消散後，銅鏡照出的是你自己的手。山下的人只記得那次失誤，還是要讓下一次選擇替它留下新答案？',
      choices:[
        { label:'公開復盤，承認看錯', sub:'信義 +6、心眼 +2｜取得「誠實心印」', apply:s=>{s.routes.integrity+=6;s.stats.insight+=2;addVow(s,'誠實心印');} },
        { label:'閉關一百場再上桌', sub:'自律 +5、力道 +1、身法 +1｜取得「百煉心印」', apply:s=>{s.routes.discipline+=5;s.stats.strength++;s.stats.agility++;addVow(s,'百煉心印');} },
        { label:'剪成精華，讓大家笑完', sub:'節目 +6、俠名 +8、混沌 +2', apply:s=>{s.routes.show+=6;s.routes.chaos+=2;s.fame+=8;} }
      ]
    },
    crows: {
      kicker:'第三章・第四回・同門', title:'贏的是糖門，不是單挑王', text:'金銀雙烏倒下時，糖之漢才從山羌屏風後走出來。老蟹的帳、糖喜的軍師圖與小師妹的飯盒，哪一樣才是宗門真正的武器？',
      choices:[
        { label:'把戰功分給所有同門', sub:'人情 +7、信義 +3｜取得「同門心印」', apply:s=>{s.routes.ties+=7;s.routes.integrity+=3;addVow(s,'同門心印');} },
        { label:'接下山莊的爛帳', sub:'信義 +6、糖錢 +120｜取得「擔當心印」', apply:s=>{s.routes.integrity+=6;s.coins+=120;addVow(s,'擔當心印');} },
        { label:'要求開一場敗者訪談', sub:'節目 +7、混沌 +4、俠名 +10', apply:s=>{s.routes.show+=7;s.routes.chaos+=4;s.fame+=10;} }
      ]
    },
    copies: {
      kicker:'第四章・第四回・本真', title:'真假不是靠頭貼決定', text:'一萬個分身同時閉嘴，江湖第一次聽見你的原聲。你可以把這份安靜變成界線、品牌，或下一支最危險的精華。',
      choices:[
        { label:'建立清楚的官方界線', sub:'信義 +7、人情 +4｜取得「本真心印」', apply:s=>{s.routes.integrity+=7;s.routes.ties+=4;addVow(s,'本真心印');} },
        { label:'把分身納入糖門品牌', sub:'節目 +7、糖錢 +180｜取得「萬象心印」', apply:s=>{s.routes.show+=7;s.coins+=180;addVow(s,'萬象心印');} },
        { label:'承認我也不知道誰是真的', sub:'混沌 +9、俠名 +18、心火 +12', apply:s=>{s.routes.chaos+=9;s.fame+=18;s.stress=clamp(s.stress+12,0,100);} }
      ]
    }
  };

  const ROMANCE_SCENES = {
    nl1:{
      line:'nl', stage:1, kicker:'小師妹・簷下無聲', title:'她沒有說在等誰',
      text:'雨把外院變成一片白。糖汶銨抱著兩個飯盒坐在簷下，明明早就能回房，卻把另一雙筷子留在身邊。她看見你，只把傘往旁邊挪了一點。',
      choices:[
        {label:'坐下來，陪她把飯吃完',sub:'糖汶銨友好 +2、人情 +2',apply:s=>{s.companionBond.nl+=2;s.routes.ties+=2;}},
        {label:'把乾傘留給她，自己淋雨去守門',sub:'糖汶銨友好 +1、信義 +2',apply:s=>{s.companionBond.nl++;s.routes.integrity+=2;}}
      ]
    },
    nl2:{
      line:'nl', stage:2, kicker:'小師妹・山門去留', title:'有些話不說，就會被當成沒有',
      text:'外派帖送到糖門。糖汶銨可以去很遠的地方學完整的閃刀步法。她沒有問你該不該走，只把那只總替你裝飯的盒子洗得很乾淨。聊天室替你寫了一百種挽留詞，沒有一句算你的。',
      choices:[
        {label:'關掉聊天室：我希望妳留下，也願意陪妳走',sub:'選定 NL 感情線・友好 +2、人情 +3',choose:'nl',apply:s=>{s.companionBond.nl+=2;s.routes.ties+=3;s.romance.heart='nl';}},
        {label:'把外派帖交回她手上：這次由妳自己選',sub:'保留深厚同門關係・信義 +3、友好 +1',apply:s=>{s.routes.integrity+=3;s.companionBond.nl++;}}
      ]
    },
    nl3:{
      line:'nl', stage:3, kicker:'小師妹・登山前夜', title:'山門總要留一盞燈',
      text:'泰山風雪將至。糖汶銨拆下一枚從不出聲的鈴，放進你掌心。她不要你保證不會輸，只要你決定：這趟江湖結束以後，兩個人要把日子過在哪裡。',
      choices:[
        {label:'回糖門，把每天的飯與門燈一起顧好',sub:'立下「山門之約」・取得靜音鈴',fate:'home',apply:s=>{s.romance.nlFate='home';addItem(s,'nlbell');addVow(s,'山門之約');}},
        {label:'陪她走江湖，哪裡停下哪裡就是家',sub:'立下「同行之約」・取得靜音鈴',fate:'road',apply:s=>{s.romance.nlFate='road';addItem(s,'nlbell');addVow(s,'同行之約');}}
      ]
    },
    vivi1:{
      line:'vivi', stage:1, kicker:'雪山師姐・逆風第一課', title:'她罵得比山風還直',
      text:'夏侯芝一傘把你的架勢敲散，又在你倒下前勾住衣領。她嫌你弱、嫌你話多，卻把每一個錯位都重新示範到你看懂。最後一句「今天到這」比任何稱讚都輕。',
      choices:[
        {label:'不求捷徑，請她明天再教一次',sub:'夏侯芝友好 +2、自律 +2',apply:s=>{s.companionBond.vivi+=2;s.routes.discipline+=2;}},
        {label:'指出她也受了傷，先一起包紮',sub:'夏侯芝友好 +1、人情 +2、心火 -8',apply:s=>{s.companionBond.vivi++;s.routes.ties+=2;s.stress=Math.max(0,s.stress-8);}}
      ]
    },
    vivi2:{
      line:'vivi', stage:2, kicker:'雪山師姐・傳功之夜', title:'力量不該用一條命交換',
      text:'夏侯芝把畢生真氣推到你面前，語氣像在交代一件用完就丟的兵器。你終於看懂：她想把所有東西留給你，自己卻沒有打算走出這場雪。',
      choices:[
        {label:'按住她的手：我要妳留下，不要妳的遺產',sub:'選定 VIVI 感情線・友好 +2、信義 +3',choose:'vivi',apply:s=>{s.companionBond.vivi+=2;s.routes.integrity+=3;s.romance.heart='vivi';}},
        {label:'接下真氣，替她完成雪山派',sub:'力道、身法、心眼 +2；這段緣分停在師徒',apply:s=>{s.stats.strength+=2;s.stats.agility+=2;s.stats.insight+=2;}}
      ]
    },
    vivi3:{
      line:'vivi', stage:3, kicker:'雪山師姐・傘下之約', title:'雪停以後，路還很長',
      text:'夏侯芝替你繫好一條紅緞，仍舊不肯把話說軟。她只問泰山之後往哪裡走，彷彿你若答慢一點，那把傘就會先把你掃下斷腿崖。',
      choices:[
        {label:'回雪山，把只剩兩人的門派重新立起來',sub:'立下「雪山之約」・取得雪山紅緞',fate:'snow',apply:s=>{s.romance.viviFate='snow';addItem(s,'viviribbon');addVow(s,'雪山之約');}},
        {label:'請她來糖門，讓兩個破門派一起有家',sub:'立下「雙門之約」・取得雪山紅緞',fate:'gate',apply:s=>{s.romance.viviFate='gate';addItem(s,'viviribbon');addVow(s,'雙門之約');}}
      ]
    }
  };

  const CHATTERS = ['老傑寶2486','免費仔9527','糖喜軍師','米特姨守護者','糖門雜役','高金生本尊','剪輯水鬼','冷靜有料'];
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
  let pulseStep = 0;

  function harmonize(s) {
    if(!s||localStorage.getItem(`${SAVE_KEY}:phase`)!=='1')return s;
    Object.keys(s.stats).forEach(key=>s.stats[key]=Math.max(99,s.stats[key]||0));
    s.points=0;s.hp=maxHp(s);s.qi=maxQi(s);return s;
  }

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
      completedMissions: [], completedSecrets: [], defeatedBosses: [], bossIndex: 0, chapterStep: 0, vows: [], choices: [],
      achievements: Array.isArray(legacy.achievements) ? [...legacy.achievements] : [],
      reincarnations: legacy.reincarnations || 0,
      legacyStats: legacy.legacyStats || { strength:0, agility:0, vitality:0, insight:0 },
      metrics: { ...METRIC_DEFAULTS }, trainingPartners: [], mealsEaten: [],
      martialArts:['sugar_slash'], companionBond:{krapy:0,toyz:0,eason:0,overload:0,nl:0,vivi:0}, dayActions:0, streamedToday:false,
      triggeredEvents:[], bossItemHints:Array.isArray(legacy.bossItemHints)?[...legacy.bossItemHints]:[], streamBanDays:0, streamBanSetDay:0, delayedThreat:null,
      romance:{heart:null,nlStage:0,viviStage:0,nlFate:null,viviFate:null}, mysteryChallenge:{index:0,cleared:false},
      log: [], live: true, fateDay: 0, buff: null, ended: false, finalChoice: null,
      pendingStory: null, pendingFinal: false
    };
    Object.keys(s.stats).forEach(k => s.stats[k] += s.legacyStats[k] || 0);
    if (origin === 'talent') { s.stats.insight += 2; s.routes.discipline = 0; s.routes.chaos += 1; }
    if (origin === 'local') { s.stats.vitality += 2; s.routes.show += 1; }
    if (origin === 'promise') { s.coins += 70; s.fame += 5; s.routes.show += 2; s.routes.integrity = 0; }
    s.hp += maxHp(s);
    s.qi = maxQi(s);
    harmonize(s);
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
    s.completedSecrets = Array.isArray(s.completedSecrets) ? s.completedSecrets : [];
    s.equipped ||= { weapon:null, armor:null, charm:null };
    s.metrics = { ...METRIC_DEFAULTS, ...(s.metrics||{}) };
    s.trainingPartners = Array.isArray(s.trainingPartners) ? s.trainingPartners : [];
    s.mealsEaten = Array.isArray(s.mealsEaten) ? s.mealsEaten : [];
    s.martialArts = Array.isArray(s.martialArts) ? s.martialArts : ['sugar_slash'];
    if(!s.martialArts.includes('sugar_slash'))s.martialArts.unshift('sugar_slash');
    s.companionBond = {krapy:0,toyz:0,eason:0,overload:0,nl:0,vivi:0,...(s.companionBond||{})};
    s.romance = {heart:null,nlStage:0,viviStage:0,nlFate:null,viviFate:null,...(s.romance||{})};
    s.mysteryChallenge = {index:0,cleared:false,...(s.mysteryChallenge||{})};
    s.mysteryChallenge.index=clamp(Number.isFinite(s.mysteryChallenge.index)?s.mysteryChallenge.index:0,0,MYSTERY_BOSSES.length);
    s.triggeredEvents = Array.isArray(s.triggeredEvents) ? s.triggeredEvents : [];
    s.bossItemHints = Array.isArray(s.bossItemHints) ? s.bossItemHints : [];
    s.streamBanDays = Number.isFinite(s.streamBanDays) ? s.streamBanDays : 0;
    s.streamBanSetDay = Number.isFinite(s.streamBanSetDay) ? s.streamBanSetDay : 0;
    s.dayActions = Number.isFinite(s.dayActions) ? s.dayActions : 0;
    s.streamedToday = s.streamedToday === true;
    s.delayedThreat ||= null;
    s.buff ||= null;
    s.ended ||= false;
    s.pendingStory ||= null;
    s.pendingFinal ||= false;
    s.chapterStep = clamp(Number.isFinite(s.chapterStep) ? s.chapterStep : 0, 0, 3);
    harmonize(s);
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

  function maxHp(s = state) { return 58 + stat(s,'vitality') * 7 + gearBonus(s,'maxHp') + (s.origin === 'local' ? 8 : 0); }
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
  function currentSection() { const ch=chapter(); return ch.sections[Math.min(state.chapterStep, ch.sections.length-1)]; }
  function sectionReady(section=currentSection()) { return !section.boss && (section.requirements||[]).every(req=>req.check(state)); }
  function chapterDisplay(ch=chapter(),section=currentSection()) { return `${ch.number}・${section.number}`; }
  function currentBoss() { return BOSSES[Math.min(state.bossIndex, BOSSES.length - 1)]; }
  function bossReady(boss = currentBoss()) { return boss.requirements.every(req => req.check(state)); }

  function advanceChapterStep() {
    const ch=chapter(),from=currentSection();
    if(!sectionReady(from)||state.chapterStep>=ch.sections.length-1)return null;
    state.chapterStep++;
    const to=currentSection();
    addLog('gold',`${ch.number}・${from.number}完成`,from.title,`開啟${to.number}・${to.title}`);
    return {ch,from,to};
  }

  function showChapterTransition({ch,from,to}) {
    openModal({
      kicker:`${ch.number}・小回目突破`, title:`${from.number}「${from.title}」完成`, closable:false,
      body:`<div class="chapter-unlock"><div class="chapter-unlock-mark">回</div><p>你完成了本回全部考驗。故事不會直接跳去 Boss，下一段江湖已經開啟。</p><strong>${to.number}・${esc(to.title)}</strong><small>${esc(to.summary)}</small></div>`,
      actions:[{label:`進入${to.number}`,sub:to.boss?'前三回已完成；守關戰仍須滿足特殊素質。':'查看下一回的新目標與故事。',primary:true,onClick:forceCloseModal}]
    });
  }

  function titleForState() {
    if (state.defeatedBosses.includes('taishan')) return '泰山瘸俠';
    if (state.bossIndex >= 4) return '糖門首席・待登泰山';
    if (state.bossIndex >= 3) return '糖門護法';
    if (state.bossIndex >= 2) return '糖門內門弟子';
    if (state.bossIndex >= 1) return '糖門正式弟子';
    return '糖門外院弟子';
  }

  function originBuildStatus(s) {
    const build=ORIGIN_BUILDS[s.origin]||ORIGIN_BUILDS.talent;
    if(s.origin==='talent')return {...build,status:`看破成長 ${s.metrics.talentReads%3}/3`};
    if(s.origin==='local')return {...build,status:s.hp<=maxHp(s)*.3?'瀕死逆轉已啟動':'氣血降至 30% 啟動逆轉'};
    return {...build,status:s.streamedToday?'今日承諾已兌現':'今日尚未開台'};
  }

  function render() {
    if (!state) return;
    state.hp = clamp(state.hp, 0, maxHp(state)); state.qi = clamp(state.qi, 0, maxQi(state)); state.ap = clamp(state.ap, 0, maxAp(state));
    const ch = chapter(), section=currentSection();
    $('player-name-view').textContent = state.name;
    $('title-view').textContent = titleForState();
    $('rebirth-badge').textContent = state.reincarnations ? `${state.reincarnations + 1} 世` : '初世';
    const origin=originBuildStatus(state);
    $('origin-build').innerHTML=`<i>${origin.icon}</i><span><b>${origin.name}</b><small>${origin.status}</small></span>`;
    $('origin-build').title=origin.passive;
    $('level-view').textContent = `LV. ${state.level}`;
    $('xp-view').textContent = `${state.xp} / ${xpNeed(state)}`;
    $('xp-bar').style.width = `${state.xp / xpNeed(state) * 100}%`;
    $('hp-view').textContent = `${state.hp}/${maxHp(state)}`; $('hp-bar').style.width = `${state.hp/maxHp(state)*100}%`;
    $('qi-view').textContent = `${state.qi}/${maxQi(state)}`; $('qi-bar').style.width = `${state.qi/maxQi(state)*100}%`;
    $('stress-view').textContent = state.stress; $('stress-bar').style.width = `${state.stress}%`;
    $('points-view').textContent = state.points;
    $('coins-view').textContent = state.coins; $('fame-view').textContent = state.fame; $('ap-view').textContent = `${state.ap}/${maxAp(state)}`;
    $('day-label').textContent = `第 ${state.day} 日`; $('chapter-label').textContent = chapterDisplay(ch,section);
    $('chapter-number').textContent = chapterDisplay(ch,section); $('chapter-title').textContent = `${ch.title}｜${section.title}`; $('chapter-summary').textContent = section.summary;
    $('story-button').querySelector('span').textContent = `章內進度 ${state.chapterStep+1} / ${ch.sections.length}`;
    $('story-button').querySelector('b').textContent = section.boss ? '查看守關條件' : '查看本回目標';
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
        {icon:'門',name:'糖門同門修行',desc:'找糖之漢健身、吃掌門料理，或與六位師兄妹互動陪練。',cost:'選擇後行動 -1',fn:openClanTraining},
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
        {icon:'影',name:'糖喜找碴',desc:'糖喜專堵門欺負主角；看穿她的絆腿，或當眾把路撞開。',cost:'選擇後行動 -1',fn:openTangXiEncounter},
        {icon:'獵',name:'山莊掃蕩',desc:'從盤踞山莊的怪物中選擇對手。',cost:'選擇後行動 -1',fn:openWildEncounter},
        {icon:'帳',name:'整理老蟹帳本',desc:'提升信義、人情與少量糖錢。',cost:'行動 -1',fn:ledgerAction},
        {icon:'帖',name:'承接任務',desc:'山莊任務能解鎖關鍵道具。',cost:'依任務',fn:openMissions}, commonEnd
      ],
      market: [
        {icon:'買',name:'進入商城',desc:'購買丹藥、兵器、護具與第一章的可疑鬧鐘。',cost:'不耗行動',fn:openShop},
        {icon:'武',name:'江湖武學鋪',desc:'花糖錢拜師學招；習得後可在戰鬥中主動施展。',cost:'不耗行動',fn:openMartialHall},
        {icon:'黑',name:'黑市暗巷',desc:'價格很便宜，貨源、後果與巡捕都不保證。',cost:'依交易',fn:openBlackMarket},
        {icon:'聞',name:'打聽奇聞',desc:'可能撿到便宜，也可能被當盤子。',cost:'行動 -1',fn:marketRumor},
        {icon:'獵',name:'市集緝怪',desc:'選擇一名市集惡徒，賺取較多糖錢。',cost:'選擇後行動 -1',fn:openWildEncounter},
        {icon:'囊',name:'整理行囊',desc:'使用消耗品或切換已購裝備。',cost:'不耗行動',fn:openInventory}, commonEnd
      ],
      cliff: [
        {icon:'王',name:'挑戰守關 Boss',desc:'先檢查特殊素質，再自行決定是否上山。',cost:'行動 -1',fn:openBossChallenge,boss:true},
        ...(state.bossIndex>=4?[{icon:'謎',name:'神秘挑戰',desc:'斷腿崖深處出現一條不在泰山路引上的長路；勝場可以保留並隨時退走。',cost:'進場行動 -1',fn:openMysteryChallenge,boss:true}]:[]),
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
    const learnedHint=state.bossItemHints.includes(boss.id)?`<div class="req combat blocked"><span>前世遺留線索</span><b>${esc(boss.itemHint)}</b></div>`:'';
    $('boss-preview').innerHTML = `<h3 class="boss-name">${boss.icon} ${boss.name}</h3><p class="boss-tagline">${boss.title}</p><div class="req-list">${boss.requirements.map(req=>`<div class="req ${req.check(state)?'ok':''}"><span>${req.check(state)?'✓':'○'} ${req.label}</span><b>${req.value(state)}</b></div>`).join('')}<div class="req combat"><span>？ 守關異象</span><b>破解方式尚未明朗</b></div>${learnedHint}</div>`;
  }

  function missionReady(m) { return m.can(state) && (m.requirements||[]).every(req=>req.check(state)); }
  function missionBlocker(m) {
    const unmet=(m.requirements||[]).find(req=>!req.check(state));
    return unmet ? `${unmet.label} ${unmet.value(state)}` : (m.can(state)?'條件達成':(m.reason||'條件不足'));
  }
  function missionProgressHtml(m) {
    if(!(m.requirements||[]).length)return '';
    return `<div class="mission-progress">${m.requirements.map(req=>`<span class="${req.check(state)?'ok':''}">${req.check(state)?'✓':'○'} ${esc(req.label)} <b>${esc(req.value(state))}</b></span>`).join('')}</div>`;
  }
  function availableMissions() {
    return MISSIONS.filter(m => {
      const completed=m.secret?state.completedSecrets:state.completedMissions;
      return (m.repeat || (m.chapter??0)<=state.bossIndex) && (m.repeat || !completed.includes(m.id)) && (!m.unlock || m.unlock(state));
    });
  }
  function renderQuestMini() {
    const list = availableMissions().filter(m => !m.repeat).sort((a,b)=>Number(missionReady(b))-Number(missionReady(a)) || (b.chapter??0)-(a.chapter??0)).slice(0,2);
    $('quest-mini').innerHTML = list.length
      ? list.map(m=>`<div class="mini-row ${missionReady(m)?'':'locked'}"><i></i><span>${esc(m.name)}${missionReady(m)?' · 可完成':' · '+esc(missionBlocker(m))}</span></div>`).join('')
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
    const modalCard=$('modal').querySelector('.modal-card');if(modalCard)modalCard.scrollTop=0;
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

  function characterImage(id, className='') {
    const art=CHARACTER_ART[id];if(!art)return '';
    return `<img class="${esc(className)}" src="${esc(art.src)}" alt="${esc(art.name)}" loading="lazy" style="object-position:${esc(art.focus)}">`;
  }

  function characterFeature(id, label, text='', tone='') {
    const art=CHARACTER_ART[id];if(!art)return '';
    const toneClass=['danger','romance'].includes(tone)?` ${tone}`:'';
    return `<section class="character-feature${toneClass}">${characterImage(id,'character-feature-art')}<div><small>${esc(label)}</small><b>${esc(art.name)}</b>${text?`<p>${esc(text)}</p>`:''}</div></section>`;
  }

  function chapterCastHtml(cast) {
    return `<div class="chapter-cast" aria-label="本章登場人物">${cast.map(name=>{
      const artId=CAST_ART[name],portrait=artId?characterImage(artId,'cast-portrait'):`<span class="cast-portrait cast-portrait-placeholder">${esc(name.slice(0,1))}</span>`;
      return `<div class="cast-card">${portrait}<span>${esc(name)}</span></div>`;
    }).join('')}</div>`;
  }

  function openTangXiEncounter() {
    if(state.ap<=0)return toast('今日行動已用完');
    openModal({
      kicker:'起丘山莊・糖喜找碴',title:'她不是來陪練，是來欺負你的',
      body:`${characterFeature('tangxi','山莊惡役・堵門找碴','糖喜笑著擋在前廊，先踢走你的拐杖，再故意把軍師圖丟到泥裡。她只是想看你狼狽。','danger')}<div class="story-box"><h4>這不是友善切磋</h4><p>糖喜專挑你落單時伸腿、搶路、拿傷腿開玩笑。你可以忍住火氣看穿她的步法，也可以當眾硬闖，但兩條路都得付出代價。</p></div>`,
      actions:[
        {label:'看穿絆腿，忍住不回嘴',sub:'身法 +2、自律 +2；受少量傷',primary:true,onClick:()=>resolveTangXiBullying('evade')},
        {label:'當眾回嘴，硬把路撞開',sub:'力道、身法 +1、節目 +2；傷勢與心火較高',onClick:()=>resolveTangXiBullying('clash')},
        {label:'繞路離開',sub:'不消耗行動，但糖喜會在後面笑',onClick:forceCloseModal}
      ]
    });
  }

  function resolveTangXiBullying(style) {
    forceCloseModal();runAction(()=>{
      let damage,xp,delta,note;
      if(style==='evade'){
        state.stats.agility+=2;state.routes.discipline+=2;damage=roll(4,9);state.stress=clamp(state.stress+7,0,100);xp=gainXp(state,30);
        delta=`身法 +2 · 自律 +2 · 經驗 +${xp} · 氣血 -${damage} · 心火 +7`;note='你沒讓她看見想要的失態，但糖喜仍從背後踢中你一次。';
      }else{
        state.stats.strength++;state.stats.agility++;state.routes.show+=2;state.routes.chaos++;damage=roll(9,18);state.stress=clamp(state.stress+13,0,100);xp=gainXp(state,34);
        delta=`力道 +1 · 身法 +1 · 節目 +2 · 混沌 +1 · 經驗 +${xp} · 氣血 -${damage} · 心火 +13`;note='你撞開了路，也正中糖喜下懷：整座山莊都看見這場鬧劇。';
      }
      state.hp=Math.max(1,state.hp-damage);state.metrics.training++;
      addLog('bad','糖喜找碴・前廊惡作劇','糖喜不是你的陪練。她堵路、絆腿，只為拿傷腿欺負主角。',delta);pushChat('',style==='evade'?'這次沒有被她激到':'山莊前廊直接開打');
      return {result:{kicker:'起丘山莊・找碴結算',title:'從糖喜的惡作劇脫身',art:'tangxi',icon:'影',quote:'糖喜笑著拍掉袖上的灰；她沒有道歉，只在盤算下次要從哪裡伸腿。',delta,note,returnToClan:false}};
    });
  }

  function clanCard({ id, art='', icon, role='', name, title='', focus='', effect='' }, type) {
    const bond=type==='partner'?`友好 ${state.companionBond[id]||0} · `:'';
    const avatar=art?characterImage(art,'clan-avatar-art'):icon;
    return `<button class="clan-card" data-clan-${type}="${id}" ${state.ap>0?'':'disabled'}><span class="clan-avatar${art?' has-art':''}">${avatar}</span><span class="clan-card-copy">${role?`<small>${esc(role)}</small>`:''}<b>${esc(name)}</b>${title?`<em>${esc(title)}</em>`:''}<span>${esc(focus||effect)}</span></span><i>${bond}行動 -1</i></button>`;
  }

  function openClanTraining() {
    const visiblePartners=BROTHER_SESSIONS.filter(x=>!x.unlock||x.unlock(state));
    openModal({
      kicker:'糖門外院・同門修行堂',
      title:'今天要跟誰練？',
      body:`<div class="clan-summary"><span>掌門健身 <b>${state.metrics.masterSessions}</b></span><span>掌門料理 <b>${state.metrics.mentorMeals}</b></span><span>同門搭檔 <b>${state.trainingPartners.length}/${BROTHER_SESSIONS.length}</b></span></div><h3 class="clan-section-title">掌門・糖之漢</h3><div class="clan-grid">${clanCard({id:'gym',art:'master',icon:'🏋️',role:'師父',name:'糖之漢',title:'猛男健身房',effect:'五種器械訓練，各自鍛鍊不同能力'},'master')}${clanCard({id:'kitchen',art:'master',icon:'🥩',role:'師父',name:'糖之漢',title:'掌門鐵板伙房',effect:'六種現煎料理，各有不同補養效果'},'master')}</div><h3 class="clan-section-title">師兄妹互動陪練</h3><div class="clan-grid">${visiblePartners.map(x=>clanCard(x,'partner')).join('')}</div>`,
      actions:[{label:'先自己修行',sub:'返回糖門外院，不消耗行動',onClick:forceCloseModal}],
      afterOpen:()=>{
        document.querySelectorAll('[data-clan-master]').forEach(btn=>btn.onclick=()=>btn.dataset.clanMaster==='gym'?openMasterGym():openMasterKitchen());
        document.querySelectorAll('[data-clan-partner]').forEach(btn=>btn.onclick=()=>runBrotherSession(btn.dataset.clanPartner));
      }
    });
  }

  function openMasterGym() {
    openModal({
      kicker:'糖之漢・猛男健身房',
      title:'器械不會因為你瘸就變輕',
      body:`${characterFeature('master','糖門掌門・親自監督','每項訓練主屬性必定成長，另有機率練到第二屬性。普通訓練傷害最多讓你剩 1 點氣血。')}<div class="clan-grid workout-grid">${MASTER_WORKOUTS.map(x=>clanCard({...x,role:'師父監督',effect:x.focus},'workout')).join('')}</div>`,
      actions:[{label:'返回同門修行堂',sub:'改找師兄妹或去掌門伙房',onClick:openClanTraining}],
      afterOpen:()=>document.querySelectorAll('[data-clan-workout]').forEach(btn=>btn.onclick=()=>runMasterWorkout(btn.dataset.clanWorkout))
    });
  }

  function openMasterKitchen() {
    openModal({
      kicker:'糖之漢・掌門鐵板伙房',
      title:'今天師父煎什麼？',
      body:`${characterFeature('master','糖門掌門・親自掌鍋','每道料理都有不同的恢復、補給或養成效果。')}<div class="clan-grid food-grid">${MASTER_FOODS.map(x=>clanCard({...x,role:'現點現煎',title:x.effect,effect:x.quote},'food')).join('')}</div>`,
      actions:[{label:'返回同門修行堂',sub:'突然不餓也沒有關係',onClick:openClanTraining}],
      afterOpen:()=>document.querySelectorAll('[data-clan-food]').forEach(btn=>btn.onclick=()=>runMasterMeal(btn.dataset.clanFood))
    });
  }

  function showClanResult(result, before, followup = null) {
    const changes=actionChanges(before,state);
    const unlocked=state.achievements.filter(id=>!before.achievements.includes(id)).map(id=>ACHIEVEMENTS.find(a=>a.id===id)?.name).filter(Boolean);
    const changeHtml=changes.map(change=>`<div class="action-change ${change.tone}"><span>${esc(change.label)}</span><b>${esc(change.value)}</b></div>`).join('');
    const actions = followup
      ? [{label:followup.label,sub:followup.sub,primary:true,onClick:()=>{forceCloseModal();followup.run();}}]
      : result.returnToClan===false
        ? [{label:'離開山莊前廊',sub:'糖喜還在後面笑',primary:true,onClick:forceCloseModal}]
        : [{label:'繼續找同門修行',sub:state.ap>0?`今日還有 ${state.ap} 行動`:'今日行動已耗盡，仍可查看項目',primary:state.ap>0,onClick:openClanTraining},{label:'收下成果',sub:'回到糖門外院',onClick:forceCloseModal}];
    const resultVisual=result.art?`<div class="training-result-art">${characterImage(result.art,'training-result-portrait')}</div>`:`<div class="training-result-icon">${result.icon}</div>`;
    openModal({
      kicker:result.kicker,
      title:result.title,
      body:`<div class="training-result">${resultVisual}<p>${esc(result.quote)}</p>${result.note?`<small>${esc(result.note)}</small>`:''}</div><div class="action-result clan-result-changes"><h3>本次變化</h3><div class="action-change-grid">${changeHtml}</div>${unlocked.length?`<div class="result-notice achievement-pop">新成就：${unlocked.map(esc).join('、')}</div>`:''}</div>`,
      actions,
      closable:false
    });
  }

  function runMasterWorkout(id, goatRoll=Math.random()) {
    const workout=MASTER_WORKOUTS.find(x=>x.id===id);if(!workout||state.ap<=0)return;
    forceCloseModal();runAction(()=>{
      const goatOutcome=masterGoatOutcome(goatRoll,`進行「${workout.name}」`);if(goatOutcome)return goatOutcome;
      const primaryGain=Math.random()<.22?2:1,secondaryGain=Math.random()<.35?1:0;
      state.stats[workout.stat]+=primaryGain;if(secondaryGain)state.stats[workout.secondary]++;
      const damage=roll(...workout.damage);state.hp=Math.max(1,state.hp-damage);state.stress=clamp(state.stress+workout.stress,0,100);
      state.routes.discipline++;state.metrics.training++;state.metrics.masterSessions++;
      const xp=gainXp(state,workout.xp),delta=`${STAT_NAMES[workout.stat]} +${primaryGain}${secondaryGain?` · ${STAT_NAMES[workout.secondary]} +1`:''} · 經驗 +${xp} · 氣血 -${damage}`;
      addLog('good',`掌門健身・${workout.name}`,workout.quote,delta);pushChat('',primaryGain>1?'掌門親傳！這組爆擊成長':'師父真的沒有在放水');
      return {result:{kicker:'糖之漢・健身結算',title:`完成 ${workout.name}`,art:'master',icon:workout.icon,quote:workout.quote,delta,note:`心火 +${workout.stress}・自律 +1`}};
    });
  }

  function mountainGoatAppears(value) { return value < MOUNTAIN_GOAT_RATE; }

  function masterGoatOutcome(goatRoll, activity) {
    if(!mountainGoatAppears(goatRoll))return null;
    state.metrics.mountainGoat++;state.routes.chaos+=10;state.finalChoice='master_goat';state.ended=true;state.pendingStory=null;state.pendingFinal=false;
    const ending=calculateEnding('master_goat'),collection=endingCollection();if(!collection.includes(ending.id)){collection.push(ending.id);localStorage.setItem(COLLECTION_KEY,JSON.stringify(collection));}
    addLog('bad','0.001%・糖之漢被開山羌',`你正和糖之漢${activity}，山羌突然撞進外院，當場把師父開死。掌門殞落，糖門修行至此中止。`,'師父死亡 · GAME OVER');pushChat('hype','糖之漢被開山羌！！！遊戲結束！');
    return {gameOver:true};
  }

  function runMasterMeal(id, goatRoll=Math.random()) {
    const food=MASTER_FOODS.find(x=>x.id===id);if(!food||state.ap<=0)return;
    forceCloseModal();runAction(()=>{
      const goatOutcome=masterGoatOutcome(goatRoll,`料理「${food.name}」`);if(goatOutcome)return goatOutcome;
      let statGain=0;if(food.stat&&Math.random()<food.chance){state.stats[food.stat]++;statGain=1;}
      if(food.rice)addItem(state,'rice',food.rice);if(food.qi)state.qi=Math.min(maxQi(state),state.qi+food.qi);if(food.discipline)state.routes.discipline+=food.discipline;
      const heal=Math.min(food.heal,maxHp(state)-state.hp);state.hp=Math.min(maxHp(state),state.hp+food.heal);state.stress=clamp(state.stress+food.stress,0,100);state.routes.ties++;
      state.metrics.mentorMeals++;if(!state.mealsEaten.includes(food.id))state.mealsEaten.push(food.id);
      const xp=gainXp(state,16),extras=[`氣血 +${heal}`,`經驗 +${xp}`];if(statGain)extras.push(`${STAT_NAMES[food.stat]} +1`);if(food.qi)extras.push(`真氣 +${food.qi}`);if(food.rice)extras.push(`飯盒 +${food.rice}`);if(food.discipline)extras.push(`自律 +${food.discipline}`);
      const delta=extras.join(' · ');addLog('good',`掌門料理・${food.name}`,food.quote,delta);pushChat('',food.id==='steak'?'師父牛排有料':'這桌是增肌餐還是流水席');
      return {result:{kicker:'掌門鐵板伙房・出菜結算',title:food.name,art:'master',icon:food.icon,quote:food.quote,delta,note:`料理圖鑑 ${state.mealsEaten.length}/${MASTER_FOODS.length}`}};
    });
  }

  function romanceBeatFor(id) {
    const bond=state.companionBond[id]||0,r=state.romance;
    if(id==='nl'){
      if(r.nlStage===0&&bond>=2)return 'nl1';
      if(r.nlStage===1&&bond>=4&&state.bossIndex>=2)return 'nl2';
      if(r.nlStage===2&&bond>=7&&state.bossIndex>=4&&r.heart==='nl')return 'nl3';
    }
    if(id==='vivi'){
      if(r.viviStage===0&&bond>=2)return 'vivi1';
      if(r.viviStage===1&&bond>=4&&state.bossIndex>=3)return 'vivi2';
      if(r.viviStage===2&&bond>=7&&state.bossIndex>=4&&r.heart==='vivi')return 'vivi3';
    }
    return null;
  }

  function openRomanceBeat(id,next=null) {
    const scene=ROMANCE_SCENES[id];if(!scene){next?.();return;}
    openModal({
      kicker:scene.kicker,title:scene.title,body:`${characterFeature(scene.line,scene.kicker,scene.text,'romance')}<div class="story-box"><h4>關係不是一次選項</h4><p>這一幕由長期陪練、章節進度與先前選擇共同開啟。選定心上人後，本世不會再開啟另一條感情線。</p></div>`,closable:false,
      actions:scene.choices.map(choice=>({
        label:choice.label,sub:choice.sub,disabled:!!choice.choose&&!!state.romance.heart&&state.romance.heart!==choice.choose,
        onClick:()=>{
          choice.apply(state);state.romance[`${scene.line}Stage`]=scene.stage;
          addLog('gold',`感情事件・${scene.title}`,scene.text,choice.sub);checkAchievements();save();render();forceCloseModal();next?.();
        }
      }))
    });
  }

  function runBrotherSession(id) {
    const partner=BROTHER_SESSIONS.find(x=>x.id===id);if(!partner||state.ap<=0)return;
    forceCloseModal();runAction(()=>{
      let xp=0,delta='',note='';
      if(id==='krapy'){
        state.stats.agility++;const insight=Math.random()<.35?1:0;if(insight)state.stats.insight++;
        const damage=roll(4,9);state.hp=Math.max(1,state.hp-damage);state.routes.discipline++;xp=gainXp(state,30);delta=`身法 +1${insight?' · 心眼 +1':''} · 經驗 +${xp} · 氣血 -${damage}`;note='大師兄真正教的是第三招之後怎麼活下來。';
      } else if(id==='toyz'){
        state.stats.insight++;state.qi=maxQi(state);const pill=Math.random()<.35;if(pill)addItem(state,'pill');state.routes.chaos++;xp=gainXp(state,26);delta=`心眼 +1 · 真氣回滿 · 經驗 +${xp}${pill?' · 回氣丹 +1':''}`;note=pill?'四十顆裡真的有一顆能吃。':'本輪沒有成丹，但至少沒有按錯。';
      } else if(id==='eason'){
        const key=Math.random()<.5?'strength':'vitality';state.stats[key]++;state.routes.discipline+=2;state.routes.integrity++;state.stress=clamp(state.stress+2,0,100);xp=gainXp(state,28);delta=`${STAT_NAMES[key]} +1 · 自律 +2 · 信義 +1 · 經驗 +${xp}`;note='點名、暖身、收操，全程沒有一句明天一定。';
      } else if(id==='overload'){
        state.stats.vitality++;const gross=roll(24,58),fee=Math.random()<.18?15:0,coins=Math.max(0,gross-fee);state.coins+=coins;state.routes.show++;state.stress=clamp(state.stress+9,0,100);xp=gainXp(state,22);delta=`根骨 +1 · 糖錢 +${coins} · 節目 +1 · 經驗 +${xp}`;note=fee?'帳上被扣了 15 糖錢「搬運平台服務費」。':'這次搬貨居然沒有任何隱藏費用。';
      } else if(id==='nl') {
        const key=Math.random()<.5?'agility':'insight';state.stats[key]++;state.routes.ties+=2;state.stress=clamp(state.stress-10,0,100);const heal=Math.min(14,maxHp(state)-state.hp);state.hp=Math.min(maxHp(state),state.hp+14);xp=gainXp(state,24);delta=`${STAT_NAMES[key]} +1 · 人情 +2 · 心火 -10 · 氣血 +${heal} · 經驗 +${xp}`;note='小師妹沒有放水，只是在你跌倒時真的有伸手。';
      } else {
        state.stats.insight++;const agility=Math.random()<.45?1:0;if(agility)state.stats.agility++;
        state.routes.discipline+=2;state.stress=clamp(state.stress+4,0,100);xp=gainXp(state,34);delta=`心眼 +1${agility?' · 身法 +1':''} · 自律 +2 · 經驗 +${xp} · 心火 +4`;note='她的傘尖每次都停在真正受傷以前，嘴上則完全沒有留手。';
      }
      state.metrics.training++;state.metrics.brotherTraining++;state.companionBond[id]=(state.companionBond[id]||0)+1;if(!state.trainingPartners.includes(id))state.trainingPartners.push(id);
      addLog('good',`${partner.role}互動・${partner.title}`,partner.quote,delta);pushChat('',id==='overload'?'搬這個到底有沒有勞健保':'糖門團練，感情有料');
      return {result:{kicker:`${partner.role}・互動訓練結算`,title:`${partner.name}｜${partner.title}`,art:partner.art,icon:partner.icon,quote:partner.quote,delta,note:`${note}・同門圖鑑 ${state.trainingPartners.length}/${BROTHER_SESSIONS.length}`},romanceBeat:romanceBeatFor(id)};
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
    if(state.streamBanDays>0)return toast(`頻道仍被停權 ${state.streamBanDays} 日，今天不能開台`);
    runAction(()=>{
      const promiseBonus=state.origin==='promise'&&!state.streamedToday;
      const bonus = 1 + gearBonus(state,'stream'); const coins=Math.round((42*1.35*bonus+roll(0,25))*(promiseBonus?1.25:1));
      state.coins+=coins;state.fame+=roll(2,5)+(promiseBonus?2:0);state.routes.show+=2;state.metrics.streams++;state.metrics.streamIncidents++;
      if(promiseBonus)state.routes.integrity++;
      state.streamedToday=true;
      const extraStress=state.equipped.charm==='mic'?2:0;state.stress=clamp(state.stress+9+extraStress,0,100);
      const incident=pick([
        {title:'水蛇洞準時開台',text:'你真的在公告時間出現，聊天室一度不知道該刷什麼。',good:true,run:()=>{}},
        {title:'哈梗寄來存證信函',text:'昨晚那句玩笑被剪成二十秒短片。信封比斗內還早到。',run:()=>{const fee=Math.min(state.coins,roll(35,80));state.coins-=fee;state.routes.integrity=Math.max(0,state.routes.integrity-1);state.stress=clamp(state.stress+12,0,100);}},
        {title:'惡意檢舉潮',text:'開台十分鐘後畫面被平台切斷，頻道進入兩日審查。',run:()=>{state.streamBanDays=2;state.streamBanSetDay=state.day;state.fame=Math.max(0,state.fame-3);state.routes.chaos+=3;}},
        {title:'標題涉嫌誤導',text:'平台撤掉本場收益，還寄來一封沒有人看得懂的規範通知。',run:()=>{state.coins=Math.max(0,state.coins-coins);state.routes.integrity=Math.max(0,state.routes.integrity-2);}},
        {title:'精華意外爆紅',text:'一段完全沒設計的摔倒畫面被推上首頁。',good:true,run:()=>{state.coins+=90;state.fame+=8;state.routes.show+=3;}}
      ]);incident.run();
      const promiseDelta=promiseBonus?' · 開局被動：收益 +25%、俠名 +2、信義 +1':'';
      addLog(incident.good?'good':'bad',incident.title,incident.text,(incident.good?'糖錢變化已結算 · 節目上升':'官司、檢舉或平台處分已生效')+promiseDelta);
      pushChat(incident.good?'hype':'',incident.good?'這段要剪！':'律師函有料？');
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
      const omen=Math.random();
      if(omen<.002&&!state.martialArts.includes('forbidden')){state.martialArts.push('forbidden');state.stats.insight+=3;state.routes.chaos+=5;state.metrics.hiddenEvents++;addLog('gold','崖壁逆頁顯字','雷光照出石壁上倒寫的經脈圖，你只看一眼就再也忘不掉。','心眼 +3 · 習得隱藏禁招');}
      else if(omen<.68){const key=pick(Object.keys(STAT_NAMES));state.stats[key]++;const xp=gainXp(state,38);state.routes.discipline++;addLog('good','斷腿崖悟道','山風很冷，但你真的想通了一招。',`${STAT_NAMES[key]} +1 · 經驗 +${xp}`);}
      else{const percent=roll(45,105),dmg=Math.ceil(maxHp(state)*percent/100);state.hp-=dmg;gainXp(state,18);addLog('bad','悟到一半墜崖','斷腿崖依最大氣血結算摔傷；根骨高也只是從更高的地方摔下來。',`氣血 -${dmg}（最大氣血 ${percent}%） · 經驗 +18`);}
    });
  }

  function actionSnapshot(s) {
    return {
      level:s.level, xp:s.xp, points:s.points, hp:s.hp, qi:s.qi, stress:s.stress,
      coins:s.coins, fame:s.fame, ap:s.ap, stats:{...s.stats}, routes:{...s.routes},
      inventory:{...s.inventory}, owned:[...s.owned], vows:[...s.vows],
      completedMissions:[...s.completedMissions], completedSecrets:[...s.completedSecrets], achievements:[...s.achievements],
      martialArts:[...s.martialArts], companionBond:{...s.companionBond}, streamBanDays:s.streamBanDays
    };
  }

  function xpBetween(before, after) {
    let gained=after.xp-before.xp;
    for(let level=before.level;level<after.level;level++)gained+=45+level*20;
    return gained;
  }

  function actionChanges(before, after) {
    const changes=[];
    const add=(label,delta,tone='')=>{if(delta)changes.push({label,value:`${delta>0?'+':''}${delta}`,tone});};
    Object.entries(STAT_NAMES).forEach(([key,label])=>add(label,after.stats[key]-before.stats[key],'good'));
    add('經驗',xpBetween(before,after),'good');
    add('等級',after.level-before.level,'good');add('可用配點',after.points-before.points,'good');
    add('氣血',after.hp-before.hp,after.hp>=before.hp?'good':'bad');
    add('真氣',after.qi-before.qi,after.qi>=before.qi?'good':'bad');
    add('心火',after.stress-before.stress,after.stress<=before.stress?'good':'bad');
    add('糖錢',after.coins-before.coins,after.coins>=before.coins?'good':'bad');
    add('俠名',after.fame-before.fame,after.fame>=before.fame?'good':'bad');
    Object.entries(ROUTE_NAMES).forEach(([key,label])=>{
      const delta=after.routes[key]-before.routes[key];
      add(label,delta,key==='chaos'?(delta>0?'bad':'good'):(delta>0?'good':'bad'));
    });
    const itemIds=new Set([...Object.keys(before.inventory),...Object.keys(after.inventory)]);
    itemIds.forEach(id=>add(ITEMS[id]?.name||id,(after.inventory[id]||0)-(before.inventory[id]||0),(after.inventory[id]||0)>=(before.inventory[id]||0)?'good':'bad'));
    after.owned.filter(id=>!before.owned.includes(id)).forEach(id=>changes.push({label:ITEMS[id]?.name||id,value:'獲得',tone:'good'}));
    after.vows.filter(vow=>!before.vows.includes(vow)).forEach(vow=>changes.push({label:vow,value:'獲得',tone:'good'}));
    after.martialArts.filter(id=>!before.martialArts.includes(id)).forEach(id=>changes.push({label:MARTIAL_ARTS[id]?.name||id,value:'習得',tone:'good'}));
    Object.entries(after.companionBond).forEach(([id,value])=>add(`${BROTHER_SESSIONS.find(x=>x.id===id)?.name||id}友好`,value-(before.companionBond[id]||0),'good'));
    add('禁播日數',after.streamBanDays-before.streamBanDays,after.streamBanDays>before.streamBanDays?'bad':'good');
    add('主線江湖帖',after.completedMissions.length-before.completedMissions.length,'good');
    add('隱藏追索',after.completedSecrets.length-before.completedSecrets.length,'good');
    add('行動',after.ap-before.ap,'cost');
    return changes;
  }

  function showActionResult(before, entry, next = null) {
    const changes=actionChanges(before,state);
    const unlocked=state.achievements.filter(id=>!before.achievements.includes(id)).map(id=>ACHIEVEMENTS.find(a=>a.id===id)?.name).filter(Boolean);
    const changeHtml=changes.length
      ? changes.map(change=>`<div class="action-change ${change.tone}"><span>${esc(change.label)}</span><b>${esc(change.value)}</b></div>`).join('')
      : '<div class="action-no-change">本次沒有產生數值變化</div>';
    openModal({
      kicker:'行動結算・收招完成',
      title:entry?.title||'本次行動完成',
      body:`<div class="action-result"><div class="action-result-seal">結</div>${entry?.text?`<p>${esc(entry.text)}</p>`:''}<h3>本次變化</h3><div class="action-change-grid">${changeHtml}</div>${unlocked.length?`<div class="result-notice achievement-pop">新成就：${unlocked.map(esc).join('、')}</div>`:''}</div>`,
      closable:false,
      actions:[{label:next?'查看新回目':'收下結果',sub:next?'本次成果已記錄，接著查看推進的故事。':state.ap>0?`今日還有 ${state.ap} 行動`:'今日行動已耗盡，可以收功入夜。',primary:true,onClick:()=>{forceCloseModal();next?.();}}]
    });
  }

  function runAction(callback) {
    if (busy || state.ended) return;
    if (state.ap <= 0) return toast('今天已經沒有行動力，收功入夜吧');
    const before=actionSnapshot(state);
    busy = true; state.ap--; state.metrics.actions++;state.dayActions++; render();
    $('cooldown').hidden = false; const bar=$('cooldown').querySelector('i'); bar.style.animation='none'; void bar.offsetWidth; bar.style.animation='';
    setTimeout(()=>{
      const outcome=callback()||{},entry=state.log[0]; busy=false; $('cooldown').hidden=true;
      checkAchievements();
      const transition=!state.ended&&state.hp>0&&state.stress<100?advanceChapterStep():null;
      save(); render();
      if(outcome.gameOver)showMasterGoatEnding();
      else if(state.hp<=0) showDeath(outcome.deathReason||'你在修行途中倒下，糖門只來得及把遺物寄回北投。');
      else if(state.stress>=100) showDeath('心火攻心。畫面還在直播，人已經先離線。');
      else if(outcome.result){
        const followup=outcome.romanceBeat
          ? {label:'留在原地',sub:'這次陪練之後，對方似乎還有話沒有說。',run:()=>openRomanceBeat(outcome.romanceBeat,transition?()=>showChapterTransition(transition):null)}
          : transition?{label:'查看新回目',sub:'本次成果已收下，接著查看推進的故事。',run:()=>showChapterTransition(transition)}:null;
        showClanResult(outcome.result,before,followup);
      }
      else showActionResult(before,entry,transition?()=>showChapterTransition(transition):null);
      if(state.ap<=0)pushChat('system','系統：今日行動耗盡，可以收功入夜。');
    }, 850);
  }

  function endDay() {
    if (busy || state.ended) return;
    const neglected=state.dayActions<2;
    const brokenPromise=state.origin==='promise'&&!state.streamedToday;
    if(neglected){state.routes.discipline=Math.max(0,state.routes.discipline-1);state.fame=Math.max(0,state.fame-2);state.stress=clamp(state.stress+22,0,100);addLog('bad','荒廢一日','今天幾乎沒有修行就收功。江湖不會等你把行程表排好。','自律 -1 · 俠名 -2 · 心火 +22');}
    if(brokenPromise){state.routes.integrity=Math.max(0,state.routes.integrity-2);state.routes.chaos+=3;state.fame=Math.max(0,state.fame-2);state.stress=clamp(state.stress+15,0,100);addLog('bad','明天一定・承諾反噬','你帶著「明天一定」入局，今天卻沒有開台。聊天室把欠下的承諾連本帶利送回來。','信義 -2 · 混沌 +3 · 俠名 -2 · 心火 +15');}
    const banStartedToday=state.streamBanSetDay===state.day;
    state.day++;state.dayActions=0;state.streamedToday=false;state.ap=maxAp(state);state.qi=maxQi(state);state.hp=Math.min(maxHp(state),state.hp+Math.floor(maxHp(state)*.12));state.stress=clamp(state.stress-(neglected?0:10),0,100);if(state.streamBanDays>0&&!banStartedToday)state.streamBanDays--;
    const events=[
      {title:'米特姨送飯',text:'門口多了一個飯盒。家人不懂江湖，但知道你會餓。',delta:'飯盒 +1 · 人情 +1',fn:()=>{addItem(state,'rice');state.routes.ties++;}},
      {title:'明天一定的代價',text:'你又想發一張宏大的行程表，最後忍住只寫明天幾點開。',delta:'自律 +1 · 信義 +1',fn:()=>{state.routes.discipline++;state.routes.integrity++;}},
      {title:'普通的一晚',text:'沒有炎上、沒有神抽、沒有警察。普通得像一種稀有事件。',delta:'氣血與真氣恢復',fn:()=>{}},
      {title:'高金生路過',text:'一個用你頭貼的人在門外說自己才是本尊。你決定明天再處理。',delta:'俠名 +2 · 混沌 +1',fn:()=>{state.fame+=2;state.routes.chaos++;}}
    ];
    const e=pick(events);e.fn();addLog('gold',e.title,e.text,e.delta);checkAchievements();save();render();pushChat('system',`系統：第 ${state.day} 日開始，行動力已恢復。`);
    if(state.stress>=100){save();render();showDeath('你連續荒廢修行，心火在期限逼近時徹底失控。');return;}
    if(resolveRelationshipCrisis())return;
    if(openTimedEvent())return;
    const transition=advanceChapterStep();save();render();
    if(transition)showChapterTransition(transition);
    else openModal({kicker:`第 ${state.day} 日・晨間事件`,title:e.title,body:`<div class="event-result"><p>${esc(e.text)}</p><strong>${esc(e.delta)}</strong>${neglected?'<div class="result-notice danger-notice">昨日行動不足：自律與俠名下降，心火受到懲罰。</div>':''}${brokenPromise?'<div class="result-notice danger-notice">「明天一定」未兌現：信義、俠名下降，混沌與心火上升。</div>':''}</div>`,actions:[{label:'開始今天',sub:`行動力 ${state.ap}/${maxAp(state)}${state.streamBanDays?`・禁播剩 ${state.streamBanDays} 日`:''}`,primary:true,onClick:forceCloseModal}]});
  }

  function resolveRelationshipCrisis(){
    if(state.day===9&&!state.triggeredEvents.includes('poison9')){
      state.triggeredEvents.push('poison9');
      if((state.companionBond.toyz||0)<2){
        addLog('bad','第九日・丹毒發作','你獨自亂吃丹藥，二師兄糖偉健與你毫無交情，藥房的門始終沒有打開。','友好不足 · 無藥可救');save();render();showDeath('丹毒攻心。你從未與糖偉健建立足夠交情，他沒有把唯一的解藥交給一個只在需要時才上門的人。');return true;
      }
      addItem(state,'pill',2);state.stress=Math.max(0,state.stress-15);addLog('good','第九日・二師兄送解藥','糖偉健嘴上說浪費，但還是把真正的解藥丟到你懷裡。','回氣丹 +2 · 心火 -15');save();render();openModal({kicker:'同門危機・關係判定通過',title:'藥房的門打開了',body:`<div class="story-box"><h4>糖偉健友好 ${state.companionBond.toyz}</h4><p>你過去的互動不是裝飾。二師兄願意救你，這一世得以繼續。</p></div>`,closable:false,actions:[{label:'收下解藥',sub:'繼續第九日修行',primary:true,onClick:forceCloseModal}]});return true;
    }
    if(state.day===15&&!state.triggeredEvents.includes('ambush15')){
      state.triggeredEvents.push('ambush15');const total=Object.values(state.companionBond).reduce((a,b)=>a+b,0);
      if(total<6){const loss=Math.min(state.coins,95),damage=Math.ceil(maxHp(state)*.42);state.coins-=loss;state.hp=Math.max(1,state.hp-damage);addLog('bad','第十五日・無人守夜','你一直獨來獨往，夜襲時沒有人替你叫醒第二班崗哨。','氣血重創 · 糖錢遭劫');}
      else{state.routes.ties+=3;addLog('good','第十五日・同門守夜','五名同門輪流站崗，刺客連你的門都沒摸到。','人情 +3');}
      save();render();
    }
    return false;
  }

  function openTimedEvent(){
    const event=FORCED_EVENTS.find(x=>x.id===state.delayedThreat)||FORCED_EVENTS.find(x=>x.day===state.day&&!state.triggeredEvents.includes(x.id));
    if(!event)return false;state.delayedThreat=event.id;save();
    openModal({kicker:'時限事件・強制迎戰',title:event.title,body:`<div class="goatless-danger"><p>${esc(event.text)}</p><strong>敵人會依目前等級與章節強化。此戰不可撤退，也不會因你還沒練好而延期。</strong></div>`,closable:false,actions:[{label:'應戰',sub:'不消耗今日行動；失敗仍視為死亡',primary:true,onClick:()=>{forceCloseModal();startEncounter(false,{...event.foe,eventId:event.id},true);}}]});return true;
  }

  function openMissions() {
    const list=availableMissions(), story=list.filter(m=>!m.repeat&&!m.secret), secrets=list.filter(m=>m.secret), daily=list.filter(m=>m.repeat);
    const missionCards = missions => missions.map(m=>{
      const ready=missionReady(m),chapterTag=m.repeat?'日常':m.secret?'跨世線索':CHAPTERS[m.chapter]?.number||'江湖';
      return `<article class="shop-item mission-item ${m.secret?'secret-mission':''}"><div class="item-icon">${m.repeat?'日':m.secret?'秘':'帖'}</div><div><div class="mission-chapter-tag">${chapterTag}</div><h4>${esc(m.name)}${m.repeat?' · 可重複':''}</h4><p>${esc(m.description)}<br>報酬：${esc(m.reward)}</p>${missionProgressHtml(m)}<button class="buy-button" data-mission="${m.id}" ${ready&&state.ap>0?'':'disabled'}>${ready?(state.ap>0?'完成任務並領取':'今日無行動'):esc(missionBlocker(m))}</button></div></article>`;
    }).join('');
    const secretSection=secrets.length?`<h3 class="mission-group-title secret-title">死亡線索追索・不列入 15 張主線帖</h3><div class="item-grid">${missionCards(secrets)}</div>`:'';
    openModal({kicker:'糖門江湖帖',title:'不是按一下就算做完',body:`<div class="mission-note">主線江湖帖必須先完成下方實戰、修行或日數條件，達標後才能花 1 行動交付；完成後會從追蹤移除。日常與死亡線索追索都不計入泰山要求的 15 張主線帖。</div>${secretSection}<h3 class="mission-group-title">主線江湖帖・已完成 ${state.completedMissions.length} / 15</h3><div class="item-grid">${story.length?missionCards(story):'<p class="empty-state">目前可見的主線江湖帖已完成，推進小回目後會出現新委託。</p>'}</div><h3 class="mission-group-title">日常委託・可重複、不列入追蹤</h3><div class="item-grid">${missionCards(daily)}</div>`,afterOpen:()=>{
      document.querySelectorAll('[data-mission]').forEach(btn=>btn.onclick=()=>{const m=MISSIONS.find(x=>x.id===btn.dataset.mission);if(!missionReady(m))return;forceCloseModal();runAction(()=>{m.run(state);state.metrics.missions++;if(m.secret&&!state.completedSecrets.includes(m.id))state.completedSecrets.push(m.id);else if(!m.repeat&&!state.completedMissions.includes(m.id))state.completedMissions.push(m.id);addLog('good',`${m.repeat?'完成日常':m.secret?'完成隱藏追索':'完成江湖帖'}・${m.name}`,m.description,m.reward);if(m.repeat)toast('日常委託完成；可再次承接，不列入右側追蹤');pushChat('',m.secret?'前世沒有白死':'工具人有料');});});
    }});
  }

  function openShop() {
    const sell=['rice','pill','clock','ankleguard','mic'];
    openModal({kicker:'叉叉商城',title:'糖錢要花在刀口上',body:`<p>裝備購買後會自動穿上，同部位可以在行囊切換。商城不消耗行動。</p><div class="item-grid">${sell.map(id=>{const item=ITEMS[id],owned=item.kind==='consumable'?false:state.owned.includes(id);return `<article class="shop-item"><div class="item-icon">${item.icon}</div><div><h4>${item.name}</h4><p>${item.description}</p><button class="buy-button" data-buy="${id}" ${owned||state.coins<item.price?'disabled':''}>${owned?'已持有':`${item.price} 糖錢`}</button></div></article>`;}).join('')}</div>`,afterOpen:()=>{
      document.querySelectorAll('[data-buy]').forEach(btn=>btn.onclick=()=>buyItem(btn.dataset.buy));
    }});
  }

  function openMartialHall(){
    const arts=Object.entries(MARTIAL_ARTS).filter(([,art])=>!art.secret);
    openModal({kicker:'叉叉市集・江湖武學鋪',title:'招式不是升級就自己長出來',body:`<div class="mission-note">每一門武學都有修習條件。學會後會出現在戰鬥指令中；同時最多顯示糖門滑劍與最近習得的三門武學。</div><div class="item-grid">${arts.map(([id,art])=>{const learned=state.martialArts.includes(id),ready=art.unlocked(state);return `<article class="shop-item martial-item"><div class="item-icon">${art.icon}</div><div><h4>${esc(art.name)}</h4><p>${esc(art.description)}<br>真氣消耗：${art.qi}</p><button class="buy-button" data-learn="${id}" ${learned||!ready||state.coins<art.price?'disabled':''}>${learned?'已習得':ready?(state.coins>=art.price?`${art.price} 糖錢`:'糖錢不足'):esc(art.requirement?.(state)||'尚未符合')}</button></div></article>`;}).join('')}</div>`,afterOpen:()=>document.querySelectorAll('[data-learn]').forEach(btn=>btn.onclick=()=>learnMartialArt(btn.dataset.learn))});
  }

  function learnMartialArt(id){
    const art=MARTIAL_ARTS[id];if(!art||state.martialArts.includes(id)||!art.unlocked(state)||state.coins<art.price)return;
    state.coins-=art.price;state.martialArts.push(id);addLog('gold',`習得武學・${art.name}`,art.description,`糖錢 -${art.price} · 新技能`);checkAchievements();save();render();toast(`習得武學：${art.name}`);forceCloseModal();openMartialHall();
  }

  function openBlackMarket(){
    openModal({kicker:'叉叉市集・無牌暗巷',title:'便宜通常有便宜的理由',body:'<p>攤販不留姓名、不給收據，也不回答貨是從哪裡來。每項交易都有可能拿到好東西、買到廢物，或把巡捕一起帶回糖門。</p>',actions:[
      {label:'買無封面內功殘頁・45 糖錢',sub:'可能是絕世武學，也可能把經脈練歪。',disabled:state.coins<45,onClick:()=>blackMarketTrade('manual',45)},
      {label:'買來路不明大補丹・22 糖錢',sub:'便宜、立即見效；藥效不保證往哪個方向走。',disabled:state.coins<22,onClick:()=>blackMarketTrade('pill',22)},
      {label:'接一筆無紀錄搬運・不收費',sub:'成功賺大錢；失敗可能被巡捕帶走。',onClick:()=>blackMarketTrade('job',0)},
      {label:'離開暗巷',sub:'今天先不拿大中計',onClick:forceCloseModal}
    ]});
  }

  function blackMarketTrade(type,cost){
    forceCloseModal();runAction(()=>{
      state.coins-=cost;state.metrics.hiddenEvents++;const chance=Math.random();let title='',text='',delta='';
      if(type==='manual'){
        if(chance<.015&&!state.martialArts.includes('forbidden')){state.martialArts.push('forbidden');state.stats.strength+=5;state.stats.agility+=5;title='殘頁竟是真貨';text='逆頁真氣貫通雙臂，你悟出一門不該存在的禁招。';delta='力道 +5 · 身法 +5 · 習得隱藏武學';}
        else if(chance<.07){const moved=state.stats.strength+state.stats.agility+state.stats.insight-3;state.stats.strength=1;state.stats.agility=1;state.stats.insight=1;state.stats.vitality+=moved;state.hp=maxHp(state);title='盜版易筋經走火';text='口訣最後一頁印反了。全身功力被硬生生洗進根骨。';delta='力道、身法、心眼歸 1 · 其餘點數全入根骨';}
        else{state.stress=clamp(state.stress+16,0,100);gainXp(state,26);title='殘頁只有封面能看';text='你練了一晚，只悟到印刷廠的油墨味。';delta='經驗 +26 · 心火 +16';}
      }else if(type==='pill'){
        if(chance<.42){state.stats.vitality+=2;state.hp=maxHp(state);title='黑市大補丹有效';text='丹藥難吃得像真的，經脈居然也真的撐開。';delta='根骨 +2 · 氣血回滿';}
        else{const damage=Math.ceil(maxHp(state)*.38);state.hp-=damage;state.stress=clamp(state.stress+12,0,100);title='丹藥成分不明';text='藥效非常猛烈，方向完全相反。';delta=`氣血 -${damage} · 心火 +12`;}
      }else{
        if(chance<.48){const reward=roll(110,210);state.coins+=reward;state.routes.chaos+=3;title='黑貨平安送達';text='沒有人問箱子裡是什麼，你也決定不要知道。';delta=`糖錢 +${reward} · 混沌 +3`;}
        else{const fine=Math.min(state.coins,roll(55,130));state.coins-=fine;state.fame=Math.max(0,state.fame-4);state.streamBanDays=Math.max(state.streamBanDays,2);state.streamBanSetDay=state.day;title='巡捕破門';text='貨主跑得比你快。你被帶去做筆錄，直播權限也遭暫停。';delta=`糖錢 -${fine} · 俠名 -4 · 禁播 2 日`;}
      }
      addLog(/真貨|有效|送達/.test(title)?'good':'bad',title,text,delta);return{};
    });
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
    const ch=chapter(),section=currentSection(),boss=currentBoss();
    const roadmap=ch.sections.map((part,index)=>`<div class="chapter-step ${index<state.chapterStep?'done':index===state.chapterStep?'current':'locked'}"><i>${index<state.chapterStep?'✓':index+1}</i><div><b>${part.number}・${esc(part.title)}</b><small>${index<state.chapterStep?'已完成':index===state.chapterStep?esc(part.summary):'尚未開啟'}</small></div></div>`).join('');
    const sectionReqs=section.boss?boss.requirements:(section.requirements||[]);
    openModal({kicker:`${chapterDisplay(ch,section)}・江湖進度`,title:`${ch.title}｜${section.title}`,body:`<div class="chapter-overview"><span>全篇規模</span><b>五大章・二十小回</b><em>目前第 ${state.bossIndex+1} 章，章內 ${state.chapterStep+1} / ${ch.sections.length}</em></div><div class="story-box"><h4>本回故事</h4><p>${esc(section.summary)}</p><h4>本章登場</h4>${chapterCastHtml(ch.cast)}</div><div class="chapter-roadmap">${roadmap}</div><div class="requirements-box"><h4>${section.boss?'守關特殊素質':'本回推進條件'}</h4><ul>${sectionReqs.map(r=>`<li class="${r.check(state)?'ok':''}"><span>${r.check(state)?'✓':'○'} ${r.label}</span><b>${r.value(state)}</b></li>`).join('')}</ul></div><p>${section.boss?'所有特殊素質達標後，才能自行決定何時挑戰守關者。':'條件達成後，再完成一次有效行動就會推進下一小回；每次只推進一回，不會連跳劇情。'}</p>`});
  }

  function openBossChallenge() {
    const boss=currentBoss(),ready=bossReady(boss);
    const clue=state.bossItemHints.includes(boss.id)?`<div class="boss-clue"><b>前世留下的線索</b><p>${esc(boss.itemHint)}</p></div>`:'';
    openModal({kicker:`守關試煉・${chapterDisplay()}`,title:`${boss.icon} ${boss.name}`,body:`<p>${boss.title}</p><div class="requirements-box"><h4>入場門檻</h4><ul>${boss.requirements.map(r=>`<li class="${r.check(state)?'ok':''}"><span>${r.check(state)?'✓':'○'} ${r.label}</span><b>${r.value(state)}</b></li>`).join('')}</ul></div><div class="boss-rule-preview"><h4>未知守關異象</h4><p>這名守關者藏著無法靠面板直接看穿的規則，也可能需要某件江湖物品。第一次交手前不會公布答案。</p></div>${clue}${ready?'<p class="warning">Boss 戰會消耗 1 行動。若準備不足，死亡後才會得到關鍵線索。</p>':'<p class="warning">必須先完成本章前三個小回目與全部入場門檻，無法靠運氣跳關。</p>'}`,actions:[{label:ready?'踢館・開始 Boss 戰':'條件不足',sub:ready?'接受未知機制與死亡風險':'先完成小回目、修行與江湖帖',primary:ready,disabled:!ready||state.ap<=0,onClick:()=>{forceCloseModal();startEncounter(true);}},{label:'再準備一下',sub:'保留進度，自己決定何時挑戰',onClick:forceCloseModal}]});
  }

  function openMysteryChallenge() {
    if(state.bossIndex<4)return toast('這條路尚未出現');
    if(state.mysteryChallenge.cleared){
      openModal({kicker:'斷腿崖・神秘挑戰',title:'長路已被走完',body:`<div class="story-box"><h4>十三戰全破</h4><p>星光已經退回裂隙。羅傑的王冠仍在行囊中，這條路不再要求你證明第二次。</p></div>`,actions:[{label:'返回斷腿崖',sub:'神秘挑戰已完成',primary:true,onClick:forceCloseModal}]});return;
    }
    const index=state.mysteryChallenge.index,foe=MYSTERY_BOSSES[index];
    openModal({
      kicker:`斷腿崖・神秘挑戰 ${index+1}/${MYSTERY_BOSSES.length}`,title:`${foe.icon} ${foe.name}`,
      body:`<p>裂隙後方沒有補給站。每擊敗一名守衛，進度就會留在斷腿崖；你可以當場退走，下次從目前這一戰繼續。</p><div class="requirements-box"><h4>目前守衛</h4><ul><li><span>氣血</span><b>${foe.hp}</b></li><li><span>攻勢</span><b>${foe.attack}</b></li><li><span>已突破</span><b>${index}/${MYSTERY_BOSSES.length}</b></li></ul></div><div class="boss-rule-preview"><h4>異界法則</h4><p>${esc(foe.clue)}</p></div><p class="warning">本挑戰不影響泰山主線；失敗仍會依正常死亡規則轉生。</p>`,
      actions:[
        {label:'踏入裂隙',sub:'消耗 1 行動；勝利後可繼續或退走',primary:true,disabled:state.ap<=0,onClick:()=>{forceCloseModal();startEncounter(false,{...foe},false,false);}},
        {label:'暫時退走',sub:'保留目前已突破的守衛數',onClick:forceCloseModal}
      ]
    });
  }

  function treeSentinelAppears(value) { return value < TREE_SENTINEL_RATE; }

  function scaledMonster(monster) {
    const foe = { ...monster };
    const levelScale=1+Math.max(0,state.level-1)*.055,chapterScale=1+state.bossIndex*.2;
    foe.hp=Math.round(foe.hp*levelScale*chapterScale);
    foe.attack=Math.round(foe.attack*(1+Math.max(0,state.level-1)*.032+state.bossIndex*.13));
    foe.reward=Math.round(foe.reward*(1+state.bossIndex*.18+Math.max(0,state.level-1)*.025));
    foe.xp=Math.round(foe.xp*(1+state.bossIndex*.15+Math.max(0,state.level-1)*.018));
    const eliteChance=Math.min(.34,.08+state.bossIndex*.045+state.level*.006);
    foe.elite=monster.elite===true||Math.random()<eliteChance;
    if(foe.elite){foe.name=`精英・${foe.name}`;foe.hp=Math.round(foe.hp*1.38);foe.attack=Math.round(foe.attack*1.2);foe.reward=Math.round(foe.reward*1.55);foe.xp=Math.round(foe.xp*1.45);foe.hiddenMechanic=monster.style;}
    foe.scaled=true;
    return foe;
  }

  function openWildEncounter() {
    if (busy || state.ap <= 0 || state.ended) return toast(state.ap <= 0 ? '今日行動已用完' : '現在無法戰鬥');
    const pool = ENEMIES[state.location] || ENEMIES.outer;
    const candidates = [...pool].sort(() => Math.random() - .5).slice(0, Math.min(3, pool.length));
    openModal({
      kicker:`${LOCATIONS[state.location].name}・野怪名冊`,
      title:'這一場要打誰？',
      body:`<p>野怪會依你的等級與目前章節同步成長。少數敵人帶有「精英」氣息，但牠們真正的本事只能進場後自己摸索。</p>`,
      actions:[
        ...candidates.map(monster => {
          const preview = scaledMonster(monster);
          return { label:`${preview.icon} ${preview.name}`, sub:`${preview.elite?'精英異象・':''}${MONSTER_STYLE_NAMES[preview.style]}・氣血 ${preview.hp}・攻勢 ${preview.attack}｜${preview.flavor}`, onClick:()=>{forceCloseModal();startEncounter(false,preview);} };
        }),
        { label:'換一批野怪', sub:'不消耗行動，重新抽出三名對手', onClick:()=>{forceCloseModal();openWildEncounter();} }
      ]
    });
  }

  function startEncounter(isBoss, chosenFoe = null, forced = false, free = false) {
    if(busy||(!forced&&!free&&state.ap<=0)||state.ended)return toast(!forced&&!free&&state.ap<=0?'今日行動已用完':'現在無法戰鬥');
    if(isBoss&&!bossReady())return openBossChallenge();
    if(!forced&&!free){state.ap--;state.metrics.actions++;state.dayActions++;}
    save();render();
    let foe;
    if(isBoss){const b=currentBoss();foe={...b,boss:true,coinReward:100+b.hp,xp:90+b.hp/3};}
    else{const pool=ENEMIES[state.location]||ENEMIES.outer;foe=chosenFoe?.scaled?{...chosenFoe}:scaledMonster(chosenFoe||pick(pool));foe.forced=forced;if(foe.mystery||foe.rareSentinel)foe.locked=true;}
    const openingLog=[`${foe.name} 擋住去路。先看招，再出手。`, ...(foe.flavor?[foe.flavor]:[])];
    if(foe.boss&&(foe.combatRule||foe.mystery))openingLog.push(`守關者的氣息不對勁。先交手，別相信第一次看見的破綻。`);
    if(foe.elite)openingLog.push('這隻精英怪身上有異常氣息，牠似乎在等你犯某種錯。');
    if(foe.id==='taishan')openingLog.push(`${state.vows.length} 枚心印化為加護：造成傷害提升，信義與人情減少所受傷害。`);
    currentBattle={foe,foeHp:foe.hp,turn:1,intent:nextIntent(foe,1),foeGuard:false,playerGuard:false,damageTaken:0,openTurns:0,armorBrokenTurns:0,ironTurns:0,lastDamageAction:null,mechanicCount:0,phase:1,revived:false,dotTurns:0,log:openingLog,busy:false};
    renderBattle();
  }

  function nextIntent(foe,turn) {
    let pool=['attack','attack','heavy','guard','trick'];
    if(foe.mysteryMechanic==='tree')return turn%78===0?'heavy':'guard';
    if(foe.mysteryMechanic==='delay')return turn%3===0?'heavy':pick(['attack','guard','trick']);
    if(foe.mysteryMechanic==='moon'||foe.mysteryMechanic==='beast')pool=['trick','trick','guard','attack'];
    if(foe.mysteryMechanic==='rot'&&turn%4===0)return 'heavy';
    if(foe.mysteryMechanic==='firstlord'&&turn%3===0)return 'heavy';
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

  function bossRuleState(b=currentBattle) {
    if(!b?.foe?.boss)return '';
    if(b.foe.mystery)return mysteryRuleState(b);
    if(b.missingItem)return '你的攻勢始終差了一個關鍵媒介。';
    if(b.openTurns>0)return `你抓到短暫破綻・剩 ${b.openTurns} 回合`;
    if(b.lastDamageAction)return '守關者開始記住你的出招習慣。';
    return '異象未解・留意戰鬥紀錄中的反應';
  }

  function mysteryRuleState(b=currentBattle) {
    const m=b.foe.mysteryMechanic;
    if(m==='moon'||m==='beast')return b.openTurns>0?`核心顯露・剩 ${b.openTurns} 回合`:'光幕仍在流動，等待真正的核心現身';
    if(m==='giant')return b.mechanicCount>=3?'巨人的支點已經崩解':`低處的傷痕正在擴大・${b.mechanicCount}/3`;
    if(m==='duo'&&b.revived)return '兩道神皮氣息終於無法再次聚合';
    if(m==='graft'&&b.phase===2)return '龍首甦醒・戰鬥已進入第二階段';
    if(m==='firstlord'&&b.phase===2)return '王名已棄・只剩戰士荷萊露';
    return b.lastDamageAction?'守衛已經開始回應你的出招習慣':'異界法則尚未完全顯形';
  }

  function applyMysteryDamageRule(action,damage,b=currentBattle) {
    if(!b?.foe?.mysteryMechanic||damage<=0)return damage;
    const m=b.foe.mysteryMechanic;
    if(m==='tree')return 1;
    if(m==='moon'||m==='beast'){
      if(action==='focus'&&b.intent==='trick'){b.openTurns=m==='moon'?4:3;b.log.push('流動的光幕裂開，真身短暫顯露！');}
      if(b.openTurns<=0){b.log.push('攻勢穿過光幕，沒有碰到真正的核心。');return 0;}
    }
    if(m==='omen'||m==='allknowing'){
      if(b.lastDamageAction===action){
        const backlash=Math.ceil(maxHp(state)*(m==='omen'?.12:.08));state.hp=Math.max(0,state.hp-backlash);
        b.log.push(`${b.foe.name}看穿重複招式，反制奪走 ${backlash} 氣血。`);return 0;
      }
      b.lastDamageAction=action;
    }
    if(m==='giant'){
      if(action==='sugar_slash'&&b.mechanicCount<3){b.mechanicCount++;b.log.push('滑劍切中巨人低處的舊傷。');}
      if(b.mechanicCount<3)damage=Math.min(damage,Math.ceil(b.foe.hp*.035));
    }
    if(m==='order'&&b.intent==='guard'){
      const reflected=Math.max(1,Math.ceil(damage*.3));state.hp=Math.max(0,state.hp-reflected);b.log.push(`黃金裂縫把 ${reflected} 點攻勢折回你身上。`);
    }
    return damage;
  }

  function applyBossDamageRule(action,damage,b=currentBattle) {
    if(!b.foe.boss||damage<=0)return damage;
    if(b.foe.requiredItem&&!hasItem(state,b.foe.requiredItem)){b.missingItem=true;b.log.push('攻勢在命中前被無形力量抹去：傷害 0。你似乎少了一件能與此地共鳴的東西。');return 0;}
    if(b.foe.id==='sleep'&&!b.foe.combatCheck(state)){
      b.log.push('棉被結界吞掉整道攻勢：傷害 0。它似乎不是只靠耐打就能破開。');return 0;
    }
    if(b.foe.id==='green'){
      if(action==='focus'&&b.intent==='trick'){b.openTurns=3;b.log.push('黃光被看破！法衣裂開 3 回合。');}
      if(b.openTurns<=0){b.log.push('黃光法衣仍閉合，這一招傷害 0。等待紫光再用看破。');return 0;}
    }
    if(b.foe.id==='crows'){
      if(action==='sugar_slash'){b.openTurns=3;b.log.push('某種熟悉的滑劍軌跡切開雙王陣，破綻維持 3 回合！');}
      if(b.openTurns<=0){b.log.push('金銀雙烏互相代擋，這一招傷害 0。陣眼似乎害怕某種糖門劍路。');return 0;}
    }
    if(b.foe.id==='copies'){
      if(b.lastDamageAction===action){b.log.push('演算法複製了相同招式：傷害 0。請更換輸出方式。');return 0;}
      b.lastDamageAction=action;
    }
    if(b.foe.id==='taishan'&&!b.foe.combatCheck(state)){
      b.log.push(`泰山拒絕失衡之力：${b.foe.combatValue(state)}，傷害 0。`);return 0;
    }
    return damage;
  }

  function applyEliteDamageRule(action,damage,b=currentBattle){
    if(!b?.foe?.elite||damage<=0)return damage;
    if(b.foe.hiddenMechanic==='guard'&&b.foeWasGuarding&&action!=='martial:sugar_slash'){b.log.push('精英怪的鐵壁吞掉攻勢，傷害 0。');return 0;}
    if(b.foe.hiddenMechanic==='trick'&&b.intent==='trick'&&action!=='focus'&&action!=='martial:yellow_flash'){b.log.push('你打中的只是誘餌，傷害 0。');return 0;}
    if(b.foe.hiddenMechanic==='swift'&&b.lastDamageAction===action){b.log.push('精英怪已看穿重複招式，這一擊被完全閃過。');return 0;}
    if(b.foe.hiddenMechanic==='brute'&&b.turn%3===0&&action!=='guard'&&action!=='martial:iron_body'){b.log.push('霸體震開你的正面攻勢，傷害 0。');return 0;}
    b.lastDamageAction=action;return damage;
  }

  function tickBossRule(b=currentBattle) {
    if(!b?.foe?.boss)return;
    if((b.foe.id==='green'||b.foe.id==='crows')&&b.openTurns>0)b.openTurns--;
    if(b.foe.mystery&&(b.foe.mysteryMechanic==='moon'||b.foe.mysteryMechanic==='beast')&&b.openTurns>0)b.openTurns--;
  }

  function renderBattle() {
    const b=currentBattle,foe=b.foe;
    modalClosable=false;$('modal-kicker').textContent=foe.mystery?'斷腿崖・神秘挑戰':foe.boss?'守關 Boss 戰':'江湖遭遇';$('modal-title').textContent=foe.name;$('modal-close').hidden=true;
    const allLearned=(state.martialArts||[]).filter(id=>MARTIAL_ARTS[id]);
    const learnedIds=['sugar_slash',...allLearned.filter(id=>id!=='sugar_slash').slice(-3)].filter((id,index,list)=>list.indexOf(id)===index);
    $('modal-body').innerHTML=`<div class="battle"><div class="battle-foes"><div class="fighter player"><div class="avatar">瘸</div><b>${esc(state.name)}</b><div class="battle-hp"><i style="width:${state.hp/maxHp(state)*100}%"></i></div><small>氣血 ${state.hp}/${maxHp(state)} · 真氣 ${state.qi}/${maxQi(state)}</small></div><div class="versus">對</div><div class="fighter"><div class="avatar">${foe.icon}</div><b>${foe.name}</b><div class="battle-hp"><i style="width:${b.foeHp/foe.hp*100}%"></i></div><small>氣血 ${Math.max(0,b.foeHp)}/${foe.hp}</small></div></div>${foe.boss?`<div class="boss-rule-box"><b>${foe.mystery?'異界法則':'守關異象'}</b><p>${foe.mystery?'每一名守衛都有自己的戰鬥機制。':'此戰藏有特殊破解條件。死亡後會留下線索。'}</p><strong>${esc(bossRuleState(b))}</strong></div>`:''}${foe.elite&&!foe.boss?'<div class="boss-rule-box elite-rule-box"><b>精英小 Boss 異象</b><p>這名敵人的反應不尋常，重複同一套打法可能會付出代價。</p></div>':''}<div class="intent-box"><i>${INTENTS[b.intent].icon}</i><div><b>敵方意圖：${INTENTS[b.intent].name}</b><small>${intentHint()}</small></div></div>${state.live?'<div class="poll-hint">實況提示：請觀眾刷數字，實況主用數字鍵執行聊天室的選擇。</div>':''}<div class="battle-log">${b.log.slice(-6).map(x=>`<div>${esc(x)}</div>`).join('')}</div><div class="battle-actions"><button class="battle-button" data-battle="attack"><b>1. 普通攻擊</b><small>穩定傷害；身法提供暴擊</small></button><button class="battle-button" data-battle="guard"><b>2. 防禦</b><small>可減傷，但部分攻勢會穿透</small></button>${learnedIds.map((id,index)=>{const art=MARTIAL_ARTS[id];return `<button class="battle-button" data-battle="martial:${id}" ${state.qi<art.qi?'disabled':''}><b>${index+3}. ${art.icon} ${art.name}</b><small>真氣 ${art.qi}・${esc(art.description)}</small></button>`;}).join('')}<button class="battle-button" data-battle="focus"><b>${learnedIds.length+3}. 看破</b><small>破解詭計；回復 7 真氣</small></button><button class="battle-button" data-battle="rice" ${(state.inventory.rice||0)<1?'disabled':''}><b>${learnedIds.length+4}. 米特飯盒</b><small>剩 ${state.inventory.rice||0}；恢復 38 氣血</small></button><button class="battle-button" data-battle="flee" ${foe.boss||foe.forced||foe.locked?'disabled':''}><b>${learnedIds.length+5}. 戰略撤退</b><small>${foe.boss||foe.forced||foe.locked?'此戰無法中途撤退':'保命；行動不退還'}</small></button></div></div>`;
    document.querySelector('.fighter.player .avatar').innerHTML=`<img class="battle-avatar" src="roger.png" alt="${esc(state.name)}">`;
    $('modal-actions').innerHTML='';$('modal').hidden=false;
    document.querySelectorAll('[data-battle]').forEach(btn=>btn.onclick=()=>battleTurn(btn.dataset.battle));
  }

  function battleTurn(action) {
    const b=currentBattle;if(!b||b.busy)return;b.busy=true;
    if(action==='flee'){addLog('bad','戰略撤退',`你從${b.foe.name}面前退回安全處。`,'行動不退還');forceCloseModal();save();render();pushChat('','跑了跑了');return;}
    let damage=0,skipEnemy=false;b.foeWasGuarding=b.foeGuard;
    if(action==='attack'){
      damage=attackPower()+roll(-3,5);if(Math.random()<stat(state,'agility')*.012){damage=Math.round(damage*1.7);b.log.push('身法觸發暴擊！');}
      if(b.foeGuard){damage=Math.ceil(damage*.45);b.foeGuard=false;b.log.push('對手的架勢擋掉大半攻勢。');}
    }
    if(action.startsWith('martial:')){
      const id=action.split(':')[1],art=MARTIAL_ARTS[id];if(!art||!state.martialArts.includes(id)||state.qi<art.qi){b.busy=false;return;}state.qi-=art.qi;
      if(id==='sugar_slash'){damage=Math.round(attackPower()*1.55+stat(state,'agility')*.7+roll(0,7));b.foeGuard=false;b.log.push('糖門滑劍破開架勢！');}
      if(id==='limp_whirl'){damage=Math.round(attackPower()*2.15+stat(state,'agility')*1.1);const recoil=Math.ceil(maxHp(state)*.06);state.hp=Math.max(1,state.hp-recoil);b.log.push(`斷腿旋風斬連斬命中，反震損失 ${recoil} 氣血。`);}
      if(id==='iron_body'){damage=Math.round(defensePower()*2.5+stat(state,'vitality'));b.ironTurns=2;b.playerGuard=true;b.log.push('糖門鐵骨功震傷敵人，護體維持 2 回合。');}
      if(id==='yellow_flash'){damage=Math.round(stat(state,'insight')*2.35+12);if(b.intent==='trick'){skipEnemy=true;b.log.push('黃光照破鎖住詭計，敵方本回合失手！');}}
      if(id==='forbidden'){damage=Math.round(attackPower()*3.1+stat(state,'vitality')*1.6);state.stress=clamp(state.stress+18,0,100);b.log.push('逆頁真氣暴走，心火 +18！');}
    }
    if(action==='guard'){b.playerGuard=true;b.log.push('你穩住下盤，等待對方出招。');}
    if(action==='focus'){
      state.qi=Math.min(maxQi(state),state.qi+7);
      if(b.intent==='trick'){
        damage=Math.round(stat(state,'insight')*1.4+8);skipEnemy=true;b.log.push('你看破假動作，反手命中真身！');
        if(state.origin==='talent'){
          damage=Math.round(damage*1.35);state.metrics.talentReads++;
          b.log.push('六天傳說的牌感讓看破反擊傷害 +35%。');
          if(state.metrics.talentReads%3===0){const beforeQi=maxQi(state);state.stats.insight++;state.qi=Math.min(maxQi(state),state.qi+maxQi(state)-beforeQi);b.log.push('連續讀懂三次詭計，本世心眼 +1！');}
        }
      }
      else b.log.push('你調整呼吸，真氣回復 7。');
    }
    if(action==='rice'&&consumeItem(state,'rice')){state.hp=Math.min(maxHp(state),state.hp+38);b.log.push('米特飯盒恢復 38 氣血。');}
    if(state.buff?.id==='rage'&&damage>0){damage=Math.round(damage*1.3);state.stress=clamp(state.stress+5,0,100);useBuff(state);b.log.push('紅溫聖旨讓傷害暴增！');}
    if(state.origin==='local'&&state.hp<=maxHp(state)*.3&&damage>0){damage=Math.round(damage*1.4);b.log.push('大中計體質瀕死逆轉：本次輸出 +40%！');}
    if(b.foe.id==='taishan'&&damage>0)damage=Math.round(damage*(1+state.vows.length*.06));
    if(damage>0&&hasItem(state,'rogercrown')){damage=b.foeHp;b.log.push('王冠越過此地所有法則，敵人的命數在一擊之內歸零。');}
    else{
      if(damage>0&&b.foe.mysteryMechanic)damage=applyMysteryDamageRule(action.replace('martial:',''),damage,b);
      if(damage>0&&b.foe.boss&&!b.foe.mystery)damage=applyBossDamageRule(action.replace('martial:',''),damage,b);
      if(damage>0&&b.foe.elite)damage=applyEliteDamageRule(action,damage,b);
    }
    if(damage>0){b.foeHp=Math.max(0,b.foeHp-damage);b.log.push(`你造成 ${damage} 點傷害。`);}
    if(b.foeHp<=0){battleWin();return;}
    if(!skipEnemy) enemyTurn(action);
    if(!currentBattle)return;
    if(state.hp<=0){
      let deathClue='';
      if(b.foe.boss&&b.foe.requiredItem&&!hasItem(state,b.foe.requiredItem)){
        if(!state.bossItemHints.includes(b.foe.id))state.bossItemHints.push(b.foe.id);
        const item=ITEMS[b.foe.requiredItem];
        deathClue=`臨死前你看見「${item?.name||'某件關鍵物'}」的殘影。${b.foe.itemHint}`;
      }
      save();render();setTimeout(()=>showDeath(`你敗給了「${b.foe.name}」。江湖沒有讀檔鍵，只有下一世。`,deathClue),250);return;
    }
    tickBossRule(b);b.turn++;b.intent=nextIntent(b.foe,b.turn);b.busy=false;save();render();renderBattle();
  }

  function enemyTurn(playerAction) {
    const b=currentBattle,intent=b.intent,base=b.foe.attack+roll(-2,4);let dmg=0,penetration=0,ignoreDefense=false,guardRate=intent==='heavy'?.22:.48,applyArmorBreak=false;
    if(intent==='attack')dmg=base;
    if(intent==='heavy')dmg=Math.round(base*1.75);
    if(intent==='guard'){
      b.foeGuard=true;
      if(b.foe.elite&&b.foe.hiddenMechanic==='guard'){const heal=Math.ceil(b.foe.hp*.07);b.foeHp=Math.min(b.foe.hp,b.foeHp+heal);b.log.push(`${b.foe.name} 架勢一沉，傷口竟恢復 ${heal} 點。`);}
      else b.log.push(`${b.foe.name} 架起防守。`);
      return;
    }
    if(intent==='trick'){
      dmg=Math.round(base*.65);state.qi=Math.max(0,state.qi-8);state.stress=clamp(state.stress+(b.foe.id==='copies'?15:8),0,100);b.log.push('詭計命中：真氣流失，心火上升。');
      if(b.foe.elite&&b.foe.hiddenMechanic==='trick'){const lost=Math.floor(state.qi*.35);state.qi=Math.max(0,state.qi-lost);b.log.push(`精英詭計再吞掉 ${lost} 真氣。`);}
    }
    const mystery=b.foe.mysteryMechanic;
    if(mystery==='tree'&&intent==='heavy'){dmg=Math.ceil(maxHp(state)*.2);ignoreDefense=true;guardRate=1;}
    if(mystery==='delay'&&intent==='heavy'){dmg=Math.max(dmg,Math.ceil(maxHp(state)*.3));penetration=.7;b.log.push('延遲許久的杖擊突然落下。');}
    if(mystery==='graft'&&b.foeHp<=b.foe.hp*.5){if(b.phase===1){b.phase=2;b.log.push('龍首在斷臂上甦醒，火焰吞沒半座戰場！');}dmg=Math.round(dmg*1.45);penetration=Math.max(penetration,.35);}
    if(mystery==='giant'&&intent==='heavy'){dmg=Math.max(dmg,Math.ceil(maxHp(state)*.26));penetration=.6;}
    if(mystery==='blackblade'&&dmg>0)b.dotTurns=3;
    if(mystery==='rot'&&b.turn%4===0){dmg=Math.max(dmg,Math.ceil(maxHp(state)*.36));ignoreDefense=true;guardRate=.55;b.log.push('猩紅翼影化成一整輪不肯停下的連斬。');}
    if(mystery==='firstlord'&&b.foeHp<=b.foe.hp*.5){if(b.phase===1){b.phase=2;b.log.push('葛孚雷捨棄王名，戰士荷萊露徒手踏碎地面。');}dmg=Math.round(dmg*1.65);penetration=Math.max(penetration,.45);}
    if(mystery==='beast'&&b.turn%5===0){dmg=Math.max(dmg,Math.ceil(maxHp(state)*.32));ignoreDefense=true;guardRate=.6;b.log.push('群星在腳下排成一道追蹤不休的光河。');}
    const brokenBefore=b.armorBrokenTurns>0;
    if(b.foe.id==='sleep'&&intent==='heavy'){penetration=.75;applyArmorBreak=true;b.log.push('棉被重壓穿透 75% 防禦，並撕開你的護體架勢！');}
    if(b.foe.id==='green'&&intent==='trick')penetration=.45;
    if(b.foe.id==='copies'&&intent==='trick')penetration=.6;
    if(b.foe.id==='crows'&&b.turn%3===0){dmg=Math.max(dmg,Math.ceil(maxHp(state)*.18));ignoreDefense=true;guardRate=.5;b.log.push('雙烏夾擊！至少造成最大氣血 18% 的穿透傷害。');}
    if(b.foe.id==='taishan'&&b.turn%3===0){dmg=Math.max(dmg,Math.ceil(maxHp(state)*.2));ignoreDefense=true;guardRate=.65;b.log.push('問心天劫！至少造成最大氣血 20% 的穿透傷害。');}
    if(b.foe.elite&&b.foe.hiddenMechanic==='brute'&&intent==='heavy'){dmg=Math.max(dmg,Math.ceil(maxHp(state)*.24));penetration=Math.max(penetration,.65);b.log.push('精英重壓直撼經脈，傷害依最大氣血計算！');}
    if(b.foe.elite&&b.foe.hiddenMechanic==='swift'&&b.turn%3===0){dmg=Math.round(dmg*1.65);b.log.push('殘影在第三回合重疊成第二次追擊！');}
    if(b.playerGuard){
      dmg=Math.round(dmg*guardRate);
      if(intent==='heavy'){
        let counter=Math.round(defensePower()*.8);
        if(mystery==='tree')counter=0;
        else if(hasItem(state,'rogercrown'))counter=b.foeHp;
        else if(mystery)counter=applyMysteryDamageRule('counter',counter,b);
        else if(b.foe.boss)counter=applyBossDamageRule('counter',counter,b);
        if(counter>0){b.foeHp=Math.max(0,b.foeHp-counter);b.log.push(`完美防住重擊，反制造成 ${counter} 點傷害！`);}
      }
      b.playerGuard=false;
    }
    const effectiveDefense=ignoreDefense?0:Math.round(defensePower()*(1-penetration)*(brokenBefore?.25:1));
    dmg=Math.max(1,dmg-effectiveDefense);
    if(b.ironTurns>0){dmg=Math.max(1,Math.round(dmg*.52));b.ironTurns--;b.log.push(`鐵骨護體吸收衝擊・剩 ${b.ironTurns} 回合。`);}
    if(b.foe.id==='taishan')dmg=Math.max(1,Math.round(dmg*(1-Math.min(.3,state.routes.integrity*.008+state.routes.ties*.004))));
    state.hp=Math.max(0,state.hp-dmg);b.damageTaken+=dmg;b.log.push(`${b.foe.name} 造成 ${dmg} 點傷害。`);
    if(mystery==='blackblade'&&b.dotTurns>0){const burn=Math.ceil(maxHp(state)*.05);state.hp=Math.max(0,state.hp-burn);b.damageTaken+=burn;b.dotTurns--;b.log.push(`黑色刀痕仍在燃燒，額外奪走 ${burn} 氣血。`);}
    if(mystery==='rot'&&dmg>0){const heal=Math.ceil(dmg*.75);b.foeHp=Math.min(b.foe.hp,b.foeHp+heal);b.log.push(`瑪蓮妮亞從命中的傷口取回 ${heal} 氣血。`);}
    if(brokenBefore)b.armorBrokenTurns--;
    if(applyArmorBreak){b.armorBrokenTurns=2;b.log.push('破甲生效：接下來 2 次敵方攻勢只計算 25% 防禦。');}
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
    if(foe.mystery&&foe.mysteryMechanic==='duo'&&!b.revived){
      b.revived=true;b.foeHp=Math.ceil(foe.hp*.46);b.log.push('倒下的神皮重新被另一道氣息撐起，戰鬥還沒有結束！');b.busy=false;b.intent=nextIntent(foe,b.turn);save();render();renderBattle();return;
    }
    if(foe.mystery){battleWinMystery();return;}
    if(!foe.boss){
      const levelBefore=state.level, achievementBefore=[...state.achievements];
      state.metrics.wins++;if(state.hp<=10)state.metrics.oneHpWins++;
      if(foe.rareSentinel)state.metrics.sentinelWins++;
      if(foe.elite)state.metrics.eliteWins++;
      if(foe.forced){state.metrics.forcedWins++;state.delayedThreat=null;if(foe.eventId&&!state.triggeredEvents.includes(foe.eventId))state.triggeredEvents.push(foe.eventId);}
      const bonus=foe.elite?18:0,reward=foe.reward+bonus;
      const xp=gainXp(state,Math.round(foe.xp));state.coins+=reward;state.fame+=foe.elite?2:1;
      addLog('good',`擊敗・${foe.name}`,foe.forced?'你在期限壓力下解開異象，硬是把這場不能逃的戰鬥活了下來。':'你不是靠按下一頁贏的，是看招、出招和活著離開。',`糖錢 +${reward} · 經驗 +${xp}${foe.elite?' · 精英破解':''}`);
      checkAchievements();const newAchievements=state.achievements.filter(id=>!achievementBefore.includes(id)).map(id=>ACHIEVEMENTS.find(a=>a.id===id)?.name).filter(Boolean);
      const sentinelFollowup=!foe.elite&&!foe.forced&&!foe.rareSentinel&&treeSentinelAppears(Math.random());
      const transition=sentinelFollowup?null:advanceChapterStep();save();render();pushChat('hype',state.hp<=10?'一滴血！這能贏？':'打得好！');
      const next=sentinelFollowup
        ? ()=>startEncounter(false,{...TREE_SENTINEL,boss:false,mystery:false,rareSentinel:true},false,true)
        : transition?()=>showChapterTransition(transition):null;
      showBattleResult({foe,xp,coins:reward,levelBefore,newAchievements,next});return;
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

  function battleWinMystery() {
    const b=currentBattle,foe=b.foe,index=state.mysteryChallenge.index,levelBefore=state.level,achievementBefore=[...state.achievements];
    const reward=foe.reward||300,xp=gainXp(state,foe.xp||300);state.coins+=reward;state.fame+=5;state.metrics.mysteryWins++;
    state.hp=Math.min(maxHp(state),state.hp+Math.ceil(maxHp(state)*.36));state.qi=maxQi(state);
    if(MYSTERY_BOSSES[index]?.id===foe.id)state.mysteryChallenge.index=Math.min(MYSTERY_BOSSES.length,index+1);
    const complete=state.mysteryChallenge.index>=MYSTERY_BOSSES.length;
    if(complete){state.mysteryChallenge.cleared=true;state.metrics.eldenClears++;addItem(state,'rogercrown');}
    addLog('gold',`神秘挑戰・擊破 ${foe.name}`,complete?'群星退去，最後一條黃金律法也在你面前碎裂。':'裂隙記住這一勝；現在退走，下次仍會從下一名守衛開始。',`糖錢 +${reward} · 經驗 +${xp}${complete?' · 羅傑的王冠':''}`);
    checkAchievements();const newAchievements=state.achievements.filter(id=>!achievementBefore.includes(id)).map(id=>ACHIEVEMENTS.find(a=>a.id===id)?.name).filter(Boolean);
    const nextIndex=state.mysteryChallenge.index;save();render();currentBattle=null;
    openModal({
      kicker:complete?'神秘挑戰・王座已開':`神秘挑戰・突破 ${nextIndex}/${MYSTERY_BOSSES.length}`,
      title:complete?'艾爾登之王':`擊破 ${foe.name}`,
      body:`<div class="battle-result"><div class="result-seal">${complete?'王':'勝'}</div><h3>${complete?'👑 羅傑的王冠':`${foe.icon} ${esc(foe.name)} 已被擊敗`}</h3><p>${complete?'艾爾登之獸化為星塵。你取得凌駕所有戰鬥法則的冠冕。':'下一道霧門已經打開；也可以先退回斷腿崖整備。'}</p><div class="result-rewards"><div><span>糖錢</span><b>+${reward}</b></div><div><span>經驗</span><b>+${xp}</b></div><div><span>進度</span><b>${nextIndex}/${MYSTERY_BOSSES.length}</b></div></div>${state.level>levelBefore?`<div class="result-notice">升級至 LV.${state.level}</div>`:''}${newAchievements.length?`<div class="result-notice achievement-pop">新成就：${newAchievements.map(esc).join('、')}</div>`:''}</div>`,
      closable:false,
      actions:complete
        ? [{label:'戴上王冠，返回斷腿崖',sub:'王冠已收入行囊',primary:true,onClick:forceCloseModal}]
        : [{label:`繼續・${MYSTERY_BOSSES[nextIndex].name}`,sub:'不消耗額外行動，直接進入下一戰',primary:true,onClick:()=>{forceCloseModal();startEncounter(false,{...MYSTERY_BOSSES[nextIndex]},false,true);}},{label:'退走',sub:'保留目前進度，之後可從斷腿崖回來',onClick:forceCloseModal}]
    });
  }

  function openBossStory(id) {
    const scene=BOSS_CHOICES[id];
    openModal({kicker:scene.kicker,title:scene.title,body:`<p>${scene.text}</p><p class="warning">這個選擇會刻進泰山最後一戰與結局，不可在本世重選。</p>`,closable:false,actions:scene.choices.map(choice=>({label:choice.label,sub:choice.sub,onClick:()=>{
      choice.apply(state);state.choices.push({boss:id,choice:choice.label});state.pendingStory=null;state.bossIndex++;state.chapterStep=0;state.location='outer';state.ap=maxAp(state);state.day++;state.hp=maxHp(state);state.qi=maxQi(state);state.stress=Math.max(0,state.stress-18);
      addLog('gold',`故事選擇・${choice.label}`,scene.title,choice.sub);checkAchievements();save();forceCloseModal();render();pushChat('system',`系統：${chapter().number}「${chapter().title}」已開啟，共有四個小回目。`);
      if(resolveRelationshipCrisis())return;
      openTimedEvent();
    }}))});
  }

  function openFinalChoice() {
    const heartActions=[];
    if(state.romance.heart==='nl')heartActions.push({label:'回到山門，赴小師妹留下的約',sub:state.romance.nlStage>=3?'NL 感情線專屬結局':'有些沒有說完的話，泰山也不能替你補上',onClick:()=>finishGame('nl')});
    if(state.romance.heart==='vivi')heartActions.push({label:'走進風雪，追上夏侯芝的傘',sub:state.romance.viviStage>=3?'VIVI 感情線專屬結局':'傳功之後若沒有同行，雪仍會埋掉足跡',onClick:()=>finishGame('vivi')});
    openModal({kicker:'泰山之巔・最後選擇',title:'你想成為哪一個羅正男？',body:'<p>泰山倒下後，山頂沒有獎盃，只有一台還亮著的直播機。過去的每個選擇都已經算進結果，但最後要按哪一個鍵，仍然由你決定。</p>',closable:false,actions:[
      ...heartActions,
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
    if(finalChoice==='master_goat')return{id:'master_goat',rank:'GAME OVER',title:'糖之漢被開山羌',text:'十萬分之一的山羌撞進糖門，掌門糖之漢當場死亡。失去師父的糖門無法繼續傳功，羅瘸的這一世在尚未登上泰山前被迫結束。'};
    if(finalChoice==='nl'){
      if(state.romance.nlStage<3)return{id:'nl_missed',rank:'B',title:'飯盒已經冷了',text:'你回到糖門才發現山門沒有留燈。糖汶銨曾經等過，也曾把選擇交給你；只是那些被你留到最後才說的話，已經追不上她的腳步。'};
      if(state.romance.nlFate==='road')return{id:'nl_road',rank:'SS',title:'鈴聲所至皆是家',text:'你沒有要求她為糖門停下，她也沒有讓你獨自困在山門。兩人帶著一只飯盒、一枚靜音鈴走遍江湖；鈴不響時，你仍知道她就在身旁。'};
      return{id:'nl_home',rank:'SS',title:'山門燈火',text:'泰山之後，你第一次準時回到有人等的地方。糖汶銨掌刀，你掌門；每天最重要的決策不是流量，而是誰去關門、誰把飯熱好。糖門的薪火終於像一個家。'};
    }
    if(finalChoice==='vivi'){
      if(state.romance.viviStage<3)return{id:'vivi_missed',rank:'B',title:'雪地沒有回音',text:'你循著傘痕走到雪山，只找到一條褪色紅緞。夏侯芝把力量留給了你，卻沒有等到一句要她留下的話；天下第一的招式，補不回同行的人。'};
      if(state.romance.viviFate==='gate')return{id:'vivi_gate',rank:'SS',title:'糖雪雙門',text:'夏侯芝把雪山派的傘插在糖門門口，第一條新門規是禁止用傳功交代遺言。她照樣每天罵你，你照樣每天碎念；兩個差點斷掉的門派，反而一起有了家。'};
      return{id:'vivi_snow',rank:'SS',title:'雪山雙傘',text:'你跟夏侯芝回到雪山，不接遺產，只一起收徒。她仍逢人便說你是最笨的弟子，轉身卻把你的名字刻在掌門旁邊。風雪很長，這次沒有人被留下。'};
    }
    if(state.vows.length>=4&&balanced)return{id:'whole',rank:'SS',title:'瘸俠不是一個人',text:'你沒有把任何一段人生剪掉。冠軍、朋友、家、失敗與聊天室都被留在同一個人身上。泰山承認的不是最強數值，而是一個完整的人。'};
    if(finalChoice==='cards'&&r.discipline+r.integrity>=24&&stat(state,'insight')>=18)return{id:'winter',rank:'S',title:'冬季之王・再臨',text:'你關掉多餘分頁，重新坐回牌桌。這次每一道黃光都看得清楚，世界冠軍不再只是「如果當時」。'};
    if(finalChoice==='brand'&&r.show+r.integrity>=25)return{id:'empire',rank:'S',title:'糖門娛樂帝國',text:'你把迷因變成制度，也終於理解老蟹為什麼每天看帳本嘆氣。新收的天才弟子今天又睡到下午。'};
    if(finalChoice==='self'&&r.ties+r.integrity>=23)return{id:'home',rank:'S',title:'家仍是存檔點',text:'你建立真正能保護家人的直播空間。這是最安靜、最不像精華，卻最不需要重生的結局。'};
    if(finalChoice==='live'&&r.chaos+r.show>=24)return{id:'algorithm',rank:'S?',title:'完全羅正男',text:'本尊、分身與聊天室再也分不開。網路上每一個「真假」都可能是你，也可能不是。你看著鏡頭說：確實，有料。'};
    if(r.discipline===Math.max(...Object.values(r)))return{id:'master',rank:'A+',title:'糖門新掌門',text:'你沒有變成最完美的實況主，卻成為第一個真的照表開門的糖門掌門。門規第一條：明天一定，必須寫時間。'};
    return{id:'stilllive',rank:'A',title:'還在開台',text:'山下聊天室問今天玩什麼。你看一眼走過的路，沒有宣布退休，也沒有再立大願，只說：「等一下啦。」'};
  }

  async function copySummary(e){const text=`《瘸俠傳：糖門再起》\n結局：${e.title}｜評價 ${e.rank}\nLV.${state.level}｜俠名 ${state.fame}｜轉生 ${state.reincarnations}\n${e.text}`;try{await navigator.clipboard.writeText(text);toast('結算摘要已複製');}catch(_){prompt('手動複製：',text);}}

  function showMasterGoatEnding() {
    currentBattle=null;modalClosable=false;const e=calculateEnding('master_goat'),collection=endingCollection();
    openModal({kicker:`0.001% 特殊事件・已收入結局圖鑑 ${collection.length} 種`,title:e.title,closable:false,body:`<div class="ending-rank game-over-rank">${e.rank}</div><p class="ending-summary">${e.text}</p><div class="story-box"><h4>本世已永久結束</h4><p>這不是羅瘸死亡，因此不能轉生續接。糖門失去掌門後故事中止，只能清除本世進度並從標題重新開始。</p></div>`,actions:[{label:'回到標題重新開始',sub:'清除本世進度；結局圖鑑仍會保留',primary:true,onClick:()=>{localStorage.removeItem(SAVE_KEY);location.reload();}}]});
  }

  function showDeath(reason, clue = '') {
    currentBattle=null;modalClosable=false;
    openModal({kicker:'死亡・本世修行中止',title:'羅瘸倒下了',body:`<p>${esc(reason)}</p>${clue?`<div class="boss-clue death-clue"><b>死亡留下的守關線索</b><p>${esc(clue)}</p><small>這條線索會跨世保留，下一世可在 Boss 頁再次查看。</small></div>`:''}<div class="story-box"><h4>死亡規則</h4><p>等級、裝備、糖錢與本世故事歸零；已解鎖成就、結局圖鑑、守關線索與轉生次數保留。你還能選一項四維，永久 +2 帶進下一世。</p></div>`,closable:false,actions:[{label:'接受死亡，選擇轉生根骨',sub:'這不是讀檔；下一世會更強',primary:true,onClick:()=>showRebirth(false)}]});
  }

  function showRebirth(fromEnding=false) {
    openModal({kicker:fromEnding?'New Game+・功成轉生':'轉生・帶著傷疤重來',title:'下一世留下什麼？',body:`<div class="choice-grid">${Object.entries(STAT_NAMES).map(([key,name])=>`<button class="choice-card" data-rebirth="${key}"><b>${STAT_ICONS[key]}・${name}</b><span>永久 +2</span><small>目前跨世加成 ${state.legacyStats[key]||0}</small></button>`).join('')}</div>`,closable:false,afterOpen:()=>document.querySelectorAll('[data-rebirth]').forEach(btn=>btn.onclick=()=>rebirth(btn.dataset.rebirth))});
  }
  function rebirth(key) {
    const legacyStats={...state.legacyStats,[key]:(state.legacyStats[key]||0)+2};
    const legacy={achievements:[...state.achievements],bossItemHints:[...state.bossItemHints],reincarnations:state.reincarnations+1,legacyStats};
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
      if(state.finalChoice==='master_goat'){showMasterGoatEnding();return;}
      const e=calculateEnding(state.finalChoice);
      openModal({kicker:'已完成的本世存檔',title:e.title,body:`<div class="ending-rank">${e.rank}</div><p class="ending-summary">${e.text}</p>`,closable:false,actions:[{label:'帶著記憶開啟下一世',sub:'保留成就與一項永久四維',primary:true,onClick:()=>showRebirth(true)}]});
      return;
    }
    if(state.hp<=0||state.stress>=100){showDeath('上次關閉頁面時，本世已經倒下。死亡紀錄仍然有效。');return;}
    if(state.pendingStory){openBossStory(state.pendingStory);return;}
    if(state.pendingFinal){openFinalChoice();return;}
    if(state.delayedThreat){openTimedEvent();return;}
    if(!showTutorial)return;
    openModal({kicker:'序章・糖門招生',title:'不是每次失敗都叫大中計',body:`<p>${esc(state.name)}，糖門不問你過去遲到幾次、按錯幾張牌，只問一件事：下一招要不要自己選？</p><div class="story-box"><h4>五大章・二十小回</h4><p>每一大章包含三回養成與故事考驗，第四回才是守關 Boss。修行、打怪、存活日數與指定江湖帖都會成為推進條件，無法直接跳關。</p></div><p>每一天有有限行動。戰鬥時先看敵人意圖：紅光要防禦、紫光要看破。死亡後必須轉生，但能永久帶走一項根骨與所有成就。</p>`,actions:[{label:'我自己選路',sub:'從第一章・第一回開始糖門修行',primary:true,onClick:forceCloseModal}]});
  }

  document.querySelector('.eyebrow > .live-dot')?.addEventListener('click',()=>{
    pulseStep++;if(pulseStep!==3)return;pulseStep=0;
    const lattice=[8,117,91,123,22,102,77,107,13,105,88,49,5,32,61,48,17,56,44,37,19,60,73,36,29,52];
    const expected=lattice.filter((_,index)=>index%2).map((value,index)=>String.fromCharCode(value^((index*13+7)&31))).join('');
    const settle=()=>{
      const answer=document.querySelector('.phase-field')?.value||'';forceCloseModal();if(answer!==expected)return;
      try{
        localStorage.setItem(`${SAVE_KEY}:phase`,'1');
        if(state){harmonize(state);save();render();}
        else{const stored=loadSave();if(stored)localStorage.setItem(SAVE_KEY,JSON.stringify(harmonize(stored)));}
        toast('風向變了。');
      }catch(_){toast('風向沒有留下來。');}
    };
    openModal({kicker:'……',title:'門內無字',body:'<input class="phase-field" type="password" autocomplete="off" aria-label="輸入">',actions:[{label:'確認',primary:true,onClick:settle},{label:'離開',onClick:forceCloseModal}],afterOpen:()=>{const field=document.querySelector('.phase-field');field?.focus();if(field)field.onkeydown=e=>{if(e.key==='Enter')settle();};}});
  });

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
  if(saved){const savedChapter=CHAPTERS[Math.min(saved.bossIndex,4)],savedSection=savedChapter.sections[Math.min(saved.chapterStep||0,3)];$('continue-game').textContent=`繼續第 ${saved.day} 日・${savedChapter.number}${savedSection.number}`;}

})();
