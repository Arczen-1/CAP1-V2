const mongoose = require("mongoose")

// Counter keyed by year and month, used to generate monthly-reset sequence numbers.
// key format: YYYY/MM (e.g., 2025/09)
const CounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Counter", CounterSchema)


