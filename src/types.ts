export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
}

export const sampleEmployees: Employee[] = [
  {
    id: 1,
    name: "田中太郎",
    email: "tanaka.taro@company.com",
    department: "開発部",
    position: "シニアエンジニア",
    salary: 8000000,
    hireDate: "2020-04-01"
  },
  {
    id: 2,
    name: "佐藤花子",
    email: "sato.hanako@company.com",
    department: "営業部",
    position: "営業マネージャー",
    salary: 7500000,
    hireDate: "2019-07-15"
  },
  {
    id: 3,
    name: "鈴木一郎",
    email: "suzuki.ichiro@company.com",
    department: "人事部",
    position: "人事担当",
    salary: 6000000,
    hireDate: "2021-01-10"
  },
  {
    id: 4,
    name: "高橋美咲",
    email: "takahashi.misaki@company.com",
    department: "開発部",
    position: "フロントエンドエンジニア",
    salary: 7000000,
    hireDate: "2022-03-01"
  },
  {
    id: 5,
    name: "山田健太",
    email: "yamada.kenta@company.com",
    department: "マーケティング部",
    position: "マーケティングスペシャリスト",
    salary: 6500000,
    hireDate: "2021-09-15"
  }
];
