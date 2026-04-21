export type UniversityEntry = {
  name: string
  nameJa?: string
  country: string
  programs?: string[]
}

export const UNIVERSITIES: UniversityEntry[] = [
  // ── Japan ──────────────────────────────────────────────────────────────────
  { name: "University of Tokyo", nameJa: "東京大学", country: "Japan", programs: ["CAMPUS Asia"] },
  { name: "Kyoto University", nameJa: "京都大学", country: "Japan", programs: ["CAMPUS Asia"] },
  { name: "Osaka University", nameJa: "大阪大学", country: "Japan", programs: ["CAMPUS Asia"] },
  { name: "Tohoku University", nameJa: "東北大学", country: "Japan", programs: ["CAMPUS Asia"] },
  { name: "Nagoya University", nameJa: "名古屋大学", country: "Japan", programs: ["CAMPUS Asia"] },
  { name: "Kyushu University", nameJa: "九州大学", country: "Japan", programs: ["CAMPUS Asia"] },
  { name: "Hokkaido University", nameJa: "北海道大学", country: "Japan", programs: ["CAMPUS Asia"] },
  { name: "Waseda University", nameJa: "早稲田大学", country: "Japan", programs: ["CAMPUS Asia", "AFLSP"] },
  { name: "Keio University", nameJa: "慶應義塾大学", country: "Japan", programs: ["CAMPUS Asia", "AFLSP"] },
  { name: "University of Tsukuba", nameJa: "筑波大学", country: "Japan", programs: ["CAMPUS Asia"] },
  { name: "Kobe University", nameJa: "神戸大学", country: "Japan", programs: ["CAMPUS Asia"] },
  { name: "Tokyo Institute of Technology", nameJa: "東京工業大学", country: "Japan" },
  { name: "Hitotsubashi University", nameJa: "一橋大学", country: "Japan" },
  { name: "Sophia University", nameJa: "上智大学", country: "Japan", programs: ["AFLSP"] },
  { name: "International Christian University", nameJa: "国際基督教大学", country: "Japan", programs: ["AFLSP"] },
  { name: "Ritsumeikan University", nameJa: "立命館大学", country: "Japan", programs: ["AFLSP"] },
  { name: "Doshisha University", nameJa: "同志社大学", country: "Japan", programs: ["AFLSP"] },
  { name: "Meiji University", nameJa: "明治大学", country: "Japan" },
  { name: "Rikkyo University", nameJa: "立教大学", country: "Japan" },
  { name: "Ochanomizu University", nameJa: "お茶の水女子大学", country: "Japan" },
  { name: "Tokyo University of Foreign Studies", nameJa: "東京外国語大学", country: "Japan" },
  { name: "Hiroshima University", nameJa: "広島大学", country: "Japan" },
  { name: "Osaka Metropolitan University", nameJa: "大阪公立大学", country: "Japan" },
  { name: "Chiba University", nameJa: "千葉大学", country: "Japan" },
  { name: "Yokohama National University", nameJa: "横浜国立大学", country: "Japan" },

  // ── China ──────────────────────────────────────────────────────────────────
  { name: "Peking University", nameJa: "北京大学", country: "China", programs: ["CAMPUS Asia"] },
  { name: "Tsinghua University", nameJa: "清華大学", country: "China", programs: ["CAMPUS Asia"] },
  { name: "Fudan University", nameJa: "復旦大学", country: "China", programs: ["CAMPUS Asia"] },
  { name: "Zhejiang University", nameJa: "浙江大学", country: "China", programs: ["CAMPUS Asia"] },
  { name: "Nanjing University", nameJa: "南京大学", country: "China", programs: ["CAMPUS Asia"] },
  { name: "Shanghai Jiao Tong University", nameJa: "上海交通大学", country: "China", programs: ["CAMPUS Asia"] },
  { name: "Renmin University of China", nameJa: "中国人民大学", country: "China", programs: ["CAMPUS Asia"] },
  { name: "Tongji University", nameJa: "同済大学", country: "China", programs: ["CAMPUS Asia"] },
  { name: "Beijing Normal University", nameJa: "北京師範大学", country: "China", programs: ["CAMPUS Asia"] },
  { name: "East China Normal University", nameJa: "華東師範大学", country: "China", programs: ["CAMPUS Asia"] },
  { name: "University of Science and Technology of China", nameJa: "中国科学技術大学", country: "China" },
  { name: "Wuhan University", nameJa: "武漢大学", country: "China" },
  { name: "Sun Yat-sen University", nameJa: "中山大学", country: "China" },
  { name: "Harbin Institute of Technology", nameJa: "ハルビン工業大学", country: "China" },
  { name: "Xi'an Jiaotong University", nameJa: "西安交通大学", country: "China" },
  { name: "Huazhong University of Science and Technology", nameJa: "華中科技大学", country: "China" },
  { name: "Shandong University", nameJa: "山東大学", country: "China" },
  { name: "Xiamen University", nameJa: "厦門大学", country: "China" },
  { name: "Nankai University", nameJa: "南開大学", country: "China" },
  { name: "Tianjin University", nameJa: "天津大学", country: "China" },
  { name: "Southeast University", nameJa: "東南大学", country: "China" },
  { name: "Beijing Foreign Studies University", nameJa: "北京外国語大学", country: "China" },
  { name: "Shanghai International Studies University", nameJa: "上海外国語大学", country: "China" },
  { name: "Communication University of China", nameJa: "中国伝媒大学", country: "China" },
  { name: "China Foreign Affairs University", nameJa: "外交学院", country: "China" },
  { name: "Central University of Finance and Economics", nameJa: "中央財経大学", country: "China" },
  { name: "Beihang University", nameJa: "北京航空航天大学", country: "China" },
  { name: "Beijing Institute of Technology", nameJa: "北京理工大学", country: "China" },

  // ── Korea ──────────────────────────────────────────────────────────────────
  { name: "Seoul National University", nameJa: "ソウル大学校", country: "Korea", programs: ["CAMPUS Asia"] },
  { name: "Yonsei University", nameJa: "延世大学校", country: "Korea", programs: ["CAMPUS Asia"] },
  { name: "Korea University", nameJa: "高麗大学校", country: "Korea", programs: ["CAMPUS Asia"] },
  { name: "Sungkyunkwan University", nameJa: "成均館大学校", country: "Korea", programs: ["CAMPUS Asia"] },
  { name: "Hanyang University", nameJa: "漢陽大学校", country: "Korea", programs: ["CAMPUS Asia"] },
  { name: "Sogang University", nameJa: "西江大学校", country: "Korea", programs: ["CAMPUS Asia"] },
  { name: "Ewha Womans University", nameJa: "梨花女子大学校", country: "Korea", programs: ["CAMPUS Asia"] },
  { name: "KAIST", nameJa: "韓国科学技術院", country: "Korea" },
  { name: "POSTECH", nameJa: "浦項工科大学校", country: "Korea" },
  { name: "Hankuk University of Foreign Studies", nameJa: "韓国外国語大学校", country: "Korea" },
  { name: "Kyung Hee University", nameJa: "慶熙大学校", country: "Korea" },
  { name: "Chung-Ang University", nameJa: "中央大学校", country: "Korea" },
  { name: "University of Seoul", nameJa: "ソウル市立大学校", country: "Korea" },
  { name: "Pusan National University", nameJa: "釜山大学校", country: "Korea" },

  // ── Taiwan ─────────────────────────────────────────────────────────────────
  { name: "National Taiwan University", nameJa: "国立臺灣大學", country: "Taiwan" },
  { name: "National Chengchi University", nameJa: "国立政治大學", country: "Taiwan" },
  { name: "National Tsing Hua University", nameJa: "国立清華大學（台湾）", country: "Taiwan" },
  { name: "National Yang Ming Chiao Tung University", nameJa: "国立陽明交通大學", country: "Taiwan" },
  { name: "National Cheng Kung University", nameJa: "国立成功大學", country: "Taiwan" },
  { name: "National Sun Yat-sen University", nameJa: "国立中山大學", country: "Taiwan" },
  { name: "Fu Jen Catholic University", nameJa: "輔仁大學", country: "Taiwan" },
  { name: "Tamkang University", nameJa: "淡江大學", country: "Taiwan" },

  // ── Hong Kong ──────────────────────────────────────────────────────────────
  { name: "University of Hong Kong", nameJa: "香港大學", country: "Hong Kong" },
  { name: "Chinese University of Hong Kong", nameJa: "香港中文大學", country: "Hong Kong" },
  { name: "Hong Kong University of Science and Technology", nameJa: "香港科技大學", country: "Hong Kong" },
  { name: "City University of Hong Kong", nameJa: "香港城市大學", country: "Hong Kong" },
  { name: "Hong Kong Polytechnic University", nameJa: "香港理工大學", country: "Hong Kong" },

  // ── Singapore ─────────────────────────────────────────────────────────────
  { name: "National University of Singapore", nameJa: "シンガポール国立大学", country: "Singapore" },
  { name: "Nanyang Technological University", nameJa: "南洋理工大学", country: "Singapore" },
  { name: "Singapore Management University", nameJa: "シンガポール経営大学", country: "Singapore" },

  // ── Southeast Asia ────────────────────────────────────────────────────────
  { name: "University of Malaya", nameJa: "マラヤ大学", country: "Malaysia" },
  { name: "Chulalongkorn University", nameJa: "チュラーロンコーン大学", country: "Thailand" },
  { name: "Mahidol University", nameJa: "マヒドン大学", country: "Thailand" },
  { name: "University of the Philippines", nameJa: "フィリピン大学", country: "Philippines" },
  { name: "Universitas Indonesia", nameJa: "インドネシア大学", country: "Indonesia" },
  { name: "University of Vietnam", nameJa: "ベトナム国家大学", country: "Vietnam" },
  { name: "Vietnam National University, Hanoi", nameJa: "ベトナム国家大学ハノイ校", country: "Vietnam" },
  { name: "Vietnam National University, Ho Chi Minh City", nameJa: "ベトナム国家大学ホーチミン市校", country: "Vietnam" },

  // ── USA ────────────────────────────────────────────────────────────────────
  { name: "Harvard University", country: "USA" },
  { name: "MIT", country: "USA" },
  { name: "Stanford University", country: "USA" },
  { name: "Columbia University", country: "USA" },
  { name: "Yale University", country: "USA" },
  { name: "Princeton University", country: "USA" },
  { name: "UC Berkeley", country: "USA" },
  { name: "University of Michigan", country: "USA" },
  { name: "University of Chicago", country: "USA" },
  { name: "Northwestern University", country: "USA" },
  { name: "Duke University", country: "USA" },
  { name: "Johns Hopkins University", country: "USA" },
  { name: "Georgetown University", country: "USA" },
  { name: "New York University", country: "USA" },

  // ── UK ─────────────────────────────────────────────────────────────────────
  { name: "University of Oxford", country: "UK" },
  { name: "University of Cambridge", country: "UK" },
  { name: "London School of Economics", country: "UK" },
  { name: "UCL", country: "UK" },
  { name: "University of Edinburgh", country: "UK" },
  { name: "King's College London", country: "UK" },
  { name: "Imperial College London", country: "UK" },

  // ── Europe ────────────────────────────────────────────────────────────────
  { name: "Sciences Po", country: "France" },
  { name: "Paris 1 Panthéon-Sorbonne", country: "France" },
  { name: "École Polytechnique", country: "France" },
  { name: "HEC Paris", country: "France" },
  { name: "LMU Munich", country: "Germany" },
  { name: "Heidelberg University", country: "Germany" },
  { name: "Humboldt University of Berlin", country: "Germany" },
  { name: "ETH Zurich", country: "Switzerland" },
  { name: "University of Amsterdam", country: "Netherlands" },
  { name: "KU Leuven", country: "Belgium" },
  { name: "Stockholm University", country: "Sweden" },
  { name: "University of Helsinki", country: "Finland" },

  // ── Australia / New Zealand ───────────────────────────────────────────────
  { name: "University of Melbourne", country: "Australia" },
  { name: "Australian National University", country: "Australia" },
  { name: "University of Sydney", country: "Australia" },
  { name: "University of Queensland", country: "Australia" },
  { name: "University of Auckland", country: "New Zealand" },

  // ── Canada ────────────────────────────────────────────────────────────────
  { name: "University of Toronto", country: "Canada" },
  { name: "McGill University", country: "Canada" },
  { name: "University of British Columbia", country: "Canada" },
]

export const UNIVERSITY_NAMES = UNIVERSITIES.map((u) => u.name)

export const COUNTRIES = [...new Set(UNIVERSITIES.map((u) => u.country))]
