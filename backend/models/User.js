const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[0-9]{10}$/
  },

  // ✅ NEW: Username + Password Hash (for password login)
  username: {
  type: String,
  required: false,
  unique: true,
  sparse: true,
  trim: true,
  lowercase: true,
  minlength: 3,
  maxlength: 30,
},
  passwordHash: {
  type: String,
  required: false,
  select: false,
},


  fullName: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: 'India'
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ✅ ensure uniqueness (extra safety)



module.exports = mongoose.model('User', userSchema);
