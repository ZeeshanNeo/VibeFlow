import axios from 'axios';

const API_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.location.port !== '3000'
    ? '/api'
    : 'http://localhost:8080/api');

export interface Project {
  id: number;
  name: string;
  key: string;
  description?: string;
  owner_id: number;
  owner_email?: string;
  owner_name?: string;
  member_count?: number;
  task_count?: number;
  my_role?: string;
  created_at?: string;
}

export interface ProjectMember {
  id: number;
  email: string;
  name: string;
  role: string;
  joined_at?: string;
}

const normalizeProject = (p: any): Project => ({
  id: Number(p?.id ?? p?.ID),
  name: p?.name ?? p?.NAME ?? '',
  key: p?.key ?? p?.KEY ?? '',
  description: p?.description ?? p?.DESCRIPTION ?? '',
  owner_id: Number(p?.owner_id ?? p?.OWNER_ID),
  owner_email: p?.owner_email ?? p?.OWNER_EMAIL ?? '',
  owner_name: p?.owner_name ?? p?.OWNER_NAME ?? '',
  member_count: Number(p?.member_count ?? p?.MEMBER_COUNT ?? 0),
  task_count: Number(p?.task_count ?? p?.TASK_COUNT ?? 0),
  my_role: p?.my_role ?? p?.MY_ROLE ?? 'member',
  created_at: p?.created_at ?? p?.CREATED_AT,
});

const projectService = {
  async getProjects(): Promise<Project[]> {
    const response = await axios.get(`${API_URL}/projects`);
    return (response.data.projects || []).map(normalizeProject);
  },

  async createProject(name: string, key: string, description?: string): Promise<Project> {
    const response = await axios.post(`${API_URL}/projects`, { name, key, description });
    return normalizeProject(response.data.project);
  },

  async getProject(id: number): Promise<{ project: Project; members: ProjectMember[] }> {
    const response = await axios.get(`${API_URL}/projects/${id}`);
    return {
      project: normalizeProject(response.data.project),
      members: (response.data.members || []).map((m: any) => ({
        id: Number(m.id ?? m.ID),
        email: m.email ?? m.EMAIL ?? '',
        name: m.name ?? m.NAME ?? '',
        role: m.role ?? m.ROLE ?? 'member',
        joined_at: m.joined_at ?? m.JOINED_AT,
      })),
    };
  },

  async updateProject(id: number, name: string, description?: string): Promise<Project> {
    const response = await axios.put(`${API_URL}/projects/${id}`, { name, description });
    return normalizeProject(response.data.project);
  },

  async deleteProject(id: number): Promise<void> {
    await axios.delete(`${API_URL}/projects/${id}`);
  },

  async addMember(projectId: number, email: string, role = 'member'): Promise<ProjectMember[]> {
    const response = await axios.post(`${API_URL}/projects/${projectId}/members`, { email, role });
    return (response.data.members || []).map((m: any) => ({
      id: Number(m.id ?? m.ID),
      email: m.email ?? m.EMAIL ?? '',
      name: m.name ?? m.NAME ?? '',
      role: m.role ?? m.ROLE ?? 'member',
    }));
  },

  async removeMember(projectId: number, userId: number): Promise<void> {
    await axios.delete(`${API_URL}/projects/${projectId}/members/${userId}`);
  },
};

export default projectService;
