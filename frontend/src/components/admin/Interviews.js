import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Interviews = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    interviewer: '',
    status: '',
    job: '',
    date: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchInterviews();
  }, [filters, pagination.current]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.current,
        limit: 10,
        ...filters
      });

      const response = await fetch(`/api/recruitment/interviews?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInterviews(data.interviews);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><i className="bi bi-chat-dots me-2"></i>Interviews</h2>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="">All Status</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No Show">No Show</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Date</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={filters.date}
                    onChange={(e) => setFilters({...filters, date: e.target.value})}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">View</label>
                  <select 
                    className="form-select"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'upcoming') {
                        setFilters({...filters, date: new Date().toISOString().split('T')[0]});
                      } else if (value === 'today') {
                        setFilters({...filters, date: new Date().toISOString().split('T')[0]});
                      } else {
                        setFilters({...filters, date: ''});
                      }
                    }}
                  >
                    <option value="">All Interviews</option>
                    <option value="today">Today's Interviews</option>
                    <option value="upcoming">Upcoming Interviews</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-secondary mt-4"
                    onClick={() => setFilters({ interviewer: '', status: '', job: '', date: '' })}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interviews Table */}
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
                          <th>Round</th>
                          <th>Interviewer</th>
                          <th>Date & Time</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Duration</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interviews.map(interview => {
                          const dateTime = formatDateTime(interview.scheduledDate);
                          const upcoming = isUpcoming(interview.scheduledDate);
                          const past = isPast(interview.scheduledDate);
                          
                          return (
                            <tr key={interview._id} className={past && interview.status === 'Scheduled' ? 'table-warning' : ''}>
                              <td>
                                <div>
                                  <strong>{interview.application?.firstName} {interview.application?.lastName}</strong>
                                  <br />
                                  <small className="text-muted">{interview.application?.email}</small>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <strong>{interview.job?.title}</strong>
                                  <br />
                                  <small className="text-muted">{interview.job?.code}</small>
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-primary">Round {interview.round}</span>
                              </td>
                              <td>
                                <div>
                                  <strong>{interview.interviewer?.firstName} {interview.interviewer?.lastName}</strong>
                                  <br />
                                  <small className="text-muted">{interview.interviewer?.email}</small>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <strong>{dateTime.date}</strong>
                                  <br />
                                  <small className="text-muted">{dateTime.time}</small>
                                  {upcoming && (
                                    <>
                                      <br />
                                      <small className="text-success">
                                        <i className="bi bi-clock me-1"></i>Upcoming
                                      </small>
                                    </>
                                  )}
                                  {past && interview.status === 'Scheduled' && (
                                    <>
                                      <br />
                                      <small className="text-warning">
                                        <i className="bi bi-exclamation-triangle me-1"></i>Overdue
                                      </small>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${interview.type === 'Online' ? 'bg-info' : 'bg-secondary'}`}>
                                  {interview.type}
                                </span>
                                {interview.type === 'Online' && interview.meetingLink && (
                                  <div className="mt-1">
                                    <a 
                                      href={interview.meetingLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-outline-info"
                                      title="Join Meeting"
                                    >
                                      <i className="bi bi-camera-video"></i>
                                    </a>
                                  </div>
                                )}
                                {interview.type === 'Offline' && interview.location && (
                                  <div className="mt-1">
                                    <small className="text-muted">{interview.location}</small>
                                  </div>
                                )}
                              </td>
                              <td>
                                <span className={getStatusBadge(interview.status)}>
                                  {interview.status}
                                </span>
                              </td>
                              <td>{interview.duration} min</td>
                              <td>
                                <div className="btn-group" role="group">
                                  {interview.feedback && interview.feedback.submittedAt ? (
                                    <button 
                                      className="btn btn-sm btn-outline-success"
                                      title="Feedback Submitted"
                                      disabled
                                    >
                                      <i className="bi bi-check-circle"></i>
                                    </button>
                                  ) : (
                                    <button 
                                      className="btn btn-sm btn-outline-warning"
                                      title="Feedback Pending"
                                    >
                                      <i className="bi bi-clock"></i>
                                    </button>
                                  )}
                                  
                                  <button 
                                    className="btn btn-sm btn-outline-primary"
                                    title="View Details"
                                    onClick={() => {
                                      // You can implement a detailed view modal here
                                      alert('Interview details modal would open here');
                                    }}
                                  >
                                    <i className="bi bi-eye"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {interviews.length === 0 && (
                    <div className="text-center py-4">
                      <i className="bi bi-calendar-x display-1 text-muted"></i>
                      <h5 className="mt-3 text-muted">No interviews found</h5>
                      <p className="text-muted">Try adjusting your filters or check back later.</p>
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

          {/* Quick Stats */}
          <div className="row mt-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title">Today's Interviews</h6>
                      <h4>{interviews.filter(i => 
                        new Date(i.scheduledDate).toDateString() === new Date().toDateString()
                      ).length}</h4>
                    </div>
                    <div className="align-self-center">
                      <i className="bi bi-calendar-day display-6"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title">Completed</h6>
                      <h4>{interviews.filter(i => i.status === 'Completed').length}</h4>
                    </div>
                    <div className="align-self-center">
                      <i className="bi bi-check-circle display-6"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title">Pending Feedback</h6>
                      <h4>{interviews.filter(i => 
                        i.status === 'Completed' && (!i.feedback || !i.feedback.submittedAt)
                      ).length}</h4>
                    </div>
                    <div className="align-self-center">
                      <i className="bi bi-clock display-6"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title">Upcoming</h6>
                      <h4>{interviews.filter(i => 
                        new Date(i.scheduledDate) > new Date() && i.status === 'Scheduled'
                      ).length}</h4>
                    </div>
                    <div className="align-self-center">
                      <i className="bi bi-calendar-plus display-6"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interviews;
