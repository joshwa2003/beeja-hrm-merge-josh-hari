const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const OfferLetter = require('../models/OfferLetter');
const User = require('../models/User');
const Department = require('../models/Department');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

class RecruitmentController {
  // ==================== JOB MANAGEMENT ====================
  
  // Get all jobs with filters
  async getJobs(req, res) {
    try {
      const { 
        status, 
        department, 
        priority, 
        search, 
        page = 1, 
        limit = 10 
      } = req.query;

      // Build query
      const query = {};
      
      if (status) query.status = status;
      if (department) query.department = department;
      if (priority) query.priority = priority;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const jobs = await Job.find(query)
        .populate('department', 'name')
        .populate('hiringManager', 'firstName lastName email')
        .populate('recruiter', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Job.countDocuments(query);

      // Get application counts for each job
      const jobsWithCounts = await Promise.all(
        jobs.map(async (job) => {
          const applicationCount = await Application.countDocuments({ 
            job: job._id, 
            isActive: true 
          });
          return {
            ...job.toObject(),
            applicationCount
          };
        })
      );

      res.json({
        jobs: jobsWithCounts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ message: 'Error fetching jobs', error: error.message });
    }
  }

  // Get single job details
  async getJob(req, res) {
    try {
      const { id } = req.params;
      
      const job = await Job.findById(id)
        .populate('department', 'name')
        .populate('hiringManager', 'firstName lastName email')
        .populate('recruiter', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName');

      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Get application statistics
      const applicationStats = await Application.aggregate([
        { $match: { job: job._id, isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const stats = {};
      applicationStats.forEach(stat => {
        stats[stat._id] = stat.count;
      });

      res.json({
        job: job.toObject(),
        applicationStats: stats,
        publicLink: job.getPublicLink()
      });
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ message: 'Error fetching job', error: error.message });
    }
  }

  // Create new job
  async createJob(req, res) {
    try {
      const jobData = {
        ...req.body,
        createdBy: req.user._id,
        hiringManager: req.body.hiringManager || req.user._id
      };

      const job = new Job(jobData);
      await job.save();

      await job.populate('department', 'name');
      await job.populate('hiringManager', 'firstName lastName email');
      await job.populate('createdBy', 'firstName lastName');

      res.status(201).json({
        message: 'Job created successfully',
        job: job.toObject(),
        publicLink: job.getPublicLink()
      });
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(400).json({ message: 'Error creating job', error: error.message });
    }
  }

  // Update job
  async updateJob(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user._id
      };

      const job = await Job.findByIdAndUpdate(id, updateData, { 
        new: true, 
        runValidators: true 
      })
      .populate('department', 'name')
      .populate('hiringManager', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName');

      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.json({
        message: 'Job updated successfully',
        job: job.toObject()
      });
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(400).json({ message: 'Error updating job', error: error.message });
    }
  }

  // Publish job
  async publishJob(req, res) {
    try {
      const { id } = req.params;
      
      const job = await Job.findById(id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      await job.publish(req.user._id);
      await job.populate('department', 'name');
      await job.populate('hiringManager', 'firstName lastName email');

      res.json({
        message: 'Job published successfully',
        job: job.toObject(),
        publicLink: job.getPublicLink()
      });
    } catch (error) {
      console.error('Error publishing job:', error);
      res.status(400).json({ message: 'Error publishing job', error: error.message });
    }
  }

  // Close job
  async closeJob(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const job = await Job.findById(id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      await job.close(req.user._id, reason);
      await job.populate('department', 'name');

      res.json({
        message: 'Job closed successfully',
        job: job.toObject()
      });
    } catch (error) {
      console.error('Error closing job:', error);
      res.status(400).json({ message: 'Error closing job', error: error.message });
    }
  }

  // ==================== APPLICATION MANAGEMENT ====================

  // Get applications with filters
  async getApplications(req, res) {
    try {
      const { 
        job, 
        status, 
        search, 
        page = 1, 
        limit = 10 
      } = req.query;

      // Build query
      const query = { isActive: true };
      
      if (job) query.job = job;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const applications = await Application.find(query)
        .populate('job', 'title code department')
        .populate('reviewedBy', 'firstName lastName')
        .populate({
          path: 'job',
          populate: {
            path: 'department',
            select: 'name'
          }
        })
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Application.countDocuments(query);

      res.json({
        applications,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
  }

  // Get single application details
  async getApplication(req, res) {
    try {
      const { id } = req.params;
      
      const application = await Application.findById(id)
        .populate('job', 'title code department location requirements')
        .populate('reviewedBy', 'firstName lastName')
        .populate('interviews')
        .populate({
          path: 'job',
          populate: {
            path: 'department',
            select: 'name'
          }
        })
        .populate({
          path: 'interviews',
          populate: {
            path: 'interviewer',
            select: 'firstName lastName email'
          }
        });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      res.json({ application });
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ message: 'Error fetching application', error: error.message });
    }
  }

  // Review application (accept/reject)
  async reviewApplication(req, res) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body; // action: 'accept' or 'reject'
      
      const application = await Application.findById(id)
        .populate('job', 'title code');

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      if (action === 'accept') {
        await application.accept(req.user._id);
        res.json({
          message: 'Application accepted successfully',
          application
        });
      } else if (action === 'reject') {
        await application.reject(req.user._id, reason);
        
        // Send rejection email
        await emailService.sendRejectionEmail(application, application.job, reason);
        
        res.json({
          message: 'Application rejected successfully',
          application
        });
      } else {
        return res.status(400).json({ message: 'Invalid action' });
      }
    } catch (error) {
      console.error('Error reviewing application:', error);
      res.status(400).json({ message: 'Error reviewing application', error: error.message });
    }
  }

  // ==================== INTERVIEW MANAGEMENT ====================

  // Get interviews with filters
  async getInterviews(req, res) {
    try {
      const { 
        interviewer, 
        status, 
        job,
        date,
        page = 1, 
        limit = 10 
      } = req.query;

      // Build query
      const query = { isActive: true };
      
      if (interviewer) query.interviewer = interviewer;
      if (status) query.status = status;
      if (job) query.job = job;
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.scheduledDate = { $gte: startDate, $lt: endDate };
      }

      const skip = (page - 1) * limit;
      
      const interviews = await Interview.find(query)
        .populate('application', 'firstName lastName email phoneNumber status')
        .populate('job', 'title code department')
        .populate('interviewer', 'firstName lastName email')
        .populate('scheduledBy', 'firstName lastName')
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Interview.countDocuments(query);

      res.json({
        interviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      console.error('Error fetching interviews:', error);
      res.status(500).json({ message: 'Error fetching interviews', error: error.message });
    }
  }

  // Schedule interview
  async scheduleInterview(req, res) {
    try {
      const {
        applicationId,
        scheduledDate,
        interviewer,
        type,
        location,
        meetingLink,
        duration = 60,
        title,
        description
      } = req.body;

      const application = await Application.findById(applicationId)
        .populate('job', 'title code');

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Determine interview round
      const existingInterviews = await Interview.countDocuments({ 
        application: applicationId,
        isActive: true 
      });
      const round = existingInterviews + 1;

      // Create interview
      const interview = new Interview({
        application: applicationId,
        job: application.job._id,
        round,
        title: title || `Interview Round ${round}`,
        description,
        scheduledDate: new Date(scheduledDate),
        duration,
        type,
        location,
        meetingLink,
        interviewer,
        scheduledBy: req.user._id,
        candidateInfo: {
          name: `${application.firstName} ${application.lastName}`,
          email: application.email,
          phone: application.phoneNumber
        }
      });

      await interview.save();

      // Update application status
      application.status = `Interview Round ${round}`;
      application.interviews.push(interview._id);
      await application.save();

      // Populate interview data
      await interview.populate('interviewer', 'firstName lastName email');
      await interview.populate('application', 'firstName lastName email phoneNumber');

      // Send emails
      await emailService.sendInterviewInvitation(interview, application, application.job);
      await emailService.sendInterviewerNotification(interview, application, application.job, interview.interviewer);

      res.status(201).json({
        message: 'Interview scheduled successfully',
        interview
      });
    } catch (error) {
      console.error('Error scheduling interview:', error);
      res.status(400).json({ message: 'Error scheduling interview', error: error.message });
    }
  }

  // Get interviewer's interviews
  async getInterviewerSchedule(req, res) {
    try {
      const interviewerId = req.params.interviewerId || req.user._id;
      const { status, upcoming } = req.query;

      let interviews;
      
      if (upcoming === 'true') {
        interviews = await Interview.getUpcoming(interviewerId);
      } else {
        interviews = await Interview.getByInterviewer(interviewerId, status);
      }

      res.json({ interviews });
    } catch (error) {
      console.error('Error fetching interviewer schedule:', error);
      res.status(500).json({ message: 'Error fetching interviewer schedule', error: error.message });
    }
  }

  // Submit interview feedback
  async submitInterviewFeedback(req, res) {
    try {
      const { id } = req.params;
      const feedbackData = req.body;

      const interview = await Interview.findById(id)
        .populate('application')
        .populate('job', 'title');

      if (!interview) {
        return res.status(404).json({ message: 'Interview not found' });
      }

      // Check if user is the assigned interviewer
      if (interview.interviewer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to submit feedback for this interview' });
      }

      await interview.submitFeedback(feedbackData, req.user._id);

      res.json({
        message: 'Interview feedback submitted successfully',
        interview
      });
    } catch (error) {
      console.error('Error submitting interview feedback:', error);
      res.status(400).json({ message: 'Error submitting interview feedback', error: error.message });
    }
  }

  // ==================== OFFER LETTER MANAGEMENT ====================

  // Get offer letters
  async getOfferLetters(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;

      const query = { isActive: true };
      if (status) query.status = status;

      const skip = (page - 1) * limit;

      const offerLetters = await OfferLetter.find(query)
        .populate('application', 'firstName lastName email phoneNumber')
        .populate('job', 'title code department')
        .populate('generatedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await OfferLetter.countDocuments(query);

      res.json({
        offerLetters,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      console.error('Error fetching offer letters:', error);
      res.status(500).json({ message: 'Error fetching offer letters', error: error.message });
    }
  }

  // Generate and send offer letter
  async generateOfferLetter(req, res) {
    try {
      const { applicationId } = req.params;
      const offerDetails = req.body;

      const application = await Application.findById(applicationId)
        .populate('job')
        .populate({
          path: 'job',
          populate: {
            path: 'department',
            select: 'name'
          }
        });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Create offer letter
      const offerLetter = new OfferLetter({
        application: applicationId,
        job: application.job._id,
        candidateInfo: {
          firstName: application.firstName,
          lastName: application.lastName,
          email: application.email,
          phoneNumber: application.phoneNumber
        },
        jobInfo: {
          title: application.job.title,
          department: application.job.department.name,
          location: application.job.location
        },
        offerDetails,
        generatedBy: req.user._id,
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days validity
      });

      await offerLetter.save();

      // Generate PDF
      const pdfResult = await pdfService.generateOfferLetterPDF(offerLetter);
      
      // Update offer letter with PDF info
      offerLetter.document = {
        fileName: pdfResult.fileName,
        filePath: pdfResult.filePath,
        mimeType: 'application/pdf',
        generatedAt: new Date()
      };

      await offerLetter.generate(req.user._id);

      // Update application
      application.offerLetter = offerLetter._id;
      await application.sendOffer();

      // Send offer letter email
      await emailService.sendOfferLetter(offerLetter);
      await offerLetter.send(req.user._id);

      res.status(201).json({
        message: 'Offer letter generated and sent successfully',
        offerLetter: offerLetter.toJSON()
      });
    } catch (error) {
      console.error('Error generating offer letter:', error);
      res.status(400).json({ message: 'Error generating offer letter', error: error.message });
    }
  }

  // ==================== DASHBOARD & STATISTICS ====================

  // Get recruitment dashboard data
  async getDashboard(req, res) {
    try {
      // Job statistics
      const jobStats = await Job.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Application statistics
      const applicationStats = await Application.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Interview statistics
      const interviewStats = await Interview.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Offer letter statistics
      const offerStats = await OfferLetter.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Recent activities
      const recentApplications = await Application.find({ isActive: true })
        .populate('job', 'title')
        .sort({ appliedAt: -1 })
        .limit(5);

      const upcomingInterviews = await Interview.getUpcoming()
        .limit(5);

      res.json({
        statistics: {
          jobs: jobStats.reduce((acc, stat) => ({ ...acc, [stat._id]: stat.count }), {}),
          applications: applicationStats.reduce((acc, stat) => ({ ...acc, [stat._id]: stat.count }), {}),
          interviews: interviewStats.reduce((acc, stat) => ({ ...acc, [stat._id]: stat.count }), {}),
          offers: offerStats.reduce((acc, stat) => ({ ...acc, [stat._id]: stat.count }), {})
        },
        recentActivities: {
          applications: recentApplications,
          upcomingInterviews
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
  }

  // Get available interviewers (non-employee roles)
  async getInterviewers(req, res) {
    try {
      const interviewers = await User.find({
        role: { $ne: 'Employee' },
        isActive: true
      })
      .select('firstName lastName email role department')
      .populate('department', 'name')
      .sort({ firstName: 1 });

      res.json({ interviewers });
    } catch (error) {
      console.error('Error fetching interviewers:', error);
      res.status(500).json({ message: 'Error fetching interviewers', error: error.message });
    }
  }
}

const controller = new RecruitmentController();

module.exports = {
  getJobs: controller.getJobs.bind(controller),
  getJob: controller.getJob.bind(controller),
  createJob: controller.createJob.bind(controller),
  updateJob: controller.updateJob.bind(controller),
  publishJob: controller.publishJob.bind(controller),
  closeJob: controller.closeJob.bind(controller),
  getApplications: controller.getApplications.bind(controller),
  getApplication: controller.getApplication.bind(controller),
  reviewApplication: controller.reviewApplication.bind(controller),
  getInterviews: controller.getInterviews.bind(controller),
  scheduleInterview: controller.scheduleInterview.bind(controller),
  getInterviewerSchedule: controller.getInterviewerSchedule.bind(controller),
  submitInterviewFeedback: controller.submitInterviewFeedback.bind(controller),
  getOfferLetters: controller.getOfferLetters.bind(controller),
  generateOfferLetter: controller.generateOfferLetter.bind(controller),
  getDashboard: controller.getDashboard.bind(controller),
  getInterviewers: controller.getInterviewers.bind(controller)
};
