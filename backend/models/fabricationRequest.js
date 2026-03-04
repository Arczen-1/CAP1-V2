// models/FabricationRequest.js
const mongoose = require("mongoose");

const fabricationRequestSchema = new mongoose.Schema({
  username: { type: String, required: true },
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  remarks: { type: String },
  date: { type: Date, default: Date.now },
  status: { type: String, default: "Pending" },
});

module.exports = mongoose.model("fabricationRequest", fabricationRequestSchema);
