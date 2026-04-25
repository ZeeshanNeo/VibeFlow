import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Typography, Box, IconButton } from '@mui/material';
import { Plus, MoreHorizontal, Check } from 'lucide-react';
import { Task } from '../store/slices/taskSlice';
import SortableTaskCard from './SortableTaskCard';
import { COLUMN_COLORS } from './TaskCard';

interface Column {
  id: string;
  title: string;
  color: string;
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks, onTaskClick, onAddTask }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  const accentColor = COLUMN_COLORS[column.id] ?? column.color;

  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: 300,
        minWidth: 300,
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isOver ? `${accentColor}12` : 'background.paper',
        border: '1px solid',
        borderColor: isOver ? accentColor : 'divider',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: '10px',
        pb: 1,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        boxShadow: isOver ? `0 0 0 1px ${accentColor}44` : 'none',
      }}
    >
      {/* Column header */}
      <Box sx={{ p: '12px 14px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Coloured dot */}
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: accentColor, flexShrink: 0 }} />
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            {column.title}
          </Typography>
          <Box
            sx={{
              bgcolor: `${accentColor}22`,
              color: accentColor,
              px: 0.8, py: 0.15,
              borderRadius: '100px',
              fontSize: '0.65rem',
              fontWeight: 800,
              minWidth: 18,
              textAlign: 'center',
            }}
          >
            {tasks.length}
          </Box>
          {column.id === 'done' && <Check size={13} color="#1F845A" strokeWidth={3} />}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" onClick={() => onAddTask(column.id)} sx={{ p: 0.4, color: '#8C9BAB', '&:hover': { color: accentColor } }}>
            <Plus size={15} />
          </IconButton>
          <IconButton size="small" sx={{ p: 0.4, color: '#8C9BAB' }}>
            <MoreHorizontal size={15} />
          </IconButton>
        </Box>
      </Box>

      {/* Task list */}
      <Box
        sx={{
          px: '8px', pb: '8px',
          flexGrow: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: accentColor + '44', borderRadius: '10px' },
        }}
      >
        <SortableContext items={tasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        {/* Empty drop zone hint */}
        {tasks.length === 0 && (
          <Box
            sx={{
              flex: 1, minHeight: 80, borderRadius: '8px',
              border: `2px dashed ${accentColor}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: accentColor + '88', fontSize: '0.7rem' }}>
              Drop here
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default KanbanColumn;

