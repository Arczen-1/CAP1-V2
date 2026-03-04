import React, { useState } from "react";
import "./DepartmentDashboard.css";

function DepartmentDashboard({ onLogout, departmentName }) {
  const [page, setPage] = useState(1);

  const handleNext = () => setPage((p) => p + 1);
  const handleBack = () => setPage((p) => (p > 1 ? p - 1 : 1));

  return (
    <div className="department-dashboard">
      <div className="dashboard-header">
        <h1>{departmentName} Dashboard</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>

      <div className="dashboard-content">
        <div className="contracts-table-container">
          <div className="table-header">
            <h3>Contracts</h3>
            <div className="pager">
              <button className="pager-btn" onClick={handleBack} aria-label="Previous Page">←</button>
              <span className="page-indicator">Page {page}</span>
              <button className="pager-btn" onClick={handleNext} aria-label="Next Page">→</button>
            </div>
          </div>
          <div className="contracts-table">
            <table>
              <thead>
                <tr>
                  <th>Contract Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="no-contracts">
                  <td colSpan="2">No contracts available</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentDashboard;



