/* Categories, icons, and demo data */
const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "School",
  "Health",
  "Other",
];
const icons = {
  "Food & Dining": "☕",
  Transportation: "⌁",
  Shopping: "◇",
  "Bills & Utilities": "⌂",
  Entertainment: "♪",
  School: "▤",
  Health: "＋",
  Other: "•",
};
const demoTransactions = [
  {
    id: "1",
    description: "Monthly allowance",
    amount: 8250,
    type: "income",
    category: "Other",
    date: "2026-08-01",
    note: "Allowance",
  },
  {
    id: "2",
    description: "Lunch",
    amount: 180,
    type: "expense",
    category: "Food & Dining",
    date: "2026-08-12",
    note: "Cafeteria",
  },
  {
    id: "3",
    description: "Jeepney fare",
    amount: 60,
    type: "expense",
    category: "Transportation",
    date: "2026-08-12",
    note: "School commute",
  },
  {
    id: "4",
    description: "School supplies",
    amount: 320,
    type: "expense",
    category: "School",
    date: "2026-08-10",
    note: "Notebook and pens",
  },
  {
    id: "5",
    description: "Mobile data",
    amount: 199,
    type: "expense",
    category: "Bills & Utilities",
    date: "2026-08-09",
    note: "7-day data",
  },
  {
    id: "6",
    description: "Coffee",
    amount: 150,
    type: "expense",
    category: "Food & Dining",
    date: "2026-08-08",
    note: "Study break",
  },
  {
    id: "7",
    description: "Movie night",
    amount: 350,
    type: "expense",
    category: "Entertainment",
    date: "2026-08-07",
    note: "Weekend",
  },
  {
    id: "8",
    description: "New shirt",
    amount: 600,
    type: "expense",
    category: "Shopping",
    date: "2026-08-05",
    note: "Casual wear",
  },
  {
    id: "9",
    description: "Medicine",
    amount: 240,
    type: "expense",
    category: "Health",
    date: "2026-08-04",
    note: "Personal",
  },
  {
    id: "10",
    description: "Lunch",
    amount: 220,
    type: "expense",
    category: "Food & Dining",
    date: "2026-08-03",
    note: "Lunch out",
  },
];
const demoBudgets = [
  { id: "b1", category: "Food & Dining", limit: 2500 },
  { id: "b2", category: "Transportation", limit: 1200 },
  { id: "b3", category: "Shopping", limit: 1500 },
  { id: "b4", category: "Bills & Utilities", limit: 1200 },
  { id: "b5", category: "Entertainment", limit: 800 },
];
/* Demo transactions with dates relative to today so charts are never empty */
function seedTx() {
  const off = [27, 0, 0, 2, 3, 4, 5, 7, 9, 11];
  return demoTransactions.map((t, i) => {
    const d = new Date();
    d.setDate(d.getDate() - off[i]);
    return { ...t, date: d.toLocaleDateString("en-CA") };
  });
}