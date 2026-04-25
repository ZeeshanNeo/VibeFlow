import axios from 'axios';
import { Task } from '../store/slices/taskSlice';

const API_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.location.port !== '3000'
    ? '/api'
    : 'http://localhost:8080/api');

const statusToBackend = (status?: string) => {
  const normalized = (status || '').toLowerCase().replace(/\s+/g, '_');

  const map: Record<string, string> = {
    backlog: 'Backlog',
    todo: 'Todo',
    in_progress: 'In Progress',
    review: 'Review',
    testing: 'Testing',
    done: 'Done',
    blocked: 'Blocked',
    archived: 'Archived',
  };

  return map[normalized] || 'Backlog';
};

const statusToFrontend = (status?: string) => {
  const normalized = (status || '').toLowerCase().replace(/\s+/g, '_');

  const map: Record<string, string> = {
    backlog: 'backlog',
    todo: 'todo',
    in_progress: 'in_progress',
    review: 'review',
    testing: 'testing',
    done: 'done',
    blocked: 'blocked',
    archived: 'archived',
  };

  return map[normalized] || normalized || 'backlog';
};

const normalizeTask = (task: any): Task => ({
  id: Number(task?.id ?? task?.ID),
  title: task?.title ?? task?.TITLE ?? '',
  description: task?.description ?? task?.DESCRIPTION ?? '',
  status: statusToFrontend(task?.status ?? task?.STATUS),
  assigneeId: (task?.assigneeId ?? task?.assignee_id ?? task?.ASSIGNEE_ID) 
    ? Number(task?.assigneeId ?? task?.assignee_id ?? task?.ASSIGNEE_ID) 
    : undefined,
  assigneeName:
    task?.assigneeName ??
    task?.assignee_email ??
    task?.ASSIGNEE_EMAIL ??
    undefined,
  dueDate: task?.dueDate ?? task?.due_date ?? task?.DUE_DATE ?? undefined,
  createdBy: Number(task?.createdBy ?? task?.created_by ?? task?.CREATED_BY ?? 0),
  createdByName:
    task?.createdByName ??
    task?.created_by_email ??
    task?.CREATED_BY_EMAIL ??
    'Unknown',
  createdAt: task?.createdAt ?? task?.created_at ?? task?.CREATED_AT ?? '',
  updatedAt:
    task?.updatedAt ??
    task?.updated_at ??
    task?.UPDATED_AT ??
    task?.createdAt ??
    task?.created_at ??
    task?.CREATED_AT ??
    '',
  order: Number(task?.order ?? task?.position ?? task?.POSITION ?? 0),
  parentId: task?.parentId ?? task?.parent_id ?? task?.PARENT_ID ?? undefined,
  projectId: task?.projectId ?? task?.project_id ?? task?.PROJECT_ID ?? undefined,
  issueType: task?.issueType ?? task?.issue_type ?? task?.ISSUE_TYPE ?? 'Task',
});

export interface CreateTaskData {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  assigneeId?: number | null;
  status?: string;
  order?: number;
  projectId?: number | null;
  issueType?: string;
  parentId?: number | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  assigneeId?: number | null;
  status?: string;
  order?: number;
  issueType?: string;
  parentId?: number | null;
}

export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkLog {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  hours: number;
  description: string;
  loggedAt: string;
}

export interface AssignmentHistory {
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

export interface TimeReportTask {
  id: number;
  title: string;
  status: string;
  assigneeName?: string;
  createdByName?: string;
  totalHours: number;
}

export interface TimeReport {
  generatedAt: string;
  tasks: TimeReportTask[];
  summary: {
    totalTasks: number;
    grandTotalHours: number;
  };
}

const normalizeWorkLog = (log: any): WorkLog => ({
  id: Number(log?.id ?? log?.ID),
  taskId: Number(log?.taskId ?? log?.task_id ?? log?.TASK_ID),
  userId: Number(log?.userId ?? log?.user_id ?? log?.USER_ID),
  userName: log?.userName ?? log?.user_email ?? log?.USER_EMAIL ?? 'Unknown',
  hours: Number(log?.hours ?? log?.hours_logged ?? log?.HOURS_LOGGED ?? 0),
  description: log?.description ?? log?.DESCRIPTION ?? '',
  loggedAt: log?.loggedAt ?? log?.logged_at ?? log?.CREATED_AT ?? '',
});

const normalizeAssignmentHistory = (item: any): AssignmentHistory => ({
  id: Number(item?.id ?? item?.ID),
  taskId: Number(item?.taskId ?? item?.task_id ?? item?.TASK_ID),
  oldAssigneeId:
    item?.oldAssigneeId ?? item?.old_assignee_id ?? item?.OLD_ASSIGNEE_ID ?? undefined,
  newAssigneeId:
    item?.newAssigneeId ?? item?.new_assignee_id ?? item?.NEW_ASSIGNEE_ID ?? undefined,
  changedBy: Number(item?.changedBy ?? item?.changed_by ?? item?.CHANGED_BY ?? 0),
  changedByName: item?.changedByName ?? item?.changed_by_email ?? item?.CHANGED_BY_EMAIL ?? 'Unknown',
  changedAt: item?.changedAt ?? item?.changed_at ?? item?.CHANGED_AT ?? '',
  oldAssigneeName:
    item?.oldAssigneeName ?? item?.old_assignee_email ?? item?.OLD_ASSIGNEE_EMAIL ?? 'Unassigned',
  newAssigneeName:
    item?.newAssigneeName ?? item?.new_assignee_email ?? item?.NEW_ASSIGNEE_EMAIL ?? 'Unassigned',
});

const normalizeComment = (comment: any): Comment => ({
  id: Number(comment?.id ?? comment?.ID),
  taskId: Number(comment?.taskId ?? comment?.task_id ?? comment?.TASK_ID),
  userId: Number(comment?.userId ?? comment?.user_id ?? comment?.USER_ID),
  userName: comment?.userName ?? comment?.user_name ?? comment?.USER_NAME ?? comment?.user_email ?? comment?.USER_EMAIL ?? 'Unknown',
  userEmail: comment?.userEmail ?? comment?.user_email ?? comment?.USER_EMAIL ?? '',
  content: comment?.content ?? comment?.CONTENT ?? '',
  createdAt: comment?.createdAt ?? comment?.created_at ?? comment?.CREATED_AT ?? '',
  updatedAt: comment?.updatedAt ?? comment?.updated_at ?? comment?.UPDATED_AT ?? '',
});

const normalizeActivityLog = (log: any) => ({
  id: Number(log?.id ?? log?.ID),
  taskId: Number(log?.taskId ?? log?.task_id ?? log?.TASK_ID),
  userId: Number(log?.userId ?? log?.user_id ?? log?.USER_ID),
  userName: log?.userName ?? log?.user_name ?? log?.USER_NAME ?? log?.user_email ?? log?.USER_EMAIL ?? 'System',
  userEmail: log?.userEmail ?? log?.user_email ?? log?.USER_EMAIL ?? '',
  action: log?.action ?? log?.ACTION ?? '',
  oldValue: log?.oldValue ?? log?.old_value ?? log?.OLD_VALUE,
  newValue: log?.newValue ?? log?.new_value ?? log?.NEW_VALUE,
  createdAt: log?.createdAt ?? log?.created_at ?? log?.CREATED_AT ?? new Date().toISOString(),
});

const normalizeTimeReportTask = (task: any): TimeReportTask => ({
  id: Number(task?.id ?? task?.ID),
  title: task?.title ?? task?.TITLE ?? '',
  status: statusToFrontend(task?.status ?? task?.STATUS),
  assigneeName: task?.assigneeName ?? task?.assignee_name ?? task?.ASSIGNEE_NAME ?? 'Unassigned',
  totalHours: Number(task?.totalHours ?? task?.total_hours ?? task?.TOTAL_HOURS ?? 0),
});

const taskService = {
  async getAllTasks(projectId?: number): Promise<Task[]> {
    const url = projectId ? `${API_URL}/tasks?projectId=${projectId}` : `${API_URL}/tasks`;
    const response = await axios.get(url);
    return (response.data.tasks || []).map(normalizeTask);
  },

  async getTasksByStatus(status: string): Promise<Task[]> {
    const response = await axios.get(`${API_URL}/tasks/status/${statusToBackend(status)}`);
    return (response.data.tasks || []).map(normalizeTask);
  },

  async getTaskById(id: number): Promise<Task> {
    const response = await axios.get(`${API_URL}/tasks/${id}`);
    return normalizeTask(response.data.task);
  },

  async createTask(taskData: CreateTaskData): Promise<Task> {
    const payload = {
      ...taskData,
      status: statusToBackend(taskData.status || 'backlog'),
      issueType: taskData.issueType || 'Task',
      projectId: taskData.projectId || undefined,
      parentId: taskData.parentId || undefined,
    };
    const response = await axios.post(`${API_URL}/tasks`, payload);
    return normalizeTask(response.data.task);
  },

  async updateTask(id: number, taskData: UpdateTaskData): Promise<Task> {
    const { status, order, ...rest } = taskData;
    const response = await axios.put(`${API_URL}/tasks/${id}`, rest);
    return normalizeTask(response.data.task);
  },

  async updateTaskStatus(id: number, status: string, order: number): Promise<Task> {
    const response = await axios.patch(`${API_URL}/tasks/${id}/status`, {
      status: statusToBackend(status),
      order,
    });
    return normalizeTask(response.data.task);
  },

  async reorderTasks(taskIds: number[], status: string): Promise<void> {
    await axios.patch(`${API_URL}/tasks/reorder`, {
      taskIds,
      status: statusToBackend(status),
    });
  },

  async deleteTask(id: number): Promise<void> {
    await axios.delete(`${API_URL}/tasks/${id}`);
  },

  // Comments
  async getComments(taskId: number): Promise<Comment[]> {
    const response = await axios.get(`${API_URL}/comments/tasks/${taskId}`);
    return (response.data.comments || []).map(normalizeComment);
  },

  async addComment(taskId: number, content: string): Promise<Comment> {
    const response = await axios.post(`${API_URL}/comments/tasks/${taskId}`, { content });
    return normalizeComment(response.data.comment);
  },

  async updateComment(id: number, content: string): Promise<Comment> {
    const response = await axios.put(`${API_URL}/comments/${id}`, { content });
    return normalizeComment(response.data.comment);
  },

  async deleteComment(id: number): Promise<void> {
    await axios.delete(`${API_URL}/comments/${id}`);
  },

  // Activity
  async getTaskActivity(taskId: number): Promise<any[]> {
    const response = await axios.get(`${API_URL}/tasks/${taskId}/activity`);
    return (response.data.activity || []).map(normalizeActivityLog);
  },

  // Worklogs
  async getWorkLogs(taskId: number): Promise<WorkLog[]> {
    const response = await axios.get(`${API_URL}/worklogs/tasks/${taskId}`);
    return (response.data.workLogs || []).map(normalizeWorkLog);
  },

  async logWork(taskId: number, hours: number, description: string): Promise<WorkLog> {
    const response = await axios.post(`${API_URL}/worklogs/tasks/${taskId}`, {
      hoursLogged: hours,
      description,
    });
    return normalizeWorkLog(response.data.workLog);
  },

  // Assignment History
  async getAssignmentHistory(taskId: number): Promise<AssignmentHistory[]> {
    const response = await axios.get(`${API_URL}/assignments/tasks/${taskId}/history`);
    return (response.data.history || []).map(normalizeAssignmentHistory);
  },

  async updateAssignee(taskId: number, assigneeId?: number): Promise<Task> {
    const response = await axios.patch(`${API_URL}/assignments/tasks/${taskId}/assign`, {
      assigneeId: assigneeId ?? null,
    });
    return normalizeTask(response.data.task);
  },

  // Reports
  async getTimeReport(projectId?: number): Promise<TimeReport> {
    const url = projectId ? `${API_URL}/reports/time?projectId=${projectId}` : `${API_URL}/reports/time`;
    const response = await axios.get(url);
    const report = response.data.report || {};

    return {
      generatedAt: report.generatedAt ?? new Date().toISOString(),
      tasks: (report.tasks || []).map(normalizeTimeReportTask),
      summary: {
        totalTasks: Number(report.summary?.totalTasks ?? 0),
        grandTotalHours: Number(report.summary?.grandTotalHours ?? 0),
      },
    };
  },
};

export default taskService;
