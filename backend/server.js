// Import required dependencies
const express = require("express") // Web framework for Node.js
const mongoose = require("mongoose") // MongoDB object modeling tool
const bcrypt = require("bcryptjs") // Password hashing library
const cors = require("cors") // Cross-Origin Resource Sharing middleware
const Admin = require("./models/Admin") // Admin user model
const User = require("./models/User") // Regular user model
const Contract = require("./models/Contract") // Contract model
const Counter = require("./models/Counter") // Monthly counter for contract numbers

// Initialize Express application
const app = express()
const PORT = 5000 // Server port number

// Middleware configuration
app.use(cors()) // Enable CORS for all routes (allows frontend to connect)
app.use(express.json()) // Parse JSON request bodies

// MongoDB database connection
mongoose.connect("mongodb://localhost:27017/") // Connect to local MongoDB instance

// Database connection event handlers
const db = mongoose.connection
db.on("error", console.error.bind(console, "MongoDB connection error:")) // Log connection errors
db.once("open", () => console.log("MongoDB Connected")) // Log successful connection

// Seed default admin account (only runs if no admin exists)
;(async () => {
  const existing = await Admin.findOne({ username: "admin" }) // Check if admin already exists
  if (!existing) {
    const hashed = await bcrypt.hash("password123", 10) // Hash the default password
    await Admin.create({ username: "admin", password: hashed }) // Create default admin
    console.log("👤 Default admin created (username: admin, password: password123)")
  }
})()

// Seed default Creative Manager account (only runs if no Creative Manager exists)
;(async () => {
  const existing = await User.findOne({ username: "creativemanager" }) // Check if Creative Manager already exists
  if (!existing) {
    const hashed = await bcrypt.hash("password123", 10) // Hash the default password
    await User.create({ username: "creativemanager", fullName: "Creative Manager", password: hashed, email: "creativemanager@example.com", role: "Creative Manager", status: "approved" }) // Create default Creative Manager
    console.log("👤 Default Creative Manager created (username: creativemanager, password: password123)")
  }
})()

// ==================== API ROUTES ====================

// POST /login - User authentication endpoint
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body // Extract credentials from request

    // First check if user is an admin
    const admin = await Admin.findOne({ username })
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password) // Compare password with hash
      if (!isMatch) return res.status(400).json({ message: "Invalid password" })
      return res.json({ message: "Login successful", user: { username: admin.username, role: admin.role } })
    }

    // If not admin, check regular users (only approved ones can login)
    const user = await User.findOne({ username, status: "approved" })
    if (!user) return res.status(400).json({ message: "Invalid username or account not approved" })
      

    const isMatch = await bcrypt.compare(password, user.password) // Compare password with hash
    if (!isMatch) return res.status(400).json({ message: "Invalid password" })

    res.json({ message: "Login successful", user: { username: user.username, role: user.role } })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// POST /register - User registration endpoint
app.post("/register", async (req, res) => {
  try {
    const { username, fullName, password, email } = req.body // Extract user data from request

    // Check if username or email already exists in database
    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" })
    }

    // Hash the password for security (salt rounds: 10)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user with pending status (requires admin approval)
    const user = new User({
      username,
      fullName,
      password: hashedPassword,
      email,
      status: "pending", // New users start as pending
    })

    await user.save() // Save user to database
    res.json({ message: "Registration successful. Waiting for admin approval." })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// GET /admin/pending-users - Get all users waiting for approval (admin only)
app.get("/admin/pending-users", async (req, res) => {
  try {
    // Find all users with pending status, exclude password field for security
    const pendingUsers = await User.find({ status: "pending" }).select("-password")
    res.json(pendingUsers)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /admin/approve-user/:userId - Approve a pending user and assign department (admin only)
app.put("/admin/approve-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params // Extract user ID from URL
    const { role } = req.body // Extract department/role from request body

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Validate that role/department is provided
    if (!role) {
      return res.status(400).json({ message: "Role is required" })
    }

    // Find user by ID
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Prevent approving already approved users
    if (user.status === "approved") {
      return res.status(400).json({ message: "User is already approved" })
    }

    // Update user status to approved and assign role/department
    user.role = role
    user.status = "approved"
    await user.save() // Save changes to database

    res.json({
      message: "User approved successfully",
      user: { id: user._id, username: user.username, role: user.role },
    })
  } catch (error) {
    console.error("Approve user error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

// PUT /admin/reject-user/:userId - Reject and permanently delete a pending user (admin only)
app.put("/admin/reject-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params // Extract user ID from URL

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Find user by ID
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Only allow rejecting pending users (not already approved/rejected)
    if (user.status !== "pending") {
      return res.status(400).json({ message: "Only pending users can be rejected" })
    }

    // Permanently delete the user account from database
    await User.findByIdAndDelete(userId)

    res.json({ message: "User account rejected and removed successfully" })
  } catch (error) {
    console.error("Reject user error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

// PUT /admin/assign-role/:userId - Change department/role of an existing user (admin only)
app.put("/admin/assign-role/:userId", async (req, res) => {
  try {
    const { userId } = req.params // Extract user ID from URL
    const { role } = req.body // Extract new role/department from request body

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Validate that role/department is provided
    if (!role) {
      return res.status(400).json({ message: "Role is required" })
    }

    // Find user by ID
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user's role/department
    user.role = role
    await user.save() // Save changes to database

    res.json({
      message: "Role assigned successfully",
      user: { id: user._id, username: user.username, role: user.role },
    })
  } catch (error) {
    console.error("Assign role error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

// GET /admin/users - Get all users in the system (admin only)
app.get("/admin/users", async (req, res) => {
  try {
    // Find all users, exclude password field for security
    const users = await User.find().select("-password")
    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// DELETE /admin/delete-user/:userId - Permanently delete any user account (admin only)
app.delete("/admin/delete-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params // Extract user ID from URL

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Find user by ID
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Permanently delete user from database
    await User.findByIdAndDelete(userId)
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

// ==================== GOOGLE SHEETS HELPER ====================

const { fetchMonitoringData, getSheetsClient, SPREADSHEET_ID } = require("./googleSheetsHelper");


app.get("/monitoring", async (req, res) => {
  try {
    const data = await fetchMonitoringData();
    console.log("Fetched monitoring data:", data);
    res.json(data);
  } catch (err) {
    console.error("Error fetching monitoring data:", err);
    res.status(500).json({ error: "Failed to fetch monitoring data" });
  }
});

app.get("/inventory", async (req, res) => {
  try {
    const sections = await fetchMonitoringData();

    // Flatten your sheet rows into simple items list
    // Assuming each "section" looks like: header: [...], rows: [[date, item, qty, ...], ...]
    const items = sections.flatMap(section => 
      section.rows.map(row => ({
        itemName: row[0], 
        quantity: row[2], 
      }))
    );

    res.json(items);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ message: "Error retrieving inventory from Google Sheets" });
  }
});

// ==================== FABRICATION REQUEST ROUTES ====================

const FabricationRequest = require("./models/fabricationRequest");

// GET /fabrication-requests - fetch all requests
app.get("/fabrication-requests", async (req, res) => {
  try {
    const requests = await FabricationRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Error fetching fabrication requests:", error);
    res.status(500).json({ message: "Server error while fetching fabrication requests" });
  }
});

// POST /fabrication-requests - create new fabrication request
app.post("/fabrication-requests", async (req, res) => {
  try {
     const { username, item, quantity, remarks } = req.body;

    const newRequest = new FabricationRequest({
      username,
      item,
      quantity,
      remarks,
    });

    await newRequest.save();
    res.status(201).json({ message: "Fabrication request created successfully", request: newRequest });
  } catch (error) {
    console.error("Error creating fabrication request:", error);
    res.status(500).json({ message: "Server error while creating fabrication request" });
  }
});

app.get("/inventory-movement", async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'invty movement monitoring'!B:I", // fetch block
    });

    let rows = resp.data.values || [];

    // 🔹 Remove completely empty rows
    rows = rows.filter(row => row.some(cell => cell && cell.trim() !== ""));

    // 🔹 If first row is headers, skip it
    if (rows.length < 2) return res.json([]);

    const headers = [
      "Item Code",        // B
      "Item Description", // C
      "UOM",              // D
      "On-hand (Start)",  // F
      "Quantity",         // G
      "Damages",          // H
      "On-hand (End)",    // I
    ];

    const data = rows.slice(1).map((row) => ({
      "Item Code": row[0] || "",
      "Item Description": row[1] || "",
      "UOM": row[2] || "",
      "On-hand (Start)": row[4] || "",
      "Quantity": row[5] || "",
      "Damages": row[6] || "",
      "On-hand (End)": row[7] || "",
    }));

    res.json(data);
  } catch (error) {
    console.error("Error fetching inventory movement data:", error);
    res.status(500).json({ error: "Failed to fetch inventory movement data" });
  }
});

// ==================== CHECKLIST ROUTES ====================

// GET /inventory/checklist - Verify that inventory items have valid quantities before approval
app.get("/inventory/checklist", async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'invty movement monitoring'!B:I",
    });

    let rows = resp.data.values || [];
    rows = rows.filter(row => row.some(cell => cell && cell.trim() !== ""));

    if (rows.length < 2) {
      return res.status(400).json({ error: "No inventory data found" });
    }

    // Skip header row
    const data = rows.slice(1).map((row) => ({
      "Item Code": row[0],
      "Item Description": row[1],
      "UOM": row[2],
      "On-hand (Start)": parseFloat(row[4] || 0),
      "Quantity": parseFloat(row[5] || 0),
      "Damages": parseFloat(row[6] || 0),
      "On-hand (End)": parseFloat(row[7] || 0),
    }));

    // Validate checklist: ensure no negative end quantities, all required fields filled
    const issues = data.filter(
      item =>
        !item["Item Code"] ||
        item["On-hand (End)"] < 0 ||
        isNaN(item["On-hand (Start)"]) ||
        isNaN(item["Quantity"])
    );

    if (issues.length > 0) {
      return res.status(400).json({
        error: "Inventory checklist failed validation",
        issues,
      });
    }

    res.json({ message: "Inventory checklist passed", count: data.length });
  } catch (error) {
    console.error("Checklist validation error:", error);
    res.status(500).json({ error: "Failed to check inventory checklist" });
  }
});


const { google } = require("googleapis");
const fs = require("fs");

app.get("/stockroom-inventory", async (req, res) => {
  try {
    //Load credentials properly (recommended way)
    const credentials = JSON.parse(fs.readFileSync("credentials.json"));
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const SPREADSHEET_ID = "1C6wGegHlIRnubxcWnnQTskRj2UIHK7PuwI8IS42NG5M";

    //Fetch the full range (A:Z is fine if you have many columns)
    const range = "'CONSOLIDATED AUG'!D:F";

    // Fetch data from sheet
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    let rows = resp.data.values || [];
    if (rows.length < 2) return res.json([]);

    // Remove empty rows
    rows = rows.filter(row => row.some(cell => cell && cell.trim() !== ""));

    // First row should be headers, skip if they exist in sheet
    const data = rows.slice(1).map((row) => ({
      "ITEM DESCRIPTION": row[0] || "",
      "UNIT": row[2] || "",
    }));

    console.log(`Loaded ${data.length} rows from Stockroom inventory`);
    res.json(data);

  } catch (error) {
    console.error("Error fetching stockroom inventory data:", error);
    res.status(500).json({ error: "Failed to fetch stockroom inventory data" });
  }
});


// ==================== CONTRACT ROUTES ====================

// Helper to build the next contract number with monthly reset.
// Format: YYYY/MM/DD-XXXX where XXXX is 4-digit sequence reset monthly.
async function generateNextContractNumber(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const key = `${year}/${month}`

  // Atomically increment the counter for this month
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )

  const seq = String(counter.seq).padStart(4, "0")
  return `${year}${month}${day}-${seq}`
}

// GET /contracts/next-number - Preview the next contract number (no write besides counter)
app.get("/contracts/next-number", async (req, res) => {
  try {
    // Use a sessionless peek without increment? Requirement says increases unless deleted,
    // but we need stability. We'll increment only on creation, so here we simulate next
    // by reading current seq. If none, next is 0001.
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const key = `${year}/${month}`
    const doc = await Counter.findOne({ key })
    const nextSeq = String(((doc && doc.seq) || 0) + 1).padStart(4, "0")
    const day = String(now.getDate()).padStart(2, "0")
    res.json({ nextNumber: `${year}${month}${day}-${nextSeq}` })
  } catch (error) {
    console.error("Next number error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// POST /contracts - Create a new contract with auto-generated number
app.post("/contracts", async (req, res) => {
  try {
    const { department = "Sales", status = "Draft", page1 = {}, page2 = {}, pageBuffet = {}, page3 = {} } = req.body

    // If status is "For Approval", validate required fields
    if (status === "For Approval") {
      const tempContract = { page1, page2, pageBuffet, page3 };
      const validationErrors = validateContractForApproval(tempContract);
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: "Contract must be fully filled before sending for approval:\n\n" + validationErrors.join("\n") });
      }
    }

    const contractNumber = await generateNextContractNumber(new Date())

    const contract = await Contract.create({
      contractNumber,
      department,
      status,
      page1,
      page2,
      pageBuffet,
      page3,
    })

    res.json({ message: "Contract created", contract })
  } catch (error) {
    console.error("Create contract error:", error)
    if (error.code === 11000) {
      // Rare race: regenerate and retry once
      try {
        const contractNumber = await generateNextContractNumber(new Date())
        const { department = "Sales", status = "Draft", page1 = {}, page2 = {}, pageBuffet = {}, page3 = {} } = req.body
        // Re-validate if needed
        if (status === "For Approval") {
          const tempContract = { page1, page2, pageBuffet, page3 };
          const validationErrors = validateContractForApproval(tempContract);
          if (validationErrors.length > 0) {
            return res.status(400).json({ message: "Contract must be fully filled before sending for approval:\n\n" + validationErrors.join("\n") });
          }
        }
        const contract = await Contract.create({ contractNumber, department, status, page1, page2, pageBuffet, page3 })
        return res.json({ message: "Contract created", contract })
      } catch (err2) {
        console.error("Retry create contract error:", err2)
      }
    }
    res.status(500).json({ message: "Server error" })
  }
})

// GET /contracts/:id - Fetch full contract details
app.get("/contracts/:id", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid contract id" })
    }
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    res.json({ contract })
  } catch (error) {
    console.error("Get contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// GET /contracts - List contracts (basic, newest first)
app.get("/contracts", async (req, res) => {
  try {
    const contracts = await Contract.find({}).sort({ createdAt: -1 })
    res.json({ contracts })
  } catch (error) {
    console.error("List contracts error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /contracts/:id - Update a contract (allowed while Draft or Rejected)
app.put("/contracts/:id", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid contract id" })
    const { page1 = {}, page2 = {}, pageBuffet = {}, page3 = {}, status, rejectionReason } = req.body
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    if (!["Draft", "Rejected"].includes(contract.status)) return res.status(400).json({ message: "Only Draft or Rejected contracts can be edited" })

    // Update the fields
    contract.page1 = page1
    contract.page2 = page2
    contract.pageBuffet = pageBuffet
    contract.page3 = page3
    if (rejectionReason !== undefined) contract.rejectionReason = rejectionReason

    // If status is being set to "For Approval", validate required fields
    if (status === "For Approval") {
      const validationErrors = validateContractForApproval(contract);
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: "Contract must be fully filled before sending for approval:\n\n" + validationErrors.join("\n") });
      }
      contract.status = status
    } else if (status) {
      contract.status = status
    }

    await contract.save()
    res.json({ message: "Contract updated", contract })
  } catch (error) {
    console.error("Update contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /contracts/:id/approve - Approve a contract (Sales Manager only)
app.put("/contracts/:id/approve", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid contract id" })
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    if (contract.status !== "For Approval") return res.status(400).json({ message: "Only contracts with 'For Approval' status can be approved" })
    
    contract.status = "For Accounting Review"
    await contract.save()
    res.json({ message: "Contract approved and sent to Accounting", contract })
  } catch (error) {
    console.error("Approve contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/contracts/:id/reject", async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    console.log("Received reject request for ID:", id); // Debug log
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid ObjectId format for ID:", id); // Debug log
      return res.status(400).json({ message: "Invalid contract id" })
    }
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    console.log(`Reject request for contract ${id} with current status: '${contract.status}'`)  // Added quotes for debug
    if (contract.status.trim().toLowerCase() !== "for approval") return res.status(400).json({ message: "Only contracts with 'For Approval' status can be rejected" })

    contract.status = "Rejected"
    contract.rejectionReason = reason || ""
    await contract.save()
    res.json({ message: "Contract rejected and status set to Rejected", contract })
  } catch (error) {
    console.error("Reject contract error:", error)
    res.status(500).json({ message: "Server error: " + error.message })  // More detailed error message
  }
})

// PUT /contracts/:id/accounting-approve - Approve a contract (Accounting only)
app.put("/contracts/:id/accounting-approve", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid contract id" })
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    if (contract.status !== "For Accounting Review") return res.status(400).json({ message: "Only contracts with 'For Accounting Review' status can be approved by Accounting" })
    
    contract.status = "Active"
    await contract.save()
    res.json({ message: "Contract approved by Accounting and activated", contract })
  } catch (error) {
    console.error("Accounting approve contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /contracts/:id/accounting-reject - Reject a contract (Accounting only)
app.put("/contracts/:id/accounting-reject", async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid contract id" })
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    if (contract.status !== "For Accounting Review") return res.status(400).json({ message: "Only contracts with 'For Accounting Review' status can be rejected by Accounting" })

    contract.status = "For Approval"
    contract.rejectionReason = reason || ""
    await contract.save()
    res.json({ message: "Contract rejected by Accounting and returned to Sales Manager", contract })
  } catch (error) {
    console.error("Accounting reject contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Helper function to validate contract for approval (only required fields with asterisks)
const validateContractForApproval = (contract) => {
  const errors = [];
  const p1 = contract.page1 || {};
  const p2 = contract.page2 || {};
  const p3 = contract.page3 || {};

  // Required fields in page1
  const requiredP1Fields = [
    'celebratorName', 'representativeName', 'representativeRelationship', 'representativeEmail', 'representativeAddress', 'representativeMobile',
    'coordinatorName', 'coordinatorMobile', 'coordinatorEmail', 'coordinatorAddress', 'eventDate', 'occasion', 'serviceStyle', 'venue', 'hall', 'address',
    'arrivalOfGuests', 'ingressTime', 'cocktailTime', 'servingTime', 'totalVIP', 'totalRegular', 'totalGuests', 'themeSetup', 'colorMotif',
    'vipTableType', 'vipTableSeats', 'vipTableQuantity', 'regularTableType', 'regularTableSeats', 'regularTableQuantity',
    'vipUnderliner', 'vipNapkin', 'guestUnderliner', 'guestNapkin'
  ];
  requiredP1Fields.forEach(field => {
    if (!p1[field] || !p1[field].trim()) {
      errors.push(`Page 1 - ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
    }
  });

  // Email validations for required emails
  const validateEmail = (email) => {
    if (email.toUpperCase() === "N/A") return true;
    return email.includes("@gmail.com") || email.includes("@yahoo.com");
  };
  if (p1.representativeEmail && !validateEmail(p1.representativeEmail)) {
    errors.push("Page 1 - Representative email must end with @gmail.com or @yahoo.com");
  }
  if (p1.coordinatorEmail && !validateEmail(p1.coordinatorEmail)) {
    errors.push("Page 1 - Coordinator email must end with @gmail.com or @yahoo.com");
  }

  // Phone validations for required phones
  if (p1.representativeMobile && p1.representativeMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.representativeMobile)) {
    errors.push("Page 1 - Representative mobile must be 11 digits or N/A");
  }
  if (p1.coordinatorMobile && p1.coordinatorMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.coordinatorMobile)) {
    errors.push("Page 1 - Coordinator mobile must be 11 digits or N/A");
  }

  // Required fields in page2 (chairs)
  const requiredP2Fields = ['chairsMonoblock', 'chairsTiffany', 'chairsCrystal', 'chairsRustic', 'chairsKiddie', 'premiumChairs', 'totalChairs'];
  requiredP2Fields.forEach(field => {
    if (!p2[field] || !p2[field].trim()) {
      errors.push(`Page 2 - ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
    }
  });

  // Check chairs sum
  const sum = (parseInt(p2.chairsMonoblock) || 0) + (parseInt(p2.chairsTiffany) || 0) + (parseInt(p2.chairsCrystal) || 0) +
              (parseInt(p2.chairsRustic) || 0) + (parseInt(p2.chairsKiddie) || 0) + (parseInt(p2.premiumChairs) || 0);
  const total = parseInt(p2.totalChairs) || 0;
  if (sum !== total) {
    errors.push(`Page 2 - The total number of chairs entered (${sum}) must equal the Total Chairs (${total}).`);
  }

  // Check at least one knowUs
  const knowUsFields = ['knowUsWebsite', 'knowUsFacebook', 'knowUsInstagram', 'knowUsFlyers', 'knowUsBillboard', 'knowUsWordOfMouth',
                        'knowUsVenueReferral', 'knowUsRepeatClient', 'knowUsBridalFair', 'knowUsFoodTasting', 'knowUsCelebrityReferral', 'knowUsOthers'];
  const hasKnowUs = knowUsFields.some(field => p2[field]);
  if (!hasKnowUs) {
    errors.push("Page 2 - At least one 'How did you know our company' option must be selected");
  }

  // Required fields in page3
  const requiredP3Fields = ['pricePerPlate'];
  requiredP3Fields.forEach(field => {
    if (!p3[field] || !p3[field].trim()) {
      errors.push(`Page 3 - ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
    }
  });

  return errors;
};

// PUT /contracts/:id/send-for-approval - Send a contract for approval
app.put("/contracts/:id/send-for-approval", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid contract id" })
    }
    const contract = await Contract.findById(id)
    if (!contract) {
      return res.status(404).json({ message: "Not found" })
    }
    if (contract.status !== "Draft") {
      return res.status(400).json({ message: "Only Draft contracts can be sent for approval" })
    }

    // Validate that the contract is fully filled
    const validationErrors = validateContractFullyFilled(contract);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: "Contract must be fully filled before sending for approval:\n\n" + validationErrors.join("\n") });
    }

    contract.status = "For Approval"
    await contract.save()
    res.json({ message: "Contract sent for approval", contract })
  } catch (error) {
    console.error("Send for approval error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// ==================== PROFILE ROUTES ====================

// GET /profile/:username - Get user profile details
app.get("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params
    const user = await User.findOne({ username }).select("-password")
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json({ user })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /profile/:username - Update user profile details
app.put("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params
    const { mobile, landline, address } = req.body
    const user = await User.findOne({ username })
    if (!user) return res.status(404).json({ message: "User not found" })
    user.mobile = mobile || ""
    user.landline = landline || ""
    user.address = address || ""
    await user.save()
    res.json({ message: "Profile updated successfully", user: { username: user.username, fullName: user.fullName, email: user.email, mobile: user.mobile, landline: user.landline, address: user.address } })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /profile/:username/password - Change user password
app.put("/profile/:username/password", async (req, res) => {
  try {
    const { username } = req.params
    const { currentPassword, newPassword } = req.body
    const user = await User.findOne({ username })
    if (!user) return res.status(404).json({ message: "User not found" })

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" })

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()
    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// ==================== FINANCE ROUTES ====================

// --- Get Finance Overview (total income + breakdown) ---
app.get("/api/finance/overview/:filter", async (req, res) => {
  try {
    const { filter } = req.params;
    const now = new Date();
    let dateFilter = {};

    if (filter === "day") {
      const start = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { updatedAt: { $gte: start } };
    } else if (filter === "week") {
      const start = new Date();
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      dateFilter = { updatedAt: { $gte: start } };
    } else if (filter === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { updatedAt: { $gte: start } };
    } else if (filter === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      dateFilter = { updatedAt: { $gte: start } };
    }

    // Only count Paid finance records
    const paidRecords = await Finance.find({
      ...dateFilter,
      status: "Paid",
    }).populate("contractId", "page1.celebratorName page3.grandTotal");

    const total = paidRecords.reduce(
      (sum, r) => sum + (r.totalAmount || 0),
      0
    );

    const breakdown = paidRecords.map((r) => ({
      client: r.client,
      amount: r.totalAmount,
      date: r.date,
      contractId: r.contractId?._id,
    }));

    res.json({ total, breakdown });
  } catch (err) {
    console.error("Finance overview error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Get Active Contracts for Finance Client Page ---
app.get("/api/finance/clients", async (req, res) => {
  try {
    // Get only contracts approved by Accounting and not cancelled
    const activeContracts = await Contract.find({
      status: "Active",
    })
      .sort({ updatedAt: -1 })
      .select(
        "contractNumber page1.celebratorName page1.occasion page3.grandTotal status updatedAt"
      );

    res.json(activeContracts);
  } catch (err) {
    console.error("Finance clients error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Mark Contract as Paid ---
app.put("/api/finance/mark-paid/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ message: "Contract not found" });

    // Update contract to Paid
    contract.status = "Paid";
    await contract.save();

    // Create/Update finance record
    let finance = await Finance.findOne({ contractId: id });
    const totalAmount =
      Number(String(contract.page3?.grandTotal || "0").replace(/[^0-9.-]+/g, "")) || 0;

    if (finance) {
      finance.status = "Paid";
      finance.totalAmount = totalAmount;
      finance.date = new Date();
      await finance.save();
    } else {
      finance = await Finance.create({
        client: contract.page1?.celebratorName || "Unknown Client",
        contractId: contract._id,
        totalAmount,
        status: "Paid",
        items: [
          {
            name: contract.page1?.occasion || "Catering Service",
            qty: 1,
            price: totalAmount,
          },
        ],
        date: new Date(),
      });
    }

    res.json({ message: "Marked as paid successfully", contract, finance });
  } catch (err) {
    console.error("Finance mark paid error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ==================== ACCOUNTING ROUTES ====================
// PUT /contracts/:id/accounting-approve - Approve a contract (Accounting only)
// (Updated to create a Finance record when contract becomes Active)
app.put("/contracts/:id/accounting-approve", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid contract id" })
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    if (contract.status !== "For Accounting Review") return res.status(400).json({ message: "Only contracts with 'For Accounting Review' status can be approved by Accounting" })

    contract.status = "Active"
    await contract.save()

    // Create Finance record linked to this contract if not already existing
    try {
      const existing = await Finance.findOne({ contractId: contract._id })
      if (!existing) {
        const clientName = (contract.page1 && (contract.page1.celebratorName || contract.page1.representativeName)) || "Unknown Client"
        const grand = parseFloat(contract.page3?.grandTotal) || 0
        const paymentDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from approval
        await Finance.create({
          client: clientName,
          contractId: contract._id,
          totalAmount: grand,
          items: contract.page3?.items || [], // optional; if you have items stored, include
          status: "Unpaid",
          paymentDueDate,
        })
      }
    } catch (finErr) {
      console.error("Failed to create finance record after contract activation:", finErr)
      // don't fail the whole request — contract is approved regardless
    }

    res.json({ message: "Contract approved by Accounting and activated", contract })
  } catch (error) {
    console.error("Accounting approve contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// ==================== LOGISTICS ROUTES ====================

// --- Get all active contracts for Logistics (for Contracts tab) ---
app.get("/api/logistics/contracts", async (req, res) => {
  try {
    const contracts = await Contract.find({ status: "Active" });

    const formattedContracts = contracts.map((c) => ({
      _id: c._id,
      name:
        (c.page1 && (c.page1.contractName || c.page1.occasion)) ||
        "Untitled Contract",
      celebratorName: (c.page1 && c.page1.celebratorName) || "",
      contractNumber: c.contractNumber,
      page1: c.page1,
      page2: c.page2,
      page3: c.page3,
    }));

    res.json({ contracts: formattedContracts });
  } catch (err) {
    console.error("Error fetching logistics contracts:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// --- Generate calendar view of truck bookings (for Calendar tab) ---
app.get("/api/logistics/calendar", async (req, res) => {
  try {
    // Fetch all active contracts
    const contracts = await Contract.find({ status: "Active" });

    // Generate Google Calendar-style events based on event dates
    const events = contracts
      .filter((c) => c.page1?.eventDate)
      .map((c) => ({
        id: c._id,
        title:
          (c.page1?.occasion || c.page1?.contractName || "Catering Event") +
          " - " +
          (c.page1?.celebratorName || ""),
        start: c.page1?.eventDate,
        end: c.page1?.eventDate, // one-day event
        color: "#1a73e8", // Google blue
        description: `Venue: ${c.page1?.venue || "N/A"}\nAddress: ${
          c.page1?.address || "N/A"
        }\nTruck: ${c.page4?.truckAssigned || "Unassigned"}`,
      }));

    // use your own embedded Google Calendar URL
    const calendarEmbedURL =
      "https://calendar.google.com/calendar/embed?src=your_calendar_id%40group.calendar.google.com&ctz=Asia%2FManila";

    // Return both the embed and event data
    res.json({
      calendarEmbedURL,
      events,
    });
  } catch (err) {
    console.error("Error fetching logistics calendar:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// --- fetch single contract for modal view ---
app.get("/api/logistics/contracts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    res.json({ contract });
  } catch (err) {
    console.error("Error fetching contract details:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ====== Mock Data for Trucks & Drivers ======
let trucks = [
  { id: 1, name: "Truck 1 - Toyota HiAce", assignedDates: [] },
  { id: 2, name: "Truck 2 - Mitsubishi Canter", assignedDates: [] },
];

let drivers = [
  { id: 1, name: "Juan Dela Cruz", assignedDates: [] },
  { id: 2, name: "Maria Santos", assignedDates: [] },
];

// ====== Auto-Assign Available Truck & Driver ======
function assignTruckAndDriver(date) {
  const dateStr = new Date(date).toISOString().split("T")[0];

  const availableTruck = trucks.find(
    (t) => !t.assignedDates.includes(dateStr)
  );
  const availableDriver = drivers.find(
    (d) => !d.assignedDates.includes(dateStr)
  );

  if (availableTruck && availableDriver) {
    availableTruck.assignedDates.push(dateStr);
    availableDriver.assignedDates.push(dateStr);
    return { truck: availableTruck.name, driver: availableDriver.name };
  }

  return {
    truck: availableTruck ? availableTruck.name : "No Truck Available",
    driver: availableDriver ? availableDriver.name : "No Driver Available",
  };
}

// ====== Fetch Assigned Bookings ======
app.get("/api/logistics/bookings", async (req, res) => {
  try {
    const contracts = await Contract.find({ status: "Active" });

    const bookings = contracts
      .filter((c) => c.page1?.eventDate)
      .map((c) => {
        const assigned = assignTruckAndDriver(c.page1.eventDate);
        return {
          client: c.page1?.celebratorName || "Unknown",
          venue: c.page1?.venue || "N/A",
          date: c.page1?.eventDate,
          truck: assigned.truck,
          driver: assigned.driver,
        };
      });

    res.json({ bookings });
  } catch (err) {
    console.error("Error fetching truck/driver bookings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Get Best Route to Venue (for Leaflet Map) ---
const axios = require("axios");
 // make sure axios is imported at the top if not yet

app.get("/api/logistics/route", async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Missing destination coordinates" });
  }

  const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImYxMGRiZjg5MGNlMjRmYzQ5MDdhYTA5ZDQzNzY1NTY2IiwiaCI6Im11cm11cjY0In0=";

  // Starting point (e.g., your HQ or warehouse in Manila)
  const start = [120.9842, 14.5995]; // [lng, lat]
  const end = [parseFloat(lng), parseFloat(lat)];

  try {
    const routeRes = await axios.get(
      `https://api.openrouteservice.org/v2/directions/driving-car`,
      {
        params: {
          api_key: ORS_API_KEY,
          start: `${start[0]},${start[1]}`,
          end: `${end[0]},${end[1]}`,
        },
      }
    );

    const routeData = routeRes.data;

    res.json({
      route: routeData.features[0].geometry.coordinates,
      summary: routeData.features[0].properties.summary,
    });
  } catch (err) {
    console.error("Error fetching best route:", err.message);
    res.status(500).json({ message: "Failed to calculate best route" });
  }
});

// ==================== LINEN ROUTES ====================

// const express = require("express");
// const mongoose = require("mongoose");

// ---------- LINEN INVENTORY SCHEMA ----------
const LinenInventorySchema = new mongoose.Schema({
  item: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String, default: "pcs" },
});

const LinenInventory = mongoose.model("LinenInventory", LinenInventorySchema);

// ---------- LINEN CHECKLIST SCHEMA ----------
const LinenChecklistSchema = new mongoose.Schema({
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" },
  checklistItems: [
    {
      name: String,
      checked: Boolean,
    },
  ],
  dateSubmitted: { type: Date, default: Date.now },
});

const LinenChecklist = mongoose.model("LinenChecklist", LinenChecklistSchema);

// ---------- REQUEST FORM SCHEMA ----------
const LinenRequestSchema = new mongoose.Schema({
  item: String,
  quantity: Number,
  reason: String,
  status: { type: String, default: "Pending" }, // Pending, Approved, Denied
  dateRequested: { type: Date, default: Date.now },
});

const LinenRequest = mongoose.model("LinenRequest", LinenRequestSchema);



// ========== LINEN ROUTES ==========

// --- Get all inventory items ---
app.get("/api/linen/inventory", async (req, res) => {
  try {
    const inventory = await LinenInventory.find();
    res.json({ inventory });
  } catch (err) {
    console.error("Error fetching linen inventory:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Add a new inventory item ---
app.post("/api/linen/inventory", async (req, res) => {
  try {
    const { item, stock, unit } = req.body;
    const newItem = new LinenInventory({ item, stock, unit });
    await newItem.save();
    res.json({ message: "Item added successfully", newItem });
  } catch (err) {
    console.error("Error adding inventory item:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Update stock count ---
app.put("/api/linen/inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const updated = await LinenInventory.findByIdAndUpdate(
      id,
      { stock },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Stock updated", updated });
  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Submit checklist for a contract ---
app.post("/api/linen/checklist", async (req, res) => {
  try {
    const { contractId, checklistItems } = req.body;
    const checklist = new LinenChecklist({ contractId, checklistItems });
    await checklist.save();
    res.json({ message: "Checklist submitted", checklist });
  } catch (err) {
    console.error("Error saving checklist:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Get checklist by contract ---
app.get("/api/linen/checklist/:contractId", async (req, res) => {
  try {
    const { contractId } = req.params;
    const checklist = await LinenChecklist.findOne({ contractId });
    res.json({ checklist });
  } catch (err) {
    console.error("Error fetching checklist:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Submit linen request to purchasing ---
app.post("/api/linen/request", async (req, res) => {
  try {
    const { item, quantity, reason } = req.body;
    const request = new LinenRequest({ item, quantity, reason });
    await request.save();
    res.json({ message: "Request submitted successfully", request });
  } catch (err) {
    console.error("Error submitting request:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Get all requests ---
app.get("/api/linen/requests", async (req, res) => {
  try {
    const requests = await LinenRequest.find().sort({ dateRequested: -1 });
    res.json({ requests });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Start the server and listen on specified port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
