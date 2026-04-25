import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  X,
  Edit2,
  Clock,
  Archive,
  CheckCircle,
  Calendar,
  Layers,
  ChevronDown,
  Info,
  Moon,
  Sun,
  Bell,
  User as UserIcon,
  MessageSquare,
  Plus,
  Send,
  Zap,
  BookOpen,
  Bug,
  CheckSquare,
  CornerDownRight,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { Task } from '../store/slices/taskSlice';
import { User } from '../services/authService';
import taskService, { Comment } from '../services/taskService';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const ISSUE_TYPES = [
  { value: 'Epic',    label: 'Epic',    icon: <Zap size={14} />,            color: '#6554C0', bg: 'rgba(101,84,192,0.15)' },
  { value: 'Story',   label: 'Story',   icon: <BookOpen size={14} />,       color: '#1F845A', bg: 'rgba(31,132,90,0.15)' },
  { value: 'Bug',     label: 'Bug',     icon: <Bug size={14} />,            color: '#FF5630', bg: 'rgba(255,86,48,0.15)' },
  { value: 'Task',    label: 'Task',    icon: <CheckSquare size={14} />,    color: '#0C66E4', bg: 'rgba(12,102,228,0.15)' },
  { value: 'Subtask', label: 'Subtask', icon: <CornerDownRight size={14} />, color: '#8C9BAB', bg: 'rgba(140,155,171,0.15)' },
];

interface AssignmentHistory {
  id: number;
  taskId: number;
  oldAssigneeId?: number;
  newAssigneeId?: number;
  changedBy: number;
  changedByName: string;
  changedAt: string;
  oldAssigneeName?: string;
  newAssigneeName?: string;
}

interface WorkLog {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  hours: number;
  description: string;
  loggedAt: string;
}

interface TaskModalProps {
  open: boolean;
  task: Task | null;
  users: User[];
  assignmentHistory: AssignmentHistory[];
  workLogs: WorkLog[];
  activityLogs: any[];
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  onLogWork: (hours: number, description: string) => void;
  onAssign: (assigneeId?: number) => void;
  onDelete?: (taskId: number) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
  open,
  task,
  users,
  assignmentHistory,
  workLogs,
  activityLogs,
  onClose,
  onSave,
  onLogWork,
  onAssign,
  onDelete,
}) => {
  const { mode, toggleTheme } = useTheme();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(!task);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [issueType, setIssueType] = useState('Task');
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  // Sub-tasks state
  const [subTasks, setSubTasks] = useState<Task[]>([]);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [logWorkOpen, setLogWorkOpen] = useState(false);
  const [logHours, setLogHours] = useState('');
  const [logDescription, setLogDescription] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setAssigneeId(task.assigneeId ?? '');
      setIssueType(task.issueType || 'Task');
      setEditMode(false);
      loadComments(task.id);
      loadSubtasks(task.id);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssigneeId('');
      setIssueType('Task');
      setEditMode(true);
      setComments([]);
      setSubTasks([]);
    }
    setActiveTab(0);
  }, [task, open]);

  const loadComments = async (taskId: number) => {
    setCommentsLoading(true);
    try {
      const data = await taskService.getComments(taskId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadSubtasks = async (taskId: number) => {
    try {
      // In a real app we might have a specific subtask API
      // Here we filter the project tasks where parentId matches
      const allProjectTasks = await taskService.getAllTasks(); // Assuming we filter on client for simplicity or add backend endpoint
      const related = allProjectTasks.filter(t => t.parentId === taskId);
      setSubTasks(related);
    } catch (err) {
      console.error('Failed to load subtasks', err);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const taskData: Partial<Task> = {
      title,
      description,
      dueDate: dueDate === '' ? null : dueDate,
      assigneeId: assigneeId === '' ? null : (assigneeId as number),
      issueType,
    };
    onSave(taskData);
    setEditMode(false);
  };

  const handleAddComment = async () => {
    if (!task || !commentText.trim()) return;
    try {
      await taskService.addComment(task.id, commentText);
      setCommentText('');
      loadComments(task.id);
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const handleAddSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return;
    try {
      await taskService.createTask({
        title: newSubtaskTitle,
        parentId: task.id,
        projectId: task.projectId, // Now in Task interface
        issueType: 'Subtask',
        status: 'backlog',
      });
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
      loadSubtasks(task.id);
    } catch (err) {
      console.error('Failed to add subtask', err);
    }
  };

  const handleAssigneeChange = (value: number | '') => {
    setAssigneeId(value);
    if (!editMode && onAssign) {
      onAssign(value === '' ? undefined : value);
    }
  };

  const handleLogWork = () => {
    const hours = parseFloat(logHours);
    if (hours > 0 && logDescription.trim()) {
      onLogWork(hours, logDescription);
      setLogHours('');
      setLogDescription('');
      setLogWorkOpen(false);
    }
  };

  const handleDelete = () => {
    if (task && onDelete && window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      onDelete(task.id);
    }
  };

  const totalHours = workLogs.reduce((sum, log) => sum + log.hours, 0);

  const getIssueTypeIcon = (type: string) => {
    const it = ISSUE_TYPES.find(i => i.value === type) || ISSUE_TYPES[3];
    return React.cloneElement(it.icon as React.ReactElement<any>, { color: it.color });
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 1000,
            maxWidth: '95vw',
            maxHeight: '92vh',
            bgcolor: 'background.paper',
            boxShadow: mode === 'dark' ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(9,30,66,0.1)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box sx={{ p: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                 {getIssueTypeIcon(issueType)}
                 <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 0.2 }}>
                   {task ? `VF-${task.id}` : 'Create Issue'}
                 </Typography>
              </Box>
              {task && (
                <Chip 
                  label={task.status.toUpperCase()} 
                  size="small" 
                  sx={{ bgcolor: 'action.hover', color: 'text.primary', fontWeight: 700, borderRadius: '3px', fontSize: '0.65rem', height: 20 }} 
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <Tooltip title={`Switch Theme`}>
                <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
                  {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}><X size={20} /></IconButton>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 320px' }}>
            {/* Left Content Area */}
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Title Section */}
              <Box>
                {editMode ? (
                  <TextField
                    variant="standard"
                    placeholder="Task Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    autoFocus
                    slotProps={{ 
                      input: { 
                        disableUnderline: true, 
                        style: { fontSize: '1.75rem', fontWeight: 700, color: 'text.primary' } 
                      } 
                    }}
                    sx={{ mb: 1 }}
                  />
                ) : (
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', fontSize: '1.75rem' }}>{task?.title}</Typography>
                )}
              </Box>

              {/* Sub-tasks Section */}
              {task && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Child issues
                    </Typography>
                    <Button size="small" startIcon={<Plus size={14} />} onClick={() => setShowAddSubtask(!showAddSubtask)} sx={{ color: 'text.secondary' }}>
                      Add child issue
                    </Button>
                  </Box>
                  
                  {showAddSubtask && (
                    <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="What needs to be done?"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        fullWidth
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                      />
                      <Button variant="contained" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>Add</Button>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {subTasks.map(st => (
                      <Box key={st.id} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.default' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                           <CornerDownRight size={14} color="#8C9BAB" />
                           <CheckSquare size={14} color="#0C66E4" />
                           <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{st.title}</Typography>
                        </Box>
                        <Chip label={st.status} size="small" sx={{ fontSize: '0.65rem', height: 18, borderRadius: 1 }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Description Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
                   Description
                </Typography>
                {editMode ? (
                  <TextField
                    multiline
                    rows={4}
                    placeholder="Add a description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    sx={{ bgcolor: 'background.default', borderRadius: 1 }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ color: description ? 'text.primary' : 'text.secondary', whiteSpace: 'pre-wrap' }}>
                    {description || 'No description provided.'}
                  </Typography>
                )}
              </Box>

              {/* Activity Section */}
              <Box>
                <Tabs 
                  value={activeTab} 
                  onChange={(_, v) => setActiveTab(v)} 
                  sx={{ 
                    borderBottom: '1px solid', borderColor: 'divider', minHeight: 'unset', mb: 3,
                    '& .MuiTab-root': { color: 'text.secondary', textTransform: 'none', fontWeight: 700, minHeight: 'unset', py: 1.5 }
                  }}
                >
                  <Tab label="Comments" />
                  <Tab label="Activity" />
                  <Tab label="History" />
                  <Tab label="Work Log" />
                </Tabs>

                <Box sx={{ pt: 1 }}>
                  {activeTab === 0 && (
                    <Box>
                      {/* Comment Input */}
                      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                         <Avatar sx={{ width: 32, height: 32, bgcolor: '#0C66E4', fontSize: '0.8rem' }}>{currentUser?.name?.charAt(0) || 'U'}</Avatar>
                         <Box sx={{ flexGrow: 1 }}>
                            <TextField
                              placeholder="Add a comment..."
                              multiline
                              minRows={1}
                              maxRows={10}
                              fullWidth
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              sx={{ 
                                mb: 1.5,
                                '& .MuiOutlinedInput-root': { 
                                  bgcolor: 'background.default',
                                  borderRadius: '8px',
                                  transition: 'all 0.2s',
                                  '&:hover': { bgcolor: 'action.hover' },
                                  '&.Mui-focused': { bgcolor: 'background.paper', boxShadow: '0 0 0 2px #0C66E4' }
                                },
                                '& .MuiOutlinedInput-notchedOutline': { border: '1px solid', borderColor: 'divider' },
                              }}
                            />
                            {commentText && (
                              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <Button 
                                  variant="contained" 
                                  size="small" 
                                  onClick={handleAddComment}
                                  sx={{ bgcolor: '#0C66E4', fontWeight: 600, textTransform: 'none', px: 2 }}
                                >
                                  Save
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="text"
                                  sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none', '&:hover': { color: 'text.primary' } }} 
                                  onClick={() => setCommentText('')}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            )}
                         </Box>
                      </Box>

                      {/* Comments List */}
                      {commentsLoading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {comments.map(c => (
                            <Box key={c.id} sx={{ display: 'flex', gap: 2 }}>
                               <Avatar sx={{ width: 32, height: 32, bgcolor: '#F4F5F7', color: 'text.primary', fontSize: '0.8rem', border: '1px solid', borderColor: 'divider' }}>{c.userName.charAt(0)}</Avatar>
                               <Box sx={{ flexGrow: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                     <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{c.userName}</Typography>
                                     <Typography variant="caption" sx={{ color: 'text.secondary' }}>{format(new Date(c.createdAt), 'MMM d, yyyy p')}</Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>{c.content}</Typography>
                               </Box>
                            </Box>
                          ))}
                          {comments.length === 0 && <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>No comments yet.</Typography>}
                        </Box>
                      )}
                    </Box>
                  )}

                  {activeTab === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                       {activityLogs.map(log => (
                         <Box key={log.id} sx={{ display: 'flex', gap: 2 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#0C66E4', fontSize: '0.8rem' }}>{log.userName?.charAt(0) || 'U'}</Avatar>
                            <Box>
                               <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                                 <Box component="span" sx={{ fontWeight: 700 }}>{log.userName}</Box>
                                 {' '}
                                 {log.action === 'CREATED' && 'created this task'}
                                 {log.action === 'STATUS_CHANGE' && (
                                   <>
                                     moved this task from <Box component="span" sx={{ fontWeight: 600, color: 'text.secondary' }}>{log.oldValue}</Box> to <Box component="span" sx={{ fontWeight: 600, color: '#0C66E4' }}>{log.newValue}</Box>
                                   </>
                                 )}
                                 {log.action === 'ASSIGNEE_CHANGE' && 'updated the assignee'}
                                 {log.action === 'TITLE_CHANGE' && (
                                   <>
                                     renamed the task to <Box component="span" sx={{ fontWeight: 700 }}>{log.newValue}</Box>
                                   </>
                                 )}
                                 {log.action === 'DESCRIPTION_CHANGE' && (
                                   <>
                                     updated the <Box component="span" sx={{ fontWeight: 700 }}>description</Box>
                                   </>
                                 )}
                                 {log.action === 'COMMENT_ADDED' && (
                                   <>
                                     added a comment: <Box component="span" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>"{log.newValue}"</Box>
                                   </>
                                 )}
                               </Typography>
                               <Typography variant="caption" sx={{ color: 'text.secondary' }}>{format(new Date(log.createdAt), 'MMM d, yyyy · h:mm a')}</Typography>
                            </Box>
                         </Box>
                       ))}
                       {activityLogs.length === 0 && (
                         <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Info size={32} color="#8C9BAB" style={{ marginBottom: 8 }} />
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>No activity logged yet.</Typography>
                         </Box>
                       )}
                    </Box>
                  )}

                  {activeTab === 2 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                       {assignmentHistory.map(h => (
                         <Box key={h.id} sx={{ display: 'flex', gap: 2 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}><UserIcon size={16} /></Avatar>
                            <Box>
                               <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                 <Box component="span" sx={{ fontWeight: 700 }}>{h.changedByName}</Box> updated the assignee to <Box component="span" sx={{ fontWeight: 700 }}>{h.newAssigneeName || 'Unassigned'}</Box>
                               </Typography>
                               <Typography variant="caption" sx={{ color: 'text.secondary' }}>{format(new Date(h.changedAt), 'MMM d, yyyy')}</Typography>
                            </Box>
                         </Box>
                       ))}
                       {assignmentHistory.length === 0 && <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>No history found.</Typography>}
                    </Box>
                  )}

                  {activeTab === 3 && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>Total Time: {totalHours.toFixed(1)}h</Typography>
                        <Button size="small" variant="outlined" startIcon={<Clock size={14} />} onClick={() => setLogWorkOpen(true)}>Log work</Button>
                      </Box>
                      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {workLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell>{log.userName}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{log.hours}h</TableCell>
                                <TableCell>{log.description}</TableCell>
                                <TableCell sx={{ color: 'text.secondary' }}>{format(new Date(log.loggedAt), 'MMM d')}</TableCell>
                              </TableRow>
                            ))}
                            {workLogs.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 2, color: 'text.secondary' }}>No work logged yet</TableCell></TableRow>}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Right Sidebar Area */}
            <Box sx={{ p: 4, borderLeft: '1px solid', borderColor: 'divider', bgcolor: mode === 'dark' ? '#1d2125' : '#F4F5F7' }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#8C9BAB', display: 'block', mb: 3, letterSpacing: '0.1em' }}>DETAILS</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  {/* Issue Type */}
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>Type</Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value)}
                        sx={{ bgcolor: 'background.paper' }}
                      >
                        {ISSUE_TYPES.map(it => (
                          <MenuItem key={it.value} value={it.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getIssueTypeIcon(it.value)}
                              <Typography variant="body2">{it.label}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Assignee */}
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>Assignee</Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={assigneeId}
                        onChange={(e) => handleAssigneeChange(e.target.value as number | '')}
                        displayEmpty
                        sx={{ bgcolor: 'background.paper' }}
                        renderValue={(selected) => {
                          if (!selected) return <Typography variant="body2" sx={{ color: 'text.secondary' }}>Unassigned</Typography>;
                          const user = users.find(u => u.id === (selected as number));
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: '#0C66E4', color: 'white' }}>{user?.name.charAt(0)}</Avatar>
                              <Typography variant="body2">{user?.name}</Typography>
                            </Box>
                          );
                        }}
                      >
                        <MenuItem value=""><em>Unassigned</em></MenuItem>
                        {users.map(u => (
                          <MenuItem key={u.id} value={u.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: '#0C66E4', color: 'white' }}>{u.name.charAt(0)}</Avatar>
                              {u.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Due Date */}
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>Due Date</Typography>
                    <TextField 
                       type="date" 
                       size="small" 
                       fullWidth 
                       value={dueDate} 
                       onChange={(e) => setDueDate(e.target.value)} 
                       slotProps={{ inputLabel: { shrink: true } }}
                       sx={{ 
                         bgcolor: 'background.paper',
                         '& .MuiInputBase-input::-webkit-calendar-picker-indicator': {
                           filter: mode === 'dark' ? 'invert(1)' : 'none',
                           cursor: 'pointer'
                         }
                       }} 
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>Created By</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>{task?.createdByName?.charAt(0) || '?'}</Avatar>
                       <Typography variant="body2" sx={{ color: 'text.primary' }}>{task?.createdByName || 'Unknown'}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {editMode ? (
                  <>
                    <Button variant="contained" fullWidth onClick={handleSave} sx={{ bgcolor: '#0C66E4' }}>
                       {task ? 'Save Changes' : 'Create Task'}
                    </Button>
                    <Button variant="text" fullWidth onClick={() => task ? setEditMode(false) : onClose()} sx={{ color: 'text.secondary' }}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outlined" fullWidth startIcon={<Edit2 size={16} />} onClick={() => setEditMode(true)} sx={{ color: 'text.primary', borderColor: 'divider' }}>
                      Edit Issue
                    </Button>
                    {task && onDelete && (
                      <Button variant="text" fullWidth startIcon={<Trash2 size={16} />} onClick={handleDelete} sx={{ color: '#FF5630' }}>
                        Delete Issue
                      </Button>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Log Work Dialog */}
      <Dialog open={logWorkOpen} onClose={() => setLogWorkOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Log Work</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Hours"
              type="number"
              fullWidth
              value={logHours}
              onChange={(e) => setLogHours(e.target.value)}
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={logDescription}
              onChange={(e) => setLogDescription(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setLogWorkOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleLogWork} variant="contained" disabled={!logHours || !logDescription}>Submit Log</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskModal;
