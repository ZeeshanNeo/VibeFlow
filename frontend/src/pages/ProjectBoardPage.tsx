import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, DragStartEvent, DragEndEvent, DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  Box, Button, IconButton, Typography, Avatar, Tooltip, Breadcrumbs,
  Link, TextField, InputAdornment, Alert, Chip, CircularProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  LayoutGrid as Kanban, Search, Plus, Settings, Bell, HelpCircle,
  BarChart3, LogOut, ChevronRight, Sun, Moon, FolderKanban,
  Zap, BookOpen, Bug, CheckSquare, CornerDownRight, Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { store, RootState } from '../store/store';

import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import {
  setTasks,
  addTask,
  updateTask,
  removeTask,
  updateTaskStatus,
  setError,
  Task,
} from '../store/slices/taskSlice';
import KanbanColumn from '../components/KanbanColumn';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import taskService from '../services/taskService';
import projectService, { Project, ProjectMember } from '../services/projectService';
import UserProfileMenu from '../components/UserProfileMenu';

const COLUMNS = [
  { id: 'backlog',     title: 'Backlog',     color: '#7c8aa5' },
  { id: 'todo',        title: 'To Do',       color: '#0C66E4' },
  { id: 'in_progress', title: 'In Progress', color: '#F1A10D' },
  { id: 'review',      title: 'Review',      color: '#6554C0' },
  { id: 'testing',     title: 'Testing',     color: '#00B8D9' },
  { id: 'done',        title: 'Done',        color: '#1F845A' },
  { id: 'blocked',     title: 'Blocked',     color: '#FF5630' },
  { id: 'archived',    title: 'Archived',    color: '#42526E' },
];

const COLUMN_IDS = new Set(COLUMNS.map(c => c.id));

const ISSUE_TYPES = [
  { value: 'Epic',    label: 'Epic',    icon: <Zap size={14} />,            color: '#6554C0', bg: 'rgba(101,84,192,0.15)' },
  { value: 'Story',   label: 'Story',   icon: <BookOpen size={14} />,       color: '#1F845A', bg: 'rgba(31,132,90,0.15)' },
  { value: 'Bug',     label: 'Bug',     icon: <Bug size={14} />,            color: '#FF5630', bg: 'rgba(255,86,48,0.15)' },
  { value: 'Task',    label: 'Task',    icon: <CheckSquare size={14} />,    color: '#0C66E4', bg: 'rgba(12,102,228,0.15)' },
  { value: 'Subtask', label: 'Subtask', icon: <CornerDownRight size={14} />, color: '#8C9BAB', bg: 'rgba(140,155,171,0.15)' },
];

const IssueTypeChip: React.FC<{ type?: string }> = ({ type = 'Task' }) => {
  const it = ISSUE_TYPES.find(i => i.value === type) || ISSUE_TYPES[3];
  return (
    <Chip
      icon={React.cloneElement(it.icon as React.ReactElement<any>, { style: { color: it.color } })}
      label={it.label}
      size="small"
      sx={{ bgcolor: it.bg, color: it.color, fontWeight: 600, fontSize: '0.7rem', height: 22 }}
    />
  );
};

// ─── helpers ────────────────────────────────────────────────────────────────
/** Convert dnd-kit UniqueIdentifier → task id (number) */
const toTaskId = (id: UniqueIdentifier): number => Number(id);

/** Resolve which column id a draggable/droppable belongs to.
 *  If the id matches a column key → that column.
 *  Otherwise treat it as a task id and return that task's status. */
const resolveColumnId = (id: UniqueIdentifier, tasks: Task[]): string | null => {
  const sid = String(id);
  if (COLUMN_IDS.has(sid)) return sid;
  const task = tasks.find(t => t.id === toTaskId(id));
  return task?.status ?? null;
};

const ProjectBoardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pId = parseInt(projectId || '0');
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const { tasks, error, fetchTasks, createTask, editTask, deleteTask } = useTasks();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [updateName, setUpdateName] = useState('');
  const [updateDesc, setUpdateDesc] = useState('');
  const [projectLoading, setProjectLoading] = useState(true);

  // localTasks mirrors Redux tasks but is updated optimistically for smooth DnD
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssigneeId, setFilterAssigneeId] = useState<number | null>(null);
  const [filterIssueType, setFilterIssueType] = useState<string | null>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Load project details
  const fetchProjectData = useCallback(async () => {
    setProjectLoading(true);
    try {
      const { project: p, members: m } = await projectService.getProject(pId);
      setProject(p);
      setMembers(m);
    } catch {
      navigate('/projects');
    } finally {
      setProjectLoading(false);
    }
  }, [pId, navigate]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Fetch tasks filtered by project
  useEffect(() => {
    if (pId) fetchTasks(pId);
  }, [pId, fetchTasks]);

  // Clear error on mount/unmount to prevent stale errors from appearing
  useEffect(() => {
    return () => {
      dispatch(setError(null));
    };
  }, [dispatch]);

  // Keep localTasks in sync when Redux tasks change (after API round-trips)
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // ── DnD sensors ────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Filtered view per column ────────────────────────────────────────────────
  const getTasksForColumn = useCallback((columnId: string) => {
    let filtered = localTasks.filter(t => t.status === columnId);
    if (searchQuery)
      filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterAssigneeId)
      filtered = filtered.filter(t => t.assigneeId === filterAssigneeId);
    if (filterIssueType)
      filtered = filtered.filter(t => t.issueType === filterIssueType);
    return filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [localTasks, searchQuery, filterAssigneeId, filterIssueType]);

  // ── Drag handlers ───────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    // active.id is a STRING (useSortable uses task.id.toString())
    const task = localTasks.find(t => t.id === toTaskId(event.active.id));
    setDraggedTask(task ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTaskId = toTaskId(active.id);
    const activeTask = localTasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    const overColumnId = resolveColumnId(over.id, localTasks);
    if (!overColumnId) return;

    // Moving to a different column → optimistically update status
    if (activeTask.status !== overColumnId) {
      setLocalTasks(prev =>
        prev.map(t =>
          t.id === activeTaskId ? { ...t, status: overColumnId } : t
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over) {
      // Dropped outside – revert to Redux state
      setLocalTasks(tasks);
      return;
    }

    const activeTaskId = toTaskId(active.id);
    const activeTask = localTasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    const targetColumnId = resolveColumnId(over.id, localTasks);
    if (!targetColumnId) return;

    const columnTasks = localTasks.filter(t => t.status === targetColumnId);
    const order = columnTasks.findIndex(t => t.id === activeTaskId) + 1 || columnTasks.length + 1;

    try {
      // Persist to backend (no setLoading during drag to avoid board remounting)
      await taskService.updateTaskStatus(activeTaskId, targetColumnId, order);
      // Refresh to get server-authoritative state
      fetchTasks(pId);
    } catch {
      // On failure revert optimistic update
      setLocalTasks(tasks);
    }
  };

  // ── Task modal handlers ─────────────────────────────────────────────────────
  const handleOpenTask = async (task: Task) => {
    setSelectedTask(task);
    setIsCreating(false);
    setModalOpen(true);
    try {
      const [history, logs, activity] = await Promise.all([
        taskService.getAssignmentHistory(task.id),
        taskService.getWorkLogs(task.id),
        taskService.getTaskActivity(task.id),
      ]);
      setAssignmentHistory(history);
      setWorkLogs(logs);
      setActivityLogs(activity);
    } catch { }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsCreating(true);
    setModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task> & { issueType?: string }) => {
    try {
      if (isCreating) {
        await createTask({
          title: taskData.title!,
          description: taskData.description,
          assigneeId: taskData.assigneeId,
          dueDate: taskData.dueDate,
          status: taskData.status || 'backlog',
          projectId: pId,
          issueType: taskData.issueType || 'Task',
        });
      } else if (selectedTask) {
        await editTask(selectedTask.id, taskData);
      }
      setModalOpen(false);
      fetchTasks(pId);
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleLogWork = async (hours: number, description: string) => {
    if (!selectedTask) return;
    await taskService.logWork(selectedTask.id, hours, description);
    const logs = await taskService.getWorkLogs(selectedTask.id);
    setWorkLogs(logs);
  };

  const handleAssign = async (assigneeId?: number) => {
    if (!selectedTask) return;
    await taskService.updateAssignee(selectedTask.id, assigneeId);
    fetchTasks(pId);
  };

  const handleDeleteTask = async (taskId: number) => {
    await deleteTask(taskId);
    setModalOpen(false);
    fetchTasks(pId);
  };

  const handleUpdateProject = async () => {
    if (!project) return;
    try {
      await projectService.updateProject(project.id, updateName, updateDesc);
      setSettingsOpen(false);
      fetchProjectData();
    } catch (err) {
      console.error('Failed to update project', err);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (window.confirm(`Are you sure you want to delete the project "${project.name}"? This will permanently delete all issues, boards, and data. This action cannot be undone.`)) {
      try {
        await projectService.deleteProject(project.id);
        navigate('/projects');
      } catch (err) {
        console.error('Failed to delete project', err);
      }
    }
  };

  // ── Theme colours ───────────────────────────────────────────────────────────
  const bgColor      = mode === 'dark' ? '#1d2125' : '#F4F5F7';
  const sidebarColor = mode === 'dark' ? '#161b22' : '#FAFBFC';
  const textPrimary  = mode === 'dark' ? '#B6C2CF' : '#172B4D';

  if (projectLoading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: bgColor }}>
        <CircularProgress />
      </Box>
    );
  }

  if (project && !project.my_role) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: bgColor, flexDirection: 'column', gap: 3 }}>
        <FolderKanban size={64} color="#0C66E4" />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>{project.name}</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            You are not a member of this project yet. Join to start tracking tasks.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={async () => {
              const { user } = (store.getState() as RootState).auth;
              if (user) {
                await projectService.addMember(pId, user.email);
                window.location.reload(); // Refresh to load project with role
              }
            }}
            sx={{ px: 5, py: 1.5, borderRadius: 2, fontWeight: 700 }}
          >
            Join Project
          </Button>
          <Button onClick={() => navigate('/projects')} sx={{ display: 'block', mt: 2, mx: 'auto', color: 'text.secondary' }}>
            Back to Projects
          </Button>
        </Box>
      </Box>
    );
  }

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
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: bgColor, overflow: 'hidden' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Box sx={{ width: 270, bgcolor: sidebarColor, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', py: 3, flexShrink: 0 }}>
        <Box sx={{ px: 3, mb: 5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: '#0C66E4', p: 0.5, borderRadius: 0.5 }}><Kanban color="white" size={24} /></Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '0.02em' }}>Vibe Flow</Typography>
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
                <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary, lineHeight: 1.2 }}>{project.name}</Typography>
                <Typography variant="caption" sx={{ color: '#8C9BAB' }}>{project.key}</Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Box sx={{ mb: 2, px: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#8C9BAB', letterSpacing: '0.05em' }}>VIEWS</Typography>
        </Box>
        <SidebarItem label="Board"       icon={<Kanban size={18} />}      active onClick={() => { }} />
        <SidebarItem label="Time Reports"  icon={<BarChart3 size={18} />}   onClick={() => navigate(`/projects/${pId}/reports`)} />
        <SidebarItem label="All Projects" icon={<FolderKanban size={18} />} onClick={() => navigate('/projects')} />

        <Box sx={{ mt: 'auto', px: 3 }}>
          <Button fullWidth onClick={logout} startIcon={<LogOut size={18} />} sx={{ color: '#8C9BAB', justifyContent: 'flex-start', py: 1.5 }}>Logout</Button>
        </Box>
      </Box>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1.5, bgcolor: sidebarColor, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ flex: 1 }}>
            <Link component="button" variant="body2" onClick={() => navigate('/projects')} sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none', '&:hover': { color: '#0C66E4' } }}>
              <FolderKanban size={14} /> Projects
            </Link>
            <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 600 }}>{project?.name}</Typography>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>{mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</IconButton>
            <IconButton sx={{ color: 'text.secondary' }}><Bell size={20} /></IconButton>
            <IconButton sx={{ color: 'text.secondary' }}><HelpCircle size={20} /></IconButton>
            <IconButton 
              sx={{ color: 'text.secondary' }} 
              onClick={() => {
                if (project) {
                  setUpdateName(project.name);
                  setUpdateDesc(project.description || '');
                  setSettingsOpen(true);
                }
              }}
            >
              <Settings size={20} />
            </IconButton>
            <UserProfileMenu />
          </Box>
        </Box>

        {/* Board header */}
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5, bgcolor: sidebarColor, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: textPrimary }}>{project?.name} Board</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{project?.key} · Kanban</Typography>
            </Box>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleCreateTask} sx={{ fontWeight: 700, borderRadius: 1.5 }}>
              Create Issue
            </Button>
          </Box>

          {/* Filters row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={14} color="#8C9BAB" /></InputAdornment> } }}
              sx={{ minWidth: 200 }}
            />

            {/* Issue type filter */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {ISSUE_TYPES.map(it => (
                <Tooltip key={it.value} title={it.value}>
                  <Box
                    onClick={() => setFilterIssueType(filterIssueType === it.value ? null : it.value)}
                    sx={{
                      p: 0.7, borderRadius: 1, cursor: 'pointer', display: 'flex',
                      bgcolor: filterIssueType === it.value ? it.bg : 'transparent',
                      border: '1px solid', borderColor: filterIssueType === it.value ? it.color : 'divider',
                      color: it.color, transition: 'all 0.15s',
                      '&:hover': { bgcolor: it.bg }
                    }}
                  >
                    {it.icon}
                  </Box>
                </Tooltip>
              ))}
            </Box>

            {/* Assignee filter */}
            <Box sx={{ display: 'flex', ml: 1 }}>
              <Typography variant="body2" sx={{ color: '#8C9BAB', mr: 1, fontSize: '0.8rem', alignSelf: 'center' }}>Assignee:</Typography>
              {members.slice(0, 5).map(m => {
                const displayName = m.name || m.email.split('@')[0];
                return (
                  <Tooltip key={m.id} title={displayName}>
                    <Avatar
                      onClick={() => setFilterAssigneeId(filterAssigneeId === m.id ? null : m.id)}
                      sx={{
                        width: 30, height: 30, bgcolor: '#0C66E4', cursor: 'pointer', fontSize: '0.75rem',
                        border: filterAssigneeId === m.id ? '2px solid #4C9AFF' : (mode === 'dark' ? '2px solid #1d2125' : '2px solid #EBEDF0'),
                        ml: -0.5, transition: 'all 0.15s', '&:hover': { transform: 'translateY(-2px)', zIndex: 10 }
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                );
              })}
            </Box>

            {(searchQuery || filterAssigneeId || filterIssueType) && (
              <Button size="small" onClick={() => { setSearchQuery(''); setFilterAssigneeId(null); setFilterIssueType(null); }} sx={{ color: '#8C9BAB', minWidth: 'auto' }}>
                Clear
              </Button>
            )}
          </Box>
        </Box>

        {/* ── Kanban columns ──────────────────────────────────────────────── */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <Box sx={{ display: 'flex', gap: 1.5, height: '100%', minWidth: 'max-content' }}>
              {COLUMNS.map(column => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={getTasksForColumn(column.id)}
                  onTaskClick={handleOpenTask}
                  onAddTask={handleCreateTask}
                />
              ))}
            </Box>
            <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
              {draggedTask ? (
                <motion.div initial={{ scale: 1.03, opacity: 0.9 }}>
                  <TaskCard task={draggedTask} onClick={() => { }} />
                </motion.div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </Box>
      </Box>

      {/* ── Task Modal ──────────────────────────────────────────────────── */}
      <TaskModal
        open={modalOpen}
        task={selectedTask}
        users={members.map(m => ({ id: m.id, email: m.email, name: m.name }))}
        assignmentHistory={assignmentHistory}
        workLogs={workLogs}
        activityLogs={activityLogs}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
        onLogWork={handleLogWork}
        onAssign={handleAssign}
        onDelete={handleDeleteTask}
      />

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3 }}>Project Settings</DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Project Name"
              fullWidth
              value={updateName}
              onChange={(e) => setUpdateName(e.target.value)}
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={updateDesc}
              onChange={(e) => setUpdateDesc(e.target.value)}
            />
            
            {project?.my_role === 'admin' && (
              <Box sx={{ mt: 2, p: 2, borderRadius: 1.5, bgcolor: 'rgba(255, 86, 48, 0.05)', border: '1px solid rgba(255, 86, 48, 0.2)' }}>
                <Typography variant="subtitle2" sx={{ color: '#FF5630', fontWeight: 700, mb: 1 }}>Danger Zone</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Deleting this project will permanently remove all issues, boards, and members.
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<Trash2 size={16} />}
                  onClick={handleDeleteProject}
                  sx={{ borderColor: '#FF5630', color: '#FF5630', '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.1)', borderColor: '#FF5630' } }}
                >
                  Delete Project
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setSettingsOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleUpdateProject} variant="contained" disabled={!updateName}>Save Settings</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectBoardPage;
