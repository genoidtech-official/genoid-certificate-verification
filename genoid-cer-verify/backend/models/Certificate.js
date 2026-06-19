/**
 * Certificate Model - Genoid Tech
 * Stores all certificate data in MongoDB
 */

const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  // Manual Certificate ID - any format accepted
  certificateId: {
    type: String,
    required: [true, 'Certificate ID is required'],
    unique: true,
    trim: true,
    uppercase: false, // preserve exact casing
  },

  // Candidate / Holder Info
  candidateName: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true,
  },

  // Program details (all optional — fill what applies)
  courseName:      { type: String, trim: true, default: '' },
  internshipName:  { type: String, trim: true, default: '' },
  workshopName:    { type: String, trim: true, default: '' },
  eventName:       { type: String, trim: true, default: '' },
  duration:        { type: String, trim: true, default: '' },  // e.g. "30 Days", "2 Months"

  // Issue details
  dateOfIssue: {
    type: Date,
    required: [true, 'Date of issue is required'],
  },
  issuedBy: {
    type: String,
    trim: true,
    default: 'Genoid Tech',
  },

  // Signatory
  signatoryName:   { type: String, trim: true, default: '' },
  signatoryDesig:  { type: String, trim: true, default: '' },

  // Status
  isActive: {
    type: Boolean,
    default: true,
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt on save
CertificateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Certificate', CertificateSchema);
