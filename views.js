/* Page rendering: dashboard, transactions, budgets, analytics, history */

// Newest date first; for the same date, the most recently added goes first
function byNewest(a, b) {
  return b.date.localeCompare(a.date) || (Number(b.id) || 0) - (Number(a.id) || 0);
}

function renderDashboard() {
  const income = incomeTotal(),
    expenses = expenseTotal(),
    balance = income - expenses;
  $("incomeValue").textContent = money(income);
  $("expenseValue").textContent = money(expenses);
  $("balanceValue").textContent = money(balance);
  const totalBudget = budgets.reduce((a, b) => a + b.limit, 0),
    left = totalBudget - expenses;
  $("budgetLeftValue").textContent = money(Math.max(0, left));
  $("budgetNote").textContent = `${money(totalBudget)} total limits`;
  renderRecent();
  renderBudgetProgress();
  renderOverviewChart();
  renderCategoryChart();
}
function renderRecent() {
  const list = [...transactions]
    .sort(byNewest)
    .slice(0, 6);
  $("recentTransactions").innerHTML = list.length
    ? list
        .map(
          (t) =>
            `<div class="transaction-row"><div class="tx-icon">${icons[t.category] || "•"}</div><div><div class="tx-name">${escapeHtml(t.description)}</div><div class="tx-date">${formatDate(t.date)} · ${t.category}</div></div><div class="tx-amount ${t.type === "income" ? "plus" : "minus"}">${t.type === "income" ? "+" : "−"}${money(t.amount)}</div></div>`,
        )
        .join("")
    : `<div class="empty">No transactions yet.</div>`;
}
function renderBudgetProgress() {
  const el = $("budgetProgressList");
  el.innerHTML = budgets.length
    ? budgets
        .map((b) => {
          const spent = categorySpent(b.category),
            pct = Math.min(100, Math.round((spent / b.limit) * 100)),
            cls = pct >= 100 ? "danger" : pct >= 80 ? "warning" : "";
          return `<div class="progress-item"><div class="progress-meta"><span>${icons[b.category] || "•"} ${b.category}</span><small>${money(spent)} / ${money(b.limit)}</small></div><div class="bar"><i class="${cls}" style="width:${pct}%"></i></div></div>`;
        })
        .join("")
    : `<div class="empty">No budgets yet.</div>`;
}
function renderTransactions() {
  const q = $("searchInput").value.toLowerCase(),
    type = $("typeFilter").value,
    cat = $("categoryFilter").value;
  const rows = transactions
    .filter(
      (t) =>
        (t.description + " " + t.category + " " + (t.note || ""))
          .toLowerCase()
          .includes(q) &&
        (type === "all" || t.type === type) &&
        (cat === "all" || t.category === cat),
    )
    .sort(byNewest);
  $("transactionTable").innerHTML = rows.length
    ? rows
        .map(
          (t) =>
            `<tr><td><b>${escapeHtml(t.description)}</b><br><small>${escapeHtml(t.note || "")}</small></td><td>${t.category}</td><td>${formatDate(t.date)}</td><td><span class="type-pill type-${t.type}">${t.type}</span></td><td class="amount ${t.type === "income" ? "plus" : "minus"}">${t.type === "income" ? "+" : "−"}${money(t.amount)}</td><td><button class="action-btn" onclick="editTransaction('${t.id}')">✎</button><button class="action-btn" onclick="deleteTransaction('${t.id}')">×</button></td></tr>`,
        )
        .join("")
    : `<tr><td colspan="6" class="empty">No matching transactions.</td></tr>`;
}
function populateFilters() {
  $("categoryFilter").innerHTML =
    '<option value="all">All categories</option>' +
    CATEGORIES.map((c) => `<option>${c}</option>`).join("");
  $("transactionCategory").innerHTML = CATEGORIES.map(
    (c) => `<option>${c}</option>`,
  ).join("");
  $("budgetCategory").innerHTML = CATEGORIES.map(
    (c) => `<option>${c}</option>`,
  ).join("");
}
function openTransaction(t = null) {
  $("transactionModal").classList.add("open");
  $("modalTitle").textContent = t ? "Edit transaction" : "Add transaction";
  $("editId").value = t?.id || "";
  $("description").value = t?.description || "";
  $("amount").value = t?.amount || "";
  $("transactionType").value = t?.type || "expense";
  $("transactionCategory").value = t?.category || CATEGORIES[0];
  $("transactionDate").value = t?.date || todayKey();
  $("transactionNote").value = t?.note || "";
}
function editTransaction(id) {
  const t = transactions.find((x) => x.id === id);
  if (t) openTransaction(t);
}
function deleteTransaction(id) {
  if (confirm("Delete this transaction?")) {
    transactions = transactions.filter((t) => t.id !== id);
    save();
    renderAll();
    showToast("Transaction deleted");
  }
}
function renderBudgetPage() {
  $("budgetCards").innerHTML = budgets.length
    ? budgets
        .map((b) => {
          const spent = categorySpent(b.category),
            pct = Math.min(100, Math.round((spent / b.limit) * 100)),
            remaining = b.limit - spent,
            cls = pct >= 100 ? "danger" : pct >= 80 ? "warning" : "";
          return `<article class="budget-card"><div class="panel-kicker">${icons[b.category] || "•"} CATEGORY</div><h3>${b.category}</h3><div class="budget-amount">${money(spent)} <span>of ${money(b.limit)}</span></div><div class="bar"><i class="${cls}" style="width:${pct}%"></i></div><div class="budget-foot"><span>${remaining >= 0 ? money(remaining) + " left" : "Over by " + money(Math.abs(remaining))}</span><button class="action-btn" onclick="deleteBudget('${b.id}')">×</button></div></article>`;
        })
        .join("")
    : `<div class="empty">No budgets yet. Add your first monthly limit.</div>`;
}
function deleteBudget(id) {
  budgets = budgets.filter((b) => b.id !== id);
  save();
  renderAll();
  showToast("Budget removed");
}
function renderAnalytics() {
  const income = incomeTotal(),
    exp = expenseTotal();
  $("savingsRate").textContent = income
    ? Math.round(((income - exp) / income) * 100) + "%"
    : "0%";
  const top = categoriesWithSpend()[0];
  $("largestCategory").textContent = top ? top.category : "—";
  $("transactionCount").textContent = transactions.length;
  const ctx = $("analyticsChart").getContext("2d");
  if (analyticsChart) analyticsChart.destroy();
  analyticsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: last7Labels(),
      datasets: [
        {
          label: "Income",
          data: last7Labels().map((d) => sumOnDate(d, "income")),
          backgroundColor: "#1f7a5a",
        },
        {
          label: "Expenses",
          data: last7Labels().map((d) => sumOnDate(d, "expense")),
          backgroundColor: "#d77b35",
        },
      ],
    },
    options: chartOptions(),
  });
  const c2 = $("analyticsCategoryChart").getContext("2d");
  if (analyticsCategoryChart) analyticsCategoryChart.destroy();
  const data = categoriesWithSpend();
  analyticsCategoryChart = new Chart(c2, {
    type: "bar",
    data: {
      labels: data.map((x) => x.category),
      datasets: [
        {
          label: "Spent",
          data: data.map((x) => x.amount),
          backgroundColor: "#1f7a5a",
          borderRadius: 7,
        },
      ],
    },
    options: { ...chartOptions(), indexAxis: "y" },
  });
}
function renderHistory() {
  const groups = {};
  transactions.forEach((t) => {
    const key = t.date.slice(0, 7);
    groups[key] ??= [];
    groups[key].push(t);
  });
  const keys = Object.keys(groups).sort().reverse();
  $("historyCards").innerHTML = keys.length
    ? keys
        .map((key) => {
          const arr = groups[key],
            inc = arr
              .filter((t) => t.type === "income")
              .reduce((a, t) => a + t.amount, 0),
            exp = arr
              .filter((t) => t.type === "expense")
              .reduce((a, t) => a + t.amount, 0),
            label = new Date(key + "-01T00:00:00").toLocaleDateString("en-PH", {
              month: "long",
              year: "numeric",
            });
          return `<article class="history-card"><div class="panel-kicker">MONTHLY SUMMARY</div><h3>${label}</h3><div class="big">${money(inc - exp)}</div><div class="history-line"><span>Income</span><b class="plus">${money(inc)}</b></div><div class="history-line"><span>Expenses</span><b class="minus">${money(exp)}</b></div><div class="history-line"><span>Transactions</span><b>${arr.length}</b></div></article>`;
        })
        .join("")
    : `<div class="empty">Your monthly history will appear here.</div>`;
}
function renderAll() {
  renderDashboard();
  renderTransactions();
  renderBudgetPage();
  renderAnalytics();
  renderHistory();
}
function switchView(view) {
  localStorage.setItem("dbView", view); // remember the current page for refresh
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  $(view + "View").classList.add("active");
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.toggle("active", n.dataset.view === view));
  $("pageTitle").innerHTML = {
    dashboard: `${greet()}, ${currentUser ? escapeHtml(currentUser.name.split(" ")[0]) : ""} <span>✦</span>`,
    transactions: "Your money, in one place",
    analytics: "Your spending at a glance",
    budget: "Plan before you spend",
    history: "Your financial history",
    profile: "Your profile",
  }[view];
  if (view === "profile") renderProfile();
  $("sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}