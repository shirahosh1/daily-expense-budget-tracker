/* Chart.js charts */
/* Chart date helpers */
function dayKeys() {
  const a = [];
  for (let i = RANGE - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    a.push(d.toLocaleDateString("en-CA"));
  }
  return a;
}
function last7Labels() {
  return dayKeys().map((k) =>
    new Date(k + "T00:00:00").toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    }),
  );
}
function sumOnDate(label, type) {
  const i = last7Labels().indexOf(label);
  if (i < 0) return 0;
  const k = dayKeys()[i];
  return transactions
    .filter((t) => t.date === k && t.type === type)
    .reduce((a, t) => a + t.amount, 0);
}
function renderOverviewChart() {
  const ctx = $("overviewChart").getContext("2d");
  if (overviewChart) overviewChart.destroy();
  const labels = last7Labels();
  const inc = labels.map((d) => sumOnDate(d, "income")),
    exp = labels.map((d) => sumOnDate(d, "expense"));
  overviewChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Income",
          data: inc,
          borderColor: "#1f7a5a",
          backgroundColor: "rgba(31,122,90,.08)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: "Expenses",
          data: exp,
          borderColor: "#d77b35",
          backgroundColor: "rgba(215,123,53,.05)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    },
    options: chartOptions(),
  });
}
function renderCategoryChart() {
  const data = categoriesWithSpend();
  const ctx = $("categoryChart").getContext("2d");
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.map((x) => x.category),
      datasets: [
        {
          data: data.map((x) => x.amount),
          backgroundColor: [
            "#1f7a5a",
            "#d77b35",
            "#6c6b9a",
            "#6c9a8a",
            "#b56d6d",
            "#777b84",
            "#9b875f",
            "#555",
          ],
          borderWidth: 3,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: { legend: { display: false } },
    },
  });
  $("categoryLegend").innerHTML = data
    .slice(0, 5)
    .map(
      (x) =>
        `<div class="legend-item"><span>${icons[x.category] || "•"} ${x.category}</span><b>${money(x.amount)}</b></div>`,
    )
    .join("");
}
function categoriesWithSpend() {
  return CATEGORIES.map((category) => ({
    category,
    amount: categorySpent(category),
  }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}
function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { font: { size: 10 }, boxWidth: 12 } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        beginAtZero: true,
        grid: { color: "#ededE8" },
        ticks: {
          font: { size: 10 },
          callback: (v) => "₱" + v.toLocaleString(),
        },
      },
    },
  };
}