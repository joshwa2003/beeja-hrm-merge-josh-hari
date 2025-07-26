const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const InterviewFeedback = require('../models/InterviewFeedback');
const Offer = require('../models/Offer');
const User = require('../models/User');
const Department = require('../models/Department');
const Team = require('../models/Team');
const path = require('path');
const fs = require('fs').promises;

// ==================== JOB MANAGEMENT ====================

// Get all jobs
exports.getJobs = async (req, res) => {
  try {
    const { status, department, search, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const jobs = await Job.find(query)
      .populate('department', 'name')
      .populate('team', 'name')
      .populate('hiringManager', 'firstName lastName email')
      .populate('recruiter', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Job.countDocuments(query);
    
    res.json({
      success: true,
      data: jobs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};

// Get single job
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('department', 'name')
      .populate('team', 'name')
      .populate('hiringManager', 'firstName lastName email designation')
      .populate('recruiter', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message
    });
  }
};

// Create new job
exports.createJob = async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const job = new Job(jobData);
    await job.save();
    
    await job.populate([
      { path: 'department', select: 'name' },
      { path: 'team', select: 'name' },
      { path: 'hiringManager', select: 'firstName lastName email' },
      { path: 'recruiter', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating job',
      error: error.message
    });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    Object.assign(job, req.body);
    job.updatedBy = req.user.id;
    await job.save();
    
    await job.populate([
      { path: 'department', select: 'name' },
      { path: 'team', select: 'name' },
      { path: 'hiringManager', select: 'firstName lastName email' },
      { path: 'recruiter', select: 'firstName lastName email' }
    ]);
    
    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating job',
      error: error.message
    });
  }
};

// Publish job
exports.publishJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    await job.publish(req.user.id);
    
    res.json({
      success: true,
      message: 'Job published successfully',
      data: job
    });
  } catch (error) {
    console.error('Error publishing job:', error);
    res.status(400).json({
      success: false,
      message: 'Error publishing job',
      error: error.message
    });
  }
};

// Close job
exports.closeJob = async (req, res) => {
  try {
    const { reason } = req.body;
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    await job.close(req.user.id, reason);
    
    res.json({
      success: true,
      message: 'Job closed successfully',
      data: job
    });
  } catch (error) {
    console.error('Error closing job:', error);
    res.status(400).json({
      success: false,
      message: 'Error closing job',
      error: error.message
    });
  }
};

// Get public job details (for application form)
exports.getPublicJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('department', 'name')
      .populate('team', 'name')
      .select('-createdBy -updatedBy -hiringManager -recruiter');
    
    if (!job || job.status !== 'Active') {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not available'
      });
    }
    
    // Check if job is still open
    if (job.closingDate && new Date() > job.closingDate) {
      return res.status(410).json({
        success: false,
        message: 'Job application deadline has passed'
      });
    }
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching public job:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job details',
      error: error.message
    });
  }
};

// ==================== APPLICATION MANAGEMENT ====================

// Submit job application (public endpoint)
exports.submitApplication = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'Active') {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not available'
      });
    }
    
    // Check if application deadline has passed
    if (job.closingDate && new Date() > job.closingDate) {
      return res.status(410).json({
        success: false,
        message: 'Job application deadline has passed'
      });
    }
    
    // Check for duplicate application
    const existingApplication = await Application.findOne({
      job: jobId,
      email: req.body.email.toLowerCase()
    });
    
    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }
    
    // Handle resume upload
    let resumeData = null;
    if (req.file) {
      resumeData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype
      };
    }
    
    const applicationData = {
      ...req.body,
      job: jobId,
      resume: resumeData
    };
    
    const application = new Application(applicationData);
    await application.save();
    
    await application.populate([
      { path: 'job', select: 'title code department' },
      { path: 'job.department', select: 'name' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationNumber: application.applicationNumber,
        submittedAt: application.submittedAt
      }
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(400).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
};

// Get applications for a job
exports.getApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, search, page = 1, limit = 10 } = req.query;
    
    let query = { job: jobId };
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { applicationNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const applications = await Application.find(query)
      .populate('job', 'title code')
      .populate('reviewedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName')
      .populate('selectedBy', 'firstName lastName')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Application.countDocuments(query);
    
    res.json({
      success: true,
      data: applications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// Get single application
exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title code department requirements')
      .populate('reviewedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName')
      .populate('selectedBy', 'firstName lastName')
      .populate('referredBy', 'firstName lastName');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    await application.updateStatus(status, req.user.id, notes);
    
    await application.populate([
      { path: 'job', select: 'title code' },
      { path: 'reviewedBy', select: 'firstName lastName' },
      { path: 'rejectedBy', select: 'firstName lastName' },
      { path: 'selectedBy', select: 'firstName lastName' }
    ]);
    
    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
};

// ==================== INTERVIEW MANAGEMENT ====================

// Schedule interview
exports.scheduleInterview = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    const interviewData = {
      ...req.body,
      application: applicationId,
      job: application.job,
      scheduledBy: req.user.id
    };
    
    const interview = new Interview(interviewData);
    await interview.save();
    
    // Update application status
    await application.updateStatus(`Interview Round ${interview.round}`, req.user.id);
    
    await interview.populate([
      { path: 'application', select: 'firstName lastName email phoneNumber' },
      { path: 'job', select: 'title code' },
      { path: 'primaryInterviewer', select: 'firstName lastName email' },
      { path: 'additionalInterviewers', select: 'firstName lastName email' },
      { path: 'scheduledBy', select: 'firstName lastName' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: interview
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(400).json({
      success: false,
      message: 'Error scheduling interview',
      error: error.message
    });
  }
};

// Get interviews
exports.getInterviews = async (req, res) => {
  try {
    const { status, interviewer, date, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (interviewer) {
      query.$or = [
        { primaryInterviewer: interviewer },
        { additionalInterviewers: interviewer }
      ];
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.scheduledDate = { $gte: startDate, $lt: endDate };
    }
    
    const interviews = await Interview.find(query)
      .populate('application', 'firstName lastName email phoneNumber applicationNumber')
      .populate('job', 'title code')
      .populate('primaryInterviewer', 'firstName lastName email')
      .populate('additionalInterviewers', 'firstName lastName email')
      .populate('scheduledBy', 'firstName lastName')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Interview.countDocuments(query);
    
    res.json({
      success: true,
      data: interviews,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interviews',
      error: error.message
    });
  }
};

// Get interviewer's interviews
exports.getInterviewerInterviews = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    let filters = {};
    
    if (status) filters.status = status;
    if (upcoming === 'true') {
      filters.scheduledDate = { $gte: new Date() };
      filters.status = { $in: ['Scheduled', 'Confirmed'] };
    }
    
    const interviews = await Interview.getByInterviewer(req.user.id, filters);
    
    res.json({
      success: true,
      data: interviews
    });
  } catch (error) {
    console.error('Error fetching interviewer interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interviews',
      error: error.message
    });
  }
};

// Update interview status
exports.updateInterviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    interview.status = status;
    interview.lastUpdatedBy = req.user.id;
    
    if (status === 'In Progress') {
      interview.actualStartTime = new Date();
    } else if (status === 'Completed') {
      interview.actualEndTime = new Date();
      if (interview.actualStartTime) {
        interview.actualDuration = Math.round((interview.actualEndTime - interview.actualStartTime) / (1000 * 60));
      }
    }
    
    await interview.save();
    
    res.json({
      success: true,
      message: 'Interview status updated successfully',
      data: interview
    });
  } catch (error) {
    console.error('Error updating interview status:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating interview status',
      error: error.message
    });
  }
};

// Reschedule interview
exports.rescheduleInterview = async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    await interview.reschedule(new Date(newDate), newTime, reason, req.user.id);
    
    res.json({
      success: true,
      message: 'Interview rescheduled successfully',
      data: interview
    });
  } catch (error) {
    console.error('Error rescheduling interview:', error);
    res.status(400).json({
      success: false,
      message: 'Error rescheduling interview',
      error: error.message
    });
  }
};

// ==================== INTERVIEW FEEDBACK ====================

// Submit interview feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Check if interviewer is authorized
    const isAuthorized = interview.primaryInterviewer.toString() === req.user.id ||
                        interview.additionalInterviewers.some(id => id.toString() === req.user.id);
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to provide feedback for this interview'
      });
    }
    
    // Check if feedback already exists
    const existingFeedback = await InterviewFeedback.findOne({
      interview: interviewId,
      interviewer: req.user.id
    });
    
    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: 'Feedback already submitted for this interview'
      });
    }
    
    const feedbackData = {
      ...req.body,
      interview: interviewId,
      application: interview.application,
      job: interview.job,
      interviewer: req.user.id
    };
    
    const feedback = new InterviewFeedback(feedbackData);
    await feedback.submit();
    
    await feedback.populate([
      { path: 'interview', select: 'round title type scheduledDate' },
      { path: 'application', select: 'firstName lastName applicationNumber' },
      { path: 'job', select: 'title code' },
      { path: 'interviewer', select: 'firstName lastName designation' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(400).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
};

// Get feedback for application
exports.getApplicationFeedback = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const feedback = await InterviewFeedback.getByApplication(applicationId);
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
};

// Get interviewer's feedback
exports.getInterviewerFeedback = async (req, res) => {
  try {
    const { status } = req.query;
    let filters = {};
    
    if (status) filters.status = status;
    
    const feedback = await InterviewFeedback.getByInterviewer(req.user.id, filters);
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching interviewer feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
};

// ==================== OFFER MANAGEMENT ====================

// Generate offer letter
exports.generateOffer = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await Application.findById(applicationId)
      .populate('job', 'title code department team');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    if (application.status !== 'Selected') {
      return res.status(400).json({
        success: false,
        message: 'Application must be in Selected status to generate offer'
      });
    }
    
    // Check if offer already exists
    const existingOffer = await Offer.findOne({ application: applicationId });
    if (existingOffer) {
      return res.status(409).json({
        success: false,
        message: 'Offer already exists for this application'
      });
    }
    
    const offerData = {
      ...req.body,
      application: applicationId,
      job: application.job._id,
      candidate: {
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        phoneNumber: application.phoneNumber
      },
      generatedBy: req.user.id
    };
    
    const offer = new Offer(offerData);
    await offer.save();
    
    await offer.populate([
      { path: 'application', select: 'firstName lastName applicationNumber' },
      { path: 'job', select: 'title code' },
      { path: 'department', select: 'name' },
      { path: 'generatedBy', select: 'firstName lastName' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Offer generated successfully',
      data: offer
    });
  } catch (error) {
    console.error('Error generating offer:', error);
    res.status(400).json({
      success: false,
      message: 'Error generating offer',
      error: error.message
    });
  }
};

// Get offers
exports.getOffers = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filters = {};
    if (status) filters.status = status;
    
    const offers = await Offer.getByStatus(status || {}, filters)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Offer.countDocuments(filters);
    
    res.json({
      success: true,
      data: offers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offers',
      error: error.message
    });
  }
};

// Send offer
exports.sendOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    await offer.sendOffer(req.user.id);
    
    res.json({
      success: true,
      message: 'Offer sent successfully',
      data: offer
    });
  } catch (error) {
    console.error('Error sending offer:', error);
    res.status(400).json({
      success: false,
      message: 'Error sending offer',
      error: error.message
    });
  }
};

// Get public offer (for candidate response)
exports.getPublicOffer = async (req, res) => {
  try {
    const { token } = req.params;
    
    // In a real implementation, you would decode the token to get the offer ID
    // For now, we'll assume the token is the offer ID
    const offer = await Offer.findById(token)
      .populate('job', 'title code')
      .populate('department', 'name')
      .select('-generatedBy -sentBy -lastUpdatedBy');
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    if (offer.status !== 'Sent' && offer.status !== 'Viewed') {
      return res.status(410).json({
        success: false,
        message: 'Offer is no longer available'
      });
    }
    
    if (offer.isExpired) {
      return res.status(410).json({
        success: false,
        message: 'Offer has expired'
      });
    }
    
    // Mark as viewed if first time
    if (offer.status === 'Sent') {
      await offer.markAsViewed();
    }
    
    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    console.error('Error fetching public offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offer',
      error: error.message
    });
  }
};

// Respond to offer (public endpoint)
exports.respondToOffer = async (req, res) => {
  try {
    const { token } = req.params;
    const { response, comments, negotiationPoints } = req.body;
    
    const offer = await Offer.findById(token);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    if (offer.isExpired) {
      return res.status(410).json({
        success: false,
        message: 'Offer has expired'
      });
    }
    
    switch (response) {
      case 'accept':
        await offer.acceptOffer(comments);
        // Update application status
        await Application.findByIdAndUpdate(offer.application, {
          status: 'Offer Accepted',
          lastUpdatedBy: offer.generatedBy
        });
        break;
      case 'reject':
        await offer.rejectOffer(comments);
        // Update application status
        await Application.findByIdAndUpdate(offer.application, {
          status: 'Offer Rejected',
          lastUpdatedBy: offer.generatedBy
        });
        break;
      case 'negotiate':
        await offer.requestNegotiation(negotiationPoints, comments);
        break;
    }
    
    res.json({
      success: true,
      message: `Offer ${response}ed successfully`,
      data: { status: offer.status }
    });
  } catch (error) {
    console.error('Error responding to offer:', error);
    res.status(400).json({
      success: false,
      message: 'Error responding to offer',
      error: error.message
    });
  }
};

// ==================== DASHBOARD & ANALYTICS ====================

// Get recruitment dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      scheduledInterviews,
      pendingOffers
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'Active' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'Pending' }),
      Interview.countDocuments({ status: { $in: ['Scheduled', 'Confirmed'] } }),
      Offer.countDocuments({ status: { $in: ['Sent', 'Viewed'] } })
    ]);

    // Get recent applications
    const recentApplications = await Application.find()
      .populate('job', 'title code')
      .sort({ submittedAt: -1 })
      .limit(5)
      .select('firstName lastName email applicationNumber submittedAt status');

    // Get upcoming interviews
    const upcomingInterviews = await Interview.find({
      scheduledDate: { $gte: new Date() },
      status: { $in: ['Scheduled', 'Confirmed'] }
    })
      .populate('application', 'firstName lastName')
      .populate('job', 'title')
      .populate('primaryInterviewer', 'firstName lastName')
      .sort({ scheduledDate: 1 })
      .limit(5);

    // Application status distribution
    const applicationStats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalJobs,
          activeJobs,
          totalApplications,
          pendingApplications,
          scheduledInterviews,
          pendingOffers
        },
        recentApplications,
        upcomingInterviews,
        applicationStats
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// Get recruitment analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Applications by month
    const applicationsByMonth = await Application.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            month: { $month: '$submittedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Applications by job
    const applicationsByJob = await Application.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$job',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: '_id',
          as: 'job'
        }
      },
      { $unwind: '$job' },
      {
        $project: {
          jobTitle: '$job.title',
          jobCode: '$job.code',
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Interview feedback statistics
    const feedbackStats = await InterviewFeedback.getStatistics(dateFilter);

    res.json({
      success: true,
      data: {
        applicationsByMonth,
        applicationsByJob,
        feedbackStats: feedbackStats[0] || {}
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// ==================== UTILITY FUNCTIONS ====================

// Get all interviewers (non-employee users)
exports.getInterviewers = async (req, res) => {
  try {
    const interviewers = await User.find({
      role: { $ne: 'Employee' },
      isActive: true
    })
      .select('firstName lastName email designation role')
      .sort({ firstName: 1 });

    res.json({
      success: true,
      data: interviewers
    });
  } catch (error) {
    console.error('Error fetching interviewers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interviewers',
      error: error.message
    });
  }
};

// Download resume
exports.downloadResume = async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    
    if (!application || !application.resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const filePath = path.join(__dirname, '..', application.resume.path);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found on server'
      });
    }

    res.download(filePath, application.resume.originalName);
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading resume',
      error: error.message
    });
  }
};

// Add candidate to user management
exports.addToUserManagement = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { role = 'Employee', department, team, reportingManager } = req.body;
    
    const offer = await Offer.findById(offerId)
      .populate('application');
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    if (offer.status !== 'Accepted') {
      return res.status(400).json({
        success: false,
        message: 'Offer must be accepted to add candidate to user management'
      });
    }
    
    if (offer.userAccountCreated) {
      return res.status(409).json({
        success: false,
        message: 'User account already created for this candidate'
      });
    }
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Create user account
    const userData = {
      email: offer.candidate.email,
      password: tempPassword,
      firstName: offer.candidate.firstName,
      lastName: offer.candidate.lastName,
      phoneNumber: offer.candidate.phoneNumber,
      role: role,
      department: department || offer.department,
      team: team || offer.team,
      reportingManager: reportingManager || offer.reportingManager,
      designation: offer.designation,
      joiningDate: offer.actualJoiningDate || offer.proposedJoiningDate,
      createdBy: req.user.id
    };
    
    const user = new User(userData);
    await user.save();
    
    // Update offer
    offer.userAccountCreated = true;
    offer.createdUserId = user._id;
    offer.onboardingInitiated = true;
    await offer.save();
    
    res.json({
      success: true,
      message: 'User account created successfully',
      data: {
        userId: user._id,
        employeeId: user.employeeId,
        tempPassword: tempPassword
      }
    });
  } catch (error) {
    console.error('Error adding to user management:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating user account',
      error: error.message
    });
  }
};
