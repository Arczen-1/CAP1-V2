const mongoose = require("mongoose");

const FinanceSchema = new mongoose.Schema({
  client: String,
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", default: null },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null }, // optional link
  totalAmount: { type: Number, default: 0 },
  items: [
    {
      name: String,
      qty: Number,
      price: Number,
    },
  ],
  status: { type: String, default: "Unpaid" }, // Paid, Unpaid, Cancelled
  paymentDueDate: { type: Date, default: null }, // set when created after approval
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Finance", FinanceSchema);
