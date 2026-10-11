let model = null;
let records = [];

const $ = (id) => document.getElementById(id);
const round = (value) => Math.max(0, Math.round(value * 10) / 10);

function featureValue(name, form) {
  const meal = form.meal_type.value;
  const value = { attendance: Number(form.attendance.value), popularity: Number(form.popularity.value),
    temperature: Number(form.temperature.value), rainfall: Number(form.rainfall.value),
    "meal_typeLunch": meal === "Lunch" ? 1 : 0, "meal_typeDinner": meal === "Dinner" ? 1 : 0,
    "day_typeWeekend": form.day_type.value === "Weekend" ? 1 : 0, "holidayYes": form.holiday.value === "Yes" ? 1 : 0 };
  return value[name] || 0;
}
function predict(coefficients, form) {
  return Object.entries(coefficients).reduce((total, [name, coefficient]) =>
    total + Number(coefficient) * (name === "(Intercept)" ? 1 : featureValue(name, form)), 0);
}
function showPrediction(event) {
  event.preventDefault();
  if (!model) { $("model-status").textContent = "Model not found. Run R\\train_model.R, then refresh this page."; return; }
  const form = event.target;
  const consumed = round(predict(model.consumption, form));
  const waste = round(predict(model.waste, form));
  const preparation = round(consumed * (1 + model.margin));
  const surplus = round(Math.max(0, preparation - consumed));
  const risk = waste <= model.riskThresholds.low ? "Low" : waste <= model.riskThresholds.high ? "Moderate" : "High";
  $("result-empty").classList.add("hidden"); $("result-content").classList.remove("hidden");
  $("predicted-consumption").textContent = consumed; $("recommended-preparation").textContent = preparation;
  $("expected-surplus").textContent = surplus; $("waste-risk").textContent = risk;
  $("recommendation-text").textContent = risk === "High" ? "Consider a smaller safety margin and review similar high-waste meals before service." : "Prepare predicted consumption plus a modest safety margin. Record actual outcomes after service to improve the next forecast.";
}
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/); const headers = lines.shift().split(",");
  return lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [headers[index], value])));
}
function renderTable() {
  $("dataset-table").innerHTML = records.slice(0, 8).map((row) =>
    `<tr><td>${row.meal_date || "—"}</td><td>${row.meal_type || "—"}</td><td>${row.attendance || "—"}</td><td>${row.consumed_kg || "—"} kg</td><td>${row.wasted_kg || "—"} kg</td></tr>`).join("");
}
async function loadModel() {
  try { const response = await fetch("model.json"); if (!response.ok) throw new Error("missing"); model = await response.json();
    $("model-status").textContent = `R model ready · trained on ${model.trainedRows} historical rows`;
    $("metric-mae").textContent = model.metrics.mae; $("metric-rmse").textContent = model.metrics.rmse; $("metric-r2").textContent = model.metrics.r2;
    $("trained-rows").textContent = `Metrics calculated by R from ${model.trainedRows} training records.`;
  } catch (_) { $("model-status").textContent = "Model not found. Run R\\train_model.R, then refresh this page."; }
}
document.querySelectorAll(".topbar nav a").forEach((link) => link.addEventListener("click", () => {
  document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", `#${page.id}` === link.hash));
}));
window.addEventListener("hashchange", () => { const hash = location.hash || "#predict"; document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", `#${page.id}` === hash)); });
$("prediction-form").addEventListener("submit", showPrediction);
$("csv-upload").addEventListener("change", (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { records = parseCsv(reader.result); renderTable(); $("upload-status").textContent = `${records.length} rows loaded`; }; reader.readAsText(file); });
$("export-button").addEventListener("click", () => { const csv = ["date,meal,attendance,consumed_kg,wasted_kg", ...records.map((r) => [r.meal_date, r.meal_type, r.attendance, r.consumed_kg, r.wasted_kg].join(","))].join("\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "platewise-predictions.csv"; link.click(); URL.revokeObjectURL(link.href); });
fetch("../data/sample_meals.csv").then((response) => response.text()).then((text) => { records = parseCsv(text); renderTable(); }).catch(() => {});
loadModel();
