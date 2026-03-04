import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function WarehouseDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [page, setPage] = useState(1);
  const [activeView, setActiveView] = useState("contracts");

  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryModalMode, setInventoryModalMode] = useState("add");
  const [inventoryModalData, setInventoryModalData] = useState({});
  const [inventoryEditingIndex, setInventoryEditingIndex] = useState(null);

  const [monitoringData, setMonitoringData] = useState([]);
  const [monitoringModalOpen, setMonitoringModalOpen] = useState(false);
  const [monitoringModalMode, setMonitoringModalMode] = useState("add");
  const [monitoringModalData, setMonitoringModalData] = useState({});
  const [monitoringEditingIndex, setMonitoringEditingIndex] = useState(null);
  const [fabricationRequests, setFabricationRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({ name: "", item: "", quantity: "", remarks: "" });

  const [inventoryPage, setInventoryPage] = useState(1);
  const [monitoringPage, setMonitoringPage] = useState(1);
  const [user, setUser] = useState(() => {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState("");

useEffect(() => {
  fetch("http://localhost:5000/inventory")
    .then(res => res.json())
    .then(data => setInventory(data))
    .catch(err => console.error("Error loading inventory:", err));
}, []);

  

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
     console.log("Loaded user:", storedUser);
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);


  // ------------------- Fetch Data -------------------
  useEffect(() => {
    if (activeView === "contracts") fetchContracts();
    if (activeView === "inventory") fetchInventory();
    if (activeView === "monitoring") fetchMonitoring();
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

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // Save only the actual user object, not the wrapper
      localStorage.setItem("user", JSON.stringify(data.user)); 
      setUser(data.user); 
      alert("Login successful!");
    } else {
      alert(data.message || "Invalid credentials");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("An error occurred while logging in.");
  }
};

  
  const fetchInventory = async () => {
    try {
      const res = await fetch("http://localhost:5000/inventory-movement");
      const data = await res.json();
      setInventoryData(data);
    } catch (err) {
      console.error("Error fetching inventory data:", err);
    }
  };

  const fetchMonitoring = async () => {
    try {
      const res = await fetch("http://localhost:5000/monitoring");
      const data = await res.json();
      setMonitoringData(data);
    } catch (err) {
      console.error("Error fetching monitoring data:", err);
    }
  };

  // ------------------- Inventory CRUD -------------------
  const openInventoryModal = (mode, data = {}, index = null) => {
    setInventoryModalMode(mode);
    setInventoryModalData(data);
    setInventoryEditingIndex(index);
    setInventoryModalOpen(true);
  };

  const closeInventoryModal = () => {
    setInventoryModalOpen(false);
    setInventoryModalData({});
    setInventoryEditingIndex(null);
  };

  const saveInventoryItem = () => {
    if (inventoryModalMode === "add") {
      setInventoryData(prev => [...prev, inventoryModalData]);
    } else if (inventoryModalMode === "edit") {
      setInventoryData(prev =>
        prev.map((item, idx) => idx === inventoryEditingIndex ? inventoryModalData : item)
      );
    }
    closeInventoryModal();
  };

  const deleteInventoryItem = (idx) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setInventoryData(prev => prev.filter((_, index) => index !== idx));
    }
  };

  // ------------------- Monitoring CRUD -------------------
  const openMonitoringModal = (mode, data = {}, index = null) => {
    setMonitoringModalMode(mode);
    setMonitoringModalData(data);
    setMonitoringEditingIndex(index);
    setMonitoringModalOpen(true);
  };

  const closeMonitoringModal = () => {
    setMonitoringModalOpen(false);
    setMonitoringModalData({});
    setMonitoringEditingIndex(null);
  };

  const saveMonitoringItem = () => {
    if (monitoringModalMode === "add") {
      setMonitoringData(prev => [...prev, monitoringModalData]);
    } else if (monitoringModalMode === "edit") {
      setMonitoringData(prev =>
        prev.map((item, idx) => idx === monitoringEditingIndex ? monitoringModalData : item)
      );
    }
    closeMonitoringModal();
  };

  const deleteMonitoringItem = (idx) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setMonitoringData(prev => prev.filter((_, index) => index !== idx));
    }
  };

  // ------------------- Render Tables -------------------
  const renderContractsTable = () => {
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedContracts = contracts.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Active Contracts</h3>
        </div>
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
              <tr><td colSpan="4">No active contracts available</td></tr>
            ) : (
              paginatedContracts.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.client}</td>
                  <td>{c.contractNumber}</td>
                  <td>
                    <button className="btn-review" onClick={() => setSelectedContract(c.raw)}>View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInventoryTable = () => {
    return (
      <div className="contracts-table-container">
        <div className="table-actions">
          <button className="btn-add" onClick={() => openInventoryModal("add")}>Add Item</button>
        </div>
        <h3>Inventory Monitoring</h3>
        {inventoryData.length === 0 ? (
          <p>No inventory data</p>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Description</th>
                <th>UOM</th>
                <th>On-hand Start</th>
                <th>Quantity</th>
                <th>Damages</th>
                <th>On-hand End</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.map((item, idx) => (
                <tr key={idx}>
                  <td>{item["Item Code"]}</td>
                  <td>{item["Item Description"]}</td>
                  <td>{item.UOM}</td>
                  <td>{item["On-hand (Start)"]}</td>
                  <td>{item.Quantity}</td>
                  <td>{item.Damages}</td>
                  <td>{item["On-hand (End)"]}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openInventoryModal("edit", item, idx)}>Edit</button>
                    <button className="btn-delete" onClick={() => deleteInventoryItem(idx)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const renderMonitoringTable = () => {
    return (
      <div className="contracts-table-container">
        <div className="table-actions">
          <button className="btn-add" onClick={() => openMonitoringModal("add")}>Add Section</button>
        </div>
        <h3>Inventory Monitoring</h3>
        {monitoringData.length === 0 ? (
          <p>No monitoring data</p>
        ) : monitoringData.map((section, idx) => (
          <div key={idx} style={{ marginBottom: "2rem" }}>
            <table className="monitoring-table">
              <thead>
                <tr>
                  {section.header.map((h, i) => <th key={i}>{h}</th>)}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
                    <td>
                      <button className="btn-edit" onClick={() => openMonitoringModal("edit", section, idx)}>Edit</button>
                      <button className="btn-delete" onClick={() => deleteMonitoringItem(idx)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  // ------------------- Modal JSX -------------------
  const renderInventoryModal = () => (
    inventoryModalOpen && (
      <div className="modal-overlay" onClick={closeInventoryModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>{inventoryModalMode === "add" ? "Add Inventory Item" : "Edit Inventory Item"}</h3>
          <form onSubmit={(e) => { e.preventDefault(); saveInventoryItem(); }}>
            {["Item Code","Item Description","UOM","On-hand (Start)","Quantity","Damages","On-hand (End)"].map(field => (
              <div key={field} className="modal-input-group">
                <label>{field}</label>
                <input
                  value={inventoryModalData[field] || ""}
                  onChange={(e) => setInventoryModalData(prev => ({ ...prev, [field]: e.target.value }))}
                />
              </div>
            ))}
            <div className="modal-actions">
              <button type="submit" className="btn-save">Save</button>
              <button type="button" className="btn-cancel" onClick={closeInventoryModal}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  const renderMonitoringModal = () => (
    monitoringModalOpen && (
      <div className="modal-overlay" onClick={closeMonitoringModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>{monitoringModalMode === "add" ? "Add Section" : "Edit Section"}</h3>
          <form onSubmit={(e) => { e.preventDefault(); saveMonitoringItem(); }}>
            <div className="modal-input-group">
              <label>Header (comma-separated)</label>
              <input
                value={monitoringModalData.header?.join(", ") || ""}
                onChange={(e) => setMonitoringModalData(prev => ({ ...prev, header: e.target.value.split(",").map(h => h.trim()) }))}
              />
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn-save">Save</button>
              <button type="button" className="btn-cancel" onClick={closeMonitoringModal}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  const renderDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Contract Details - {selectedContract?.contractNumber}</h3>
          <button className="close-btn" onClick={() => setSelectedContract(null)}>×</button>
        </div>
        <div className="modal-body">
          {selectedContract && (
            <div className="contract-details-comprehensive">
              {/* Contract Status */}
              <div className="detail-section">
                <div className="detail-row">
                  <strong>Status:</strong>
                  <span className={`status ${selectedContract.status?.toLowerCase().replace(' ', '-')}`}>
                    {selectedContract.status}
                  </span>
                </div>
                {selectedContract.rejectionReason && (
                  <div className="detail-row">
                    <strong>Rejection Reason:</strong> {selectedContract.rejectionReason}
                  </div>
                )}
              </div>

              {/* Client Information */}
              <div className="detail-section">
                <h4>Client Information</h4>
                <div className="detail-grid">
                  <div className="detail-row">
                    <strong>Celebrator/Corporate Name:</strong> {selectedContract.page1?.celebratorName || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Coordinator Name:</strong> {selectedContract.page1?.coordinatorName || "N/A"}
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="detail-section">
                <h4>Event Details</h4>
                <div className="detail-grid">
                  <div className="detail-row">
                    <strong>Date of Event:</strong> {selectedContract.page1?.eventDate || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Occasion:</strong> {selectedContract.page1?.occasion || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Venue:</strong> {selectedContract.page1?.venue || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Hall:</strong> {selectedContract.page1?.hall || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>No. of Guests:</strong> {selectedContract.page1?.totalGuests || "N/A"}
                    {selectedContract.page1?.totalVIP && ` (VIP: ${selectedContract.page1.totalVIP}`}
                    {selectedContract.page1?.totalRegular && `, Regular: ${selectedContract.page1.totalRegular})`}
                  </div>
                </div>
              </div>

              {/* Set-Up */}
              <div className="detail-section">
                <h4>Set-Up</h4>
                <div className="detail-grid">
                  <div className="detail-row">
                    <strong>Theme Set-Up:</strong> {selectedContract.page1?.themeSetup || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Color Motif:</strong> {selectedContract.page1?.colorMotif || "N/A"}
                  </div>
                </div>
              </div>

              {/* Flower Arrangement */}
              <div className="detail-section">
                <h4>Flower Arrangement</h4>
                <div className="detail-grid">
                  <div className="detail-row">
                    <strong>Backdrop:</strong> {selectedContract.page2?.flowerBackdrop || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Guest Centerpiece:</strong> {selectedContract.page2?.flowerGuestCenterpiece || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>VIP Centerpiece:</strong> {selectedContract.page2?.flowerVipCenterpiece || "N/A"}
                  </div>
                </div>
              </div>

              {/* Other Special Requirements */}
              <div className="detail-section">
                <h4>Other Special Requirements</h4>
                <div className="detail-subsection">
                  <h5>Cake Details</h5>
                  <div className="detail-grid">
                    <div className="detail-row">
                      <strong>Cake Name/Code:</strong> {selectedContract.page2?.cakeNameCode || "N/A"}
                    </div>
                    <div className="detail-row">
                      <strong>Flavor:</strong> {selectedContract.page2?.cakeFlavor || "N/A"}
                    </div>
                    <div className="detail-row">
                      <strong>Supplier:</strong> {selectedContract.page2?.cakeSupplier || "N/A"}
                    </div>
                    <div className="detail-row">
                      <strong>Specifications:</strong> {selectedContract.page2?.cakeSpecifications || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="detail-subsection">
                  <h5>Additional Requirements</h5>
                  <div className="detail-grid">
                    <div className="detail-row">
                      <strong>Celebrator's Car:</strong> {selectedContract.page2?.celebratorsCar || "N/A"}
                    </div>
                    <div className="detail-row">
                      <strong>Emcee:</strong> {selectedContract.page2?.emcee || "N/A"}
                    </div>
                    <div className="detail-row">
                      <strong>Sound System:</strong> {selectedContract.page2?.soundSystem || "N/A"}
                    </div>
                    <div className="detail-row">
                      <strong>Tent:</strong> {selectedContract.page2?.tent || "N/A"}
                    </div>
                    <div className="detail-row">
                      <strong>Celebrator's Chair:</strong> {selectedContract.page2?.celebratorsChair || "N/A"}
                    </div>
                  </div>
                </div>
                {(selectedContract.page2?.remarks || selectedContract.page2?.others) && (
                  <div className="detail-subsection">
                    <h5>Remarks & Other Requirements</h5>
                    <div className="detail-row">
                      <strong>Remarks:</strong> {selectedContract.page2?.remarks || "N/A"}
                    </div>
                    <div className="detail-row">
                      <strong>Other Requirements:</strong> {selectedContract.page2?.others || "N/A"}
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Details */}
              <div className="detail-section">
                <h4>Menu Details</h4>
                <div className="menu-details">
                  {selectedContract.page3?.cocktailHour && (
                    <div className="detail-row">
                      <strong>Cocktail Hour:</strong>
                      <div className="menu-text">{selectedContract.page3.cocktailHour}</div>
                    </div>
                  )}
                  {selectedContract.page3?.appetizer && (
                    <div className="detail-row">
                      <strong>Appetizer:</strong>
                      <div className="menu-text">{selectedContract.page3.appetizer}</div>
                    </div>
                  )}
                  {selectedContract.page3?.soup && (
                    <div className="detail-row">
                      <strong>Soup:</strong>
                      <div className="menu-text">{selectedContract.page3.soup}</div>
                    </div>
                  )}
                  {selectedContract.page3?.bread && (
                    <div className="detail-row">
                      <strong>Bread:</strong>
                      <div className="menu-text">{selectedContract.page3.bread}</div>
                    </div>
                  )}
                  {selectedContract.page3?.salad && (
                    <div className="detail-row">
                      <strong>Salad:</strong>
                      <div className="menu-text">{selectedContract.page3.salad}</div>
                    </div>
                  )}
                  {selectedContract.page3?.mainEntree && (
                    <div className="detail-row">
                      <strong>Main Entrée:</strong>
                      <div className="menu-text">{selectedContract.page3.mainEntree}</div>
                    </div>
                  )}
                  {selectedContract.page3?.dessert && (
                    <div className="detail-row">
                      <strong>Dessert:</strong>
                      <div className="menu-text">{selectedContract.page3.dessert}</div>
                    </div>
                  )}
                  {selectedContract.page3?.cakeName && (
                    <div className="detail-row">
                      <strong>Cake Name:</strong>
                      <div className="menu-text">{selectedContract.page3.cakeName}</div>
                    </div>
                  )}
                  {selectedContract.page3?.kidsMeal && (
                    <div className="detail-row">
                      <strong>Kids Meal:</strong>
                      <div className="menu-text">{selectedContract.page3.kidsMeal}</div>
                    </div>
                  )}
                  {selectedContract.page3?.crewMeal && (
                    <div className="detail-row">
                      <strong>Crew Meal:</strong>
                      <div className="menu-text">{selectedContract.page3.crewMeal}</div>
                    </div>
                  )}
                  {selectedContract.page3?.drinksCocktail && (
                    <div className="detail-row">
                      <strong>Drinks at Cocktail:</strong>
                      <div className="menu-text">{selectedContract.page3.drinksCocktail}</div>
                    </div>
                  )}
                  {selectedContract.page3?.drinksMeal && (
                    <div className="detail-row">
                      <strong>Drinks at Meal:</strong>
                      <div className="menu-text">{selectedContract.page3.drinksMeal}</div>
                    </div>
                  )}
                  {(selectedContract.page3?.roastedPig || selectedContract.page3?.roastedCalf) && (
                    <div className="detail-row">
                      <strong>Special Items:</strong>
                      <div className="menu-text">
                        {selectedContract.page3.roastedPig && `Roasted Pig: ${selectedContract.page3.roastedPig}`}
                        {selectedContract.page3.roastedPig && selectedContract.page3.roastedCalf && <br />}
                        {selectedContract.page3.roastedCalf && `Roasted Calf: ${selectedContract.page3.roastedCalf}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
  fetchFabricationRequests();
  }, []);

  const fetchFabricationRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/fabrication-requests");
      const data = await res.json();
      setFabricationRequests(data || []);
    } catch (err) {
      console.error("Error fetching fabrication requests:", err);
    }
  };

  const renderFabricationReport = () => {
  const handleRequestSubmit = async (e) => {
  e.preventDefault();

  const requestData = {
    username: user?.username,    
    item: newRequest.item,
    quantity: newRequest.quantity,
    remarks: newRequest.remarks,
  };

  try {
    const res = await fetch("http://localhost:5000/fabrication-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    const data = await res.json();
    if (res.ok) {
      alert(" Fabrication request submitted successfully!");
      setFabricationRequests((prev) => [...prev, data.request]);
      setNewRequest({ item: "", quantity: "", remarks: "" });
    } else {
      alert("Error" + data.message);
    }
  } catch (err) {
    console.error("Error submitting fabrication request:", err);
    alert("Server error while submitting request.");
  }
};


  return (
    <div className="fabrication-report-container">
      <div className="table-header">
        <h3>Fabrication Request Report</h3>
      </div>

      <form className="fabrication-form" onSubmit={handleRequestSubmit}>
        <div className="form-row">
          <div className="input-group">
            <label>Requestor Name</label>
            <input
              type="text"
              value={user?.username || ""}
              readOnly
          />
          </div>

          <div className="input-group">
            <label>Item Needed</label>
            <select
              value={newRequest.item}
              onChange={(e) => setNewRequest(prev => ({ ...prev, item: e.target.value }))}
              required
            >
              <option value="">Select item</option>
              {inventory.map((inv, i) => (
                <option key={i} value={inv.itemName}>
                  {inv.itemName} (Available: {inv.quantity})
                </option>
              ))}
            </select>
          </div>


          <div className="input-group small">
            <label>Quantity</label>
            <input
              type="number"
              min="1"
              value={newRequest.quantity}
              onChange={(e) => setNewRequest(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="Qty"
              required
            />
          </div>

          <div className="input-group">
            <label>Remarks (optional)</label>
            <input
              type="text"
              value={newRequest.remarks}
              onChange={(e) => setNewRequest(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Remarks or purpose"
            />
          </div>
        </div>
        <button type="submit" className="btn-add">Submit Request</button>
      </form>

      <div className="fabrication-table-wrapper">
        {fabricationRequests.length === 0 ? (
          <p>No fabrication requests submitted yet.</p>
        ) : (
          <table className="fabrication-table">
            <thead>
              <tr>
                <th>Requestor</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Remarks</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {fabricationRequests.map((req, idx) => (
                <tr key={idx}>
                  <td>{req.username}</td>
                  <td>{req.item}</td>
                  <td>{req.quantity}</td>
                  <td>{req.remarks || "—"}</td>
                  <td>{req.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};


  // ------------------- Render -------------------
  return (
    <div className="department-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Warehouse Dashboard</h1>
          <div className="header-nav">
            <button className={`nav-btn ${activeView === "contracts" ? "active" : ""}`} onClick={() => setActiveView("contracts")}>Active Contracts</button>
            <button className={`nav-btn ${activeView === "inventory" ? "active" : ""}`} onClick={() => setActiveView("inventory")}>Inventory Monitoring</button>
            <button className={`nav-btn ${activeView === "monitoring" ? "active" : ""}`} onClick={() => setActiveView("monitoring")}>Inventory</button>
            <button className={`nav-btn ${activeView === "fabrication" ? "active" : ""}`} onClick={() => setActiveView("fabrication")}>Fabrication Report</button>
          </div>
          <button onClick={onLogout} className="logout-btn header-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeView === "contracts" && renderContractsTable()}
        {activeView === "inventory" && renderInventoryTable()}
        {activeView === "monitoring" && renderMonitoringTable()}
        {activeView === "fabrication" && renderFabricationReport()}
      </div>

      {selectedContract && renderDetailsModal()}
      {renderInventoryModal()}
      {renderMonitoringModal()}
    </div>
  );
}

export default WarehouseDashboard;
