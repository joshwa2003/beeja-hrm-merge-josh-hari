const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job reference is required']
  },
  
  // Candidate Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  
  // Professional Information
  resume: {
    originalName: String,
    fileName: String,
    filePath: String,
    mimeType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years']
  },
  technicalSkills: [{
    type: String,
    trim: true
  }],
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  
  // Application Status
  status: {
    type: String,
    enum: [
      'Pending',
      'Reviewed', 
      'Accepted',
      'Rejected',
      'Interview Round 1',
      'Interview Round 2', 
      'Interview Round 3',
      'Selected',
      'Offer Sent',
      'Offer Accepted',
      'Offer Rejected',
      'Onboarded'
    ],
    default: 'Pending'
  },
  
  // Application Timeline
  appliedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Interview References
  interviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  }],
  
  // Feedback and Notes
  hrFeedback: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  internalNotes: {
    type: String,
    trim: true
  },
  
  // Offer Letter Reference
  offerLetter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OfferLetter'
  },
  
  // Source tracking
  applicationSource: {
    type: String,
    enum: ['Direct Application', 'Referral', 'Job Portal', 'Social Media', 'Other'],
    default: 'Direct Application'
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ email: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ appliedAt: -1 });
applicationSchema.index({ job: 1, appliedAt: -1 });

// Virtual for full name
applicationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for current interview round
applicationSchema.virtual('currentRound').get(function() {
  if (this.status.includes('Interview Round')) {
    const match = this.status.match(/Interview Round (\d+)/);
    return match ? parseInt(match[1]) : 1;
  }
  return 0;
});

// Method to move to next interview round
applicationSchema.methods.moveToNextRound = function() {
  const currentRound = this.currentRound;
  const nextRound = currentRound + 1;
  this.status = `Interview Round ${nextRound}`;
  return this.save();
};

// Method to accept application
applicationSchema.methods.accept = function(reviewedBy) {
  this.status = 'Accepted';
  this.reviewedAt = new Date();
  this.reviewedBy = reviewedBy;
  return this.save();
};

// Method to reject application
applicationSchema.methods.reject = function(reviewedBy, reason) {
  this.status = 'Rejected';
  this.reviewedAt = new Date();
  this.reviewedBy = reviewedBy;
  this.rejectionReason = reason;
  return this.save();
};

// Method to select candidate
applicationSchema.methods.select = function() {
  this.status = 'Selected';
  return this.save();
};

// Method to send offer
applicationSchema.methods.sendOffer = function() {
  this.status = 'Offer Sent';
  return this.save();
};

// Method to handle offer response
applicationSchema.methods.handleOfferResponse = function(accepted) {
  this.status = accepted ? 'Offer Accepted' : 'Offer Rejected';
  return this.save();
};

// Method to mark as onboarded
applicationSchema.methods.onboard = function() {
  this.status = 'Onboarded';
  return this.save();
};

// Static method to get applications by job
applicationSchema.statics.getByJob = function(jobId, status = null) {
  const query = { job: jobId, isActive: true };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('job', 'title code department')
    .populate('reviewedBy', 'firstName lastName')
    .populate('interviews')
    .sort({ appliedAt: -1 });
};

// Static method to get applications by status
applicationSchema.statics.getByStatus = function(status) {
  return this.find({ status, isActive: true })
    .populate('job', 'title code department')
    .populate('reviewedBy', 'firstName lastName')
    .sort({ appliedAt: -1 });
};

// Static method to check if email already applied for job
applicationSchema.statics.hasApplied = function(email, jobId) {
  return this.findOne({ 
    email: email.toLowerCase(), 
    job: jobId, 
    isActive: true 
  });
};

// Transform output
applicationSchema.methods.toJSON = function() {
  const applicationObject = this.toObject();
  return applicationObject;
};

module.exports = mongoose.model('Application', applicationSchema);
