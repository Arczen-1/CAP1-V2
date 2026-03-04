"use client" // Next.js directive for client-side component

// Import React hooks and CSS styles
import { useState, useEffect } from "react"
import "./AdminDashboard.css"

/**
 * AdminDashboard Component
 * Main dashboard for administrators to manage contracts and users
 * Features: Contract overview, user approval/rejection, role management
 */
function AdminDashboard({ onLogout }) {
  // ==================== STATE MANAGEMENT ====================
  
  // User data states
  const [pendingUsers, setPendingUsers] = useState([]) // Users waiting for approval
  const [allUsers, setAllUsers] = useState([]) // All users in the system
  const [selectedRole, setSelectedRole] = useState("") // Currently selected department/role
  
  // UI state management
  const [message, setMessage] = useState("") // Success/error messages
  const [activeView, setActiveView] = useState("dashboard") // Current view: "dashboard" or "userManagement"
  const [userManagementTab, setUserManagementTab] = useState("pending") // Tab: "pending" or "all"
  const [editingUser, setEditingUser] = useState(null) // User being edited/approved
  const [departmentFilter, setDepartmentFilter] = useState("all") // Filter for user departments

  // Available departments/roles in the system
  // NOTE: Ensure "Fabrication" is present here so admins can assign it when approving users
  const roles = [
    "Sales",
    "Sales Manager",
    "Accounting",
    "Warehouse",
    "Creative",
    "Creative Manager",
    "Linen",
    "Logistics",
    "Kitchen",
    "Stockroom",
    "Purchasing",
    "Banquet Staff",
    "Fabrication", // Added/ensured Fabrication role is selectable
    "Admin",
  ]

  // ==================== LIFECYCLE HOOKS ====================
  
  // Load user data when component mounts
  useEffect(() => {
    fetchPendingUsers() // Load users waiting for approval
    fetchAllUsers() // Load all users in system
  }, [])

  // ==================== API FUNCTIONS ====================

  /**
   * Fetch users waiting for admin approval
   * Updates pendingUsers state with users having status: "pending"
   */
  const fetchPendingUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/pending-users")
      if (res.ok) {
        const data = await res.json()
        setPendingUsers(data) // Update pending users state
      } else {
        console.error("Failed to fetch pending users:", res.status)
        setMessage("Error: Failed to load pending users")
      }
    } catch (err) {
      console.error("Fetch pending users error:", err)
      setMessage("Error: Unable to connect to server")
    }
  }

  /**
   * Fetch all users in the system
   * Updates allUsers state with complete user list
   */
  const fetchAllUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/users")
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data) // Update all users state
      } else {
        console.error("Failed to fetch all users:", res.status)
        setMessage("Error: Failed to load users")
      }
    } catch (err) {
      console.error("Fetch all users error:", err)
      setMessage("Error: Unable to connect to server")
    }
  }

  /**
   * Approve a pending user and assign them to a department
   * Changes user status from "pending" to "approved" and assigns role
   * @param {string} userId - MongoDB ObjectId of the user
   * @param {string} role - Department/role to assign to the user
   */
  const approveUser = async (userId, role) => {
    // Input validation
    if (!userId) {
      setMessage("Error: User ID is missing")
      return
    }

    if (!role) {
      setMessage("Error: Please select a department/role")
      return
    }

    try {
      // Send approval request to backend
      const res = await fetch(`http://localhost:5000/admin/approve-user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }), // Send department/role to assign
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Success: ${data.message}`)
        fetchPendingUsers() // Refresh pending users list
        fetchAllUsers() // Refresh all users list
        setEditingUser(null) // Close modal
        setSelectedRole("") // Reset role selection

        // Auto-clear success message after 3 seconds
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Approve user error:", err)
      setMessage("Error: Unable to connect to server. Please check if the server is running.")
    }
  }

  /**
   * Reject a pending user and permanently delete their account
   * Removes user from database completely (no soft delete)
   * @param {string} userId - MongoDB ObjectId of the user to reject
   */
  const rejectUser = async (userId) => {
    // Input validation
    if (!userId) {
      setMessage("Error: User ID is missing")
      return
    }

    // Confirmation dialog - this action is irreversible
    if (!window.confirm("Are you sure you want to reject this user? This will permanently delete their account.")) {
      return
    }

    try {
      // Send rejection request to backend
      const res = await fetch(`http://localhost:5000/admin/reject-user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Empty body - backend handles deletion
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Success: ${data.message}`)
        fetchPendingUsers() // Refresh pending users list
        fetchAllUsers() // Refresh all users list

        // Auto-clear success message after 3 seconds
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Reject user error:", err)
      setMessage("Error: Unable to connect to server. Please check if the server is running.")
    }
  }

  /**
   * Change the department/role of an existing approved user
   * Used for editing user roles in the "All Users" tab
   * @param {string} userId - MongoDB ObjectId of the user
   * @param {string} role - New department/role to assign
   */
  const assignRole = async (userId, role) => {
    // Input validation
    if (!userId) {
      setMessage("Error: User ID is missing")
      return
    }

    if (!role) {
      setMessage("Error: Please select a department/role")
      return
    }

    try {
      // Send role change request to backend
      const res = await fetch(`http://localhost:5000/admin/assign-role/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }), // Send new role/department
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Success: ${data.message}`)
        fetchPendingUsers() // Refresh data
        fetchAllUsers() // Refresh data
        setEditingUser(null) // Close modal

        // Auto-clear success message after 3 seconds
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Assign role error:", err)
      setMessage("Error: Unable to connect to server. Please check if the server is running.")
    }
  }

  /**
   * Permanently delete any user account (admin only)
   * Used for removing users from the "All Users" tab
   * @param {string} userId - MongoDB ObjectId of the user to delete
   */
  const deleteUser = async (userId) => {
    // Input validation
    if (!userId) {
      setMessage("Error: User ID is missing")
      return
    }

    // Confirmation dialog - this action is irreversible
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      // Send deletion request to backend
      const res = await fetch(`http://localhost:5000/admin/delete-user/${userId}`, {
        method: "DELETE", // DELETE HTTP method
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Success: ${data.message}`)
        fetchPendingUsers() // Refresh data
        fetchAllUsers() // Refresh data

        // Auto-clear success message after 3 seconds
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Delete user error:", err)
      setMessage("Error: Unable to connect to server. Please check if the server is running.")
    }
  }

  // ==================== RENDER FUNCTIONS ====================

  /**
   * Render a single user row in the users table
   * Shows different action buttons based on user status (pending vs approved)
   * @param {Object} user - User object with all user data
   * @param {boolean} isPending - Whether this user is pending approval
   * @returns {JSX.Element} Table row with user data and action buttons
   */
  const renderUserRow = (user, isPending = false) => (
    <tr key={user._id} className="user-row">
      <td>{user.fullName}</td> {/* Display user's full name */}
      <td>{user.username}</td> {/* Display username */}
      <td>{user.email}</td> {/* Display email address */}
      <td>
        <span className={`status ${user.status}`}>{user.status}</span> {/* Status badge with color coding */}
      </td>
      <td>{user.role || "Not assigned"}</td> {/* Department/role or "Not assigned" */}
      <td>{new Date(user.createdAt).toLocaleDateString()}</td> {/* Registration date */}
      <td>
        <div className="user-actions">
          {isPending ? (
            // Action buttons for pending users
            <>
              <button className="approve-btn" onClick={() => setEditingUser({ ...user, action: "approve" })}>
                Approve {/* Opens modal to select department */}
              </button>
              <button className="reject-btn" onClick={() => rejectUser(user._id)}>
                Reject {/* Immediately deletes user account */}
              </button>
            </>
          ) : (
            // Action buttons for approved users
            <>
              <button className="edit-btn" onClick={() => setEditingUser({ ...user, action: "edit" })}>
                Edit {/* Opens modal to change department */}
              </button>
              <button className="delete-btn" onClick={() => deleteUser(user._id)}>
                Delete {/* Permanently removes user */}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )

  const renderEditModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <h3>
          {editingUser.action === "approve" ? "Approve User:" : "Edit User:"} {editingUser.fullName}
        </h3>
        <div className="user-details">
          <p>
            <strong>Username:</strong> {editingUser.username}
          </p>
          <p>
            <strong>Email:</strong> {editingUser.email}
          </p>
          <p>
            <strong>Status:</strong> {editingUser.status}
          </p>
        </div>

        <div className="role-selection">
          <label>Assign Department:</label>
          <select
            value={selectedRole || editingUser.role || ""}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="role-select"
          >
            <option value="">Select Department</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-actions">
          {editingUser.action === "approve" ? (
            <button
              onClick={() => {
                const roleToAssign = selectedRole || editingUser.role
                if (!roleToAssign) {
                  setMessage("Error: Please select a department before approving")
                  return
                }
                approveUser(editingUser._id, roleToAssign)
              }}
              className="approve-btn-modal"
              disabled={!selectedRole && !editingUser.role}
            >
              Approve User
            </button>
          ) : (
            <button
              onClick={() => {
                const roleToAssign = selectedRole || editingUser.role
                if (!roleToAssign) {
                  setMessage("Error: Please select a department")
                  return
                }
                assignRole(editingUser._id, roleToAssign)
              }}
              className="save-btn"
              disabled={!selectedRole && !editingUser.role}
            >
              Save Changes
            </button>
          )}
          <button
            onClick={() => {
              setEditingUser(null)
              setSelectedRole("")
            }}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )

  const renderMainDashboard = () => (
    <div className="main-dashboard">
      <h2>Contract Status Dashboard</h2>

      <div className="contracts-table-container">
        <div className="table-header">
          <h3>All Contracts</h3>
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
  )

  const renderUserManagement = () => (
    <div className="user-management">
      <div className="management-tabs">
        <button
          className={`tab ${userManagementTab === "pending" ? "active" : ""}`}
          onClick={() => setUserManagementTab("pending")}
        >
          Pending Approvals ({pendingUsers.length})
        </button>
        <button
          className={`tab ${userManagementTab === "all" ? "active" : ""}`}
          onClick={() => setUserManagementTab("all")}
        >
          All Users ({allUsers.filter((user) => user.status === "approved").length})
        </button>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="users-table-container">
        <div className="table-header">
          <h3>{userManagementTab === "pending" ? "Pending User Approvals" : "All Users"}</h3>
          {userManagementTab === "all" && (
            <div className="filter-section">
              <label>Filter by Department:</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Departments</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th>Department</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userManagementTab === "pending" ? (
                pendingUsers.length === 0 ? (
                  <tr className="no-users">
                    <td colSpan="7">No pending users</td>
                  </tr>
                ) : (
                  pendingUsers.map((user) => renderUserRow(user, true))
                )
              ) : (
                (() => {
                  const filteredUsers =
                    departmentFilter === "all"
                      ? allUsers.filter((user) => user.status === "approved")
                      : allUsers.filter((user) => user.status === "approved" && user.role === departmentFilter)

                  return filteredUsers.length === 0 ? (
                    <tr className="no-users">
                      <td colSpan="7">No users found</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => renderUserRow(user, false))
                  )
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // ==================== MAIN COMPONENT RENDER ====================

  return (
    <div className="admin-dashboard">
      {/* Header section with centered inner wrapper to align with content width */}
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          {/* Left: Title */}
          <h1>Admin Dashboard</h1>
          {/* Center: Navigation between Contract Dashboard and User Management */}
          <div className="header-nav">
            <button
              className={`nav-btn ${activeView === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveView("dashboard")}
            >
              {/* Renamed to match requested label */}
              Contracts
            </button>
            <button
              className={`nav-btn ${activeView === "userManagement" ? "active" : ""}`}
              onClick={() => setActiveView("userManagement")}
            >
              {/* Keep label; style will reflect active route */}
              User Management
            </button>
          </div>
          {/* Right: Logout */}
          <button onClick={onLogout} className="logout-btn header-logout">
            Logout
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="dashboard-content">
        {/* Conditional rendering based on active view */}
        {activeView === "dashboard" ? renderMainDashboard() : renderUserManagement()}
      </div>

      {/* Modal overlay for user editing/approval */}
      {editingUser && renderEditModal()}
    </div>
  )
}

export default AdminDashboard
