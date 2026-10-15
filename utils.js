/* App state and helper functions */
/* App state */
let transactions = [],
  budgets = [],
  currentUser = null,
  RANGE = 30; // days shown in charts
let overviewChart, categoryChart, analyticsChart, analyticsCategoryChart;
const money = (n) =>
  `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const save = () => {
  if (!currentUser) return;
  const k = "dbt_" + currentUser.email;
  localStorage.setItem(k + "_tx", JSON.stringify(transactions));
  localStorage.setItem(k + "_bd", JSON.stringify(budgets));
};
const expenseTotal = () =>
  transactions
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + t.amount, 0);
const incomeTotal = () =>
  transactions
    .filter((t) => t.type === "income")
    .reduce((a, t) => a + t.amount, 0);
const categorySpent = (cat) =>
  transactions
    .filter((t) => t.type === "expense" && t.category === cat)
    .reduce((a, t) => a + t.amount, 0);
function formatDate(date) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[m],
  );
}
function greet() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
const todayKey = () => new Date().toLocaleDateString("en-CA");