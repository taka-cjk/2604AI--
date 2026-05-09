export type StationEntry = {
  name: string   // DB key (kanji)
  kana: string   // hiragana (for search)
  label: string  // English romaji
  lat: number
  lng: number
}

export const STATIONS: StationEntry[] = [
  // ── JR山手線 ─────────────────────────────────────────────────────────────
  { name: "東京",       kana: "とうきょう",         label: "Tokyo",              lat: 35.6812, lng: 139.7671 },
  { name: "有楽町",     kana: "ゆうらくちょう",     label: "Yurakucho",          lat: 35.6753, lng: 139.7631 },
  { name: "新橋",       kana: "しんばし",           label: "Shimbashi",          lat: 35.6667, lng: 139.7586 },
  { name: "浜松町",     kana: "はままつちょう",     label: "Hamamatsucho",       lat: 35.6555, lng: 139.7571 },
  { name: "田町",       kana: "たまち",             label: "Tamachi",            lat: 35.6455, lng: 139.7476 },
  { name: "品川",       kana: "しながわ",           label: "Shinagawa",          lat: 35.6284, lng: 139.7387 },
  { name: "大崎",       kana: "おおさき",           label: "Osaki",              lat: 35.6197, lng: 139.7285 },
  { name: "五反田",     kana: "ごたんだ",           label: "Gotanda",            lat: 35.6260, lng: 139.7237 },
  { name: "目黒",       kana: "めぐろ",             label: "Meguro",             lat: 35.6334, lng: 139.7157 },
  { name: "恵比寿",     kana: "えびす",             label: "Ebisu",              lat: 35.6467, lng: 139.7100 },
  { name: "渋谷",       kana: "しぶや",             label: "Shibuya",            lat: 35.6580, lng: 139.7016 },
  { name: "原宿",       kana: "はらじゅく",         label: "Harajuku",           lat: 35.6702, lng: 139.7027 },
  { name: "代々木",     kana: "よよぎ",             label: "Yoyogi",             lat: 35.6831, lng: 139.7023 },
  { name: "新宿",       kana: "しんじゅく",         label: "Shinjuku",           lat: 35.6896, lng: 139.7006 },
  { name: "新大久保",   kana: "しんおおくぼ",       label: "Shin-Okubo",         lat: 35.7006, lng: 139.7002 },
  { name: "高田馬場",   kana: "たかだのばば",       label: "Takadanobaba",       lat: 35.7123, lng: 139.7036 },
  { name: "目白",       kana: "めじろ",             label: "Mejiro",             lat: 35.7213, lng: 139.7060 },
  { name: "池袋",       kana: "いけぶくろ",         label: "Ikebukuro",          lat: 35.7295, lng: 139.7109 },
  { name: "大塚",       kana: "おおつか",           label: "Otsuka",             lat: 35.7318, lng: 139.7285 },
  { name: "巣鴨",       kana: "すがも",             label: "Sugamo",             lat: 35.7333, lng: 139.7393 },
  { name: "駒込",       kana: "こまごめ",           label: "Komagome",           lat: 35.7368, lng: 139.7484 },
  { name: "田端",       kana: "たばた",             label: "Tabata",             lat: 35.7381, lng: 139.7603 },
  { name: "西日暮里",   kana: "にしにっぽり",       label: "Nishi-Nippori",      lat: 35.7322, lng: 139.7668 },
  { name: "日暮里",     kana: "にっぽり",           label: "Nippori",            lat: 35.7279, lng: 139.7710 },
  { name: "鶯谷",       kana: "うぐいすだに",       label: "Uguisudani",         lat: 35.7206, lng: 139.7780 },
  { name: "上野",       kana: "うえの",             label: "Ueno",               lat: 35.7141, lng: 139.7774 },
  { name: "御徒町",     kana: "おかちまち",         label: "Okachimachi",        lat: 35.7077, lng: 139.7737 },
  { name: "秋葉原",     kana: "あきはばら",         label: "Akihabara",          lat: 35.6984, lng: 139.7731 },
  { name: "神田",       kana: "かんだ",             label: "Kanda",              lat: 35.6918, lng: 139.7706 },

  // ── 港区・千代田区 ───────────────────────────────────────────────────────
  { name: "表参道",     kana: "おもてさんどう",     label: "Omotesando",         lat: 35.6654, lng: 139.7124 },
  { name: "青山一丁目", kana: "あおやまいっちょうめ", label: "Aoyama-Itchome",   lat: 35.6719, lng: 139.7226 },
  { name: "六本木",     kana: "ろっぽんぎ",         label: "Roppongi",           lat: 35.6627, lng: 139.7310 },
  { name: "麻布十番",   kana: "あざぶじゅうばん",   label: "Azabu-Juban",        lat: 35.6551, lng: 139.7378 },
  { name: "広尾",       kana: "ひろお",             label: "Hiroo",              lat: 35.6504, lng: 139.7183 },
  { name: "白金台",     kana: "しろかねだい",       label: "Shirokanedai",       lat: 35.6406, lng: 139.7284 },
  { name: "白金高輪",   kana: "しろかねたかなわ",   label: "Shirokanedakarinwa", lat: 35.6453, lng: 139.7340 },
  { name: "三田",       kana: "みた",               label: "Mita",               lat: 35.6480, lng: 139.7442 },
  { name: "泉岳寺",     kana: "せんがくじ",         label: "Sengakuji",          lat: 35.6366, lng: 139.7402 },
  { name: "大門",       kana: "だいもん",           label: "Daimon",             lat: 35.6558, lng: 139.7552 },
  { name: "汐留",       kana: "しおどめ",           label: "Shiodome",           lat: 35.6604, lng: 139.7580 },
  { name: "神谷町",     kana: "かみやちょう",       label: "Kamiyacho",          lat: 35.6671, lng: 139.7421 },
  { name: "赤坂",       kana: "あかさか",           label: "Akasaka",            lat: 35.6740, lng: 139.7374 },
  { name: "赤坂見附",   kana: "あかさかみつけ",     label: "Akasaka-Mitsuke",    lat: 35.6797, lng: 139.7372 },
  { name: "永田町",     kana: "ながたちょう",       label: "Nagatacho",          lat: 35.6745, lng: 139.7448 },
  { name: "溜池山王",   kana: "ためいけさんのう",   label: "Tameike-Sanno",      lat: 35.6676, lng: 139.7423 },
  { name: "霞ヶ関",     kana: "かすみがせき",       label: "Kasumigaseki",       lat: 35.6733, lng: 139.7495 },
  { name: "日比谷",     kana: "ひびや",             label: "Hibiya",             lat: 35.6726, lng: 139.7586 },
  { name: "大手町",     kana: "おおてまち",         label: "Otemachi",           lat: 35.6859, lng: 139.7661 },
  { name: "半蔵門",     kana: "はんぞうもん",       label: "Hanzomon",           lat: 35.6814, lng: 139.7431 },
  { name: "九段下",     kana: "くだんした",         label: "Kudanshita",         lat: 35.6963, lng: 139.7493 },
  { name: "神保町",     kana: "じんぼうちょう",     label: "Jimbocho",           lat: 35.6971, lng: 139.7569 },
  { name: "四ッ谷",     kana: "よつや",             label: "Yotsuya",            lat: 35.6862, lng: 139.7296 },
  { name: "市ヶ谷",     kana: "いちがや",           label: "Ichigaya",           lat: 35.6927, lng: 139.7368 },
  { name: "麹町",       kana: "こうじまち",         label: "Kojimachi",          lat: 35.6836, lng: 139.7356 },

  // ── 中央区 ───────────────────────────────────────────────────────────────
  { name: "銀座",       kana: "ぎんざ",             label: "Ginza",              lat: 35.6717, lng: 139.7640 },
  { name: "東銀座",     kana: "ひがしぎんざ",       label: "Higashi-Ginza",      lat: 35.6695, lng: 139.7671 },
  { name: "築地",       kana: "つきじ",             label: "Tsukiji",            lat: 35.6656, lng: 139.7758 },
  { name: "月島",       kana: "つきしま",           label: "Tsukishima",         lat: 35.6681, lng: 139.7842 },
  { name: "日本橋",     kana: "にほんばし",         label: "Nihonbashi",         lat: 35.6834, lng: 139.7739 },
  { name: "三越前",     kana: "みつこしまえ",       label: "Mitsukoshimae",      lat: 35.6836, lng: 139.7767 },
  { name: "馬喰町",     kana: "ばくろちょう",       label: "Bakurocho",          lat: 35.6933, lng: 139.7775 },
  { name: "人形町",     kana: "にんぎょうちょう",   label: "Ningyocho",          lat: 35.6837, lng: 139.7835 },
  { name: "水天宮前",   kana: "すいてんぐうまえ",   label: "Suitengumae",        lat: 35.6823, lng: 139.7890 },
  { name: "八丁堀",     kana: "はっちょうぼり",     label: "Hatchobori",         lat: 35.6751, lng: 139.7773 },
  { name: "茅場町",     kana: "かやばちょう",       label: "Kayabacho",          lat: 35.6777, lng: 139.7810 },

  // ── 新宿区 ───────────────────────────────────────────────────────────────
  { name: "新宿三丁目", kana: "しんじゅくさんちょうめ", label: "Shinjuku-Sanchome", lat: 35.6898, lng: 139.7039 },
  { name: "新宿御苑前", kana: "しんじゅくぎょえんまえ", label: "Shinjuku-Gyoen-mae", lat: 35.6863, lng: 139.7082 },
  { name: "東新宿",     kana: "ひがししんじゅく",   label: "Higashi-Shinjuku",   lat: 35.6987, lng: 139.7096 },
  { name: "飯田橋",     kana: "いいだばし",         label: "Iidabashi",          lat: 35.7022, lng: 139.7449 },
  { name: "神楽坂",     kana: "かぐらざか",         label: "Kagurazaka",         lat: 35.7059, lng: 139.7405 },
  { name: "早稲田",     kana: "わせだ",             label: "Waseda",             lat: 35.7082, lng: 139.7197 },

  // ── 文京区 ───────────────────────────────────────────────────────────────
  { name: "後楽園",     kana: "こうらくえん",       label: "Korakuen",           lat: 35.7074, lng: 139.7519 },
  { name: "水道橋",     kana: "すいどうばし",       label: "Suidobashi",         lat: 35.7022, lng: 139.7539 },
  { name: "御茶ノ水",   kana: "おちゃのみず",       label: "Ochanomizu",         lat: 35.6980, lng: 139.7651 },
  { name: "本郷三丁目", kana: "ほんごうさんちょうめ", label: "Hongo-Sanchome",   lat: 35.7078, lng: 139.7604 },
  { name: "湯島",       kana: "ゆしま",             label: "Yushima",            lat: 35.7099, lng: 139.7693 },
  { name: "根津",       kana: "ねづ",               label: "Nezu",               lat: 35.7196, lng: 139.7625 },
  { name: "千駄木",     kana: "せんだぎ",           label: "Sendagi",            lat: 35.7257, lng: 139.7611 },
  { name: "茗荷谷",     kana: "みょうがだに",       label: "Myogadani",          lat: 35.7209, lng: 139.7381 },
  { name: "東大前",     kana: "とうだいまえ",       label: "Todaimae",           lat: 35.7277, lng: 139.7576 },
  { name: "白山",       kana: "はくさん",           label: "Hakusan",            lat: 35.7249, lng: 139.7430 },
  { name: "本駒込",     kana: "ほんこまごめ",       label: "Honkomagome",        lat: 35.7368, lng: 139.7505 },
  { name: "千石",       kana: "せんごく",           label: "Sengoku",            lat: 35.7366, lng: 139.7427 },

  // ── 台東区 ───────────────────────────────────────────────────────────────
  { name: "浅草",       kana: "あさくさ",           label: "Asakusa",            lat: 35.7116, lng: 139.7966 },
  { name: "浅草橋",     kana: "あさくさばし",       label: "Asakusabashi",       lat: 35.7003, lng: 139.7883 },
  { name: "蔵前",       kana: "くらまえ",           label: "Kuramae",            lat: 35.7031, lng: 139.7926 },
  { name: "稲荷町",     kana: "いなりちょう",       label: "Inaricho",           lat: 35.7113, lng: 139.7824 },
  { name: "田原町",     kana: "たわらまち",         label: "Tawaracho",          lat: 35.7114, lng: 139.7926 },
  { name: "三ノ輪",     kana: "みのわ",             label: "Minowa",             lat: 35.7263, lng: 139.7875 },

  // ── 墨田区・江東区 ───────────────────────────────────────────────────────
  { name: "押上",       kana: "おしあげ",           label: "Oshiage",            lat: 35.7100, lng: 139.8130 },
  { name: "錦糸町",     kana: "きんしちょう",       label: "Kinshicho",          lat: 35.6964, lng: 139.8143 },
  { name: "両国",       kana: "りょうごく",         label: "Ryogoku",            lat: 35.6961, lng: 139.7938 },
  { name: "豊洲",       kana: "とよす",             label: "Toyosu",             lat: 35.6555, lng: 139.7957 },
  { name: "門前仲町",   kana: "もんぜんなかちょう", label: "Monzen-Nakacho",     lat: 35.6726, lng: 139.7970 },
  { name: "清澄白河",   kana: "きよすみしらかわ",   label: "Kiyosumi-Shirakawa", lat: 35.6802, lng: 139.7979 },
  { name: "木場",       kana: "きば",               label: "Kiba",               lat: 35.6722, lng: 139.8099 },
  { name: "東陽町",     kana: "とうようちょう",     label: "Toyocho",            lat: 35.6714, lng: 139.8175 },
  { name: "南砂町",     kana: "みなみすなまち",     label: "Minami-Sunamachicho",lat: 35.6672, lng: 139.8288 },
  { name: "新木場",     kana: "しんきば",           label: "Shinkiba",           lat: 35.6344, lng: 139.8231 },
  { name: "国際展示場", kana: "こくさいてんじじょう", label: "Kokusai-Tenjijo", lat: 35.6330, lng: 139.7949 },

  // ── 荒川区・足立区・葛飾区・江戸川区 ────────────────────────────────────
  { name: "南千住",     kana: "みなみせんじゅ",     label: "Minami-Senju",       lat: 35.7371, lng: 139.8003 },
  { name: "北千住",     kana: "きたせんじゅ",       label: "Kita-Senju",         lat: 35.7493, lng: 139.8039 },
  { name: "綾瀬",       kana: "あやせ",             label: "Ayase",              lat: 35.7649, lng: 139.8246 },
  { name: "三河島",     kana: "みかわしま",         label: "Mikawashima",        lat: 35.7329, lng: 139.7795 },
  { name: "町屋",       kana: "まちや",             label: "Machiya",            lat: 35.7373, lng: 139.7822 },
  { name: "亀有",       kana: "かめあり",           label: "Kameari",            lat: 35.7688, lng: 139.8468 },
  { name: "金町",       kana: "かなまち",           label: "Kanamachi",          lat: 35.7648, lng: 139.8706 },
  { name: "新小岩",     kana: "しんこいわ",         label: "Shin-Koiwa",         lat: 35.7325, lng: 139.8583 },
  { name: "小岩",       kana: "こいわ",             label: "Koiwa",              lat: 35.7327, lng: 139.8690 },
  { name: "葛西",       kana: "かさい",             label: "Kasai",              lat: 35.6663, lng: 139.8674 },
  { name: "西葛西",     kana: "にしかさい",         label: "Nishi-Kasai",        lat: 35.6676, lng: 139.8540 },
  { name: "一之江",     kana: "いちのえ",           label: "Ichinoe",            lat: 35.6932, lng: 139.8624 },
  { name: "瑞江",       kana: "みずえ",             label: "Mizue",              lat: 35.6924, lng: 139.8727 },
  { name: "竹ノ塚",     kana: "たけのつか",         label: "Takenotsuka",        lat: 35.7929, lng: 139.8289 },
  { name: "柴又",       kana: "しばまた",           label: "Shibamata",          lat: 35.7547, lng: 139.8651 },

  // ── 渋谷区・目黒区・世田谷区（私鉄） ────────────────────────────────────
  { name: "代官山",     kana: "だいかんやま",       label: "Daikanyama",         lat: 35.6490, lng: 139.7035 },
  { name: "中目黒",     kana: "なかめぐろ",         label: "Nakameguro",         lat: 35.6438, lng: 139.6977 },
  { name: "学芸大学",   kana: "がくげいだいがく",   label: "Gakugeidaigaku",     lat: 35.6281, lng: 139.6825 },
  { name: "祐天寺",     kana: "ゆうてんじ",         label: "Yutenji",            lat: 35.6387, lng: 139.6820 },
  { name: "自由が丘",   kana: "じゆうがおか",       label: "Jiyugaoka",          lat: 35.6076, lng: 139.6683 },
  { name: "都立大学",   kana: "とりつだいがく",     label: "Toritsu-Daigaku",    lat: 35.6186, lng: 139.6791 },
  { name: "大岡山",     kana: "おおおかやま",       label: "Ookayama",           lat: 35.6018, lng: 139.6928 },
  { name: "代々木上原", kana: "よよぎうえはら",     label: "Yoyogi-Uehara",      lat: 35.6701, lng: 139.6847 },
  { name: "代々木公園", kana: "よよぎこうえん",     label: "Yoyogi-Koen",        lat: 35.6750, lng: 139.6889 },
  { name: "下北沢",     kana: "しもきたざわ",       label: "Shimokitazawa",      lat: 35.6615, lng: 139.6683 },
  { name: "三軒茶屋",   kana: "さんげんじゃや",     label: "Sangenjaya",         lat: 35.6443, lng: 139.6706 },
  { name: "二子玉川",   kana: "ふたこたまがわ",     label: "Futako-Tamagawa",    lat: 35.6093, lng: 139.6274 },
  { name: "用賀",       kana: "ようが",             label: "Yoga",               lat: 35.6196, lng: 139.6411 },
  { name: "桜新町",     kana: "さくらしんまち",     label: "Sakura-Shimmachi",   lat: 35.6350, lng: 139.6506 },
  { name: "経堂",       kana: "きょうどう",         label: "Kyodo",              lat: 35.6414, lng: 139.6388 },
  { name: "千歳烏山",   kana: "ちとせからすやま",   label: "Chitose-Karasuyama", lat: 35.6500, lng: 139.6095 },
  { name: "明大前",     kana: "めいだいまえ",       label: "Meidaimae",          lat: 35.6660, lng: 139.6553 },
  { name: "笹塚",       kana: "ささづか",           label: "Sasazuka",           lat: 35.6693, lng: 139.6651 },
  { name: "幡ヶ谷",     kana: "はたがや",           label: "Hatagaya",           lat: 35.6759, lng: 139.6693 },
  { name: "下高井戸",   kana: "しもたかいど",       label: "Shimo-Takaido",      lat: 35.6670, lng: 139.6442 },
  { name: "旗の台",     kana: "はたのだい",         label: "Hatanodai",          lat: 35.6069, lng: 139.7104 },

  // ── 中野区・杉並区 ───────────────────────────────────────────────────────
  { name: "中野",       kana: "なかの",             label: "Nakano",             lat: 35.7071, lng: 139.6637 },
  { name: "東中野",     kana: "ひがしなかの",       label: "Higashi-Nakano",     lat: 35.7107, lng: 139.6774 },
  { name: "新中野",     kana: "しんなかの",         label: "Shin-Nakano",        lat: 35.7038, lng: 139.6679 },
  { name: "中野坂上",   kana: "なかのさかうえ",     label: "Nakano-Sakaue",      lat: 35.7063, lng: 139.6790 },
  { name: "落合",       kana: "おちあい",           label: "Ochiai",             lat: 35.7098, lng: 139.6890 },
  { name: "高円寺",     kana: "こうえんじ",         label: "Koenji",             lat: 35.7054, lng: 139.6495 },
  { name: "阿佐ヶ谷",   kana: "あさがや",           label: "Asagaya",            lat: 35.7054, lng: 139.6363 },
  { name: "荻窪",       kana: "おぎくぼ",           label: "Ogikubo",            lat: 35.7043, lng: 139.6235 },
  { name: "西荻窪",     kana: "にしおぎくぼ",       label: "Nishi-Ogikubo",      lat: 35.7054, lng: 139.6100 },
  { name: "方南町",     kana: "ほうなんちょう",     label: "Honancho",           lat: 35.6895, lng: 139.6709 },
  { name: "東高円寺",   kana: "ひがしこうえんじ",   label: "Higashi-Koenji",     lat: 35.7059, lng: 139.6540 },

  // ── 品川区・大田区 ───────────────────────────────────────────────────────
  { name: "大井町",     kana: "おおいまち",         label: "Oimachi",            lat: 35.6041, lng: 139.7283 },
  { name: "大森",       kana: "おおもり",           label: "Omori",              lat: 35.5989, lng: 139.7370 },
  { name: "蒲田",       kana: "かまた",             label: "Kamata",             lat: 35.5636, lng: 139.7167 },
  { name: "池上",       kana: "いけがみ",           label: "Ikegami",            lat: 35.5820, lng: 139.7053 },
  { name: "雪が谷大塚", kana: "ゆきがやおおつか",   label: "Yukigaya-Otsuka",    lat: 35.5973, lng: 139.7015 },

  // ── 豊島区・北区 ─────────────────────────────────────────────────────────
  { name: "東池袋",     kana: "ひがしいけぶくろ",   label: "Higashi-Ikebukuro",  lat: 35.7279, lng: 139.7232 },
  { name: "赤羽",       kana: "あかばね",           label: "Akabane",            lat: 35.7778, lng: 139.7213 },
  { name: "王子",       kana: "おうじ",             label: "Oji",                lat: 35.7531, lng: 139.7377 },
  { name: "十条",       kana: "じゅうじょう",       label: "Jujo",               lat: 35.7572, lng: 139.7172 },

  // ── 板橋区 ───────────────────────────────────────────────────────────────
  { name: "板橋",       kana: "いたばし",           label: "Itabashi",           lat: 35.7483, lng: 139.7107 },
  { name: "大山",       kana: "おおやま",           label: "Oyama",              lat: 35.7538, lng: 139.7016 },
  { name: "成増",       kana: "なります",           label: "Narimasu",           lat: 35.7810, lng: 139.6594 },
  { name: "志村坂上",   kana: "しむらさかうえ",     label: "Shimura-Sakaue",     lat: 35.7672, lng: 139.6962 },

  // ── 練馬区 ───────────────────────────────────────────────────────────────
  { name: "練馬",       kana: "ねりま",             label: "Nerima",             lat: 35.7387, lng: 139.6519 },
  { name: "石神井公園", kana: "しゃくじいこうえん", label: "Shakujii-Koen",      lat: 35.7393, lng: 139.6226 },
  { name: "光が丘",     kana: "ひかりがおか",       label: "Hikarigaoka",        lat: 35.7541, lng: 139.6273 },
]

export const STATION_MAP: Record<string, StationEntry> = Object.fromEntries(
  STATIONS.map((s) => [s.name, s])
)
