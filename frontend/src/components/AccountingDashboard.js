import React, { useState, useEffect } from "react";
import "./AccountingDashboard.css";
import FinanceOverview from "./income/FinanceOverview";
import FinanceClients from "./income/FinanceClient";

function AccountingDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [activeTab, setActiveTab] = useState("contracts"); // main tabs: contracts, income
  const [subTab, setSubTab] = useState("for-review");
  const [incomeTab, setIncomeTab] = useState("overview"); // new income subtabs
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [refreshOverview, setRefreshOverview] = useState(false); // ✅ new: trigger refresh

  // Load contracts from backend
  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      if (res.ok) {
        setContracts(
          (data.contracts || []).map((c) => ({
            id: c._id,
            name:
              (c.page1 && (c.page1.contractName || c.page1.occasion)) ||
              "Contract",
            client: (c.page1 && c.page1.celebratorName) || "",
            value: (c.page3 && c.page3.grandTotal) || "",
            startDate: (c.page1 && c.page1.eventDate) || "",
            endDate: (c.page1 && c.page1.eventDate) || "",
            status: c.status || "Draft",
            contractNumber: c.contractNumber,
            page1: c.page1,
            page2: c.page2,
            page3: c.page3,
          }))
        );
      }
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  const handleAccountingApprove = async (contractId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/contracts/${contractId}/accounting-approve`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve");
      setContracts(
        contracts.map((c) =>
          c.id === contractId ? { ...c, status: "Active" } : c
        )
      );
      alert("Contract approved and activated");
      setSelectedContract(null);
    } catch (err) {
      console.error(err);
      alert("Failed to approve contract. Please try again.");
    }
  };

  const handleAccountingReject = async () => {
    if (!selectedContract) return;
    try {
      const res = await fetch(
        `http://localhost:5000/contracts/${selectedContract._id}/accounting-reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject");
      setContracts(
        contracts.map((c) =>
          c.id === selectedContract._id ? { ...c, status: "Rejected" } : c
        )
      );
      alert("Contract rejected");
      setSelectedContract(null);
      setShowRejectModal(false);
      setRejectReason("");
    } catch (err) {
      console.error(err);
      alert("Failed to reject contract. Please try again.");
    }
  };

  const getFilteredContracts = () => {
    switch (subTab) {
      case "for-review":
        return contracts.filter((c) => c.status === "For Accounting Review");
      case "approved":
        return contracts.filter((c) => c.status === "Active");
      default:
        return contracts;
    }
  };

  // --- Render Contracts Table ---
  const renderContractsTable = () => {
    const filteredContracts = getFilteredContracts();
    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Contract Review</h3>
        </div>
        <div className="tabs">
          <button
            className={`tab ${subTab === "for-review" ? "active" : ""}`}
            onClick={() => setSubTab("for-review")}
          >
            For Review (
            {contracts.filter((c) => c.status === "For Accounting Review").length}
            )
          </button>
          <button
            className={`tab ${subTab === "approved" ? "active" : ""}`}
            onClick={() => setSubTab("approved")}
          >
            Approved ({contracts.filter((c) => c.status === "Active").length})
          </button>
          <button
            className={`tab ${subTab === "all" ? "active" : ""}`}
            onClick={() => setSubTab("all")}
          >
            All Contracts ({contracts.length})
          </button>
        </div>

        <div className="contracts-table">
          <table>
            <thead>
              <tr>
                <th>Contract Name</th>
                <th>Client</th>
                <th>Contract No.</th>
                <th>Total Value</th>
                <th>Event Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr className="no-contracts">
                  <td colSpan="7">No contracts found</td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="clickable-row"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `http://localhost:5000/contracts/${contract.id}`
                        );
                        const data = await res.json();
                        if (res.ok) setSelectedContract(data.contract);
                      } catch (e) {}
                    }}
                  >
                    <td>{contract.name}</td>
                    <td>{contract.client}</td>
                    <td>{contract.contractNumber || "-"}</td>
                    <td>₱{contract.value}</td>
                    <td>{contract.startDate}</td>
                    <td>
                      <span
                        className={`status ${contract.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td>
                      {contract.status === "For Accounting Review" && (
                        <div className="action-buttons">
                          <button
                            className="btn-review"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await fetch(
                                  `http://localhost:5000/contracts/${contract.id}`
                                );
                                const data = await res.json();
                                if (res.ok) setSelectedContract(data.contract);
                              } catch (e) {
                                console.error(
                                  "Error fetching contract details:",
                                  e
                                );
                              }
                            }}
                          >
                            Review
                          </button>
                        </div>
                      )}
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

  // --- Render Income Section with Subtabs ---
  const renderIncomeSection = () => (
    <div className="contracts-table-container">
      <div className="table-header">
        <h3>Income Management</h3>
      </div>
      <div className="tabs" style={{ marginTop: "10px" }}>
        <button
          className={`tab ${incomeTab === "overview" ? "active" : ""}`}
          onClick={() => setIncomeTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${incomeTab === "clients" ? "active" : ""}`}
          onClick={() => setIncomeTab("clients")}
        >
          Clients
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        {incomeTab === "overview" && (
          <FinanceOverview refreshTrigger={refreshOverview} />
        )}
        {incomeTab === "clients" && (
          <FinanceClients
            onStatusChange={() => {
              setRefreshOverview(!refreshOverview); // ✅ refresh overview
              setIncomeTab("overview");
            }}
          />
        )}
      </div>
    </div>
  );

  // --- Modals (unchanged) ---
  const renderDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Contract Details - Accounting Review</h3>
          <button
            className="close-btn"
            onClick={() => setSelectedContract(null)}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {selectedContract && (
            <div className="contract-details">
              <div className="detail-section">
                <h4>Contract Number</h4>
                <div className="detail-row">
                  <strong>Contract Number:</strong>{" "}
                  {selectedContract.contractNumber}
                </div>
              </div>
              <div className="detail-section">
                <h4>Client Details (Celebrator)</h4>
                <div className="detail-row">
                  <strong>Celebrator/Corporate Name:</strong>{" "}
                  {selectedContract.page1?.celebratorName || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Address:</strong>{" "}
                  {selectedContract.page1?.celebratorAddress || "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-actions">
          {selectedContract?.status === "For Accounting Review" && (
            <div className="approval-actions">
              <button
                className="btn-approve"
                onClick={() =>
                  handleAccountingApprove(selectedContract._id)
                }
              >
                Approve & Activate
              </button>
              <button
                className="btn-reject"
                onClick={() => setShowRejectModal(true)}
              >
                Reject
              </button>
            </div>
          )}
          <button
            className="btn-secondary"
            onClick={() => setSelectedContract(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const renderRejectModal = () => (
    <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Reject Contract</h3>
          <button
            className="close-btn"
            onClick={() => setShowRejectModal(false)}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Reason for Rejection</label>
            <textarea
              placeholder="Please provide a reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="5"
              required
            />
          </div>
        </div>
        <div className="modal-actions">
          <button
            className="btn-reject"
            onClick={handleAccountingReject}
            disabled={!rejectReason.trim()}
          >
            Submit Rejection
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowRejectModal(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // --- Main render ---
  return (
    <div className="accounting-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Accounting Dashboard</h1>
          <div className="tabs">
            <button
              className={`tab ${activeTab === "contracts" ? "active" : ""}`}
              onClick={() => setActiveTab("contracts")}
            >
              Contracts
            </button>
            <button
              className={`tab ${activeTab === "income" ? "active" : ""}`}
              onClick={() => setActiveTab("income")}
            >
              Income
            </button>
          </div>
          <button onClick={onLogout} className="logout-btn header-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === "contracts" && renderContractsTable()}
        {activeTab === "income" && renderIncomeSection()}
        {selectedContract && renderDetailsModal()}
        {showRejectModal && renderRejectModal()}
      </div>
    </div>
  );
}

export default AccountingDashboard;
