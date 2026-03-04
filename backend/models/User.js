const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, default: "" },
  landline: { type: String, default: "" },
  address: { type: String, default: "" },
  role: {
    type: String,
    enum: ['Sales', 'Sales Manager', 'Accounting', 'Warehouse', 'Creative', 'Creative Manager', 'Linen', 'Logistics', 'Kitchen', 'Stockroom', 'Purchasing', 'Banquet Staff', 'Admin'],
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
