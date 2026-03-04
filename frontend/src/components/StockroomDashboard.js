
import React, { useState, useEffect } from "react";
import "./other.css";

function StockroomDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [fabricationRequests, setFabricationRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({ item: "", quantity: "", remarks: "" });
  const [selectedContract, setSelectedContract] = useState(null);
  const [page, setPage] = useState(1);
  const [activeView, setActiveView] = useState("contracts");

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // ===================== FETCH DATA =====================
  useEffect(() => {
    if (activeView === "contracts") fetchContracts();
    if (activeView === "inventory") fetchInventory();
    if (activeView === "fabrication") fetchFabricationRequests();
  }, [activeView]);

const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      if (res.ok) {
        setContracts(
          (data.contracts || [])
            .filter(c => c.status === "Active")
            .map(c => ({
              id: c._id,
              name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
              client: (c.page1 && c.page1.celebratorName) || "",
              value: (c.page3 && c.page3.grandTotal) || "",
              startDate: (c.page1 && c.page1.eventDate) || "",
              endDate: (c.page1 && c.page1.eventDate) || "",
              contractNumber: c.contractNumber,
              raw: c,
            }))
        );
      }
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };


  const fetchInventory = async () => {
    try {
      const res = await fetch("http://localhost:5000/stockroom-inventory");
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const fetchFabricationRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/fabrication-requests");
      const data = await res.json();
      setFabricationRequests(data);
    } catch (err) {
      console.error("Error fetching fabrication requests:", err);
    }
  };

  // ===================== FABRICATION FORM =====================
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!newRequest.item || !newRequest.quantity) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/fabrication-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user?.username,
          item: newRequest.item,
          quantity: newRequest.quantity,
          remarks: newRequest.remarks,
        }),
      });

      if (!res.ok) throw new Error("Failed to create request");
      alert("Fabrication request submitted!");
      setNewRequest({ item: "", quantity: "", remarks: "" });
      fetchFabricationRequests();
    } catch (err) {
      console.error("Error submitting request:", err);
      alert("Error submitting request");
    }
  };

  // ===================== PAGINATION =====================
  const contractsPerPage = 5;
  const startIndex = (page - 1) * contractsPerPage;
  const paginatedContracts = contracts.slice(startIndex, startIndex + contractsPerPage);

  // ===================== RENDER =====================
 return (

    <div className="department-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Stockroom Dashboard</h1>
          <div className="header-nav">
            <button className={`nav-btn ${activeView === "contracts" ? "active" : ""}`} onClick={() => setActiveView("contracts")}>Active Contracts</button>
            <button className={`nav-btn ${activeView === "inventory" ? "active" : ""}`} onClick={() => setActiveView("inventory")}>Inventory</button>
            <button className={`nav-btn ${activeView === "fabrication" ? "active" : ""}`} onClick={() => setActiveView("fabrication")}>Fabrication Report</button>
          </div>
          <button onClick={onLogout} className="logout-btn header-logout">Logout</button>
        </div>
      </div>

    <div className="dashboard-content">
      {/* Active Contracts */}
      {activeView === "contracts" && (
        <div className="contracts-table-container">
          <div className="table-header">
            <h3>Active Contracts</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Contract Name</th>
                <th>Client</th>
                <th>Contract Number</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContracts.length === 0 ? (
                <tr><td colSpan="3">No active contracts available</td></tr>
              ) : (
                paginatedContracts.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.client}</td>
                    <td>{c.contractNumber}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination">
            {Array.from({ length: Math.ceil(contracts.length / contractsPerPage) }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={page === i + 1 ? "active" : ""}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inventory */}
      {activeView === "inventory" && (
  <div className="contracts-table-container">
    <div className="table-header">
      <h3>Inventory</h3>
    </div>
    <table className="inventory-table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Unit</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {inventory.length === 0 ? (
          <tr>
            <td colSpan="3">No inventory data</td>
          </tr>
        ) : (
          inventory.map((item, idx) => (
            <tr key={idx}>
              <td>{item["ITEM DESCRIPTION"]}</td>
              <td>{item["UNIT"]}</td>
              <td>
                <button className="action-btn">View</button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}

      {/* Fabrication Requests */}
      {activeView === "fabrication" && (
        <div className="contracts-table-container">
          <div className="table-header">
            <h3>Fabrication Requests</h3>
          </div>

          <form className="fabrication-form" onSubmit={handleRequestSubmit}>
            <div className="form-row">
              <div className="input-group">
                <label>Requestor</label>
                <input type="text" value={user?.username || ""} readOnly style={{ backgroundColor: "#f1f1f1" }} />
              </div>
              <div className="input-group">
                <label>Item Needed</label>
                <select
                  value={newRequest.item}
                  onChange={(e) => setNewRequest({ ...newRequest, item: e.target.value })}
                >
                  <option value="">Select Item</option>
                  {inventory.map((item, idx) => (
                    <option key={idx} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group small">
                <label>Quantity</label>
                <input
                  type="number"
                  value={newRequest.quantity}
                  onChange={(e) => setNewRequest({ ...newRequest, quantity: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Remarks</label>
                <input
                  type="text"
                  value={newRequest.remarks}
                  onChange={(e) => setNewRequest({ ...newRequest, remarks: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-add">Submit</button>
            </div>
          </form>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>Requestor</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Remarks</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {fabricationRequests.length === 0 ? (
                <tr><td colSpan="6">No requests yet</td></tr>
              ) : (
                fabricationRequests.map((req) => (
                  <tr key={req._id}>
                    <td>{req.username}</td>
                    <td>{req.item}</td>
                    <td>{req.quantity}</td>
                    <td>{req.remarks}</td>
                    <td>{req.status}</td>
                    <td>{new Date(req.date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);
}

export default StockroomDashboard;

