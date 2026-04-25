import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  assigneeId?: number | null;
  assigneeName?: string | null;
  dueDate?: string | null;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  order: number;
  parentId?: number | null;
  projectId?: number | null;
  issueType: string;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    removeTask: (state, action: PayloadAction<number>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    },
    updateTaskStatus: (state, action: PayloadAction<{ id: number; status: string; order: number }>) => {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) {
        task.status = action.payload.status;
        task.order = action.payload.order;
      }
    },
    reorderTasks: (state, action: PayloadAction<{ status: string; tasks: Task[] }>) => {
      const { tasks } = action.payload;
      tasks.forEach(updatedTask => {
        const index = state.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          state.tasks[index] = updatedTask;
        }
      });
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  removeTask,
  updateTaskStatus,
  reorderTasks,
  setLoading,
  setError,
} = taskSlice.actions;

export default taskSlice.reducer;
