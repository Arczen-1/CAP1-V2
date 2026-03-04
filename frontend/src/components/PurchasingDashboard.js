import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function PurchasingDashboard({ onLogout }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/fabrication-requests");
      const data = await res.json();
      setRequests(data || []);
    } catch (err) {
      console.error("Error fetching fabrication requests:", err);
    }
  };

  fetch("http://localhost:5000/fabrication-requests")
  .then(res => res.json())
  .catch(err => console.error(err));

  return (
    <div className="department-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Purchasing Dashboard</h1>
          <button onClick={onLogout} className="logout-btn header-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="contracts-table-container">
          <div className="table-header">
            <h3>Incoming Fabrication Requests</h3>
          </div>

          <table>
            <thead>
              <tr>
                <th>Requestor</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Remarks</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan="6">No requests received yet.</td></tr>
              ) : (
                requests.map((r, i) => (
                  <tr key={i}>
                    <td>{r.user?.name}</td>
                    <td>{r.item}</td>
                    <td>{r.quantity}</td>
                    <td>{r.remarks || "—"}</td>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.status || "Pending"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PurchasingDashboard;
