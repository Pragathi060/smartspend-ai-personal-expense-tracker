import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Plus,
  Trash2,
  Search,
  Wallet,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  Receipt,
  CalendarDays,
  CreditCard,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./style.css";

const API = "https://smartspend-backend-c9jl.onrender.com/api";
const defaultAnalytics = {
  total: 0,
  budget: 20000,
  remaining: 20000,
  savings: 20000,
};

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatCurrency(value) {
  return `₹${safeNumber(value).toLocaleString("en-IN")}`;
}

function Card({ title, value, note, good = false, icon }) {
  return (
    <div className="card summary-card">
      <div className="card-top">
        <span className="card-title">{title}</span>
        <span className="card-icon">{icon}</span>
      </div>

      <div className="card-value">{value}</div>

      <div className={good ? "card-note good" : "card-note"}>
        {note}
      </div>
    </div>
  );
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(defaultAnalytics);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // Budget editing state
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState("");

  const [form, setForm] = useState({
    amount: "",
    description: "",
    merchant: "",
    category: "",
    payment_method: "UPI",
    date: new Date().toISOString().split("T")[0],
  });

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  async function loadData() {
    try {
      setError("");

      const [expensesResponse, analyticsResponse] =
        await Promise.all([
          fetch(`${API}/expenses`),
          fetch(`${API}/analytics`),
        ]);

      if (!expensesResponse.ok) {
        throw new Error("Unable to load expenses");
      }

      if (!analyticsResponse.ok) {
        throw new Error("Unable to load analytics");
      }

      const expensesData = await expensesResponse.json();
      const analyticsData = await analyticsResponse.json();

      setExpenses(
        Array.isArray(expensesData)
          ? expensesData
          : []
      );

      const budgetValue = safeNumber(
        analyticsData?.budget,
        20000
      );

      const totalValue = safeNumber(
        analyticsData?.total
      );

      setAnalytics({
        total: totalValue,

        budget: budgetValue,

        remaining: safeNumber(
          analyticsData?.remaining,
          budgetValue - totalValue
        ),

        savings: safeNumber(
          analyticsData?.savings
        ),
      });
    } catch (err) {
      console.error(err);

      setError(
        "Could not connect to the backend. Make sure the Flask server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // --------------------------------------------------
  // ADD EXPENSE
  // --------------------------------------------------

  async function addExpense(event) {
    event.preventDefault();

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API}/expenses`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            amount: Number(form.amount),
            description: form.description,
            merchant: form.merchant,
            category: form.category,
            payment_method:
              form.payment_method,
            date: form.date,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to add expense"
        );
      }

      setForm({
        amount: "",
        description: "",
        merchant: "",
        category: "",
        payment_method: "UPI",
        date: new Date()
          .toISOString()
          .split("T")[0],
      });

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        "Unable to add expense. Please check the backend."
      );
    }
  }

  // --------------------------------------------------
  // UPDATE BUDGET
  // --------------------------------------------------

  async function updateBudget(event) {
    event.preventDefault();

    const amount = Number(newBudget);

    if (!amount || amount <= 0) {
      alert(
        "Please enter a valid budget greater than 0."
      );
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API}/budget`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            amount: amount,
          }),
        }
      );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => ({}));

        throw new Error(
          data.message ||
            "Failed to update budget"
        );
      }

      setEditingBudget(false);
      setNewBudget("");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        "Unable to update the budget. Please try again."
      );
    }
  }

  // --------------------------------------------------
  // DELETE EXPENSE
  // --------------------------------------------------

  async function deleteExpense(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/expenses/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete expense"
        );
      }

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete the expense."
      );
    }
  }

  // --------------------------------------------------
  // FILTER EXPENSES
  // --------------------------------------------------

  const filteredExpenses = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return expenses;
    }

    return expenses.filter((expense) => {
      return (
        String(
          expense.description || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          expense.merchant || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          expense.category || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          expense.payment_method || ""
        )
          .toLowerCase()
          .includes(query)
      );
    });
  }, [expenses, search]);

  // --------------------------------------------------
  // CATEGORY DATA
  // --------------------------------------------------

  const categoryData = useMemo(() => {
    const totals = {};

    expenses.forEach((expense) => {
      const category =
        expense.category || "Other";

      totals[category] =
        (totals[category] || 0) +
        safeNumber(expense.amount);
    });

    return Object.entries(totals).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
  }, [expenses]);

  // --------------------------------------------------
  // MONTHLY DATA
  // --------------------------------------------------

  const monthlyData = useMemo(() => {
    const totals = {};

    expenses.forEach((expense) => {
      const date = new Date(
        expense.date
      );

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const month =
        date.toLocaleDateString(
          "en-IN",
          {
            month: "short",
          }
        );

      totals[month] =
        (totals[month] || 0) +
        safeNumber(expense.amount);
    });

    return Object.entries(totals).map(
      ([month, amount]) => ({
        month,
        amount,
      })
    );
  }, [expenses]);

  // --------------------------------------------------
  // HIGHEST CATEGORY
  // --------------------------------------------------

  const highestCategory = useMemo(() => {
    if (!categoryData.length) {
      return null;
    }

    return categoryData.reduce(
      (highest, current) =>
        current.value > highest.value
          ? current
          : highest
    );
  }, [categoryData]);

  // --------------------------------------------------
  // BUDGET CALCULATIONS
  // --------------------------------------------------

  const totalSpent = safeNumber(
    analytics.total
  );

  const budget = safeNumber(
    analytics.budget,
    20000
  );

  const remaining = safeNumber(
    analytics.remaining,
    budget - totalSpent
  );

  const savings = safeNumber(
    analytics.savings
  );

  const budgetPercentage =
    budget > 0
      ? Math.min(
          (totalSpent / budget) * 100,
          100
        )
      : 0;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            <Wallet size={22} />
          </div>

          <div>
            <h2>SmartSpend</h2>
            <span>
              AI Personal Finance
            </span>
          </div>

        </div>

        <nav className="nav">

          <a
            className="active"
            href="#dashboard"
          >
            <Wallet size={18} />
            Dashboard
          </a>

          <a href="#expenses">
            <Receipt size={18} />
            Expenses
          </a>

          <a href="#budget">
            <PiggyBank size={18} />
            Budget
          </a>

          <a href="#insights">
            <Sparkles size={18} />
            AI Insights
          </a>

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-tip">

            <Sparkles size={18} />

            <div>

              <strong>
                Smart tip
              </strong>

              <p>
                Track every expense to
                understand where your
                money goes.
              </p>

            </div>

          </div>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main
        className="main-content"
        id="dashboard"
      >

        {/* HEADER */}

        <header className="header">

          <div>

            <span className="eyebrow">
              PERSONAL FINANCE
            </span>

            <h1>
              Good morning 👋
            </h1>

            <p>
              Here is your spending overview.
            </p>

          </div>

          <button
            className="primary"
            onClick={() => {
              document
                .getElementById("amount")
                ?.focus();
            }}
          >
            <Plus size={18} />
            Add expense
          </button>

        </header>

        {/* ERROR */}

        {error && (
          <div className="error-banner">

            <AlertTriangle size={18} />

            <span>{error}</span>

          </div>
        )}

        {/* SUMMARY CARDS */}

        <section className="cards">

          <Card
            title="Total spent"
            value={formatCurrency(
              totalSpent
            )}
            note="All recorded expenses"
            icon={
              <TrendingUp size={19} />
            }
          />

          <Card
            title="Monthly budget"
            value={formatCurrency(
              budget
            )}
            note="Your planned limit"
            icon={<Wallet size={19} />}
          />

          <Card
            title="Remaining"
            value={formatCurrency(
              remaining
            )}
            note={
              remaining < 0
                ? "Over budget"
                : "Within budget"
            }
            good={remaining >= 0}
            icon={
              <PiggyBank size={19} />
            }
          />

          <Card
            title="Potential savings"
            value={formatCurrency(
              savings
            )}
            note="Based on current budget"
            good
            icon={
              <Sparkles size={19} />
            }
          />

        </section>

        {/* CHARTS */}

        <section className="grid charts-grid">

          <div className="panel large-panel">

            <div className="panel-header">

              <div>

                <h3>
                  Spending trend
                </h3>

                <p>
                  Your spending by month
                </p>

              </div>

              <TrendingUp size={20} />

            </div>

            <div className="chart-container">

              {monthlyData.length === 0 ? (

                <div className="empty-chart">

                  <Receipt size={30} />

                  <p>
                    No spending data yet.
                  </p>

                  <span>
                    Add your first expense below.
                  </span>

                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={monthlyData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                    />

                    <YAxis />

                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value),
                        "Spent",
                      ]}
                    />

                    <Bar
                      dataKey="amount"
                      radius={[
                        8,
                        8,
                        0,
                        0,
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>

          <div className="panel">

            <div className="panel-header">

              <div>

                <h3>
                  Categories
                </h3>

                <p>
                  Where your money goes
                </p>

              </div>

            </div>

            <div className="pie-container">

              {categoryData.length === 0 ? (

                <div className="empty-chart">

                  <Wallet size={30} />

                  <p>
                    No categories yet.
                  </p>

                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                    >

                      {categoryData.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${
                              index * 55 + 20
                            }, 65%, 55%)`}
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Legend />

                  </PieChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>

        </section>

        {/* =========================================
            BUDGET PROGRESS
            ========================================= */}

        <section
          className="panel budget-panel"
          id="budget"
        >

          <div className="panel-header">

            <div>

              <h3>
                Budget progress
              </h3>

              <p>
                How much of your monthly
                budget you've used
              </p>

            </div>

            <strong>
              {Math.round(
                budgetPercentage
              )}
              %
            </strong>

          </div>

          {/* Progress bar */}

          <div className="progress-track">

            <div
              className="progress-bar"
              style={{
                width: `${budgetPercentage}%`,
              }}
            />

          </div>

          {/* Budget information */}

          <div className="budget-details">

            <span>
              Spent:{" "}
              <strong>
                {formatCurrency(
                  totalSpent
                )}
              </strong>
            </span>

            <span>
              Budget:{" "}
              <strong>
                {formatCurrency(
                  budget
                )}
              </strong>
            </span>

            <span>
              Remaining:{" "}
              <strong>
                {formatCurrency(
                  remaining
                )}
              </strong>
            </span>

          </div>

          {/* EDIT BUDGET */}

          {!editingBudget ? (

            <button
              className="edit-budget-btn"
              type="button"
              onClick={() => {
                setNewBudget(
                  String(budget)
                );

                setEditingBudget(true);
              }}
            >

              <Wallet size={16} />

              Edit Budget

            </button>

          ) : (

            <form
              onSubmit={updateBudget}
              className="budget-edit-area"
            >

              <div className="budget-input-group">

                <label htmlFor="budgetInput">
                  New monthly budget
                </label>

                <div className="budget-input-wrapper">

                  <span className="budget-currency">
                    ₹
                  </span>

                  <input
                    id="budgetInput"
                    className="budget-input"
                    type="number"
                    min="1"
                    step="1"
                    value={newBudget}
                    onChange={(e) =>
                      setNewBudget(
                        e.target.value
                      )
                    }
                    placeholder="Enter budget amount"
                    autoFocus
                    required
                  />

                </div>

              </div>

              <div className="budget-actions">

                <button
                  className="save-budget-btn"
                  type="submit"
                >
                  Save Budget
                </button>

                <button
                  className="cancel-budget-btn"
                  type="button"
                  onClick={() => {
                    setEditingBudget(false);
                    setNewBudget("");
                  }}
                >
                  Cancel
                </button>

              </div>

            </form>

          )}

        </section>

        {/* ADD EXPENSE */}

        <section
          className="panel form-panel"
        >

          <div className="panel-header">

            <div>

              <h3>
                Add a new expense
              </h3>

              <p>
                Record your spending and
                keep your finances organized.
              </p>

            </div>

            <Receipt size={20} />

          </div>

          <form
            onSubmit={addExpense}
            className="expense-form"
          >

            <div className="form-group">

              <label htmlFor="amount">
                Amount
              </label>

              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="₹500"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount:
                      e.target.value,
                  })
                }
                required
              />

            </div>

            <div className="form-group">

              <label htmlFor="description">
                Description
              </label>

              <input
                id="description"
                type="text"
                placeholder="Lunch, shopping, travel..."
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
              />

            </div>

            <div className="form-group">

              <label htmlFor="merchant">
                Merchant
              </label>

              <input
                id="merchant"
                type="text"
                placeholder="Amazon, Swiggy..."
                value={form.merchant}
                onChange={(e) =>
                  setForm({
                    ...form,
                    merchant:
                      e.target.value,
                  })
                }
              />

            </div>

            <div className="form-group">

              <label htmlFor="category">
                Category
              </label>

              <select
                id="category"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:
                      e.target.value,
                  })
                }
              >

                <option value="">
                  AI Auto Category
                </option>

                <option value="Food">
                  Food
                </option>

                <option value="Shopping">
                  Shopping
                </option>

                <option value="Transport">
                  Transport
                </option>

                <option value="Entertainment">
                  Entertainment
                </option>

                <option value="Bills">
                  Bills
                </option>

                <option value="Healthcare">
                  Healthcare
                </option>

                <option value="Education">
                  Education
                </option>

                <option value="Travel">
                  Travel
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>

            <div className="form-group">

              <label htmlFor="payment">
                Payment method
              </label>

              <select
                id="payment"
                value={form.payment_method}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payment_method:
                      e.target.value,
                  })
                }
              >

                <option value="UPI">
                  UPI
                </option>

                <option value="Cash">
                  Cash
                </option>

                <option value="Credit Card">
                  Credit Card
                </option>

                <option value="Debit Card">
                  Debit Card
                </option>

                <option value="Bank Transfer">
                  Bank Transfer
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>

            <div className="form-group">

              <label htmlFor="date">
                Date
              </label>

              <input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: e.target.value,
                  })
                }
              />

            </div>

            <button
              className="primary form-submit"
              type="submit"
            >

              <Plus size={18} />

              Add expense

            </button>

          </form>

        </section>

        {/* RECENT EXPENSES */}

        <section
          className="panel expenses-panel"
          id="expenses"
        >

          <div className="panel-header">

            <div>

              <h3>
                Recent expenses
              </h3>

              <p>
                Review and manage your
                transactions.
              </p>

            </div>

            <div className="search-box">

              <Search size={17} />

              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

          </div>

          {loading ? (

            <div className="loading">
              Loading expenses...
            </div>

          ) : filteredExpenses.length === 0 ? (

            <div className="empty-state">

              <Receipt size={40} />

              <h3>
                No expenses found
              </h3>

              <p>
                Add your first expense to
                start tracking your spending.
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      Description
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Merchant
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Amount
                    </th>

                    <th></th>

                  </tr>

                </thead>

                <tbody>

                  {filteredExpenses.map(
                    (expense) => (

                      <tr
                        key={expense.id}
                      >

                        <td>

                          <div className="expense-name">

                            <div className="expense-icon">

                              <Receipt
                                size={16}
                              />

                            </div>

                            <span>
                              {
                                expense.description ||
                                "Expense"
                              }
                            </span>

                          </div>

                        </td>

                        <td>

                          <span className="category-badge">

                            {
                              expense.category ||
                              "Other"
                            }

                          </span>

                        </td>

                        <td>
                          {
                            expense.merchant ||
                            "—"
                          }
                        </td>

                        <td>

                          <span className="payment">

                            <CreditCard
                              size={14}
                            />

                            {
                              expense.payment_method ||
                              "—"
                            }

                          </span>

                        </td>

                        <td>

                          <span className="date">

                            <CalendarDays
                              size={14}
                            />

                            {
                              expense.date ||
                              "—"
                            }

                          </span>

                        </td>

                        <td className="amount">

                          {
                            formatCurrency(
                              expense.amount
                            )
                          }

                        </td>

                        <td>

                          <button
                            className="delete-btn"
                            title="Delete expense"
                            onClick={() =>
                              deleteExpense(
                                expense.id
                              )
                            }
                          >

                            <Trash2
                              size={17}
                            />

                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* AI INSIGHTS */}

        <section
          className="panel insight-panel"
          id="insights"
        >

          <div className="insight-icon">

            <Sparkles size={24} />

          </div>

          <div>

            <span className="eyebrow">
              AI SPENDING INSIGHT
            </span>

            <h3>

              {highestCategory
                ? `${highestCategory.name} is currently your biggest spending category.`
                : "Start tracking expenses to get personalized insights."}

            </h3>

            <p>

              {highestCategory
                ? `You have spent ${formatCurrency(
                    highestCategory.value
                  )} on ${
                    highestCategory.name
                  }. Reviewing this category regularly can help you find opportunities to save.`
                : "SmartSpend will analyze your expenses and provide useful spending suggestions as you add transactions."}

            </p>

          </div>

        </section>

        {/* FOOTER */}

        <footer className="footer">

          <span>
            SmartSpend AI Personal Expense Tracker
          </span>

          <span>
            Built with React + Flask
          </span>

        </footer>

      </main>

    </div>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>
    <App />
  </React.StrictMode>

);