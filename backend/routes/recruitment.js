const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const recruitmentController = require('../controllers/recruitmentController');

// Middleware to check HR roles
const checkHRRole = (req, res, next) => {
  const hrRoles = ['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive'];
  if (!hrRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. HR role required.' });
  }
  next();
};

// Middleware to check interviewer roles (non-employee)
const checkInterviewerRole = (req, res, next) => {
  if (req.user.role === 'Employee') {
    return res.status(403).json({ message: 'Access denied. Interviewer role required.' });
  }
  next();
};

// ==================== JOB MANAGEMENT ROUTES ====================

// Get all jobs with filters
router.get('/jobs', auth, checkHRRole, recruitmentController.getJobs);

// Get single job details
router.get('/jobs/:id', auth, checkHRRole, recruitmentController.getJob);

// Create new job
router.post('/jobs', auth, checkHRRole, recruitmentController.createJob);

// Update job
router.put('/jobs/:id', auth, checkHRRole, recruitmentController.updateJob);

// Publish job
router.patch('/jobs/:id/publish', auth, checkHRRole, recruitmentController.publishJob);

// Close job
router.patch('/jobs/:id/close', auth, checkHRRole, recruitmentController.closeJob);

// ==================== APPLICATION MANAGEMENT ROUTES ====================

// Get applications with filters
router.get('/applications', auth, checkHRRole, recruitmentController.getApplications);

// Get single application details
router.get('/applications/:id', auth, checkHRRole, recruitmentController.getApplication);

// Review application (accept/reject)
router.patch('/applications/:id/review', auth, checkHRRole, recruitmentController.reviewApplication);

// ==================== INTERVIEW MANAGEMENT ROUTES ====================

// Get interviews with filters
router.get('/interviews', auth, checkHRRole, recruitmentController.getInterviews);

// Schedule interview
router.post('/interviews', auth, checkHRRole, recruitmentController.scheduleInterview);

// Get interviewer's schedule (accessible by interviewers)
router.get('/interviews/my-schedule', auth, checkInterviewerRole, recruitmentController.getInterviewerSchedule);

// Get specific interviewer's schedule (HR only)
router.get('/interviews/interviewer/:interviewerId', auth, checkHRRole, recruitmentController.getInterviewerSchedule);

// Submit interview feedback (accessible by assigned interviewer)
router.patch('/interviews/:id/feedback', auth, checkInterviewerRole, recruitmentController.submitInterviewFeedback);

// ==================== OFFER LETTER MANAGEMENT ROUTES ====================

// Get offer letters
router.get('/offers', auth, checkHRRole, recruitmentController.getOfferLetters);

// Generate and send offer letter
router.post('/offers/:applicationId', auth, checkHRRole, recruitmentController.generateOfferLetter);

// ==================== UTILITY ROUTES ====================

// Get recruitment dashboard data
router.get('/dashboard', auth, checkHRRole, recruitmentController.getDashboard);

// Get available interviewers
router.get('/interviewers', auth, checkHRRole, recruitmentController.getInterviewers);

module.exports = router;
