import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../store/slices/taskSlice';

interface DndProviderWrapperProps {
  children: React.ReactNode;
  tasks: Task[];
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
}

const DndProviderWrapper: React.FC<DndProviderWrapperProps> = ({
  children,
  tasks,
  onDragEnd,
  onDragStart,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const taskIds = tasks.map(task => task.id.toString());

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay>
        {/* Overlay content when dragging */}
      </DragOverlay>
    </DndContext>
  );
};

export default DndProviderWrapper;