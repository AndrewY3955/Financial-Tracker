# Financial Tracker - Fixes and Issues Documentation

This document details all data normalization and formatting issues found in the app and how they have been fixed.

---

## Issue 1: Inconsistent Currency Formatting

### Problem
- Throughout the codebase, amounts were formatted inline using `$${value.toFixed(2)}` in multiple places.
- This scattered approach led to:
  - Risk of inconsistent formatting if one location was missed.
  - Duplicated logic that could become desynchronized.
  - Difficulty maintaining format consistency if requirements change.
- Example: `$${t.amount.toFixed(2)}` appeared in `renderTransactions()`, `updateTransactionSelect()`, `updateDashboard()`, and `updateBudgetSelect()`.

### Fix Applied
- **Added `formatCurrency(value)` helper function** that standardizes all currency output to `$0.00` format.
- **Replaced all inline formatting** with calls to `formatCurrency()`.
- **Locations updated:**
  - `renderTransactions()` – transaction amounts in table.
  - `renderBudgets()` – budget limits.
  - `updateBudgetSelect()` – budget option labels.
  - `updateTransactionSelect()` – transaction option labels.
  - `updateDashboard()` – income, expenses, available funds displays.

### How to Avoid in the Future
- Whenever you need to display a monetary amount, **always use `formatCurrency(value)`** instead of inline `.toFixed(2)`.
- If you need to change currency format (e.g., use a locale like `$1,234.56`), you only need to update the `formatCurrency()` function in one place.

---

## Issue 2: Positive Amounts Entered for Expense Categories

### Problem
- Users can enter transactions with any category (Food, Utilities, Rent, Entertainment, Salary, Other).
- Natural expense categories (Food, Utilities, Rent, Entertainment) represent **spending** and should be stored as **negative** amounts.
- Natural income categories (Salary) should be **positive**.
- **Problem:** If a user mistakenly entered `50` for "Food" instead of `-50`, the app would store `50` as a positive value.
- **Impact:** Dashboard calculations would treat it as income instead of expense, inflating `Available Funds` and zeroing out `Monthly Expenses`.
- **Root cause:** No validation or normalization at input time.

### Transactions Affected
```javascript
// Before: No sign enforcement
const amount = parseFloat(document.getElementById("amount").value); // User enters 50 for "Food"
state.transactions.push({ title, amount, category: "Food", date }); // Stored as 50 (positive!)
```

### Fix Applied
- **In `addTransaction()`:**
  ```javascript
  if (EXPENSE_CATEGORIES.includes(category) && amount > 0) {
    amount = -amount;  // Force negative for expenses
  } else if (INCOME_CATEGORIES.includes(category) && amount < 0) {
    amount = Math.abs(amount);  // Force positive for income
  }
  ```
- **Lists of categories defined at top of file:**
  ```javascript
  const EXPENSE_CATEGORIES = ["Food", "Rent", "Utilities", "Entertainment"];
  const INCOME_CATEGORIES = ["Salary"];
  ```
- **"Other" category** is treated as neutral — no automatic sign is applied.

### State Sanitization on Load
- When the app loads, `normalizeTransactionsInState()` is called to fix any legacy data:
  - Any transaction with a known expense category is checked; if positive, it's negated.
  - Any transaction with a known income category is checked; if negative, it's made positive.
  - This prevents old incorrect data from causing dashboard calculations to fail.

### How to Avoid in the Future
- Always think about the **semantic meaning** of each category:
  - Expenses (spending) → naturally negative.
  - Income (money in) → naturally positive.
- When adding new expense/income categories, update the `EXPENSE_CATEGORIES` and `INCOME_CATEGORIES` arrays.
- Test data entry with both positive and negative inputs to verify the sign is enforced.

---

## Issue 3: Imprecise Decimal Handling (Floating-Point Rounding Errors)

### Problem
- JavaScript's floating-point arithmetic can introduce rounding errors.
- Example: `0.1 + 0.2 === 0.30000000000000004` (not exactly `0.3`).
- **Impact:** If transactions are summed without rounding, dashboard totals could be off by fractions of a cent.
- **Root cause:** Amounts were parsed with `parseFloat()` but not normalized to exactly 2 decimal places before storage.

### Fix Applied
- **In `addTransaction()`:**
  ```javascript
  amount = Number(amount.toFixed(2));  // Round to 2 decimals, then coerce back to Number
  ```
- **In `addBudget()` and `createBudget()`:**
  ```javascript
  limit = Number(limit.toFixed(2));  // Same rounding approach
  ```
- **In `normalizeTransactionsInState()` and `normalizeBudgetsInState()`:**
  - Every amount/limit is explicitly rounded to 2 decimals when the app loads.

### How to Avoid in the Future
- **Always apply `Number(value.toFixed(2))` after any arithmetic or input parsing.**
- If you do complex math (e.g., splitting a bill), round intermediary results and final results to 2 decimals.
- Example:
  ```javascript
  const splitAmount = Number((totalAmount / 3).toFixed(2));
  ```

---

## Issue 4: Budget Limits Accepting Negative Values

### Problem
- Budget limits represent the **maximum amount allowed** to spend on a category.
- A limit should always be positive (e.g., "Food budget: $100" means max $100, not max -$100).
- **Problem:** `addBudget()` and `createBudget()` did not validate or enforce that limits are positive.
- **Impact:** Negative limits could cause incorrect budget tracking or confusing UI display.

### Fix Applied
- **In `addBudget()` and `createBudget()`:**
  ```javascript
  if (limit < 0) limit = Math.abs(limit);  // Convert to positive
  limit = Number(limit.toFixed(2));  // Ensure 2 decimal places
  ```
- **In `normalizeBudgetsInState()`:**
  - All persisted budget limits are checked and converted to positive on load.

### How to Avoid in the Future
- **Budget limits should always be `Math.abs()`** to ensure they are positive.
- Any field representing a "max" or "limit" should be validated to be non-negative.

---

## Issue 5: Missing Type Coercion on Amount Display

### Problem
- In `updateTransactionSelect()`, the amount was displayed as:
  ```javascript
  $${(Number(t.amount)||0).toFixed(2)}
  ```
- This defensive approach (`||0` fallback) suggests that at some point `t.amount` might NOT be a number.
- **Problem:** Data inconsistency — amounts should reliably be stored as Numbers, not strings or null.
- **Impact:** Extra defensive code is needed everywhere amounts are accessed, making the codebase harder to maintain.

### Fix Applied
- **Centralized normalization:**
  - `normalizeTransactionsInState()` ensures every transaction amount is a Number.
  - No more `Number(t.amount) || 0` workarounds needed.
- **Now safe to assume:**
  ```javascript
  state.transactions.forEach(t => {
    // t.amount is guaranteed to be a Number
    const formatted = formatCurrency(t.amount);  // No fallback needed
  });
  ```

### How to Avoid in the Future
- **Design your data schema** and enforce it:
  - `transaction.amount` should always be a Number, never a string or null.
  - Use type annotations (JSDoc, TypeScript) to document expected types:
    ```javascript
    /**
     * @typedef {Object} Transaction
     * @property {string} title
     * @property {number} amount - Always a Number, rounded to 2 decimals, signed (negative for expenses)
     * @property {string} category
     * @property {string} date - YYYY-MM-DD format
     */
    ```
- Add assertions or validation in `normalizeTransactionsInState()` to catch unexpected data shapes.

---

## Issue 6: "Other" Category Behavior

### Problem
- The "Other" category is not listed in `EXPENSE_CATEGORIES` or `INCOME_CATEGORIES`.
- **Current behavior:** Users can enter `50` for "Other", and it will remain positive (not auto-negated).
- **Design decision:** Treat "Other" as semantically neutral — let the user control the sign for this category.

### How to Use It
- If a user wants to manually track something that doesn't fit other categories, they use "Other" and explicitly enter a negative or positive amount.
- If you want "Other" to be treated as an expense by default, add it to `EXPENSE_CATEGORIES`:
  ```javascript
  const EXPENSE_CATEGORIES = ["Food", "Rent", "Utilities", "Entertainment", "Other"];
  ```

---

## Issue 7: Dashboard Calculations Always Run on Load

### Problem
- Previously, `updateDashboard()` was not called when the page loaded.
- **Problem:** If a user navigated from Transactions to Dashboard, the KPIs would not update until they added another transaction.
- **Impact:** Stale data on page load; user confusion if transactions don't immediately show in the dashboard.

### Fix Applied
- **Added `updateDashboard()` call in `DOMContentLoaded` event:**
  ```javascript
  document.addEventListener("DOMContentLoaded", () => {
    renderTransactions();
    renderBudgets();
    updateBudgetSelect();
    updateDashboard();  // Populate KPIs immediately
    updateTransactionSelect();
    loadUser();
  });
  ```

### How to Avoid in the Future
- **Initialize all UI components on page load**, not lazily on user action.
- Ensure the application state is reflected in the UI as soon as the page is ready.

---

## Issue 8: Lack of Data Validation at Input

### Problem
- Form inputs (title, amount, date, category) are read directly from DOM without any validation.
- **Problems:**
  - Empty titles or missing dates could sneak into state.
  - Non-numeric amounts could be stored if input type validation is bypassed.
  - Invalid dates passed in.

### Current Mitigations
- HTML `required` attributes on form inputs help, but don't guarantee valid data (e.g., if someone modifies the form via DevTools).
- `normalizeTransactionsInState()` provides a fallback: missing fields are set to defaults.

### How to Improve (Not Yet Implemented)
- Add runtime validation in `addTransaction()`:
  ```javascript
  if (!title || title.trim().length === 0) {
    alert("Please enter a transaction title");
    return;
  }
  if (isNaN(amount) || amount === 0) {
    alert("Please enter a valid amount");
    return;
  }
  ```

---

## Summary of Changes Made

| File | Change |
|------|--------|
| `assets/js/app.js` | Added `formatCurrency()` helper for consistent currency display |
| `assets/js/app.js` | Added `EXPENSE_CATEGORIES` and `INCOME_CATEGORIES` constants |
| `assets/js/app.js` | Added `normalizeTransactionsInState()` to sanitize persisted data on load |
| `assets/js/app.js` | Added `normalizeBudgetsInState()` to sanitize persisted data on load |
| `assets/js/app.js` | Updated `addTransaction()` to auto-enforce amount signs by category |
| `assets/js/app.js` | Updated `addTransaction()` to round amounts to 2 decimals |
| `assets/js/app.js` | Updated `addBudget()` and `createBudget()` to ensure positive limits |
| `assets/js/app.js` | Updated `renderTransactions()` to use `formatCurrency()` |
| `assets/js/app.js` | Updated `renderBudgets()` to use `formatCurrency()` |
| `assets/js/app.js` | Updated `updateBudgetSelect()` to use `formatCurrency()` |
| `assets/js/app.js` | Updated `updateTransactionSelect()` to use `formatCurrency()` |
| `assets/js/app.js` | Updated `updateDashboard()` to use `formatCurrency()` and added documentation |
| `assets/js/app.js` | Added call to `updateDashboard()` on `DOMContentLoaded` |

---

## Testing Recommendations

1. **Test currency formatting:**
   - Add a transaction with amount `123.456` and verify it displays as `$123.46`.
   - Verify all pages (Dashboard, Transactions, Budgets) show consistent formatting.

2. **Test expense sign enforcement:**
   - Enter an expense transaction (e.g., Food) with a positive amount (e.g., `50`).
   - Verify it's stored as `-50` and shows as `-$50.00` in the table.
   - Verify the dashboard correctly treats it as an expense (subtracts it from available funds).

3. **Test income sign enforcement:**
   - Enter a Salary transaction with a negative amount (e.g., `-5000`).
   - Verify it's stored as `5000` and shows as `$5000.00`.
   - Verify the dashboard correctly treats it as income.

4. **Test rounding:**
   - Add multiple transactions with odd decimal amounts (e.g., `10.111`, `20.222`).
   - Verify the dashboard total is correct (not off by fractions of a cent).

5. **Test budget limits:**
   - Enter a budget limit as a negative value (e.g., `-500`).
   - Verify it's stored as `500` and displays as `$500.00`.

6. **Test page load:**
   - Add transactions, then refresh the Dashboard page.
   - Verify KPIs are immediately populated (not blank).

