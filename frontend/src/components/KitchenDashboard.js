import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function KitchenDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [page, setPage] = useState(1);

  // Load contracts from backend on mount
  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      if (res.ok) {
        setContracts(
          // 1. CHANGED: Filter for "For Approval" status
          (data.contracts || []).filter(c => c.status === "For Approval").map((c) => ({
            id: c._id,
            name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
            celebratorName: (c.page1 && c.page1.celebratorName) || "",
            contractNumber: c.contractNumber,
            // Only map data needed for the table, modal will fetch full details
          }))
        );
      }
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  const renderContractsTable = () => {
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedContracts = contracts.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="contracts-table-container">
        <div className="table-header">
          {/* 2. CHANGED: Title updated */}
          <h3>Contracts for Kitchen Review</h3>
          <div className="pager">
            <button className="pager-btn" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>←</button>
            <span className="page-indicator">Page {page} of {Math.ceil(contracts.length / itemsPerPage)}</span>
            <button className="pager-btn" onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(contracts.length / itemsPerPage)}>→</button>
          </div>
        </div>
        <div className="contracts-table">
          <table>
            <thead>
              <tr>
                <th>Contract Name</th>
                <th>Celebrator/Corporate Name</th>
                <th>Contract No.</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContracts.length === 0 ? (
                <tr className="no-contracts">
                  {/* 3. CHANGED: Text updated */}
                  <td colSpan="4">No contracts awaiting review</td>
                </tr>
              ) : (
                paginatedContracts.map(contract => (
                  <tr key={contract.id} className="clickable-row" onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                      const data = await res.json();
                      if (res.ok) setSelectedContract(data.contract);
                    } catch (e) {}
                  }}>
                    <td>{contract.name}</td>
                    <td>{contract.celebratorName}</td>
                    <td>{contract.contractNumber || "-"}</td>
                    <td>
                      <button
                        className="btn-review"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                            const data = await res.json();
                            if (res.ok) setSelectedContract(data.contract);
                          } catch (e) {
                            console.error("Error fetching contract details:", e);
                          }
                        }}
                      >
                        {/* 4. CHANGED: Button text updated */}
                        Review Menu
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Helper to render multi-line menu items nicely
  const renderMenuSection = (title, data) => {
    if (!data) return <div className="detail-row"><strong>{title}:</strong> N/A</div>;
    
    const items = data.split('\n').filter(item => item.trim() !== "");
    if (items.length === 0) {
      return <div className="detail-row"><strong>{title}:</strong> N/A</div>;
    }

    return (
      <>
        <div className="detail-row"><strong>{title}:</strong></div>
        <ul className="menu-detail-list">
          {items.map((item, index) => (
            <li key={index}>{item.trim()}</li>
          ))}
        </ul>
      </>
    );
  };

  // 5. MODIFIED: Modal now shows all fields from your new code
  const renderDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Kitchen Contract Details</h3>
          <button className="close-btn" onClick={() => setSelectedContract(null)}>×</button>
        </div>
        <div className="modal-body">
          {selectedContract && (
            <div className="contract-details">
              <div className="detail-section">
                <h4>Event Information</h4>
                <div className="detail-row">
                  <strong>Contract Number:</strong> {selectedContract.contractNumber}
                </div>
                <div className="detail-row">
                  <strong>Celebrator:</strong> {selectedContract.page1?.celebratorName || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Date of Event:</strong> {selectedContract.page1?.eventDate || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Ingress Time:</strong> {selectedContract.page1?.ingressTime || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Total No. of Guests:</strong> {selectedContract.page1?.totalGuests || "N/A"}
                </div>
              </div>

              <div className="detail-section">
                <h4>Coordinator Details</h4>
                 <div className="detail-row">
                  <strong>Name:</strong> {selectedContract.page1?.coordinatorName || "N/A"}
                </div>
                 <div className="detail-row">
                  <strong>Mobile:</strong> {selectedContract.page1?.coordinatorMobile || "N/A"}
                </div>
                 <div className="detail-row">
                  <strong>Email:</strong> {selectedContract.page1?.coordinatorEmail || "N/A"}
                </div>
              </div>

              <div className="detail-section">
                <h4>Menu Details</h4>
                {renderMenuSection("Cocktail Hour", selectedContract.page3?.cocktailHour)}
                {renderMenuSection("Food Stations", selectedContract.page3?.foodStations)}
                {renderMenuSection("Appetizer", selectedContract.page3?.appetizer)}
                {renderMenuSection("Soup", selectedContract.page3?.soup)}
                {renderMenuSection("Salad", selectedContract.page3?.salad)}
                {renderMenuSection("Main Entrée", selectedContract.page3?.mainEntree)}
                {renderMenuSection("Rice", selectedContract.page3?.rice)}
                {renderMenuSection("Dessert", selectedContract.page3?.dessert)}
                {renderMenuSection("Drinks", selectedContract.page3?.drinks)}
              </div>
              
              <div className="detail-section">
                <h4>Other Items</h4>
                 <div className="detail-row">
                  <strong>Cake:</strong> {selectedContract.page2?.cakeNameCode || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Roasted Pig:</strong> {selectedContract.page3?.roastedPig || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Roasted Calf:</strong> {selectedContract.page3?.roastedCalf || "N/A"}
                </div>
              </div>

            </div>
          )}
        </div>
        {/* 6. MODIFIED: Only Close button is present */}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="department-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Kitchen Dashboard</h1>
          <button onClick={onLogout} className="logout-btn header-logout">Logout</button>
        </div>
      </div>
      <div className="dashboard-content">
        {renderContractsTable()}
        {selectedContract && renderDetailsModal()}
      </div>
    </div>
  );
}

export default KitchenDashboard;