let state = JSON.parse(localStorage.getItem("fintrack")) || {
  transactions: [],
  budgets: [],
  user: {
    name: "Andrew",
    email: "andrew@email.com"
  }
};

function saveState() {
  localStorage.setItem("fintrack", JSON.stringify(state));
}

/* --------------------------
   TRANSACTIONS
--------------------------- */

function addTransaction(e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  state.transactions.push({ title, amount, category, date });
  saveState();
  renderTransactions();
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
        <td>$${t.amount.toFixed(2)}</td>
      </tr>
    `;
  });
}

/* --------------------------
   BUDGETS
--------------------------- */

function addBudget(e) {
  e.preventDefault();

  const category = document.getElementById("budgetCategory").value;
  const limit = parseFloat(document.getElementById("budgetLimit").value);

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
        <p>Limit: $${b.limit.toFixed(2)}</p>
      </div>
    `;
  });
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
  loadUser();
});
