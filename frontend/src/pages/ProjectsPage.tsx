import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardActionArea,
  Avatar, Chip, IconButton, Tooltip, CircularProgress, Alert,
  InputAdornment, TextField, Divider,
} from '@mui/material';
import {
  LayoutGrid as Kanban, Plus, Search, Settings, Bell, HelpCircle,
  FolderKanban, Users, ClipboardList, Zap, Calendar, BarChart3,
  Sun, Moon, Trash2, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import projectService, { Project } from '../services/projectService';
import CreateProjectModal from '../components/CreateProjectModal';
import UserProfileMenu from '../components/UserProfileMenu';



const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { mode, toggleTheme } = useTheme();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (e: any) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.key.toLowerCase().includes(search.toLowerCase())
  );

  const bgColor = mode === 'dark' ? '#1d2125' : '#F4F5F7';
  const paperColor = mode === 'dark' ? '#22272b' : '#FFFFFF';
  const sidebarColor = mode === 'dark' ? '#161b22' : '#FAFBFC';
  const textPrimary = mode === 'dark' ? '#B6C2CF' : '#172B4D';

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: bgColor, overflow: 'hidden' }}>
      {/* Sidebar */}
      <Box sx={{ width: 270, bgcolor: sidebarColor, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', py: 3, flexShrink: 0 }}>
        <Box sx={{ px: 3, mb: 5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: '#0C66E4', p: 0.5, borderRadius: 0.5 }}><Kanban color="white" size={24} /></Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '0.02em' }}>Vibe Flow</Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ px: 3, mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#8C9BAB', letterSpacing: '0.05em' }}>MAIN MENU</Typography>
          </Box>
          {[
            { label: 'Projects', icon: <FolderKanban size={18} />, active: true, onClick: () => navigate('/projects') },
          ].map((item, idx) => (
            <Box
              key={idx}
              onClick={item.onClick}
              sx={{
                py: 1.2, px: 3, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', borderRadius: '4px', mx: 1.5,
                bgcolor: item.active ? (mode === 'dark' ? 'rgba(12, 102, 228, 0.2)' : 'rgba(12, 102, 228, 0.1)') : 'transparent',
                color: item.active ? (mode === 'dark' ? '#4C9AFF' : '#0C66E4') : 'text.secondary',
                borderLeft: item.active ? '3px solid #0C66E4' : '3px solid transparent',
                '&:hover': { bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(9,30,66,0.05)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>{item.icon}</Box>
              <Typography variant="body2" sx={{ fontWeight: item.active ? 600 : 400 }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 'auto', px: 3 }}>
          <Button fullWidth onClick={logout} startIcon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
            sx={{ color: '#8C9BAB', justifyContent: 'flex-start', py: 1.5 }}>Logout</Button>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1.5, bgcolor: sidebarColor, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
              {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
            <IconButton sx={{ color: 'text.secondary' }}><Bell size={20} /></IconButton>
            <IconButton sx={{ color: 'text.secondary' }}><HelpCircle size={20} /></IconButton>
            <IconButton sx={{ color: 'text.secondary' }}><Settings size={20} /></IconButton>
            <UserProfileMenu />
          </Box>
        </Box>

        {/* Page body */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, mb: 0.5 }}>Projects</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Manage your software projects and track progress in one place.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={(e) => {
                e.stopPropagation();
                setCreateOpen(true);
              }}
              sx={{ borderRadius: 2, fontWeight: 700, px: 3, py: 1.2, zIndex: 100 }}
            >
              Create Project
            </Button>
          </Box>

          {/* Search */}
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            size="small"
            sx={{ mb: 3, maxWidth: 340 }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><Search size={16} color="#8C9BAB" /></InputAdornment> }
            }}
            fullWidth
          />

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 10 }}>
              <FolderKanban size={56} color="#8C9BAB" style={{ marginBottom: 16 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>No projects found</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>Create your first project to get started</Typography>
              <Button variant="contained" startIcon={<Plus size={16} />} onClick={(e) => { e.stopPropagation(); setCreateOpen(true); }}>Create Project</Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filtered.map((project) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                  <Card
                    elevation={0}
                    sx={{
                      border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: paperColor,
                      transition: 'all 0.2s', cursor: 'pointer',
                      '&:hover': { borderColor: '#0C66E4', boxShadow: '0 4px 20px rgba(12,102,228,0.12)', transform: 'translateY(-2px)' }
                    }}
                    onClick={() => navigate(`/projects/${project.id}/board`)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: '#0C66E4', borderRadius: 1.5, fontSize: '1rem', fontWeight: 800 }}>
                            {project.key?.charAt(0) || project.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: textPrimary, lineHeight: 1.2 }}>{project.name}</Typography>
                            <Typography variant="caption" sx={{ color: '#8C9BAB', fontWeight: 600, letterSpacing: '0.04em' }}>{project.key}</Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={!project.my_role ? 'Public' : (project.my_role === 'admin' ? 'Admin' : 'Member')}
                          size="small"
                          sx={{
                            bgcolor: !project.my_role ? 'rgba(255,255,255,0.1)' : (project.my_role === 'admin' ? 'rgba(12,102,228,0.15)' : 'rgba(31,132,90,0.15)'),
                            color: !project.my_role ? 'text.secondary' : (project.my_role === 'admin' ? '#4C9AFF' : '#1F845A'),
                            fontWeight: 600, fontSize: '0.7rem'
                          }}
                        />
                      </Box>

                      {project.description && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {project.description}
                        </Typography>
                      )}

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ClipboardList size={14} color="#8C9BAB" />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{project.task_count ?? 0} issues</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Users size={14} color="#8C9BAB" />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{project.member_count ?? 0} members</Typography>
                          </Box>
                        </Box>
                        <ArrowRight size={16} color="#8C9BAB" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(project) => {
          setCreateOpen(false);
          navigate(`/projects/${project.id}/board`);
        }}
      />
    </Box>
  );
};

export default ProjectsPage;
