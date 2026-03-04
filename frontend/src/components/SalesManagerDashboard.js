
import React, { useState, useEffect } from "react";
import "./SalesManagerDashboard.css";
import ContractForm from "./ContractForm";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";


function SalesManagerDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nextNumber, setNextNumber] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [editExisting, setEditExisting] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all", "for-approval", "approved"
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reviewingContract, setReviewingContract] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectionReasonModal, setShowRejectionReasonModal] = useState(false);
  const [currentRejectionReason, setCurrentRejectionReason] = useState("");
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState(null);

  const [newContract, setNewContract] = useState({
    name: "",
    client: "",
    value: "",
    startDate: "",
    endDate: "",
    status: "For Approval" // Sales Manager creates contracts that need approval
  });

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
          (data.contracts || []).map((c) => {
            let status = c.status || "Draft";
            if (c.rejectionReason && status === "For Approval") {
              status = "Returned by Accounting";
            }
            return {
              id: c._id,
              name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
              client: (c.page1 && c.page1.celebratorName) || "",
              value: (c.page3 && c.page3.grandTotal) || "",
              startDate: (c.page1 && c.page1.eventDate) || "",
              endDate: (c.page1 && c.page1.eventDate) || "",
              status,
              contractNumber: c.contractNumber,
              rejectionReason: c.rejectionReason || "",
            };
          })
        );
      }
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  const handleInputChange = (e) => {
    setNewContract({
      ...newContract,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        department: "Sales",
        status: newContract.status,
        page1: {
          contractName: newContract.name,
          client: newContract.client,
          value: newContract.value,
          startDate: newContract.startDate,
          endDate: newContract.endDate,
        },
      };

      const res = await fetch("http://localhost:5000/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create");

      setContracts([
        ...contracts,
        {
          id: data.contract._id,
          name: newContract.name,
          client: newContract.client,
          value: newContract.value,
          startDate: newContract.startDate,
          endDate: newContract.endDate,
          status: newContract.status,
          contractNumber: data.contract.contractNumber,
        },
      ]);

      setNewContract({
        name: "",
        client: "",
        value: "",
        startDate: "",
        endDate: "",
        status: "For Approval",
      });
      setShowCreateForm(false);
      setNextNumber("");
    } catch (err) {
      console.error(err);
      alert("Failed to create contract. Please try again.");
    }
  };

  const handleApprove = async (contractId) => {
    if (!contractId) return;
    try {
      const res = await fetch(`http://localhost:5000/contracts/${contractId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve");

      // Update local state
      setContracts(contracts.map(c =>
        c.id === contractId
          ? { ...c, status: "For Accounting Review" }
          : c
      ));

      setShowReviewModal(false);
      setReviewingContract(null);
      alert("Contract approved and sent to Accounting Department");
    } catch (err) {
      console.error(err);
      alert("Failed to approve contract. Please try again.");
    }
  };

  const handleReject = async () => {
    if (!reviewingContract) return;
    try {
      console.log("Rejecting contract with ID:", reviewingContract.id); // Debug log
      const res = await fetch(`http://localhost:5000/contracts/${reviewingContract.id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject");

      // Update local state
      setContracts(contracts.map(c =>
        c.id === reviewingContract.id
          ? { ...c, status: "Rejected" }
          : c
      ));

      setShowRejectModal(false);
      setReviewingContract(null);
      setRejectReason("");
      alert("Contract rejected and returned to Rejected status");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to reject contract. Please try again.");
    }
  };

  // Helper function to map contract data consistently
  const mapContractData = (contract) => ({
    id: contract._id,
    contractNumber: contract.contractNumber,
    status: contract.status,
    page1: contract.page1,
    page2: contract.page2,
    page3: contract.page3,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    rejectionReason: contract.rejectionReason || ""
  });

  const getFilteredContracts = () => {
    switch (activeTab) {
      case "for-approval":
        return contracts.filter(c => c.status === "For Approval" || c.status === "Returned by Accounting");
      case "approved":
        return contracts.filter(c => c.status === "For Accounting Review");
      default:
        return contracts;
    }
  };

  const renderCreateForm = () => (
    <div className="create-contract-form">
      <h3>Create New Contract</h3>
      {nextNumber && (
        <div className="next-number">
          Next Contract Number: {nextNumber}
        </div>
      )}
      <form onSubmit={handleCreateContract}>
        <div className="form-row">
          <div className="form-group">
            <label>Contract Name</label>
            <input
              type="text"
              name="name"
              value={newContract.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Client</label>
            <input
              type="text"
              name="client"
              value={newContract.client}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Value</label>
            <input
              type="number"
              name="value"
              value={newContract.value}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Event Date</label>
            <input
              type="date"
              name="startDate"
              value={newContract.startDate}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Status</label>
          <select
            name="status"
            value={newContract.status}
            onChange={handleInputChange}
          >
            <option value="For Approval">For Approval</option>
            <option value="For Accounting Review">For Accounting Review</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">Create Contract</button>
          <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderContractsTable = () => {
    const filteredContracts = getFilteredContracts();
    
    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Contract Management</h3>
          <button 
            className="action-btn primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create New Contract
          </button>
        </div>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Contracts
          </button>
          <button 
            className={`tab ${activeTab === "for-approval" ? "active" : ""}`}
            onClick={() => setActiveTab("for-approval")}
          >
            For Approval ({contracts.filter(c => c.status === "For Approval").length})
          </button>
          <button 
            className={`tab ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            Sent to Accounting ({contracts.filter(c => c.status === "For Accounting Review").length})
          </button>

        </div>
        
        <div className="contracts-table">
          <table>
            <thead>
              <tr>
                <th>Contract Name</th>
                <th>Client</th>
                <th>Contract No.</th>
                <th>Value</th>
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
                filteredContracts.map(contract => (
                  <tr key={contract.id} className="clickable-row" onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                      const data = await res.json();
                      if (res.ok) {
                        // Map the contract data consistently
                        const mappedContract = mapContractData(data.contract);
                        setSelectedContract(mappedContract);
                      }
                    } catch (e) {
                      console.error("Error fetching contract details:", e);
                    }
                  }}>
                    <td>{contract.name}</td>
                    <td>{contract.client}</td>
                    <td>{contract.contractNumber || "-"}</td>
                    <td>₱{contract.value}</td>
                    <td>{contract.startDate}</td>
                    <td>
                      <span
                        className={`status ${contract.status.toLowerCase().replace(' ', '-')}`}
                        style={{
                          cursor: ((contract.status === "Rejected" || contract.status === "Returned by Accounting") && contract.rejectionReason) ? 'pointer' : 'default'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((contract.status === "Rejected" || contract.status === "Returned by Accounting") && contract.rejectionReason) {
                            setCurrentRejectionReason(contract.rejectionReason);
                            setShowRejectionReasonModal(true);
                          }
                        }}
                        title={((contract.status === "Rejected" || contract.status === "Returned by Accounting") && contract.rejectionReason) ? contract.rejectionReason : ""}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td>
                      {(contract.status === "For Approval" || contract.status === "Returned by Accounting") && (
                        <div className="action-buttons">
                          <button
                            className="btn-review"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                                const data = await res.json();
                                if (res.ok) {
                                  // Map the contract data consistently
                                  const mappedContract = mapContractData(data.contract);
                                  setSelectedContract(mappedContract);
                                }
                              } catch (e) {
                                console.error("Error fetching contract details:", e);
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

  const renderCalendarView = () => {
  const events = contracts.map(c => ({
    id: c.id,
    title: `${c.name} (${c.client})`,
    start: c.startDate,
    end: c.endDate || c.startDate,
    extendedProps: { status: c.status, value: c.value }
  }));

  return (
    <div className="calendar-container">
      <h3>Contract Calendar</h3>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={(info) => {
          setSelectedCalendarEvent({
            title: info.event.title,
            start: info.event.startStr,
            end: info.event.endStr,
            status: info.event.extendedProps.status,
            value: info.event.extendedProps.value
          });
          setShowCalendarModal(true);
        }}
        height="80vh"
      />
    </div>
  );
};

const renderCalendarEventModal = () => (
  <div className="modal-overlay" onClick={() => setShowCalendarModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Event Details</h3>
        <button className="close-btn" onClick={() => setShowCalendarModal(false)}>×</button>
      </div>
      <div className="modal-body">
        {selectedCalendarEvent && (
          <>
            <p><strong>Title:</strong> {selectedCalendarEvent.title}</p>
            <p><strong>Start:</strong> {selectedCalendarEvent.start}</p>
            <p><strong>End:</strong> {selectedCalendarEvent.end}</p>
            <p><strong>Status:</strong> {selectedCalendarEvent.status}</p>
            <p><strong>Value:</strong> ₱{selectedCalendarEvent.value}</p>
          </>
        )}
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={() => setShowCalendarModal(false)}>Close</button>
      </div>
    </div>
  </div>
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
        <div className="modal-actions">
          {selectedContract?.status === "For Approval" && (
            <div className="approval-actions">
              <button className="btn-approve" onClick={() => {
                handleApprove(selectedContract.id);
                setSelectedContract(null);
              }}>Approve</button>
              <button className="btn-reject" onClick={() => {
                // Create a mapped version for reviewing that has consistent id field
                const mappedForReview = {
                  id: selectedContract.id,
                  contractNumber: selectedContract.contractNumber,
                  client: selectedContract.page1?.celebratorName || "",
                  startDate: selectedContract.page1?.eventDate || "",
                  value: selectedContract.page3?.grandTotal || ""
                };
                setReviewingContract(mappedForReview);
                setShowRejectModal(true);
                setSelectedContract(null);
              }}>Reject</button>
            </div>
          )}
          <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
        </div>
      </div>
    </div>
  );

  const renderReviewModal = () => (
    <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Review Contract</h3>
          <button className="close-btn" onClick={() => setShowReviewModal(false)}>×</button>
        </div>
        <div className="modal-body">
          {reviewingContract && (
            <div className="contract-details">
              <div className="detail-row">
                <strong>Contract Number:</strong> {reviewingContract.contractNumber}
              </div>
              <div className="detail-row">
                <strong>Client:</strong> {reviewingContract.client}
              </div>
              <div className="detail-row">
                <strong>Event Date:</strong> {reviewingContract.startDate}
              </div>
              <div className="detail-row">
                <strong>Price:</strong> ₱{reviewingContract.value}
              </div>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <div className="review-actions">
            <button className="btn-approve" onClick={() => handleApprove(reviewingContract?.id)}>Accept</button>
            <button
              className="btn-reject"
              onClick={() => {
                setShowReviewModal(false);
                setShowRejectModal(true);
              }}
            >
              Reject
            </button>
          </div>
          <button className="btn-secondary" onClick={() => setShowReviewModal(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );

  const renderRejectModal = () => (
    <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Reject Contract</h3>
          <button className="close-btn" onClick={() => setShowRejectModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Reason for Rejection</label>
            <textarea
              placeholder="Please provide a reason for rejecting this contract..."
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
            onClick={handleReject}
            disabled={!rejectReason.trim()}
          >
            Submit Rejection
          </button>
          <button className="btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );

  const renderRejectionReasonModal = () => (
    <div className="modal-overlay" onClick={() => setShowRejectionReasonModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rejection Reason</h3>
          <button className="close-btn" onClick={() => setShowRejectionReasonModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <p>{currentRejectionReason}</p>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setShowRejectionReasonModal(false)}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sales-manager-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Sales Manager Dashboard</h1>
          <button onClick={onLogout} className="logout-btn header-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="calendar-side">
          {renderCalendarView()}
        </div>

        <div className="contracts-side">
          {showCreateForm ? (
            <ContractForm onCancel={() => setShowCreateForm(false)} />
          ) : (
            renderContractsTable()
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedContract && renderDetailsModal()}
      {showReviewModal && renderReviewModal()}
      {showRejectModal && renderRejectModal()}
      {showRejectionReasonModal && renderRejectionReasonModal()}
      {showCalendarModal && renderCalendarEventModal()}

    </div>
  );
}

export default SalesManagerDashboard;
