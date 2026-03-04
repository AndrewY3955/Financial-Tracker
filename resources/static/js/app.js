/**
 * Fixes and normalizations introduced:
 * - Ensure amounts are stored as Numbers rounded to 2 decimals.
 * - Automatically make amounts negative for known expense categories
 *   (Food, Rent, Utilities, Entertainment) if the user entered a positive value.
 * - Ensure income categories (Salary) are positive.
 * - Provide a single `formatCurrency()` helper for consistent $0.00 formatting.
 * - Sanitize persisted `state` on load to correct any legacy/incorrect values.
 *
 * Documentation for each issue and guidance is provided below the code edits.
 */

const EXPENSE_CATEGORIES = ["Food", "Rent", "Utilities", "Entertainment"];
const INCOME_CATEGORIES = ["Salary"];

let state = JSON.parse(localStorage.getItem("Financial Tracker")) || {
  transactions: [],
  budgets: [],
  user: {
    name: "Andrew",
    email: "andrew@email.com"
  }
};

function saveState() {
  localStorage.setItem("Financial Tracker", JSON.stringify(state));
}

// Helper: consistently format a number as $0.00
function formatCurrency(value) {
  const num = Number(value) || 0;
  return `$${num.toFixed(2)}`;
}

// Normalize transactions in `state` (coerce amounts to numbers, enforce sign rules)
function normalizeTransactionsInState() {
  if (!Array.isArray(state.transactions)) state.transactions = [];
  state.transactions = state.transactions.map(t => {
    const title = t.title || "";
    const category = t.category || "Other";
    const date = t.date || new Date().toISOString().slice(0, 10);
    let amount = Number(t.amount) || 0;

    // Enforce sign: expense categories should be negative, income should be positive
    if (EXPENSE_CATEGORIES.includes(category)) {
      if (amount > 0) amount = -amount;
    } else if (INCOME_CATEGORIES.includes(category)) {
      if (amount < 0) amount = Math.abs(amount);
    }

    // Round to 2 decimals and store as Number
    amount = Number(amount.toFixed(2));

    return { title, category, date, amount };
  });
}

// Normalize budgets in `state` (coerce limits to numbers)
function normalizeBudgetsInState() {
  if (!Array.isArray(state.budgets)) state.budgets = [];
  state.budgets = state.budgets.map(b => {
    const category = b.category || "";
    let limit = Number(b.limit) || 0;
    limit = Number(limit.toFixed(2));
    return { category, limit };
  });
}

// Run normalization immediately after loading state so renderers get consistent data
normalizeTransactionsInState();
normalizeBudgetsInState();
saveState();

/* --------------------------
   UpdateDashboardCards
--------------------------- */
function updateDashboard(month) {
  const selectedMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM

  // Filter transactions for the selected month. Date strings expected in YYYY-MM-DD format.
  const monthlyTransactions = state.transactions.filter(t => typeof t.date === 'string' && t.date.includes(selectedMonth));

  let income = 0;
  let expenses = 0;

  monthlyTransactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (amt > 0) income += amt;
    else expenses += Math.abs(amt);
  });

  const availableFunds = income - expenses;

  // ISSUE: Re-calculating and formatting currency in every render is inefficient and prone to rounding errors.
  // FIX: Use centralized formatCurrency() helper to ensure consistent $0.00 formatting everywhere.
  
  // Defensive DOM updates: only update elements that exist to avoid runtime exceptions
  const incomeEl = document.getElementById("income");
  const expensesEl = document.getElementById("expenses");
  const availEl = document.getElementById("availableFunds");

  if (incomeEl) incomeEl.textContent = formatCurrency(income);
  if (expensesEl) expensesEl.textContent = formatCurrency(expenses);
  if (availEl) availEl.textContent = formatCurrency(availableFunds);

}

/* --------------------------
   TRANSACTIONS
--------------------------- */

function addTransaction(e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  let amount = parseFloat(document.getElementById("amount").value) || 0;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  // ISSUE: User entered positive amount for expense category (e.g., Food, Utilities).
  // FIX: Auto-negate amounts for known expense categories to maintain sign consistency.
  if (EXPENSE_CATEGORIES.includes(category) && amount > 0) {
    amount = -amount;
  } else if (INCOME_CATEGORIES.includes(category) && amount < 0) {
    amount = Math.abs(amount);
  }

  // Ensure amount is a Number rounded to 2 decimals for consistent formatting and calculations.
  amount = Number(amount.toFixed(2));

  state.transactions.push({ title, amount, category, date });
  saveState();
  renderTransactions();
  updateDashboard();
  updateTransactionSelect();
  e.target.reset();
}

function renderTransactions() {
  const table = document.getElementById("transactionTable");
  if (!table) return;

  table.innerHTML = "";

  state.transactions.forEach(t => {
    table.innerHTML += `
      <tr>
        <td>${t.date}</td>
        <td>${t.title}</td>
        <td>${t.category}</td>
        <td>${formatCurrency(t.amount)}</td>
      </tr>
    `;
  });
  updateTransactionSelect();
}

/* --------------------------
   BUDGETS
--------------------------- */

function addBudget(e) {
  e.preventDefault();

  const category = document.getElementById("budgetCategory").value;
  let limit = parseFloat(document.getElementById("budgetLimit").value) || 0;

  // ISSUE: Budget limits should always be positive (they represent max spend, not a signed amount).
  // FIX: Ensure limit is stored as absolute value.
  if (limit < 0) limit = Math.abs(limit);

  // Ensure limit is a Number rounded to 2 decimals.
  limit = Number(limit.toFixed(2));

  state.budgets.push({ category, limit });
  saveState();
  renderBudgets();
  e.target.reset();
}

function renderBudgets() {
  const container = document.getElementById("budgetList");
  if (!container) return;

  container.innerHTML = "";

  state.budgets.forEach(b => {
    container.innerHTML += `
      <div class="card">
        <strong>${b.category}</strong>
        <p>Limit: ${formatCurrency(b.limit)}</p>
      </div>
    `;
  });
}

// Compatibility helpers for budgets.html which uses different IDs and functions
function createBudget(e) {
  e.preventDefault();

  const categoryField = document.getElementById("budgetName");
  const amountField = document.getElementById("budgetAmount");
  if (!categoryField || !amountField) return;

  const category = categoryField.value;
  let limit = parseFloat(amountField.value) || 0;

  // Ensure limit is positive and rounded to 2 decimals.
  if (limit < 0) limit = Math.abs(limit);
  limit = Number(limit.toFixed(2));

  state.budgets.push({ category, limit });
  saveState();
  renderBudgets();
  updateBudgetSelect();
  e.target.reset();
}

function removeBudget(e) {
  e.preventDefault();
  const sel = document.getElementById("budgetSelect");
  if (!sel) return;
  const value = sel.value;
  if (!value) return;

  state.budgets = state.budgets.filter(b => b.category !== value);
  saveState();
  renderBudgets();
  updateBudgetSelect();
}

function updateBudgetSelect() {
  const sel = document.getElementById("budgetSelect");
  if (!sel) return;
  sel.innerHTML = '<option value="" selected>Select Budget</option>';
  state.budgets.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.category;
    opt.textContent = `${b.category} - ${formatCurrency(b.limit)}`;
    sel.appendChild(opt);
  });
}

// Transactions select helpers
function updateTransactionSelect() {
  const sel = document.getElementById("transactionSelect");
  if (!sel) return;
  sel.innerHTML = '<option value="" selected>Select Transaction</option>';
  state.transactions.forEach((t, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = `${t.date} — ${t.title} — ${formatCurrency(t.amount)}`;
    sel.appendChild(opt);
  });
}

function removeTransaction(e) {
  e.preventDefault();
  const sel = document.getElementById("transactionSelect");
  if (!sel) return;
  const value = sel.value;
  if (value === "" || value == null) return;

  const idx = parseInt(value, 10);
  if (Number.isNaN(idx) || idx < 0 || idx >= state.transactions.length) return;

  state.transactions.splice(idx, 1);
  saveState();
  renderTransactions();
  updateDashboard();
  updateTransactionSelect();
}

/* --------------------------
   SETTINGS
--------------------------- */

function updateUser(e) {
  e.preventDefault();

  state.user.name = document.getElementById("userName").value;
  state.user.email = document.getElementById("userEmail").value;

  saveState();
  alert("Profile Updated");
}

function loadUser() {
  const nameField = document.getElementById("userName");
  const emailField = document.getElementById("userEmail");

  if (nameField) nameField.value = state.user.name;
  if (emailField) emailField.value = state.user.email;
}

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  renderTransactions();
  renderBudgets();
  updateBudgetSelect();
  updateDashboard();
  updateTransactionSelect();
  loadUser();
});

