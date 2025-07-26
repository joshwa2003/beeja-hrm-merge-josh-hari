import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Menu,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  Work as WorkIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const JobPostings = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    search: ''
  });
  
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    department: '',
    team: '',
    description: '',
    requirements: {
      education: '',
      experience: { min: 0, max: 10 },
      skills: [],
      certifications: []
    },
    salary: {
      min: '',
      max: '',
      currency: 'INR'
    },
    employmentType: 'Full-time',
    workMode: 'On-site',
    location: '',
    openings: 1,
    priority: 'Medium',
    closingDate: '',
    hiringManager: '',
    recruiter: '',
    interviewProcess: [],
    benefits: [],
    tags: [],
    isUrgent: false,
    isRemote: false
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchJobs();
    fetchDepartments();
    fetchUsers();
  }, [filters, pagination.current]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 10,
        ...filters
      });
      
      const response = await api.get(`/recruitment/jobs?${params}`);
      setJobs(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      showAlert('Error fetching jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const userData = response.data?.data || [];
      setUsers(userData.filter(u => u.role !== 'Employee'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTeams = async (departmentId) => {
    try {
      const response = await api.get(`/teams?department=${departmentId}`);
      setTeams(response.data.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.code.trim()) newErrors.code = 'Job code is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.hiringManager) newErrors.hiringManager = 'Hiring manager is required';
    if (formData.openings < 1) newErrors.openings = 'At least 1 opening is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const submitData = {
        ...formData,
        requirements: {
          ...formData.requirements,
          skills: formData.requirements.skills.filter(s => s.trim()),
          certifications: formData.requirements.certifications.filter(c => c.trim())
        },
        benefits: formData.benefits.filter(b => b.trim()),
        tags: formData.tags.filter(t => t.trim())
      };

      if (editingJob) {
        await api.put(`/recruitment/jobs/${editingJob._id}`, submitData);
        showAlert('Job updated successfully', 'success');
      } else {
        await api.post('/recruitment/jobs', submitData);
        showAlert('Job created successfully', 'success');
      }
      
      setShowModal(false);
      setEditingJob(null);
      resetForm();
      fetchJobs();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error saving job', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      department: '',
      team: '',
      description: '',
      requirements: {
        education: '',
        experience: { min: 0, max: 10 },
        skills: [],
        certifications: []
      },
      salary: {
        min: '',
        max: '',
        currency: 'INR'
      },
      employmentType: 'Full-time',
      workMode: 'On-site',
      location: '',
      openings: 1,
      priority: 'Medium',
      closingDate: '',
      hiringManager: '',
      recruiter: '',
      interviewProcess: [],
      benefits: [],
      tags: [],
      isUrgent: false,
      isRemote: false
    });
    setErrors({});
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      ...job,
      department: job.department?._id || '',
      team: job.team?._id || '',
      hiringManager: job.hiringManager?._id || '',
      recruiter: job.recruiter?._id || '',
      closingDate: job.closingDate ? new Date(job.closingDate).toISOString().split('T')[0] : ''
    });
    
    if (job.department?._id) {
      fetchTeams(job.department._id);
    }
    
    setShowModal(true);
    setAnchorEl(null);
  };

  const handlePublish = async (jobId) => {
    try {
      await api.patch(`/recruitment/jobs/${jobId}/publish`);
      showAlert('Job published successfully', 'success');
      fetchJobs();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error publishing job', 'error');
    }
    setAnchorEl(null);
  };

  const handleClose = async (jobId) => {
    const reason = prompt('Please provide a reason for closing this job:');
    if (!reason) return;
    
    try {
      await api.patch(`/recruitment/jobs/${jobId}/close`, { reason });
      showAlert('Job closed successfully', 'success');
      fetchJobs();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error closing job', 'error');
    }
    setAnchorEl(null);
  };

  const getStatusColor = (status) => {
    const variants = {
      'Draft': 'default',
      'Active': 'success',
      'Paused': 'warning',
      'Closed': 'error',
      'Cancelled': 'default'
    };
    return variants[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const variants = {
      'Low': 'info',
      'Medium': 'primary',
      'High': 'warning',
      'Urgent': 'error'
    };
    return variants[priority] || 'primary';
  };

  const handleMenuClick = (event, job) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

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
            <WorkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Job Postings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage job openings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowModal(true)}
        >
          Create Job
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Paused">Paused</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.department}
                  label="Department"
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments && departments.map(dept => (
                    <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Search by title, code, or description..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchJobs}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Box textAlign="center">
                <CircularProgress />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Loading jobs...
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Job Title</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Openings</TableCell>
                      <TableCell>Posted Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobs && jobs.map(job => (
                      <TableRow key={job._id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {job.title}
                              {job.isUrgent && (
                                <Chip label="Urgent" color="error" size="small" sx={{ ml: 1 }} />
                              )}
                              {job.isRemote && (
                                <Chip label="Remote" color="info" size="small" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {job.location}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {job.code}
                          </Typography>
                        </TableCell>
                        <TableCell>{job.department?.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={job.status}
                            color={getStatusColor(job.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={job.priority}
                            color={getPriorityColor(job.priority)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{job.openings}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={(e) => handleMenuClick(e, job)}
                            size="small"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={pagination.pages}
                    page={pagination.current}
                    onChange={(event, page) => setPagination(prev => ({ ...prev, current: page }))}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEdit(selectedJob)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {selectedJob?.status === 'Draft' && (
          <MenuItem onClick={() => handlePublish(selectedJob._id)}>
            <PlayArrowIcon sx={{ mr: 1 }} />
            Publish
          </MenuItem>
        )}
        {selectedJob?.status === 'Active' && (
          <MenuItem onClick={() => handleClose(selectedJob._id)}>
            <StopIcon sx={{ mr: 1 }} />
            Close
          </MenuItem>
        )}
        <MenuItem onClick={() => window.location.href = `/admin/recruitment/applications?job=${selectedJob?._id}`}>
          <PersonIcon sx={{ mr: 1 }} />
          View Applications
        </MenuItem>
      </Menu>

      {/* Create/Edit Job Dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingJob ? 'Edit Job' : 'Create New Job'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Job Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={!!errors.title}
                  helperText={errors.title}
                  placeholder="e.g., Senior Software Engineer"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Job Code *"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  error={!!errors.code}
                  helperText={errors.code}
                  placeholder="e.g., SSE001"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.department}>
                  <InputLabel>Department *</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    label="Department *"
                    onChange={(e) => {
                      handleInputChange(e);
                      if (e.target.value) {
                        fetchTeams(e.target.value);
                      } else {
                        setTeams([]);
                      }
                    }}
                  >
                  <MenuItem value="">Select Department</MenuItem>
                  {departments && departments.map(dept => (
                    <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                  ))}
                  </Select>
                  {errors.department && (
                    <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                      {errors.department}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!formData.department}>
                  <InputLabel>Team</InputLabel>
                  <Select
                    name="team"
                    value={formData.team}
                    label="Team"
                    onChange={handleInputChange}
                  >
                  <MenuItem value="">Select Team</MenuItem>
                  {teams && teams.map(team => (
                    <MenuItem key={team._id} value={team._id}>{team.name}</MenuItem>
                  ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Job Description *"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  error={!!errors.description}
                  helperText={errors.description}
                  placeholder="Describe the role, responsibilities, and requirements..."
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Employment Type</InputLabel>
                  <Select
                    name="employmentType"
                    value={formData.employmentType}
                    label="Employment Type"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="Full-time">Full-time</MenuItem>
                    <MenuItem value="Part-time">Part-time</MenuItem>
                    <MenuItem value="Contract">Contract</MenuItem>
                    <MenuItem value="Internship">Internship</MenuItem>
                    <MenuItem value="Freelance">Freelance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Work Mode</InputLabel>
                  <Select
                    name="workMode"
                    value={formData.workMode}
                    label="Work Mode"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="On-site">On-site</MenuItem>
                    <MenuItem value="Remote">Remote</MenuItem>
                    <MenuItem value="Hybrid">Hybrid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    label="Priority"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location *"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  error={!!errors.location}
                  helperText={errors.location}
                  placeholder="e.g., Bangalore, India"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Openings *"
                  name="openings"
                  value={formData.openings}
                  onChange={handleInputChange}
                  error={!!errors.openings}
                  helperText={errors.openings}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Closing Date"
                  name="closingDate"
                  value={formData.closingDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.hiringManager}>
                  <InputLabel>Hiring Manager *</InputLabel>
                  <Select
                    name="hiringManager"
                    value={formData.hiringManager}
                    label="Hiring Manager *"
                    onChange={handleInputChange}
                  >
                  <MenuItem value="">Select Hiring Manager</MenuItem>
                  {users && users.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </MenuItem>
                  ))}
                  </Select>
                  {errors.hiringManager && (
                    <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                      {errors.hiringManager}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Recruiter</InputLabel>
                  <Select
                    name="recruiter"
                    value={formData.recruiter}
                    label="Recruiter"
                    onChange={handleInputChange}
                  >
                  <MenuItem value="">Select Recruiter</MenuItem>
                  {users && users.filter(u => u.role.includes('HR')).map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </MenuItem>
                  ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isUrgent"
                      checked={formData.isUrgent}
                      onChange={handleInputChange}
                    />
                  }
                  label="Mark as Urgent"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isRemote"
                      checked={formData.isRemote}
                      onChange={handleInputChange}
                    />
                  }
                  label="Remote Position"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {editingJob ? 'Update Job' : 'Create Job'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default JobPostings;
