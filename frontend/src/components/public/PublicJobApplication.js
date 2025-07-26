import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PublicJobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    yearsOfExperience: '',
    technicalSkills: '',
    coverLetter: '',
    resume: null
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/jobs/${jobId}`);

      if (response.ok) {
        const data = await response.json();
        setJob(data.job);
      } else {
        const error = await response.json();
        setError(error.message || 'Job not found');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Error loading job details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.yearsOfExperience) {
      errors.yearsOfExperience = 'Years of experience is required';
    } else if (isNaN(formData.yearsOfExperience) || formData.yearsOfExperience < 0) {
      errors.yearsOfExperience = 'Please enter a valid number';
    }

    if (!formData.technicalSkills.trim()) {
      errors.technicalSkills = 'Technical skills are required';
    }

    if (!formData.resume) {
      errors.resume = 'Resume is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const submitData = new FormData();
      submitData.append('firstName', formData.firstName.trim());
      submitData.append('lastName', formData.lastName.trim());
      submitData.append('email', formData.email.trim());
      submitData.append('phoneNumber', formData.phoneNumber.trim());
      submitData.append('yearsOfExperience', formData.yearsOfExperience);
      submitData.append('technicalSkills', formData.technicalSkills.trim());
      submitData.append('coverLetter', formData.coverLetter.trim());
      submitData.append('resume', formData.resume);

      const response = await fetch(`/api/public/jobs/${jobId}/apply`, {
        method: 'POST',
        body: submitData
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const error = await response.json();
        setError(error.message || 'Error submitting application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setError('Error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setFormErrors({...formErrors, resume: 'Only PDF and Word documents are allowed'});
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors({...formErrors, resume: 'File size must be less than 5MB'});
        return;
      }

      setFormData({...formData, resume: file});
      setFormErrors({...formErrors, resume: ''});
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <i className="bi bi-exclamation-triangle display-1 text-warning"></i>
          <h3 className="mt-3">{error}</h3>
          <p className="text-muted">The job you're looking for might not be available anymore.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/jobs')}
          >
            Browse Other Jobs
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <i className="bi bi-check-circle display-1 text-success"></i>
          <h3 className="mt-3 text-success">Application Submitted Successfully!</h3>
          <p className="text-muted">
            Thank you for applying for the <strong>{job.title}</strong> position.
            <br />
            We have received your application and will review it shortly.
            <br />
            You will receive a confirmation email at <strong>{formData.email}</strong>.
          </p>
          <div className="mt-4">
            <button 
              className="btn btn-primary me-3"
              onClick={() => navigate('/jobs')}
            >
              Browse More Jobs
            </button>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => window.location.reload()}
            >
              Apply for Another Position
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Job Information */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h2 className="card-title text-primary">{job.title}</h2>
                    <p className="text-muted mb-2">
                      <i className="bi bi-building me-2"></i>{job.department?.name}
                      <span className="mx-2">•</span>
                      <i className="bi bi-geo-alt me-2"></i>{job.location}
                      <span className="mx-2">•</span>
                      <i className="bi bi-briefcase me-2"></i>{job.employmentType}
                    </p>
                    <div className="d-flex gap-2 mb-3">
                      <span className="badge bg-primary">{job.workMode}</span>
                      <span className="badge bg-info">{job.openings} Opening{job.openings > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <small className="text-muted">Job Code: {job.code}</small>
                    {job.closingDate && (
                      <div>
                        <small className="text-muted">
                          Apply by: {new Date(job.closingDate).toLocaleDateString()}
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="row mt-4">
                  <div className="col-md-6">
                    <h6>Job Description</h6>
                    <p className="text-muted">{job.description}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Requirements</h6>
                    {job.requirements?.education && (
                      <p><strong>Education:</strong> {job.requirements.education}</p>
                    )}
                    <p><strong>Experience:</strong> {job.requirements?.experience?.min || 0} - {job.requirements?.experience?.max || 10} years</p>
                    {job.requirements?.skills && job.requirements.skills.length > 0 && (
                      <div>
                        <strong>Skills:</strong>
                        <div className="mt-1">
                          {job.requirements.skills.map((skill, index) => (
                            <span key={index} className="badge bg-secondary me-1 mb-1">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {job.benefits && job.benefits.length > 0 && (
                  <div className="mt-3">
                    <h6>Benefits</h6>
                    <ul className="list-unstyled">
                      {job.benefits.map((benefit, index) => (
                        <li key={index}><i className="bi bi-check-circle text-success me-2"></i>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Application Form */}
            <div className="card">
              <div className="card-header">
                <h4 className="mb-0">
                  <i className="bi bi-file-person me-2"></i>Apply for this Position
                </h4>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>{error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name *</label>
                      <input 
                        type="text"
                        className={`form-control ${formErrors.firstName ? 'is-invalid' : ''}`}
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        disabled={submitting}
                      />
                      {formErrors.firstName && (
                        <div className="invalid-feedback">{formErrors.firstName}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name *</label>
                      <input 
                        type="text"
                        className={`form-control ${formErrors.lastName ? 'is-invalid' : ''}`}
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        disabled={submitting}
                      />
                      {formErrors.lastName && (
                        <div className="invalid-feedback">{formErrors.lastName}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email Address *</label>
                      <input 
                        type="email"
                        className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        disabled={submitting}
                      />
                      {formErrors.email && (
                        <div className="invalid-feedback">{formErrors.email}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number *</label>
                      <input 
                        type="tel"
                        className={`form-control ${formErrors.phoneNumber ? 'is-invalid' : ''}`}
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        disabled={submitting}
                      />
                      {formErrors.phoneNumber && (
                        <div className="invalid-feedback">{formErrors.phoneNumber}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Years of Experience *</label>
                      <input 
                        type="number"
                        className={`form-control ${formErrors.yearsOfExperience ? 'is-invalid' : ''}`}
                        value={formData.yearsOfExperience}
                        onChange={(e) => setFormData({...formData, yearsOfExperience: e.target.value})}
                        min="0"
                        max="50"
                        disabled={submitting}
                      />
                      {formErrors.yearsOfExperience && (
                        <div className="invalid-feedback">{formErrors.yearsOfExperience}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Resume *</label>
                      <input 
                        type="file"
                        className={`form-control ${formErrors.resume ? 'is-invalid' : ''}`}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                        disabled={submitting}
                      />
                      <div className="form-text">
                        Upload your resume (PDF or Word document, max 5MB)
                      </div>
                      {formErrors.resume && (
                        <div className="invalid-feedback">{formErrors.resume}</div>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Technical Skills *</label>
                      <input 
                        type="text"
                        className={`form-control ${formErrors.technicalSkills ? 'is-invalid' : ''}`}
                        value={formData.technicalSkills}
                        onChange={(e) => setFormData({...formData, technicalSkills: e.target.value})}
                        placeholder="e.g., JavaScript, React, Node.js, Python (comma-separated)"
                        disabled={submitting}
                      />
                      {formErrors.technicalSkills && (
                        <div className="invalid-feedback">{formErrors.technicalSkills}</div>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Cover Letter (Optional)</label>
                      <textarea 
                        className="form-control"
                        rows="5"
                        value={formData.coverLetter}
                        onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
                        placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Submitting Application...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>Submit Application
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicJobApplication;
