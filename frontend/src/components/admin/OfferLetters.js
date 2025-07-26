import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const OfferLetters = () => {
  const { user } = useAuth();
  const [offerLetters, setOfferLetters] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filters, setFilters] = useState({
    status: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const [offerForm, setOfferForm] = useState({
    salary: {
      basic: '',
      hra: '',
      allowances: '',
      ctc: '',
      currency: 'INR'
    },
    employmentType: 'Full-time',
    workMode: 'On-site',
    joiningDate: '',
    probationPeriod: 6,
    noticePeriod: 30,
    benefits: [],
    termsAndConditions: [],
    reportingManager: {
      name: '',
      designation: '',
      email: ''
    },
    workingHours: '9:00 AM - 6:00 PM',
    workingDays: 'Monday to Friday'
  });

  useEffect(() => {
    fetchOfferLetters();
    fetchSelectedApplications();
  }, [filters, pagination.current]);

  const fetchOfferLetters = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.current,
        limit: 10,
        ...filters
      });

      const response = await fetch(`/api/recruitment/offers?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOfferLetters(data.offerLetters);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching offer letters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedApplications = async () => {
    try {
      const response = await fetch('/api/recruitment/applications?status=Selected', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching selected applications:', error);
    }
  };

  const handleGenerateOffer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/recruitment/offers/${selectedApplication._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(offerForm)
      });

      if (response.ok) {
        setShowModal(false);
        setSelectedApplication(null);
        resetOfferForm();
        fetchOfferLetters();
        fetchSelectedApplications();
        alert('Offer letter generated and sent successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Error generating offer letter');
      }
    } catch (error) {
      console.error('Error generating offer letter:', error);
      alert('Error generating offer letter');
    }
  };

  const resetOfferForm = () => {
    setOfferForm({
      salary: {
        basic: '',
        hra: '',
        allowances: '',
        ctc: '',
        currency: 'INR'
      },
      employmentType: 'Full-time',
      workMode: 'On-site',
      joiningDate: '',
      probationPeriod: 6,
      noticePeriod: 30,
      benefits: [],
      termsAndConditions: [],
      reportingManager: {
        name: '',
        designation: '',
        email: ''
      },
      workingHours: '9:00 AM - 6:00 PM',
      workingDays: 'Monday to Friday'
    });
  };

  const calculateCTC = () => {
    const basic = parseFloat(offerForm.salary.basic) || 0;
    const hra = parseFloat(offerForm.salary.hra) || 0;
    const allowances = parseFloat(offerForm.salary.allowances) || 0;
    const ctc = basic + hra + allowances;
    setOfferForm({
      ...offerForm,
      salary: {
        ...offerForm.salary,
        ctc: ctc.toString()
      }
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Draft': 'bg-secondary',
      'Generated': 'bg-info',
      'Sent': 'bg-primary',
      'Viewed': 'bg-warning',
      'Accepted': 'bg-success',
      'Rejected': 'bg-danger',
      'Expired': 'bg-dark',
      'Withdrawn': 'bg-secondary'
    };
    return `badge ${statusClasses[status] || 'bg-secondary'}`;
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const addBenefit = () => {
    setOfferForm({
      ...offerForm,
      benefits: [...offerForm.benefits, '']
    });
  };

  const updateBenefit = (index, value) => {
    const newBenefits = [...offerForm.benefits];
    newBenefits[index] = value;
    setOfferForm({
      ...offerForm,
      benefits: newBenefits
    });
  };

  const removeBenefit = (index) => {
    const newBenefits = offerForm.benefits.filter((_, i) => i !== index);
    setOfferForm({
      ...offerForm,
      benefits: newBenefits
    });
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><i className="bi bi-envelope-check me-2"></i>Offer Letters</h2>
            {applications.length > 0 && (
              <div className="dropdown">
                <button 
                  className="btn btn-primary dropdown-toggle" 
                  type="button" 
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-plus-circle me-2"></i>Generate Offer
                </button>
                <ul className="dropdown-menu">
                  {applications.map(app => (
                    <li key={app._id}>
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          setSelectedApplication(app);
                          resetOfferForm();
                          setShowModal(true);
                        }}
                      >
                        {app.firstName} {app.lastName} - {app.job?.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                    <option value="Generated">Generated</option>
                    <option value="Sent">Sent</option>
                    <option value="Viewed">Viewed</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
                <div className="col-md-8">
                  <div className="d-flex gap-2 mt-4">
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => setFilters({ status: '' })}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Offer Letters Table */}
          <div className="card">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Job</th>
                          <th>CTC</th>
                          <th>Status</th>
                          <th>Generated Date</th>
                          <th>Valid Until</th>
                          <th>Response Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offerLetters.map(offer => (
                          <tr key={offer._id}>
                            <td>
                              <div>
                                <strong>{offer.candidateInfo.firstName} {offer.candidateInfo.lastName}</strong>
                                <br />
                                <small className="text-muted">{offer.candidateInfo.email}</small>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{offer.jobInfo.title}</strong>
                                <br />
                                <small className="text-muted">{offer.jobInfo.department}</small>
                              </div>
                            </td>
                            <td>
                              <strong>{formatCurrency(offer.offerDetails.salary.ctc, offer.offerDetails.salary.currency)}</strong>
                              <br />
                              <small className="text-muted">per annum</small>
                            </td>
                            <td>
                              <span className={getStatusBadge(offer.status)}>
                                {offer.status}
                              </span>
                            </td>
                            <td>
                              {offer.generatedAt ? 
                                new Date(offer.generatedAt).toLocaleDateString() : 
                                '-'
                              }
                            </td>
                            <td>
                              <div>
                                {new Date(offer.validUntil).toLocaleDateString()}
                                {new Date(offer.validUntil) < new Date() && (
                                  <>
                                    <br />
                                    <small className="text-danger">Expired</small>
                                  </>
                                )}
                              </div>
                            </td>
                            <td>
                              {offer.respondedAt ? 
                                new Date(offer.respondedAt).toLocaleDateString() : 
                                '-'
                              }
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  title="View Details"
                                  onClick={() => {
                                    // You can implement a detailed view modal here
                                    alert('Offer details modal would open here');
                                  }}
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                
                                {offer.status === 'Accepted' && (
                                  <button 
                                    className="btn btn-sm btn-outline-success"
                                    title="Add to User Management"
                                    onClick={() => {
                                      // Navigate to user management with pre-filled data
                                      alert('Would redirect to User Management with pre-filled candidate data');
                                    }}
                                  >
                                    <i className="bi bi-person-plus"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {offerLetters.length === 0 && (
                    <div className="text-center py-4">
                      <i className="bi bi-envelope-x display-1 text-muted"></i>
                      <h5 className="mt-3 text-muted">No offer letters found</h5>
                      <p className="text-muted">Generate offer letters for selected candidates.</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <nav className="mt-4">
                      <ul className="pagination justify-content-center">
                        <li className={`page-item ${pagination.current === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link"
                            onClick={() => setPagination({...pagination, current: pagination.current - 1})}
                          >
                            Previous
                          </button>
                        </li>
                        {[...Array(pagination.pages)].map((_, i) => (
                          <li key={i + 1} className={`page-item ${pagination.current === i + 1 ? 'active' : ''}`}>
                            <button 
                              className="page-link"
                              onClick={() => setPagination({...pagination, current: i + 1})}
                            >
                              {i + 1}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${pagination.current === pagination.pages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link"
                            onClick={() => setPagination({...pagination, current: pagination.current + 1})}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Offer Modal */}
      {showModal && selectedApplication && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Generate Offer Letter - {selectedApplication.firstName} {selectedApplication.lastName}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleGenerateOffer}>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* Salary Details */}
                    <div className="col-12">
                      <h6 className="border-bottom pb-2">Salary Details</h6>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Basic Salary *</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={offerForm.salary.basic}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          salary: {...offerForm.salary, basic: e.target.value}
                        })}
                        onBlur={calculateCTC}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">HRA</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={offerForm.salary.hra}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          salary: {...offerForm.salary, hra: e.target.value}
                        })}
                        onBlur={calculateCTC}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Other Allowances</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={offerForm.salary.allowances}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          salary: {...offerForm.salary, allowances: e.target.value}
                        })}
                        onBlur={calculateCTC}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Total CTC *</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={offerForm.salary.ctc}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          salary: {...offerForm.salary, ctc: e.target.value}
                        })}
                        required
                      />
                    </div>

                    {/* Employment Details */}
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2">Employment Details</h6>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Employment Type</label>
                      <select 
                        className="form-select"
                        value={offerForm.employmentType}
                        onChange={(e) => setOfferForm({...offerForm, employmentType: e.target.value})}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Work Mode</label>
                      <select 
                        className="form-select"
                        value={offerForm.workMode}
                        onChange={(e) => setOfferForm({...offerForm, workMode: e.target.value})}
                      >
                        <option value="On-site">On-site</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Joining Date *</label>
                      <input 
                        type="date"
                        className="form-control"
                        value={offerForm.joiningDate}
                        onChange={(e) => setOfferForm({...offerForm, joiningDate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Probation Period (months)</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={offerForm.probationPeriod}
                        onChange={(e) => setOfferForm({...offerForm, probationPeriod: parseInt(e.target.value)})}
                        min="0"
                        max="12"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Notice Period (days)</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={offerForm.noticePeriod}
                        onChange={(e) => setOfferForm({...offerForm, noticePeriod: parseInt(e.target.value)})}
                        min="0"
                      />
                    </div>

                    {/* Reporting Manager */}
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2">Reporting Manager</h6>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Manager Name</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={offerForm.reportingManager.name}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          reportingManager: {...offerForm.reportingManager, name: e.target.value}
                        })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Designation</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={offerForm.reportingManager.designation}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          reportingManager: {...offerForm.reportingManager, designation: e.target.value}
                        })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Email</label>
                      <input 
                        type="email"
                        className="form-control"
                        value={offerForm.reportingManager.email}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          reportingManager: {...offerForm.reportingManager, email: e.target.value}
                        })}
                      />
                    </div>

                    {/* Benefits */}
                    <div className="col-12 mt-4">
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                        <h6 className="mb-0">Benefits</h6>
                        <button 
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={addBenefit}
                        >
                          <i className="bi bi-plus"></i> Add Benefit
                        </button>
                      </div>
                    </div>
                    {offerForm.benefits.map((benefit, index) => (
                      <div key={index} className="col-12">
                        <div className="input-group">
                          <input 
                            type="text"
                            className="form-control"
                            value={benefit}
                            onChange={(e) => updateBenefit(index, e.target.value)}
                            placeholder="Enter benefit"
                          />
                          <button 
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => removeBenefit(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Generate & Send Offer Letter
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

export default OfferLetters;
