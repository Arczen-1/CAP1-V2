import React, { useEffect, useState } from "react";
import "./Finance.css";

export default function FinanceClient({ onStatusChange }) {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/finance/clients");
      const data = await res.json();
      if (res.ok) setClients(data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/finance/update-status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Marked as ${status}`);
        fetchClients();
        if (onStatusChange) onStatusChange(); // 🔁 notify overview to refresh total
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return (
    <div className="finance-clients">
      <h2>Clients</h2>

      <table className="clients-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Contract No.</th>
            <th>Occasion</th>
            <th>Total Amount</th>
            <th>Event Date</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>No active contracts found</td>
            </tr>
          ) : (
            clients.map((f) => {
              const c = f.contractId || {};
              const eventDate = c.page1?.eventDate || "-";
              const occasion = c.page1?.occasion || "-";
              const total = c.page3?.grandTotal || f.totalAmount || 0;
              const dueDate = f.paymentDueDate
                ? new Date(f.paymentDueDate).toLocaleDateString()
                : "-";

              return (
                <tr key={f._id}>
                  <td>{f.client}</td>
                  <td>{c.contractNumber || "-"}</td>
                  <td>{occasion}</td>
                  <td>₱{Number(total).toLocaleString()}</td>
                  <td>{eventDate}</td>
                  <td>{dueDate}</td>
                  <td>
                    <span className={`status-badge ${f.status.toLowerCase()}`}>
                      {f.status}
                    </span>
                  </td>
                  <td>
                    {f.status === "Unpaid" && (
                      <button className="btn-paid" onClick={() => updateStatus(f._id, "Paid")}>
                        Mark as Paid
                      </button>
                    )}
                    {f.status === "Paid" && (
                      <button className="btn-unpaid" onClick={() => updateStatus(f._id, "Unpaid")}>
                        Mark as Unpaid
                      </button>
                    )}
                    {f.status !== "Cancelled" && (
                      <button className="btn-unpaid" onClick={() => updateStatus(f._id, "Cancelled")}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
