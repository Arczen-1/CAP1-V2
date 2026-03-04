import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function LinenDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("contracts");

  const [inventory, setInventory] = useState([]);
  const [newItem, setNewItem] = useState({ item: "", stock: 0, unit: "pcs" });

  const [checklist, setChecklist] = useState([
    { name: "Tablecloths", checked: false },
    { name: "Chair covers", checked: false },
    { name: "Napkins", checked: false },
    { name: "Centerpieces", checked: false },
  ]);
  const [checklistSubmitted, setChecklistSubmitted] = useState(false);

  const [request, setRequest] = useState({ item: "", quantity: "", reason: "" });
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchContracts();
    fetchInventory();
    fetchRequests();
  }, []);

  // ===== CONTRACTS =====
  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      if (res.ok) {
        setContracts(
          (data.contracts || [])
            .filter((c) => c.status === "Active")
            .map((c) => ({
              id: c._id,
              name:
                (c.page1 && (c.page1.contractName || c.page1.occasion)) ||
                "Contract",
              celebratorName: (c.page1 && c.page1.celebratorName) || "",
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

  // ===== INVENTORY =====
  const fetchInventory = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/linen/inventory");
      const data = await res.json();
      if (res.ok) setInventory(data.inventory || []);
    } catch (e) {
      console.error("Error fetching inventory:", e);
    }
  };

  const addInventoryItem = async () => {
    if (!newItem.item) return alert("Enter item name!");
    try {
      const res = await fetch("http://localhost:5000/api/linen/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        setNewItem({ item: "", stock: 0, unit: "pcs" });
        fetchInventory();
      }
    } catch (e) {
      console.error("Error adding item:", e);
    }
  };

  const updateStock = async (id, stock) => {
    try {
      const res = await fetch(`http://localhost:5000/api/linen/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      if (res.ok) fetchInventory();
    } catch (e) {
      console.error("Error updating stock:", e);
    }
  };

  // ===== CHECKLIST =====
  const fetchChecklist = async (contractId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/linen/checklist/${contractId}`);
      const data = await res.json();
      if (res.ok && data.checklist) {
        setChecklist(data.checklist);
        setChecklistSubmitted(data.submitted || false);
      } else {
        setChecklistSubmitted(false);
        setChecklist([
          { name: "Tablecloths", checked: false },
          { name: "Chair covers", checked: false },
          { name: "Napkins", checked: false },
          { name: "Centerpieces", checked: false },
        ]);
      }
    } catch (e) {
      console.error("Error fetching checklist:", e);
    }
  };

  const handleChecklistChange = (index) => {
    const updated = [...checklist];
    updated[index].checked = !updated[index].checked;
    setChecklist(updated);
  };

  const submitChecklist = async () => {
    if (!selectedContract) {
      alert("Please select a contract first!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/linen/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: selectedContract._id,
          checklistItems: checklist,
        }),
      });
      if (res.ok) {
        setChecklistSubmitted(true);
        alert("Checklist submitted successfully!");
      }
    } catch (e) {
      console.error("Error submitting checklist:", e);
    }
  };

  // ===== REQUEST FORM =====
  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/linen/requests");
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch (e) {
      console.error("Error fetching requests:", e);
    }
  };

  const submitRequest = async () => {
    if (!request.item || !request.quantity)
      return alert("Please complete all fields!");

    const newRequest = {
      ...request,
      status: "Pending",
      department: "Linen",
      dateRequested: new Date().toISOString(),
    };

    try {
      await fetch("http://localhost:5000/api/linen/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });

      await fetch("http://localhost:5000/api/purchasing/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRequest,
          sourceDepartment: "Linen",
        }),
      });

      alert("Request sent to Purchasing Department!");
      setRequest({ item: "", quantity: "", reason: "" });
      fetchRequests();
    } catch (e) {
      console.error("Error submitting request:", e);
    }
  };

  // ===== CONTRACTS TABLE =====
  const renderContractsTable = () => {
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedContracts = contracts.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Active Contracts</h3>
          <div className="pager">
            <button className="pager-btn" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              ←
            </button>
            <span className="page-indicator">
              Page {page} of {Math.ceil(contracts.length / itemsPerPage)}
            </span>
            <button
              className="pager-btn"
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(contracts.length / itemsPerPage)}
            >
              →
            </button>
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
                  <td colSpan="4">No active contracts available</td>
                </tr>
              ) : (
                paginatedContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>{contract.name}</td>
                    <td>{contract.celebratorName}</td>
                    <td>{contract.contractNumber || "-"}</td>
                    <td>
                      <button
                        className="btn-review"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                          const data = await res.json();
                          if (res.ok) {
                            setSelectedContract(data.contract);
                            fetchChecklist(contract.id);
                          }
                        }}
                      >
                        View Details
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

  // ===== INVENTORY TAB =====
  const renderInventoryTab = () => (
    <div className="contracts-table-container">
      <div className="table-header">
        <h3>Linen Inventory</h3>
      </div>

      <div className="inventory-inputs-vertical">
        <label>Item Name:</label>
        <input placeholder="Item name" value={newItem.item} onChange={(e) => setNewItem({ ...newItem, item: e.target.value })} />
        <label>Stock:</label>
        <input type="number" placeholder="Stock" value={newItem.stock} onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })} />
        <label>Unit:</label>
        <input placeholder="Unit" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
        <button onClick={addInventoryItem}>Add Item</button>
      </div>

      <div className="contracts-table">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Stock</th>
              <th>Unit</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr><td colSpan="4">No items found</td></tr>
            ) : (
              inventory.map((i) => (
                <tr key={i._id}>
                  <td>{i.item}</td>
                  <td>{i.stock}</td>
                  <td>{i.unit}</td>
                  <td>
                    <button onClick={() => updateStock(i._id, i.stock + 10)}>+10</button>
                    <button onClick={() => updateStock(i._id, i.stock - 10)}>-10</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ===== CHECKLIST TAB =====
  const renderChecklistTab = () => (
    <div className="contracts-table-container">
      <div className="table-header"><h3>Linen Checklist</h3></div>
      {selectedContract ? (
        <div className="contracts-table checklist-table">
          <table>
            <thead>
              <tr><th>Item</th><th>Status</th></tr>
            </thead>
            <tbody>
              {checklist.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleChecklistChange(index)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn-review" onClick={submitChecklist} disabled={checklistSubmitted}>
            {checklistSubmitted ? "Submitted" : "Submit Checklist"}
          </button>
        </div>
      ) : (
        <p style={{ padding: "20px" }}>Select a contract first to access the checklist.</p>
      )}
    </div>
  );

  // ===== DETAILS MODAL =====
  const renderDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Linen Contract Details</h3>
          <button className="close-btn" onClick={() => setSelectedContract(null)}>×</button>
        </div>
        <div className="modal-body">
          {selectedContract && (
            <div className="contract-details">
              <div className="detail-section">
                <h4>Contract Information</h4>
                <div className="detail-row"><strong>Contract Number:</strong> {selectedContract.contractNumber}</div>
                <div className="detail-row"><strong>Celebrator/Corporate Name:</strong> {selectedContract.page1?.celebratorName || "N/A"}</div>
                <div className="detail-row"><strong>Date of Event:</strong> {selectedContract.page1?.eventDate || "N/A"}</div>
              </div>
              <div className="detail-section">
                <h4>Theme and Setup</h4>
                <div className="detail-row"><strong>Theme Set Up:</strong> {selectedContract.page1?.themeSetup || "N/A"}</div>
                <div className="detail-row"><strong>Color Motif:</strong> {selectedContract.page1?.colorMotif || "N/A"}</div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
        </div>
      </div>
    </div>
  );

  // ===== REQUEST TAB =====
  const renderRequestTab = () => (
    <div className="contracts-table-container">
      <div className="table-header"><h3>Request Form to Purchasing</h3></div>
      <div className="inventory-inputs-vertical">
        <label>Item:</label>
        <input placeholder="Item" value={request.item} onChange={(e) => setRequest({ ...request, item: e.target.value })} />
        <label>Quantity:</label>
        <input type="number" placeholder="Quantity" value={request.quantity} onChange={(e) => setRequest({ ...request, quantity: e.target.value })} />
        <label>Reason:</label>
        <textarea placeholder="Reason for request" value={request.reason} onChange={(e) => setRequest({ ...request, reason: e.target.value })} />
        <button onClick={submitRequest}>Submit Request</button>
      </div>

      <div className="contracts-table">
        <table>
          <thead>
            <tr><th>Item</th><th>Quantity</th><th>Reason</th><th>Status</th></tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan="4">No requests submitted</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.item}</td>
                  <td>{r.quantity}</td>
                  <td>{r.reason}</td>
                  <td>
                    <span
                      style={{
                        color: r.status === "Approved" ? "green" : r.status === "Pending" ? "orange" : "gray",
                        fontWeight: "bold",
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ===== MAIN RETURN =====
  return (
    <div className="department-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Linen Dashboard</h1>
          <div className="tabs">
            <button className={`tab ${activeTab === "contracts" ? "active" : ""}`} onClick={() => setActiveTab("contracts")}>Contracts</button>
            <button className={`tab ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>Inventory</button>
            <button className={`tab ${activeTab === "checklist" ? "active" : ""}`} onClick={() => setActiveTab("checklist")}>Checklist</button>
            <button className={`tab ${activeTab === "request" ? "active" : ""}`} onClick={() => setActiveTab("request")}>Request Form</button>
          </div>
          <button onClick={onLogout} className="logout-btn header-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === "contracts" && renderContractsTable()}
        {activeTab === "inventory" && renderInventoryTab()}
        {activeTab === "checklist" && renderChecklistTab()}
        {activeTab === "request" && renderRequestTab()}
        {selectedContract && renderDetailsModal()}
      </div>
    </div>
  );
}

export default LinenDashboard;
