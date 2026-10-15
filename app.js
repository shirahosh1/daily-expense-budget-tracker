/* Navigation, buttons, forms, and startup */
const $ = (id) => document.getElementById(id);
document
  .querySelectorAll(".nav-item")
  .forEach((btn) =>
    btn.addEventListener("click", () => switchView(btn.dataset.view)),
  );
document
  .querySelectorAll("[data-view]")
  .forEach((btn) =>
    btn.addEventListener("click", () => switchView(btn.dataset.view)),
  );
$("quickAdd").onclick = () => openTransaction();
$("heroAdd").onclick = () => openTransaction();
$("transactionAdd").onclick = () => openTransaction();
$("budgetAdd").onclick = () => $("budgetModal").classList.add("open");
$("menuBtn").onclick = () => $("sidebar").classList.toggle("open");
document
  .querySelectorAll("[data-close]")
  .forEach(
    (b) => (b.onclick = () => $("transactionModal").classList.remove("open")),
  );
document
  .querySelectorAll("[data-close-budget]")
  .forEach(
    (b) => (b.onclick = () => $("budgetModal").classList.remove("open")),
  );
$("transactionForm").onsubmit = (e) => {
  e.preventDefault();
  const id = $("editId").value || Date.now().toString(),
    obj = {
      id,
      description: $("description").value.trim(),
      amount: Number($("amount").value),
      type: $("transactionType").value,
      category: $("transactionCategory").value,
      date: $("transactionDate").value,
      note: $("transactionNote").value.trim(),
    };
  const i = transactions.findIndex((t) => t.id === id);
  i >= 0 ? (transactions[i] = obj) : transactions.push(obj);
  save();
  $("transactionModal").classList.remove("open");
  renderAll();
  showToast(i >= 0 ? "Transaction updated" : "Transaction added");
};
$("budgetForm").onsubmit = (e) => {
  e.preventDefault();
  const category = $("budgetCategory").value,
    limit = Number($("budgetAmount").value),
    existing = budgets.find((b) => b.category === category);
  existing
    ? (existing.limit = limit)
    : budgets.push({ id: Date.now().toString(), category, limit });
  save();
  $("budgetModal").classList.remove("open");
  $("budgetAmount").value = "";
  renderAll();
  showToast("Budget saved");
};
["searchInput", "typeFilter", "categoryFilter"].forEach((id) =>
  $(id).addEventListener("input", renderTransactions),
);
$("chartPeriod").onchange = () => {
  RANGE = $("chartPeriod").value === "month" ? 30 : 7;
  renderOverviewChart();
  renderAnalytics();
};
const today = new Date();
$("dateLabel").textContent = today.toLocaleDateString("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
populateFilters();
initAuth(); // must stay last: it loads the saved session and renders the app