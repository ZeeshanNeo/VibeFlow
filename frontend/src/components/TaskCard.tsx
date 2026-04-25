import React from 'react';
import { motion } from 'framer-motion';
import { Paper, Typography, Box, Avatar, Tooltip, Chip } from '@mui/material';
import { Clock, CheckSquare, Zap, BookOpen, Bug, CornerDownRight, MessageSquare } from 'lucide-react';
import { Task } from '../store/slices/taskSlice';
import { format, isPast, isToday } from 'date-fns';

// ── Column colour palette (must match KanbanColumn + ProjectBoardPage COLUMNS) ──
export const COLUMN_COLORS: Record<string, string> = {
  backlog:     '#7c8aa5',
  todo:        '#0C66E4',
  in_progress: '#F1A10D',
  review:      '#6554C0',
  testing:     '#00B8D9',
  done:        '#1F845A',
  blocked:     '#FF5630',
  archived:    '#42526E',
};

// ── Issue-type config ─────────────────────────────────────────────────────────
const ISSUE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  Epic:    { icon: <Zap size={11} />,            color: '#6554C0', bg: 'rgba(101,84,192,0.18)' },
  Story:   { icon: <BookOpen size={11} />,       color: '#1F845A', bg: 'rgba(31,132,90,0.18)'  },
  Bug:     { icon: <Bug size={11} />,            color: '#FF5630', bg: 'rgba(255,86,48,0.18)'  },
  Task:    { icon: <CheckSquare size={11} />,    color: '#0C66E4', bg: 'rgba(12,102,228,0.18)' },
  Subtask: { icon: <CornerDownRight size={11} />, color: '#8C9BAB', bg: 'rgba(140,155,171,0.18)'},
};

interface TaskCardProps {
  task: Task & { issueType?: string; commentCount?: number };
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try { return format(new Date(dateString), 'd MMM yyyy'); }
    catch { return null; }
  };

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const accentColor = COLUMN_COLORS[task.status] ?? '#7c8aa5';
  const issueType   = (task as any).issueType ?? 'Task';
  const typeCfg     = ISSUE_TYPE_CONFIG[issueType] ?? ISSUE_TYPE_CONFIG.Task;
  const commentCount = (task as any).commentCount ?? 0;

  return (
    <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.1 }}>
      <Paper
        onClick={onClick}
        elevation={0}
        sx={{
          p: '10px 12px 10px 14px',
          cursor: 'pointer',
          borderRadius: '8px',
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderLeft: `3px solid ${accentColor}`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'box-shadow 0.15s, border-color 0.15s',
          '&:hover': {
            backgroundColor: 'action.hover',
            borderColor: accentColor,
            borderLeftColor: accentColor,
            boxShadow: `0 0 0 1px ${accentColor}22, 0 4px 12px rgba(0,0,0,0.15)`,
          },
        }}
      >
        {/* Issue-type chip + title */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, mb: 0.8 }}>
          <Box
            sx={{
              mt: '2px', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 18, height: 18, borderRadius: '4px',
              bgcolor: typeCfg.bg, color: typeCfg.color,
            }}
          >
            {typeCfg.icon}
          </Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, color: 'text.primary', lineHeight: 1.4, fontSize: '0.82rem' }}
          >
            {task.title}
          </Typography>
        </Box>

        {/* Due date badge */}
        {task.dueDate && (
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              mb: 1, px: 0.8, py: 0.3, borderRadius: '4px',
              border: `1.5px solid ${isOverdue ? '#FF5630' : '#F1A10D'}`,
              color: isOverdue ? '#FF5630' : '#F1A10D',
            }}
          >
            <Clock size={11} />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
              {formatDate(task.dueDate)}
            </Typography>
          </Box>
        )}

        {/* Footer: task ID / author + comment count + assignee avatar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.04em', opacity: 0.8 }}
            >
              {issueType.toUpperCase()}-{task.id}
            </Typography>
            {commentCount > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: 'text.secondary', opacity: 0.7 }}>
                <MessageSquare size={10} />
                <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>{commentCount}</Typography>
              </Box>
            )}
          </Box>

          <Tooltip title={task.assigneeName || 'Unassigned'}>
            <Avatar
              sx={{
                width: 20, height: 20, fontSize: '0.58rem',
                bgcolor: task.assigneeId ? accentColor : '#42526E',
                color: '#FFFFFF', fontWeight: 700,
              }}
            >
              {task.assigneeName?.charAt(0) ?? '?'}
            </Avatar>
          </Tooltip>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default TaskCard;
