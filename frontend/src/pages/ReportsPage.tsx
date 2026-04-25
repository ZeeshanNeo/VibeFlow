import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Alert,
  IconButton,
  Divider,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Download,
  RefreshCw,
  BarChart3,
  Clock,
  ChevronRight,
  TrendingUp,
  FileText,
  LayoutGrid as Kanban,
  FolderKanban,
  LogOut,
  Bell,
  HelpCircle,
  Settings,
  Zap,
  Search,
  Filter,
  Sun,
  Moon,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import taskService, { TimeReportTask } from '../services/taskService';
import projectService, { Project } from '../services/projectService';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Tooltip } from '@mui/material';
import UserProfileMenu from '../components/UserProfileMenu';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const pId = Number(projectId);
  
  const { logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<TimeReportTask[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string>(new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load both project info and report data
      const [report, projData] = await Promise.all([
        taskService.getTimeReport(pId),
        projectService.getProject(pId)
      ]);
      setTasks(report.tasks);
      setGeneratedAt(report.generatedAt);
      setProject(projData.project);
    } catch (err: any) {
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pId) {
      loadReport();
    } else {
      navigate('/projects');
    }
  }, [pId]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(filterSearch.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const grandTotal = filteredTasks.reduce((sum, task) => sum + task.totalHours, 0);
  const averagePerTask = filteredTasks.length > 0 ? grandTotal / filteredTasks.length : 0;
  const maxTaskHours = filteredTasks.length > 0 ? Math.max(...filteredTasks.map((task) => task.totalHours), 0) : 0;

  const getStatusChip = (status: string) => {
    const configs: Record<string, { bg: string, color: string }> = {
      backlog: { bg: 'rgba(143, 155, 171, 0.1)', color: '#8C9BAB' },
      todo: { bg: 'rgba(12, 102, 228, 0.2)', color: '#4C9AFF' },
      in_progress: { bg: 'rgba(241, 161, 13, 0.2)', color: '#F1A10D' },
      review: { bg: 'rgba(101, 84, 192, 0.2)', color: '#998DD9' },
      testing: { bg: 'rgba(0, 184, 217, 0.2)', color: '#00B8D9' },
      done: { bg: 'rgba(31, 132, 90, 0.2)', color: '#1F845A' },
      blocked: { bg: 'rgba(255, 86, 48, 0.2)', color: '#FF5630' },
      archived: { bg: 'rgba(66, 82, 110, 0.2)', color: '#8C9BAB' },
    };
    const config = configs[status] || configs.backlog;
    return (
      <Chip 
        label={status.replace('_', ' ').toUpperCase()} 
        size="small" 
        sx={{ 
          bgcolor: config.bg, 
          color: config.color, 
          fontWeight: 700, 
          fontSize: '0.65rem',
          borderRadius: '3px'
        }} 
      />
    );
  };

  const handleExport = () => {
    const headers = ['Task Title', 'Status', 'Assignee', 'Total Hours'];
    const rows = filteredTasks.map((task) => [
      `"${task.title.replace(/"/g, '""')}"`,
      task.status,
      `"${(task.assigneeName || 'Unassigned').replace(/"/g, '""')}"`,
      task.totalHours.toFixed(2),
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vbeflow-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
  };

  const SidebarItem = ({ label, icon, active, onClick }: any) => (
    <Box onClick={onClick} sx={{
      py: 1.2, px: 3, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
      borderRadius: '4px', mx: 1.5,
      bgcolor: active ? (mode === 'dark' ? 'rgba(12,102,228,0.2)' : 'rgba(12,102,228,0.1)') : 'transparent',
      color: active ? (mode === 'dark' ? '#4C9AFF' : '#0C66E4') : 'text.secondary',
      borderLeft: active ? '3px solid #0C66E4' : '3px solid transparent',
      '&:hover': { bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(9,30,66,0.05)' }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontWeight: active ? 600 : 400 }}>{label}</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Box sx={{ width: 270, bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', py: 3, flexShrink: 0 }}>
        <Box sx={{ px: 3, mb: 5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: '#0C66E4', p: 0.5, borderRadius: 0.5 }}><Kanban color="white" size={24} /></Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '0.02em' }}>Vibe Flow</Typography>
        </Box>

        <Box sx={{ mb: 2, px: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#8C9BAB', letterSpacing: '0.05em' }}>PROJECT</Typography>
        </Box>
        {project && (
          <Box sx={{ mx: 1.5, mb: 3, px: 1.5, py: 1.5, borderRadius: 1.5, bgcolor: mode === 'dark' ? 'rgba(12,102,228,0.1)' : 'rgba(12,102,228,0.06)', border: '1px solid', borderColor: mode === 'dark' ? 'rgba(12,102,228,0.3)' : 'rgba(12,102,228,0.2)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#0C66E4', borderRadius: 1, fontSize: '0.8rem', fontWeight: 800 }}>
                {project.key?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>{project.name}</Typography>
                <Typography variant="caption" sx={{ color: '#8C9BAB' }}>{project.key}</Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Box sx={{ mb: 2, px: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#8C9BAB', letterSpacing: '0.05em' }}>VIEWS</Typography>
        </Box>
        <SidebarItem label="Board"       icon={<Kanban size={18} />}      onClick={() => navigate(`/projects/${pId}/board`)} />
        <SidebarItem label="Time Reports"  icon={<BarChart3 size={18} />}   active />
        <SidebarItem label="All Projects" icon={<FolderKanban size={18} />} onClick={() => navigate('/projects')} />

        <Box sx={{ mt: 'auto', px: 3 }}>
          <Button
            fullWidth onClick={logout} startIcon={<LogOut size={18} />}
            sx={{ color: '#8C9BAB', justifyContent: 'flex-start', py: 1.5 }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Global Toolbar */}
        <Box sx={{ height: 56, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
             <Breadcrumbs separator={<ChevronRight size={14} color="text.secondary" />}>
                <Link underline="hover" onClick={() => navigate('/projects')} sx={{ color: 'text.secondary', fontSize: '0.875rem', cursor: 'pointer' }}>Projects</Link>
                <Link underline="hover" onClick={() => navigate(`/projects/${pId}/board`)} sx={{ color: 'text.secondary', fontSize: '0.875rem', cursor: 'pointer' }}>{project?.name || 'Project'}</Link>
                <Typography sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 500 }}>Time Reports</Typography>
             </Breadcrumbs>
          </Box>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
                <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
                  {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </IconButton>
              </Tooltip>
              <IconButton sx={{ color: 'text.secondary' }}><Bell size={20} /></IconButton>
              <IconButton sx={{ color: 'text.secondary' }}><HelpCircle size={20} /></IconButton>
              <IconButton sx={{ color: 'text.secondary' }}><Settings size={20} /></IconButton>
              <UserProfileMenu />
           </Box>
        </Box>

        {/* Subnav Tabs */}
        <Box sx={{ px: 4, pt: 3, pb: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Spaces</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, mb: 2 }}>
            <Box sx={{ bgcolor: '#0C66E4', width: 32, height: 32, borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>
              {project?.key?.[0] || 'V'}
            </Box>
            <Typography variant="h4" sx={{ letterSpacing: '0.02em', color: 'text.primary', textTransform: 'uppercase' }}>{project?.name || 'VIBE FLOW'}</Typography>
          </Box>

          <Tabs 
            value={1}
            onChange={(_, v) => {
               if (v === 0) navigate(`/projects/${pId}/board`);
            }}
            sx={{ 
              minHeight: 'unset',
              '& .MuiTabs-indicator': { height: 3, bgcolor: '#0C66E4' },
              '& .MuiTab-root': { color: 'text.secondary', minHeight: 'unset', py: 1.5, textTransform: 'none', fontWeight: 600, px: 2 }
            }}
          >
            <Tab label="Board" icon={<Kanban size={16} />} iconPosition="start" />
            <Tab label="Time Reports" icon={<BarChart3 size={16} />} iconPosition="start" />
          </Tabs>
          <Divider sx={{ border: 'none', height: 1, bgcolor: 'divider' }} />
          
        </Box>

        <Box sx={{ p: 4 }}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Box sx={{ mb: 2, mt: 1 }}>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>Time Reports</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>Analysis of work logs for project <strong>{project?.name}</strong> ({project?.key}).</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" startIcon={<RefreshCw size={14} />} onClick={loadReport} disabled={loading} sx={{ color: '#8C9BAB' }}>Refresh</Button>
              <Button variant="contained" startIcon={<Download size={14} />} onClick={handleExport} disabled={tasks.length === 0}>Export CSV</Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', mb: 4 }}>
            <TextField
                size="small" placeholder="Search report..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                sx={{ 
                  width: 280, 
                  '& .MuiOutlinedInput-root': { bgcolor: mode === 'dark' ? '#22272b' : '#FFFFFF', borderRadius: 1.5 },
                  '& .MuiInputBase-input': { color: 'text.primary', fontSize: '0.85rem' }
                }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} color="#8C9BAB" /></InputAdornment> } }}
            />
            
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                startAdornment={<InputAdornment position="start"><Filter size={14} color="#8C9BAB" /></InputAdornment>}
                sx={{ 
                  bgcolor: mode === 'dark' ? '#22272b' : '#FFFFFF', 
                  borderRadius: 1.5,
                  fontSize: '0.85rem',
                  color: 'text.primary'
                }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="backlog">Backlog</MenuItem>
                <MenuItem value="todo">To Do</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="testing">Testing</MenuItem>
                <MenuItem value="done">Done</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>

            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'divider', height: 28, alignSelf: 'center' }} />
            
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              Showing {filteredTasks.length} of {tasks.length} entries
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, mb: 4 }}>
            {[
              { label: 'Total Hours', value: grandTotal.toFixed(1), icon: <Clock size={20} />, color: '#0C66E4' },
              { label: 'Average/Task', value: averagePerTask.toFixed(1), icon: <TrendingUp size={20} />, color: '#1F845A' },
              { label: 'Generated', value: format(new Date(generatedAt), 'p'), icon: <FileText size={20} />, color: '#998DD9' },
            ].map((stat, idx) => (
              <Card key={idx} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>{stat.value}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{stat.label}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>TASK TITLE</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>STATUS</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ASSIGNEE</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 700 }}>HOURS</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>CHART</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                  ) : (
                    filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>{task.title}</TableCell>
                        <TableCell>{getStatusChip(task.status)}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{task.assigneeName || '--'}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.primary', fontWeight: 700 }}>{task.totalHours.toFixed(1)}h</TableCell>
                        <TableCell>
                          <LinearProgress 
                            variant="determinate" value={(task.totalHours / (maxTaskHours || 1)) * 100} 
                            sx={{ height: 6, borderRadius: 3, bgcolor: 'background.default', '& .MuiLinearProgress-bar': { bgcolor: '#0C66E4' } }} 
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ReportsPage;
