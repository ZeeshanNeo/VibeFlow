import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Avatar,
  Tooltip,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Divider,
  Alert,
} from '@mui/material';
import {
  LayoutGrid as Kanban,
  Search,
  Plus,
  Settings,
  Bell,
  HelpCircle,
  BarChart3,
  LogOut,
  ChevronRight,
  Filter,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Task, setError } from '../store/slices/taskSlice';
import KanbanColumn from '../components/KanbanColumn';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import taskService from '../services/taskService';
import authService, { User } from '../services/authService';
import UserProfileMenu from '../components/UserProfileMenu';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: '#7c8aa5' },
  { id: 'todo', title: 'To Do', color: '#0C66E4' },
  { id: 'in_progress', title: 'In Progress', color: '#F1A10D' },
  { id: 'review', title: 'Review', color: '#6554C0' },
  { id: 'testing', title: 'Testing', color: '#00B8D9' },
  { id: 'done', title: 'Done', color: '#1F845A' },
  { id: 'blocked', title: 'Blocked', color: '#FF5630' },
  { id: 'archived', title: 'Archived', color: '#42526E' },
];

const KanbanBoard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const { tasks, loading, error, fetchTasks, createTask, editTask } = useTasks();
  
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [taskDetails, setTaskDetails] = useState<{ history: any[]; logs: any[] }>({ history: [], logs: [] });
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState(2); // Default to Board
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAssigneeId, setFilterAssigneeId] = useState<number | null>(null);
  const [filterOnlyMyIssues, setFilterOnlyMyIssues] = useState(false);

  useEffect(() => {
    fetchTasks();
    authService.getAllUsers().then(setUsers).catch(console.error);
  }, [fetchTasks]);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleOpenModal = async (task: Task | null = null) => {
    setSelectedTask(task);
    setModalOpen(true);
    if (task) {
      try {
        const history = await taskService.getAssignmentHistory(task.id);
        const logs = await taskService.getWorkLogs(task.id);
        setTaskDetails({ history, logs });
      } catch (err) {
        console.error('Failed to load task details', err);
      }
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
    setTaskDetails({ history: [], logs: [] });
  };

  const handleSave = async (taskData: Partial<Task>) => {
    try {
      if (selectedTask) {
        await editTask(selectedTask.id, taskData);
      } else {
        await createTask({ ...taskData, status: taskData.status || 'backlog' });
      }
      handleCloseModal();
      await fetchTasks();
    } catch (err) {
      console.error('Failed to save task', err);
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    // active.id is a STRING (useSortable uses task.id.toString())
    const task = localTasks.find(t => t.id.toString() === String(event.active.id));
    if (task) setActiveTask(task);
  };

  /**
   * Resolve which column id an over-target belongs to.
   * If overId matches a column key → return it.
   * Otherwise treat it as a task id and return that task's status.
   */
  const resolveColumnId = (overId: string | number): string | null => {
    const sid = String(overId);
    if (COLUMNS.find(c => c.id === sid)) return sid;
    const task = localTasks.find(t => t.id.toString() === sid);
    return task?.status ?? null;
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTaskId = String(active.id);
    const activeTask = localTasks.find(t => t.id.toString() === activeTaskId);
    if (!activeTask) return;

    const destColumnId = resolveColumnId(over.id);
    if (!destColumnId || destColumnId === activeTask.status) return;

    setLocalTasks(prev =>
      prev.map(t =>
        t.id.toString() === activeTaskId ? { ...t, status: destColumnId } : t
      )
    );
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) {
      setLocalTasks(tasks);
      return;
    }

    const activeTaskId = String(active.id);
    const activeTaskData = localTasks.find(t => t.id.toString() === activeTaskId);
    if (!activeTaskData) return;

    const destColumnId = resolveColumnId(over.id);
    if (!destColumnId) return;

    const columnTasks = localTasks.filter(t => t.status === destColumnId);
    const order = columnTasks.findIndex(t => t.id.toString() === activeTaskId) + 1 || columnTasks.length + 1;

    try {
      // Direct API call – avoid setLoading(true) which unmounts the board mid-drag
      await taskService.updateTaskStatus(parseInt(activeTaskId), destColumnId, order);
      await fetchTasks();
    } catch {
      setLocalTasks(tasks);
    }
  };

  const filteredTasks = localTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(filterSearch.toLowerCase()) || 
                         (task.description?.toLowerCase().includes(filterSearch.toLowerCase()) ?? false);
    const matchesAssignee = filterAssigneeId === null || task.assigneeId === filterAssigneeId;
    const matchesMyIssues = !filterOnlyMyIssues || task.assigneeId === user?.id;
    
    return matchesSearch && matchesAssignee && matchesMyIssues;
  });

  const SidebarSection = ({ title, items }: { title: string, items: any[] }) => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ px: 3, mb: 1.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#8C9BAB', letterSpacing: '0.05em' }}>{title.toUpperCase()}</Typography>
      </Box>
      {items.map((item, idx) => (
        <Box
          key={idx}
          onClick={item.onClick}
          sx={{
            py: 1.2, px: 3, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', borderRadius: '4px', mx: 1.5,
            bgcolor: item.active ? (mode === 'dark' ? 'rgba(12, 102, 228, 0.2)' : 'rgba(12, 102, 228, 0.1)') : 'transparent',
            color: item.active ? (mode === 'dark' ? '#4C9AFF' : '#0C66E4') : 'text.secondary',
            borderLeft: item.active ? '3px solid #0C66E4' : '3px solid transparent',
            '&:hover': { bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(9, 30, 66, 0.05)' }
          }}
        >
          {item.icon}
          <Typography variant="body2" sx={{ fontWeight: item.active ? 600 : 400, flexGrow: 1 }}>{item.label}</Typography>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Box sx={{ width: 270, bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', py: 3 }}>
        <Box sx={{ px: 3, mb: 5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: '#0C66E4', p: 0.5, borderRadius: 0.5 }}><Kanban color="white" size={24} /></Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FFFFFF' : '#172B4D', letterSpacing: '0.02em' }}>Vibe Flow</Typography>
        </Box>

        <SidebarSection 
          title="Project" 
          items={[
            { label: 'Kanban Board', icon: <Kanban size={18} />, active: true },
            { label: 'Time Reports', icon: <BarChart3 size={18} />, onClick: () => navigate('/reports/time') },
          ]} 
        />

        <Box sx={{ mt: 'auto', px: 3 }}>
          <Button fullWidth onClick={logout} startIcon={<LogOut size={18} />} sx={{ color: '#8C9BAB', justifyContent: 'flex-start', py: 1.5 }}>Logout</Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ height: 56, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <TextField
              size="small" placeholder="Global Search" variant="outlined"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              sx={{ width: 400, mr: 2, '& .MuiOutlinedInput-root': { bgcolor: mode === 'dark' ? '#22272b' : '#FFFFFF' } }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} color="#8C9BAB" /></InputAdornment> } }}
            />
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => handleOpenModal(null)}>Create</Button>
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

        <Box sx={{ px: 4, pt: 3, pb: 0 }}>
          {error && <Alert severity="error" onClose={() => dispatch(setError(null))} sx={{ mb: 2, bgcolor: 'rgba(255,86,48,0.1)', color: '#FF5630' }}>{error}</Alert>}
          <Typography variant="caption" sx={{ color: '#8C9BAB', fontWeight: 600 }}>Spaces</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, mb: 2 }}>
            <Box sx={{ bgcolor: '#0C66E4', width: 32, height: 32, borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap color="white" size={20} fill="white" />
            </Box>
            <Typography variant="h4" sx={{ letterSpacing: '0.02em', color: 'text.primary' }}>VIBE FLOW</Typography>
          </Box>

          <Tabs 
            value={activeTab === 2 ? 0 : 1}
            onChange={(_, v) => { if (v === 1) navigate('/reports/time'); else setActiveTab(2); }}
            sx={{ '& .MuiTabs-indicator': { height: 3, bgcolor: '#0C66E4' }, '& .MuiTab-root': { color: 'text.secondary', textTransform: 'none', fontWeight: 600 } }}
          >
            <Tab label="Board" icon={<Kanban size={16} />} iconPosition="start" />
            <Tab label="Reports" icon={<BarChart3 size={16} />} iconPosition="start" />
          </Tabs>
          <Divider sx={{ border: 'none', height: 1, bgcolor: 'divider' }} />
        </Box>

        <Box sx={{ px: 4, py: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
              size="small" placeholder="Filter tasks..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              sx={{ 
                width: 220, 
                '& .MuiOutlinedInput-root': { bgcolor: mode === 'dark' ? '#22272b' : '#FFFFFF' },
                '& .MuiInputBase-input': { color: 'text.primary', fontSize: '0.85rem' }
              }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={14} color="#8C9BAB" /></InputAdornment> } }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            <Typography variant="body2" sx={{ color: '#8C9BAB', mr: 1, fontSize: '0.8rem' }}>Assignee:</Typography>
            <Box sx={{ display: 'flex' }}>
              {users.slice(0, 5).map((u) => {
                const displayName = u.name || (u.email ? u.email.split('@')[0] : 'U');
                return (
                  <Tooltip key={u.id} title={displayName}>
                    <Avatar
                      onClick={() => setFilterAssigneeId(filterAssigneeId === u.id ? null : u.id)}
                      sx={{ 
                        width: 32, height: 32, bgcolor: '#0C66E4', cursor: 'pointer',
                        fontSize: '0.75rem', border: filterAssigneeId === u.id ? '2px solid #4C9AFF' : (mode === 'dark' ? '2px solid #1d2125' : '2px solid #EBEDF0'),
                        ml: -0.5, transition: 'all 0.2s',
                        '&:hover': { transform: 'translateY(-2px)', zIndex: 10 }
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                );
              })}
              {users.length > 5 && (
                <Tooltip 
                  title={
                    <Box sx={{ p: 0.5 }}>
                      {users.slice(5).map(u => {
                        const displayName = u.name || (u.email ? u.email.split('@')[0] : 'Unknown');
                        return <Typography key={u.id} variant="caption" sx={{ display: 'block', py: 0.2 }}>{displayName}</Typography>
                      })}
                    </Box>
                  }
                >
                  <Avatar 
                    sx={{ 
                      width: 32, height: 32, 
                      bgcolor: mode === 'dark' ? '#22272b' : '#DFE1E6', 
                      ml: -0.5, fontSize: '0.7rem', 
                      color: 'text.secondary', 
                      border: mode === 'dark' ? '2px solid #1d2125' : '2px solid #EBEDF0',
                      cursor: 'pointer'
                    }}
                  >
                    +{users.length - 5}
                  </Avatar>
                </Tooltip>
              )}
            </Box>
            {filterAssigneeId !== null && (
              <Button size="small" variant="text" onClick={() => setFilterAssigneeId(null)} sx={{ color: '#4C9AFF', fontSize: '0.7rem', minWidth: 'auto', p: 0.5 }}>Clear</Button>
            )}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(143, 155, 171, 0.1)', mx: 1, height: 24, alignSelf: 'center' }} />

          <Button 
            size="small" 
            onClick={() => setFilterOnlyMyIssues(!filterOnlyMyIssues)}
            sx={{ 
              color: filterOnlyMyIssues ? '#4C9AFF' : '#B6C2CF',
              bgcolor: filterOnlyMyIssues ? 'rgba(76, 154, 255, 0.1)' : 'transparent',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              '&:hover': { bgcolor: filterOnlyMyIssues ? 'rgba(76, 154, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)' }
            }}
          >
            Only my issues
          </Button>
          
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(143, 155, 171, 0.1)', mx: 1, height: 24, alignSelf: 'center' }} />
          
          <Typography variant="body2" sx={{ color: '#8C9BAB', fontSize: '0.8rem', fontStyle: 'italic' }}>
            Showing {filteredTasks.length} of {localTasks.length} tasks
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, overflowX: 'auto', px: 4, pb: 4, display: 'flex', gap: 2 }}>
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
            <Box sx={{ display: 'flex', gap: 2, height: '100%', alignItems: 'flex-start' }}>
              {COLUMNS.map((column) => (
                <motion.div key={column.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100%' }}>
                  <KanbanColumn 
                     column={column} 
                     tasks={filteredTasks.filter((t) => t.status === column.id)} 
                     onAddTask={() => handleOpenModal(null)} 
                     onTaskClick={handleOpenModal} 
                  />
                </motion.div>
              ))}
            </Box>
            <DragOverlay>
              {activeTask ? <Box sx={{ width: 280 }}><TaskCard task={activeTask} onClick={() => {}} /></Box> : null}
            </DragOverlay>
          </DndContext>
        </Box>
      </Box>

      <TaskModal
        open={modalOpen} task={selectedTask} users={users}
        assignmentHistory={taskDetails.history} workLogs={taskDetails.logs}
        activityLogs={[]}
        onClose={handleCloseModal} onSave={handleSave}
        onLogWork={async (hours, description) => {
          if (selectedTask) {
             try {
                await taskService.logWork(selectedTask.id, hours, description);
                const logs = await taskService.getWorkLogs(selectedTask.id);
                setTaskDetails((prev: any) => ({ ...prev, logs }));
             } catch (err) { console.error(err); }
          }
        }}
        onAssign={async (assigneeId) => {
           if (selectedTask) {
              try {
                 await taskService.updateAssignee(selectedTask.id, assigneeId);
                 const history = await taskService.getAssignmentHistory(selectedTask.id);
                 setTaskDetails((prev: any) => ({ ...prev, history }));
                 await fetchTasks();
              } catch (err) { console.error(err); }
           }
        }}
      />
    </Box>
  );
};

export default KanbanBoard;
