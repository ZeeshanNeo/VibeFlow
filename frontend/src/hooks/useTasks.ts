import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  setTasks,
  addTask,
  updateTask,
  removeTask,
  updateTaskStatus,
  setLoading,
  setError,
  Task,
} from '../store/slices/taskSlice';
import taskService from '../services/taskService';

export const useTasks = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state: RootState) => state.tasks as {
    tasks: Task[];
    loading: boolean;
    error: string | null;
  });

  const fetchTasks = useCallback(async (projectId?: number) => {
    dispatch(setLoading(true));
    try {
      const fetchedTasks = await taskService.getAllTasks(projectId);
      dispatch(setTasks(fetchedTasks));
      return fetchedTasks;
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const createTask = useCallback(async (taskData: any) => {
    dispatch(setLoading(true));
    try {
      const newTask = await taskService.createTask(taskData);
      dispatch(addTask(newTask));
      return newTask;
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const editTask = useCallback(async (id: number, taskData: any) => {
    dispatch(setLoading(true));
    try {
      const updatedTask = await taskService.updateTask(id, taskData);
      dispatch(updateTask(updatedTask));
      return updatedTask;
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const deleteTask = useCallback(async (id: number) => {
    dispatch(setLoading(true));
    try {
      await taskService.deleteTask(id);
      dispatch(removeTask(id));
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const changeTaskStatus = useCallback(async (id: number, status: string, order: number) => {
    dispatch(setLoading(true));
    try {
      const updatedTask = await taskService.updateTaskStatus(id, status, order);
      dispatch(updateTaskStatus({ id, status, order }));
      return updatedTask;
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const reorderColumnTasks = useCallback(async (taskIds: number[], status: string) => {
    dispatch(setLoading(true));
    try {
      await taskService.reorderTasks(taskIds, status);
      return taskIds;
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const getTasksByStatus = useCallback((status: string) => {
    return tasks.filter(task => task.status === status).sort((a, b) => a.order - b.order);
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    editTask,
    deleteTask,
    changeTaskStatus,
    reorderColumnTasks,
    getTasksByStatus,
  };
};
