const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: [true, 'Application reference is required']
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job reference is required']
  },
  
  // Interview Details
  round: {
    type: Number,
    required: [true, 'Interview round is required'],
    min: [1, 'Round must be at least 1']
  },
  title: {
    type: String,
    required: [true, 'Interview title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Scheduling Information
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  type: {
    type: String,
    enum: ['Online', 'Offline'],
    required: [true, 'Interview type is required']
  },
  location: {
    type: String,
    trim: true
  },
  meetingLink: {
    type: String,
    trim: true
  },
  
  // Interviewer Information
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Interviewer is required']
  },
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Scheduled by is required']
  },
  
  // Interview Status
  status: {
    type: String,
    enum: [
      'Scheduled',
      'Confirmed',
      'In Progress',
      'Completed',
      'Cancelled',
      'Rescheduled',
      'No Show'
    ],
    default: 'Scheduled'
  },
  
  // Feedback Information
  feedback: {
    // Technical Assessment
    technicalRating: {
      type: Number,
      min: 1,
      max: 10
    },
    technicalComments: {
      type: String,
      trim: true
    },
    
    // Communication Skills
    communicationRating: {
      type: Number,
      min: 1,
      max: 10
    },
    communicationComments: {
      type: String,
      trim: true
    },
    
    // Problem Solving
    problemSolvingRating: {
      type: Number,
      min: 1,
      max: 10
    },
    problemSolvingComments: {
      type: String,
      trim: true
    },
    
    // Cultural Fit
    culturalFitRating: {
      type: Number,
      min: 1,
      max: 10
    },
    culturalFitComments: {
      type: String,
      trim: true
    },
    
    // Overall Assessment
    overallRating: {
      type: Number,
      min: 1,
      max: 10
    },
    overallComments: {
      type: String,
      trim: true
    },
    
    // Recommendation
    recommendation: {
      type: String,
      enum: ['Strongly Recommend', 'Recommend', 'Maybe', 'Do Not Recommend', 'Strongly Do Not Recommend']
    },
    
    // Strengths and Weaknesses
    strengths: [{
      type: String,
      trim: true
    }],
    weaknesses: [{
      type: String,
      trim: true
    }],
    
    // Additional Notes
    additionalNotes: {
      type: String,
      trim: true
    },
    
    // Feedback submission info
    submittedAt: Date,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Candidate Information (for quick access)
  candidateInfo: {
    name: String,
    email: String,
    phone: String
  },
  
  // Rescheduling Information
  rescheduleHistory: [{
    originalDate: Date,
    newDate: Date,
    reason: String,
    rescheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rescheduledAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Cancellation Information
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  
  // Email tracking
  emailsSent: [{
    type: {
      type: String,
      enum: ['Interview Scheduled', 'Interview Reminder', 'Interview Cancelled', 'Interview Rescheduled']
    },
    sentTo: String, // email address
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Sent', 'Failed'],
      default: 'Sent'
    }
  }],
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
interviewSchema.index({ interviewer: 1, scheduledDate: 1 });
interviewSchema.index({ application: 1 });
interviewSchema.index({ job: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ scheduledDate: 1 });
interviewSchema.index({ interviewer: 1, status: 1 });

// Virtual for interview duration in hours
interviewSchema.virtual('durationInHours').get(function() {
  return this.duration / 60;
});

// Virtual for feedback completion status
interviewSchema.virtual('isFeedbackComplete').get(function() {
  return !!(this.feedback && 
           this.feedback.overallRating && 
           this.feedback.recommendation && 
           this.feedback.submittedAt);
});

// Virtual for average rating
interviewSchema.virtual('averageRating').get(function() {
  if (!this.feedback) return 0;
  
  const ratings = [
    this.feedback.technicalRating,
    this.feedback.communicationRating,
    this.feedback.problemSolvingRating,
    this.feedback.culturalFitRating
  ].filter(rating => rating && rating > 0);
  
  if (ratings.length === 0) return 0;
  
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Method to confirm interview
interviewSchema.methods.confirm = function() {
  this.status = 'Confirmed';
  return this.save();
};

// Method to start interview
interviewSchema.methods.start = function() {
  this.status = 'In Progress';
  return this.save();
};

// Method to complete interview
interviewSchema.methods.complete = function() {
  this.status = 'Completed';
  return this.save();
};

// Method to cancel interview
interviewSchema.methods.cancel = function(reason, cancelledBy) {
  this.status = 'Cancelled';
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;
  this.cancelledAt = new Date();
  return this.save();
};

// Method to reschedule interview
interviewSchema.methods.reschedule = function(newDate, reason, rescheduledBy) {
  // Add to reschedule history
  this.rescheduleHistory.push({
    originalDate: this.scheduledDate,
    newDate: newDate,
    reason: reason,
    rescheduledBy: rescheduledBy
  });
  
  // Update scheduled date and status
  this.scheduledDate = newDate;
  this.status = 'Rescheduled';
  
  return this.save();
};

// Method to submit feedback
interviewSchema.methods.submitFeedback = function(feedbackData, submittedBy) {
  this.feedback = {
    ...feedbackData,
    submittedAt: new Date(),
    submittedBy: submittedBy
  };
  
  // Mark interview as completed if not already
  if (this.status !== 'Completed') {
    this.status = 'Completed';
  }
  
  return this.save();
};

// Method to mark as no show
interviewSchema.methods.markNoShow = function() {
  this.status = 'No Show';
  return this.save();
};

// Method to track email sent
interviewSchema.methods.trackEmailSent = function(emailType, sentTo, status = 'Sent') {
  this.emailsSent.push({
    type: emailType,
    sentTo: sentTo,
    status: status
  });
  return this.save();
};

// Static method to get interviews by interviewer
interviewSchema.statics.getByInterviewer = function(interviewerId, status = null) {
  const query = { interviewer: interviewerId, isActive: true };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('application', 'firstName lastName email phoneNumber status')
    .populate('job', 'title code department')
    .populate('scheduledBy', 'firstName lastName')
    .sort({ scheduledDate: 1 });
};

// Static method to get upcoming interviews
interviewSchema.statics.getUpcoming = function(interviewerId = null) {
  const query = {
    scheduledDate: { $gte: new Date() },
    status: { $in: ['Scheduled', 'Confirmed'] },
    isActive: true
  };
  
  if (interviewerId) {
    query.interviewer = interviewerId;
  }
  
  return this.find(query)
    .populate('application', 'firstName lastName email phoneNumber')
    .populate('job', 'title code')
    .populate('interviewer', 'firstName lastName email')
    .sort({ scheduledDate: 1 });
};

// Static method to get interviews requiring feedback
interviewSchema.statics.getPendingFeedback = function(interviewerId = null) {
  const query = {
    status: 'Completed',
    'feedback.submittedAt': { $exists: false },
    isActive: true
  };
  
  if (interviewerId) {
    query.interviewer = interviewerId;
  }
  
  return this.find(query)
    .populate('application', 'firstName lastName email phoneNumber')
    .populate('job', 'title code')
    .populate('interviewer', 'firstName lastName')
    .sort({ scheduledDate: -1 });
};

// Transform output
interviewSchema.methods.toJSON = function() {
  const interviewObject = this.toObject();
  return interviewObject;
};

module.exports = mongoose.model('Interview', interviewSchema);
