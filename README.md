# FinTrack - Personal Financial Tracker

FinTrack is a simple, web-based financial management application that helps users track their spending, manage budgets, and organize their financial goals.

## Features

- **Dashboard**: View key financial metrics at a glance
- **Transactions**: Add and track all your financial transactions with categories, amounts, and dates
- **Budgets**: Create and manage spending budgets by category
- **Settings**: Update your user profile information
- **Goals & Breakdown**: Planned feature for visualizing spending patterns
- **Investments**: Planned feature for investment tracking

## How It Works

FinTrack stores all your financial data locally in your browser using `localStorage`. When you add transactions or budgets, they are saved automatically and persist even after you close the browser.

### Core Functionality

- **Add Transactions**: Log expenses with title, amount, date, and category
- **Create Budgets**: Set spending limits for different categories
- **Manage Profile**: Update your name and email in settings
- **View History**: All transactions are displayed in a table on the transactions page

## How to Run

1. Open `index.html` in your web browser
2. Navigate through the sidebar to access different sections:
   - Dashboard (main page)
   - Transactions (add and view expenses)
   - Budgets (create spending limits)
   - Settings (manage profile)
   - Goals & Investments (coming soon)

No installation, server, or build process required—just open and use!

## File Structure

- `index.html` - Dashboard page
- `transactions.html` - Transaction management page
- `budgets.html` - Budget management page
- `settings.html` - User settings page
- `goals.html` - Goals visualization page (coming soon)
- `investments.html` - Investment tracking page (coming soon)
- `assets/css/styles.css` - Application styling
- `assets/js/app.js` - Core application logic and state management

## Technology Stack

- **HTML** - Structure
- **CSS** - Styling and responsive design
- **JavaScript (Vanilla)** - Application logic and local storage management

## Data Structure

All data is stored in `localStorage` under the key `"fintrack"` with the following structure:

```json
{
  "transactions": [
    { "title": "...", "amount": 0, "category": "...", "date": "..." }
  ],
  "budgets": [
    { "category": "...", "limit": 0 }
  ],
  "user": {
    "name": "...",
    "email": "..."
  }
}
```