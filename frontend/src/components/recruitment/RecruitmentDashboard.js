import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Refresh as RefreshIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const RecruitmentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recruitment/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      showAlert('Error fetching dashboard data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
  };

  const getStatusColor = (status) => {
    const variants = {
      'Pending': 'warning',
      'Reviewed': 'info',
      'Shortlisted': 'primary',
      'Interview Round 1': 'success',
      'Interview Round 2': 'success',
      'Interview Round 3': 'success',
      'Selected': 'success',
      'Rejected': 'error',
      'Offer Sent': 'info',
      'Offer Accepted': 'success',
      'Offer Rejected': 'error'
    };
    return variants[status] || 'default';
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div">
              {value || 0}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Box textAlign="center">
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Loading dashboard...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load dashboard data. Please try again.
        </Alert>
      </Box>
    );
  }

  const { summary, recentApplications, upcomingInterviews, applicationStats } = dashboardData;

  return (
    <Box sx={{ p: 3 }}>
      {alert.show && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert({ show: false, message: '', type: '' })}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Recruitment Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage hiring process and track recruitment metrics
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Jobs"
            value={summary.totalJobs}
            subtitle={`${summary.activeJobs} Active`}
            icon={<WorkIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Applications"
            value={summary.totalApplications}
            subtitle={`${summary.pendingApplications} Pending`}
            icon={<PersonIcon sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Scheduled Interviews"
            value={summary.scheduledInterviews}
            subtitle="Upcoming"
            icon={<EventIcon sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Offers"
            value={summary.pendingOffers}
            subtitle="Awaiting Response"
            icon={<EmailIcon sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Applications */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Applications</Typography>
                <Button
                  component={Link}
                  to="/admin/recruitment/applications"
                  variant="outlined"
                  size="small"
                >
                  View All
                </Button>
              </Box>
              
              {recentApplications.length === 0 ? (
                <Typography variant="body1" color="text.secondary" textAlign="center" py={3}>
                  No recent applications
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Applicant</TableCell>
                        <TableCell>Job</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Applied</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentApplications.map(application => (
                        <TableRow key={application._id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {application.firstName} {application.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {application.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {application.job?.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {application.job?.code}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={application.status}
                              color={getStatusColor(application.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(application.submittedAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Application Status Distribution */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Status Distribution
              </Typography>
              {applicationStats.length === 0 ? (
                <Typography variant="body1" color="text.secondary" textAlign="center" py={3}>
                  No application data available
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {applicationStats.map(stat => (
                    <Grid item xs={12} sm={6} md={4} key={stat._id}>
                      <Box textAlign="center" p={2}>
                        <Chip
                          label={stat._id}
                          color={getStatusColor(stat._id)}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="h4" component="div">
                          {stat.count}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Interviews & Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Upcoming Interviews</Typography>
                <Button
                  component={Link}
                  to="/admin/recruitment/interviews"
                  variant="outlined"
                  size="small"
                >
                  View All
                </Button>
              </Box>
              
              {upcomingInterviews.length === 0 ? (
                <Typography variant="body1" color="text.secondary" textAlign="center" py={3}>
                  No upcoming interviews
                </Typography>
              ) : (
                <Box>
                  {upcomingInterviews.map(interview => (
                    <Box key={interview._id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box flexGrow={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {interview.application?.firstName} {interview.application?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {interview.job?.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {new Date(interview.scheduledDate).toLocaleDateString()} at {interview.scheduledTime}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Chip label={`Round ${interview.round}`} color="info" size="small" />
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            {interview.primaryInterviewer?.firstName} {interview.primaryInterviewer?.lastName}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  component={Link}
                  to="/admin/recruitment/jobs"
                  variant="contained"
                  startIcon={<WorkIcon />}
                  fullWidth
                >
                  Manage Jobs
                </Button>
                <Button
                  component={Link}
                  to="/admin/recruitment/applications"
                  variant="contained"
                  color="info"
                  startIcon={<PersonIcon />}
                  fullWidth
                >
                  Review Applications
                </Button>
                <Button
                  component={Link}
                  to="/admin/recruitment/interviews"
                  variant="contained"
                  color="success"
                  startIcon={<EventIcon />}
                  fullWidth
                >
                  Schedule Interviews
                </Button>
                <Button
                  component={Link}
                  to="/admin/recruitment/offers"
                  variant="contained"
                  color="warning"
                  startIcon={<EmailIcon />}
                  fullWidth
                >
                  Manage Offers
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecruitmentDashboard;
