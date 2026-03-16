const mongoose = require('mongoose');

const menuTastingSchema = new mongoose.Schema({
  // Booking Reference (auto-generated)
  tastingNumber: {
    type: String,
    unique: true
  },
  
  // Client Information (with validation)
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  clientEmail: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  clientPhone: {
    type: String,
    required: [true, 'Phone number is required'],
    minlength: [7, 'Phone number must be at least 7 characters'],
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  clientAddress: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      match: [/^\d{4,6}$/, 'Please enter a valid ZIP code']
    }
  },
  
  // Event Information
  eventType: {
    type: String,
    enum: ['wedding', 'corporate', 'birthday', 'debut', 'anniversary', 'other'],
    required: [true, 'Event type is required']
  },
  expectedGuests: {
    type: Number,
    required: [true, 'Expected number of guests is required'],
    min: [1, 'Must have at least 1 guest'],
    max: [5000, 'Cannot exceed 5000 guests']
  },
  preferredEventDate: {
    type: Date,
    required: [true, 'Preferred event date is required']
  },
  
  // Tasting Booking Details
  tastingDate: {
    type: Date,
    required: [true, 'Tasting date is required']
  },
  tastingTime: {
    type: String,
    enum: ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'],
    required: [true, 'Tasting time is required']
  },
  numberOfPax: {
    type: Number,
    required: [true, 'Number of tasting pax is required'],
    min: [1, 'Minimum 1 person'],
    max: [10, 'Maximum 10 people for tasting']
  },
  
  // Menu Items for Tasting
  menuItems: [{
    category: {
      type: String,
      enum: ['Appetizer', 'Soup', 'Salad', 'Main Course', 'Dessert', 'Beverage']
    },
    itemName: String,
    selected: {
      type: Boolean,
      default: false
    },
    notes: String
  }],
  
  // Status
  status: {
    type: String,
    enum: ['booked', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'booked'
  },
  
  // Contract Link
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    default: null
  },
  contractCreated: {
    type: Boolean,
    default: false
  },
  
  // Staff Assignment
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notes
  clientNotes: String,
  internalNotes: String,
  
  // Feedback after tasting
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    itemsLiked: [String],
    itemsToChange: [String]
  }
}, {
  timestamps: true
});

// Generate tasting number before saving
menuTastingSchema.pre('save', async function() {
  if (!this.tastingNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await mongoose.model('MenuTasting').countDocuments();
    this.tastingNumber = `TASTE-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('MenuTasting', menuTastingSchema);
