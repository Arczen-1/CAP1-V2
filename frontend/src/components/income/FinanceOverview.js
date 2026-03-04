import React, { useEffect, useState } from "react";
import "./Finance.css";

export default function FinanceOverview() {
  const [filter, setFilter] = useState("month");
  const [overview, setOverview] = useState({ total: 0 });

  async function fetchOverview(currentFilter = filter) {
    try {
      const res = await fetch(`/api/finance/overview/${currentFilter}`);
      const json = await res.json();
      setOverview(json || { total: 0 });
    } catch (err) {
      console.error("Error fetching overview:", err);
    }
  }

  useEffect(() => {
    fetchOverview(filter);

    // Refresh when FinanceClient triggers update
    function onUpdate() {
      fetchOverview(filter);
    }

    window.addEventListener("financeUpdated", onUpdate);
    return () => window.removeEventListener("financeUpdated", onUpdate);
  }, [filter]);

  return React.createElement(
    "div",
    { className: "finance-overview" },
    React.createElement("h2", null, "Finance Overview"),
    React.createElement(
      "div",
      { style: { marginBottom: "12px" } },
      React.createElement("label", null, "Filter: "),
      React.createElement(
        "select",
        {
          value: filter,
          onChange: (e) => {
            setFilter(e.target.value);
            fetchOverview(e.target.value);
          },
        },
        React.createElement("option", { value: "day" }, "Today"),
        React.createElement("option", { value: "week" }, "This Week"),
        React.createElement("option", { value: "month" }, "This Month"),
        React.createElement("option", { value: "year" }, "This Year")
      )
    ),

    React.createElement(
      "div",
      {
        className: "finance-card total",
        style: {
          marginTop: "20px",
          padding: "40px",
          background: "#f9fafb",
          borderRadius: "12px",
          textAlign: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        },
      },
      React.createElement("h3", null, "Total Income"),
      React.createElement(
        "p",
        {
          style: {
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#2e7d32",
            margin: "10px 0",
          },
        },
        "₱" + (overview.total ? overview.total.toLocaleString() : "0")
      ),
      React.createElement(
        "p",
        { style: { color: "#777" } },
        "as of this " + filter
      )
    )
  );
}
