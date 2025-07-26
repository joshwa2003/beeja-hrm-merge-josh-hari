import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import MyProfile from './components/MyProfile';
import Dashboard from './components/Dashboard';
import DepartmentManagement from './components/admin/DepartmentManagement';
import LeaveApproval from './components/admin/LeaveApproval';
import LeavePolicy from './components/admin/LeavePolicy';
import LeaveRequest from './components/employee/LeaveRequest';
import LeaveHistory from './components/employee/LeaveHistory';
import UserManagement from './components/admin/UserManagement';
import AddUser from './components/admin/AddUser';
import UserRoles from './components/admin/UserRoles';
import TeamManagement from './components/admin/TeamManagement';
import OrganizationChart from './components/admin/OrganizationChart';
import HolidayCalendar from './components/admin/HolidayCalendar';
import MyTeamDashboard from './components/MyTeamDashboard';
import MyManagedTeamsDashboard from './components/MyManagedTeamsDashboard';

// Chat Components
import ChatInterface from './components/chat/ChatInterface';

// Helpdesk Components
import TicketDashboard from './components/helpdesk/TicketDashboard';
import CreateTicket from './components/helpdesk/CreateTicket';
import MyTickets from './components/helpdesk/MyTickets';
import TicketDetails from './components/helpdesk/TicketDetails';
import FAQManagement from './components/helpdesk/FAQManagement';

// Recruitment Components
import RecruitmentDashboard from './components/recruitment/RecruitmentDashboard';
import JobPostings from './components/recruitment/JobPostings';
import Applications from './components/recruitment/Applications';
import InterviewSchedule from './components/recruitment/InterviewSchedule';
import PublicJobApplication from './components/recruitment/PublicJobApplication';


function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyProfile />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/departments" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive']}>
                  <Layout>
                    <DepartmentManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* User Management Routes */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive']}>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/add" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR Manager']}>
                  <Layout>
                    <AddUser />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/roles" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <UserRoles />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Leave Management Routes */}
            <Route 
              path="/admin/leave/requests" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <LeaveApproval />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Leave Policy Route */}
            <Route 
              path="/admin/leave/policies" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive']}>
                  <Layout>
                    <LeavePolicy />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Holiday Calendar Route */}
            <Route 
              path="/admin/leave/holidays" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <HolidayCalendar />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Employee Leave Routes */}
            <Route 
              path="/employee/leave/apply" 
              element={
                <ProtectedRoute requiredRoles={['Employee', 'Team Leader', 'Team Manager', 'HR Executive', 'HR Manager', 'HR BP', 'Vice President', 'Admin']}>
                  <Layout>
                    <LeaveRequest />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/employee/leave/history" 
              element={
                <ProtectedRoute requiredRoles={['Employee', 'Team Leader', 'Team Manager', 'HR Executive', 'HR Manager', 'HR BP', 'Vice President', 'Admin']}>
                  <Layout>
                    <LeaveHistory />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Other Leave & Attendance Routes */}
            
            {/* Team Management Routes */}
            <Route
              path="/admin/teams"
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <TeamManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Organization Chart Route */}
            <Route
              path="/admin/org-chart"
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive']}>
                  <Layout>
                    <OrganizationChart />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* My Team Dashboard for Team Leaders */}
            <Route
              path="/my-team"
              element={
                <ProtectedRoute requiredRoles={['Team Leader']}>
                  <Layout>
                    <MyTeamDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* My Teams Dashboard for Team Managers */}
            <Route
              path="/my-teams"
              element={
                <ProtectedRoute requiredRoles={['Team Manager']}>
                  <Layout>
                    <MyManagedTeamsDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Chat Route */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute requiredRoles={['Employee', 'Team Leader', 'Team Manager', 'HR Executive', 'HR Manager', 'HR BP', 'Vice President', 'Admin']}>
                  <Layout>
                    <ChatInterface />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Helpdesk Routes */}
            <Route
              path="/helpdesk"
              element={
                <ProtectedRoute requiredRoles={['Employee', 'Team Leader', 'Team Manager', 'HR Executive', 'HR Manager', 'HR BP', 'Vice President', 'Admin']}>
                  <Layout>
                    <TicketDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk/create"
              element={
                <ProtectedRoute requiredRoles={['Employee', 'Team Leader', 'Team Manager', 'HR Executive', 'HR Manager', 'HR BP', 'Vice President', 'Admin']}>
                  <Layout>
                    <CreateTicket />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk/tickets/:id"
              element={
                <ProtectedRoute requiredRoles={['Employee', 'Team Leader', 'Team Manager', 'HR Executive', 'HR Manager', 'HR BP', 'Vice President', 'Admin']}>
                  <Layout>
                    <TicketDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk/my-tickets"
              element={
                <ProtectedRoute requiredRoles={['Employee', 'Team Leader', 'Team Manager', 'HR Executive', 'HR Manager', 'HR BP', 'Vice President', 'Admin']}>
                  <Layout>
                    <MyTickets />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk/all-tickets"
              element={
                <ProtectedRoute requiredRoles={['HR Executive', 'HR Manager', 'HR BP', 'Vice President', 'Admin']}>
                  <Layout>
                    <TicketDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk/manage-faq"
              element={
                <ProtectedRoute requiredRoles={['HR Executive', 'HR Manager', 'HR BP', 'Vice President', 'Admin']}>
                  <Layout>
                    <FAQManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk/faq"
              element={
                <ProtectedRoute requiredRoles={['Employee', 'Team Leader', 'Team Manager', 'HR Executive', 'HR Manager', 'HR BP', 'Vice President', 'Admin']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-info">
                        <h4><i className="bi bi-question-circle me-2"></i>FAQ & Knowledge Base</h4>
                        <p>This section will include:</p>
                        <ul>
                          <li>Searchable FAQ database</li>
                          <li>Category-wise FAQ browsing</li>
                          <li>Popular and recent FAQs</li>
                          <li>FAQ feedback and ratings</li>
                          <li>Related FAQ suggestions</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk/reports"
              element={
                <ProtectedRoute requiredRoles={['HR Executive', 'HR Manager', 'HR BP', 'Vice President', 'Admin']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-success">
                        <h4><i className="bi bi-graph-up me-2"></i>Helpdesk Reports & Analytics</h4>
                        <p>This section will include:</p>
                        <ul>
                          <li>Ticket volume and trends</li>
                          <li>Response and resolution time metrics</li>
                          <li>Category-wise ticket analysis</li>
                          <li>Agent performance reports</li>
                          <li>Customer satisfaction scores</li>
                          <li>SLA compliance reports</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
                      {/* Leave & Attendance Routes */}
            <Route 
              path="/admin/leave/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-success">
                        <h4><i className="bi bi-calendar3 me-2"></i>Leave & Attendance Management</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>Leave request approval workflow</li>
                          <li>Attendance tracking and reports</li>
                          <li>Holiday calendar management</li>
                          <li>Leave policy configuration</li>
                          <li>Attendance regularization</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Payroll Routes */}
            <Route 
              path="/admin/payroll/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-primary">
                        <h4><i className="bi bi-currency-dollar me-2"></i>Payroll Management</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>Salary structure definition</li>
                          <li>Monthly payroll processing</li>
                          <li>Payslip generation and distribution</li>
                          <li>Tax calculations and deductions</li>
                          <li>Reimbursement management</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Performance Routes */}
            <Route 
              path="/admin/performance/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-warning">
                        <h4><i className="bi bi-graph-up-arrow me-2"></i>Performance Management</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>Goal setting and tracking</li>
                          <li>Performance review cycles</li>
                          <li>360-degree feedback</li>
                          <li>Appraisal management</li>
                          <li>Performance analytics</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Training Routes */}
            <Route 
              path="/admin/training/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-info">
                        <h4><i className="bi bi-book me-2"></i>Training Management</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>Training program creation</li>
                          <li>Employee enrollment</li>
                          <li>Training calendar and scheduling</li>
                          <li>Certification tracking</li>
                          <li>Training effectiveness reports</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Recruitment Routes */}
            <Route 
              path="/admin/recruitment" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive']}>
                  <Layout>
                    <RecruitmentDashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/recruitment/jobs" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive']}>
                  <Layout>
                    <JobPostings />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/recruitment/applications" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive']}>
                  <Layout>
                    <Applications />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/recruitment/interviews" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <InterviewSchedule />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Public Recruitment Routes */}
            <Route 
              path="/jobs/:jobId/apply" 
              element={<PublicJobApplication />} 
            />

            {/* Reports Routes */}
            <Route 
              path="/admin/reports/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-dark">
                        <h4><i className="bi bi-bar-chart me-2"></i>Reports & Analytics</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>Employee reports and analytics</li>
                          <li>Attendance and leave reports</li>
                          <li>Performance dashboards</li>
                          <li>Payroll reports</li>
                          <li>Custom report builder</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* System Settings Routes - Admin Only */}
            <Route 
              path="/admin/settings/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-danger">
                        <h4><i className="bi bi-gear me-2"></i>System Settings</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>General system configuration</li>
                          <li>User roles and permissions</li>
                          <li>Email templates and notifications</li>
                          <li>Approval workflows</li>
                          <li>Audit logs and security</li>
                          <li>Backup and restore</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Employee Self-Service Routes */}
            <Route 
              path="/employee/*" 
              element={
                <ProtectedRoute requiredRoles={['Employee']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-light border">
                        <h4><i className="bi bi-person-circle me-2"></i>Employee Self-Service</h4>
                        <p>This section will include:</p>
                        <ul>
                          <li>Personal profile management</li>
                          <li>Leave application and history</li>
                          <li>Attendance tracking</li>
                          <li>Payslip downloads</li>
                          <li>Training enrollment</li>
                          <li>Performance goals</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 Page */}
            <Route 
              path="*" 
              element={
                <Layout>
                  <div className="container-fluid">
                    <div className="row justify-content-center">
                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-body text-center">
                            <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
                            <h2 className="card-title mt-3">Page Not Found</h2>
                            <p className="card-text text-muted">
                              The page you're looking for doesn't exist.
                            </p>
                            <button 
                              className="btn btn-primary"
                              onClick={() => window.location.href = '/dashboard'}
                            >
                              <i className="bi bi-house me-2"></i>
                              Go to Dashboard
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Layout>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
