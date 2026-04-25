import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import { Task } from '../store/slices/taskSlice';

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
    data: {
      type: 'task',
      task,
      columnId: task.status,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab',
    touchAction: 'none' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
};

export default SortableTaskCard;
