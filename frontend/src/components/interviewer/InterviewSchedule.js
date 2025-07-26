import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const InterviewSchedule = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    upcoming: 'false'
  });

  const [feedbackForm, setFeedbackForm] = useState({
    technicalRating: '',
    technicalComments: '',
    communicationRating: '',
    communicationComments: '',
    problemSolvingRating: '',
    problemSolvingComments: '',
    culturalFitRating: '',
    culturalFitComments: '',
    overallRating: '',
    overallComments: '',
    recommendation: '',
    strengths: [],
    weaknesses: [],
    additionalNotes: ''
  });

  useEffect(() => {
    fetchInterviews();
  }, [filters]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);

      const response = await fetch(`/api/recruitment/interviews/my-schedule?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInterviews(data.interviews);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/recruitment/interviews/${selectedInterview._id}/feedback`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(feedbackForm)
      });

      if (response.ok) {
        setShowFeedbackModal(false);
        setSelectedInterview(null);
        resetFeedbackForm();
        fetchInterviews();
        alert('Feedback submitted successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Error submitting feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    }
  };

  const resetFeedbackForm = () => {
    setFeedbackForm({
      technicalRating: '',
      technicalComments: '',
      communicationRating: '',
      communicationComments: '',
      problemSolvingRating: '',
      problemSolvingComments: '',
      culturalFitRating: '',
      culturalFitComments: '',
      overallRating: '',
      overallComments: '',
      recommendation: '',
      strengths: [],
      weaknesses: [],
      additionalNotes: ''
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Scheduled': 'bg-warning',
      'Confirmed': 'bg-info',
      'In Progress': 'bg-primary',
      'Completed': 'bg-success',
      'Cancelled': 'bg-danger',
      'Rescheduled': 'bg-secondary',
      'No Show': 'bg-dark'
    };
    return `badge ${statusClasses[status] || 'bg-secondary'}`;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  const isPast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const addStrength = () => {
    setFeedbackForm({
      ...feedbackForm,
      strengths: [...feedbackForm.strengths, '']
    });
  };

  const updateStrength = (index, value) => {
    const newStrengths = [...feedbackForm.strengths];
    newStrengths[index] = value;
    setFeedbackForm({
      ...feedbackForm,
      strengths: newStrengths
    });
  };

  const removeStrength = (index) => {
    const newStrengths = feedbackForm.strengths.filter((_, i) => i !== index);
    setFeedbackForm({
      ...feedbackForm,
      strengths: newStrengths
    });
  };

  const addWeakness = () => {
    setFeedbackForm({
      ...feedbackForm,
      weaknesses: [...feedbackForm.weaknesses, '']
    });
  };

  const updateWeakness = (index, value) => {
    const newWeaknesses = [...feedbackForm.weaknesses];
    newWeaknesses[index] = value;
    setFeedbackForm({
      ...feedbackForm,
      weaknesses: newWeaknesses
    });
  };

  const removeWeakness = (index) => {
    const newWeaknesses = feedbackForm.weaknesses.filter((_, i) => i !== index);
    setFeedbackForm({
      ...feedbackForm,
      weaknesses: newWeaknesses
    });
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><i className="bi bi-calendar-check me-2"></i>My Interview Schedule</h2>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="">All Status</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">View</label>
                  <select 
                    className="form-select"
                    value={filters.upcoming}
                    onChange={(e) => setFilters({...filters, upcoming: e.target.value})}
                  >
                    <option value="false">All Interviews</option>
                    <option value="true">Upcoming Only</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <button 
                    className="btn btn-outline-secondary mt-4"
                    onClick={() => setFilters({ status: '', upcoming: 'false' })}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interviews List */}
          <div className="row">
            {loading ? (
              <div className="col-12">
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            ) : interviews.length === 0 ? (
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <i className="bi bi-calendar-x display-1 text-muted"></i>
                    <h5 className="mt-3 text-muted">No interviews scheduled</h5>
                    <p className="text-muted">You don't have any interviews assigned at the moment.</p>
                  </div>
                </div>
              </div>
            ) : (
              interviews.map(interview => {
                const dateTime = formatDateTime(interview.scheduledDate);
                const upcoming = isUpcoming(interview.scheduledDate);
                const past = isPast(interview.scheduledDate);
                const hasFeedback = interview.feedback && interview.feedback.submittedAt;

                return (
                  <div key={interview._id} className="col-md-6 col-lg-4 mb-4">
                    <div className={`card h-100 ${upcoming ? 'border-primary' : past && !hasFeedback ? 'border-warning' : ''}`}>
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <span className={getStatusBadge(interview.status)}>
                          {interview.status}
                        </span>
                        <small className="text-muted">Round {interview.round}</small>
                      </div>
                      <div className="card-body">
                        <h6 className="card-title">
                          {interview.application?.firstName} {interview.application?.lastName}
                        </h6>
                        <p className="card-text">
                          <strong>Position:</strong> {interview.job?.title}<br />
                          <strong>Date:</strong> {dateTime.date}<br />
                          <strong>Time:</strong> {dateTime.time}<br />
                          <strong>Duration:</strong> {interview.duration} minutes<br />
                          <strong>Type:</strong> {interview.type}
                        </p>
                        
                        {interview.type === 'Online' && interview.meetingLink && (
                          <div className="mb-2">
                            <a 
                              href={interview.meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bi bi-camera-video me-1"></i>Join Meeting
                            </a>
                          </div>
                        )}
                        
                        {interview.type === 'Offline' && interview.location && (
                          <p className="text-muted">
                            <i className="bi bi-geo-alt me-1"></i>{interview.location}
                          </p>
                        )}

                        <div className="mt-2">
                          <small className="text-muted">
                            <strong>Candidate Email:</strong> {interview.application?.email}<br />
                            <strong>Phone:</strong> {interview.application?.phoneNumber}
                          </small>
                        </div>
                      </div>
                      <div className="card-footer">
                        {hasFeedback ? (
                          <div className="text-center">
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i>Feedback Submitted
                            </span>
                            <br />
                            <small className="text-muted">
                              {new Date(interview.feedback.submittedAt).toLocaleDateString()}
                            </small>
                          </div>
                        ) : interview.status === 'Completed' || past ? (
                          <button 
                            className="btn btn-primary btn-sm w-100"
                            onClick={() => {
                              setSelectedInterview(interview);
                              resetFeedbackForm();
                              setShowFeedbackModal(true);
                            }}
                          >
                            <i className="bi bi-pencil me-1"></i>Submit Feedback
                          </button>
                        ) : upcoming ? (
                          <div className="text-center">
                            <span className="badge bg-info">
                              <i className="bi bi-clock me-1"></i>Upcoming
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedInterview && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Interview Feedback - {selectedInterview.application?.firstName} {selectedInterview.application?.lastName}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowFeedbackModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmitFeedback}>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* Technical Assessment */}
                    <div className="col-12">
                      <h6 className="border-bottom pb-2">Technical Assessment</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Technical Rating (1-10) *</label>
                      <select 
                        className="form-select"
                        value={feedbackForm.technicalRating}
                        onChange={(e) => setFeedbackForm({...feedbackForm, technicalRating: e.target.value})}
                        required
                      >
                        <option value="">Select Rating</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Technical Comments</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        value={feedbackForm.technicalComments}
                        onChange={(e) => setFeedbackForm({...feedbackForm, technicalComments: e.target.value})}
                      />
                    </div>

                    {/* Communication Skills */}
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2">Communication Skills</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Communication Rating (1-10) *</label>
                      <select 
                        className="form-select"
                        value={feedbackForm.communicationRating}
                        onChange={(e) => setFeedbackForm({...feedbackForm, communicationRating: e.target.value})}
                        required
                      >
                        <option value="">Select Rating</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Communication Comments</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        value={feedbackForm.communicationComments}
                        onChange={(e) => setFeedbackForm({...feedbackForm, communicationComments: e.target.value})}
                      />
                    </div>

                    {/* Problem Solving */}
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2">Problem Solving</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Problem Solving Rating (1-10) *</label>
                      <select 
                        className="form-select"
                        value={feedbackForm.problemSolvingRating}
                        onChange={(e) => setFeedbackForm({...feedbackForm, problemSolvingRating: e.target.value})}
                        required
                      >
                        <option value="">Select Rating</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Problem Solving Comments</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        value={feedbackForm.problemSolvingComments}
                        onChange={(e) => setFeedbackForm({...feedbackForm, problemSolvingComments: e.target.value})}
                      />
                    </div>

                    {/* Cultural Fit */}
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2">Cultural Fit</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Cultural Fit Rating (1-10) *</label>
                      <select 
                        className="form-select"
                        value={feedbackForm.culturalFitRating}
                        onChange={(e) => setFeedbackForm({...feedbackForm, culturalFitRating: e.target.value})}
                        required
                      >
                        <option value="">Select Rating</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Cultural Fit Comments</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        value={feedbackForm.culturalFitComments}
                        onChange={(e) => setFeedbackForm({...feedbackForm, culturalFitComments: e.target.value})}
                      />
                    </div>

                    {/* Overall Assessment */}
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2">Overall Assessment</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Overall Rating (1-10) *</label>
                      <select 
                        className="form-select"
                        value={feedbackForm.overallRating}
                        onChange={(e) => setFeedbackForm({...feedbackForm, overallRating: e.target.value})}
                        required
                      >
                        <option value="">Select Rating</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Recommendation *</label>
                      <select 
                        className="form-select"
                        value={feedbackForm.recommendation}
                        onChange={(e) => setFeedbackForm({...feedbackForm, recommendation: e.target.value})}
                        required
                      >
                        <option value="">Select Recommendation</option>
                        <option value="Strongly Recommend">Strongly Recommend</option>
                        <option value="Recommend">Recommend</option>
                        <option value="Maybe">Maybe</option>
                        <option value="Do Not Recommend">Do Not Recommend</option>
                        <option value="Strongly Do Not Recommend">Strongly Do Not Recommend</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Overall Comments</label>
                      <textarea 
                        className="form-control"
                        rows="4"
                        value={feedbackForm.overallComments}
                        onChange={(e) => setFeedbackForm({...feedbackForm, overallComments: e.target.value})}
                      />
                    </div>

                    {/* Strengths */}
                    <div className="col-12 mt-4">
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                        <h6 className="mb-0">Strengths</h6>
                        <button 
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={addStrength}
                        >
                          <i className="bi bi-plus"></i> Add Strength
                        </button>
                      </div>
                    </div>
                    {feedbackForm.strengths.map((strength, index) => (
                      <div key={index} className="col-12">
                        <div className="input-group">
                          <input 
                            type="text"
                            className="form-control"
                            value={strength}
                            onChange={(e) => updateStrength(index, e.target.value)}
                            placeholder="Enter strength"
                          />
                          <button 
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => removeStrength(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Weaknesses */}
                    <div className="col-12 mt-4">
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                        <h6 className="mb-0">Areas for Improvement</h6>
                        <button 
                          type="button"
                          className="btn btn-sm btn-outline-warning"
                          onClick={addWeakness}
                        >
                          <i className="bi bi-plus"></i> Add Area
                        </button>
                      </div>
                    </div>
                    {feedbackForm.weaknesses.map((weakness, index) => (
                      <div key={index} className="col-12">
                        <div className="input-group">
                          <input 
                            type="text"
                            className="form-control"
                            value={weakness}
                            onChange={(e) => updateWeakness(index, e.target.value)}
                            placeholder="Enter area for improvement"
                          />
                          <button 
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => removeWeakness(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Additional Notes */}
                    <div className="col-12 mt-4">
                      <label className="form-label">Additional Notes</label>
                      <textarea 
                        className="form-control"
                        rows="4"
                        value={feedbackForm.additionalNotes}
                        onChange={(e) => setFeedbackForm({...feedbackForm, additionalNotes: e.target.value})}
                        placeholder="Any additional observations or notes..."
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowFeedbackModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Feedback
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSchedule;
