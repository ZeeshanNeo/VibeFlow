const request = require('supertest');
const app = require('../../src/app');

// Mock the database connection to avoid actual DB calls during tests
jest.mock('../../src/config/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
  executeQuery: jest.fn(),
  executeQuerySingle: jest.fn(),
  executeQueryRows: jest.fn(),
}));

const { executeQuery, executeQuerySingle, executeQueryRows } = require('../../src/config/database');

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('Health Check', () => {
    it('GET /health should return 200 OK', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication Endpoints', () => {
    it('POST /api/auth/register should register a new user', async () => {
      // Mock database responses
      executeQuerySingle.mockResolvedValueOnce(null) // email doesn't exist
                       .mockResolvedValueOnce({ 
                         id: 1, 
                         email: 'test@example.com', 
                         created_at: new Date().toISOString() 
                       });
      
      executeQuery.mockResolvedValue({ 
        outBinds: { 
          id: [1], 
          emailOut: ['test@example.com'], 
          nameOut: [null],
          createdAt: [new Date()] 
        } 
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('token');
    });

    it('POST /api/auth/login should authenticate user', async () => {
      const bcrypt = require('bcrypt');
      const User = require('../../src/models/User');

      jest.spyOn(User, 'findByEmail').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password_hash: 'mock-hash',
        name: 'Test User',
        created_at: new Date().toISOString()
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('Task Endpoints', () => {
    let authToken;

    beforeEach(() => {
      // Create a mock token for authenticated requests
      authToken = 'mock-jwt-token';
      
      // Mock JWT verification
      jest.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue({
        userId: 1,
        email: 'test@example.com'
      });
    });

    it('GET /api/tasks should return all tasks', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', status: 'Backlog' },
        { id: 2, title: 'Task 2', status: 'Todo' }
      ];

      executeQueryRows.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.tasks[0]).toHaveProperty('title', 'Task 1');
    });

    it('POST /api/tasks should create a new task', async () => {
      // Mock task creation
      executeQuerySingle.mockResolvedValueOnce({ maxPos: 0 }) // position query
                       .mockResolvedValueOnce({ // findById after creation
                         id: 1,
                         title: 'New Task',
                         status: 'Backlog',
                         assignee_id: null,
                         assignee_email: null,
                         created_by_email: 'test@example.com'
                       });
      
      executeQuery.mockResolvedValue({ outBinds: { id: [1] } });

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Task'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Task created successfully');
      expect(response.body.task).toHaveProperty('title', 'New Task');
      expect(response.body.task).toHaveProperty('status', 'Backlog');
    });
  });

  describe('Worklog Endpoints', () => {
    let authToken;

    beforeEach(() => {
      authToken = 'mock-jwt-token';
      jest.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue({
        userId: 1,
        email: 'test@example.com'
      });
    });

    it('POST /api/worklogs/tasks/:id should create a work log', async () => {
      // Mock task exists
      executeQuerySingle.mockResolvedValueOnce({
        id: 1,
        title: 'Test Task'
      }).mockResolvedValueOnce({ // worklog after creation
        id: 1,
        task_id: 1,
        user_id: 1,
        hours_logged: 2.5,
        description: 'Test work',
        created_at: new Date().toISOString()
      });
      
      executeQuery.mockResolvedValue({ outBinds: { id: [1] } });

      const response = await request(app)
        .post('/api/worklogs/tasks/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hoursLogged: 2.5,
          description: 'Test work'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Work log created successfully');
      expect(response.body.workLog).toHaveProperty('hours_logged', 2.5);
    });
  });

  describe('Report Endpoints', () => {
    let authToken;

    beforeEach(() => {
      authToken = 'mock-jwt-token';
      jest.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue({
        userId: 1,
        email: 'test@example.com'
      });
    });

    it('GET /api/reports/time should return time report', async () => {
      const mockReport = [
        { id: 1, title: 'Task 1', status: 'In Progress', total_hours: 5.5 },
        { id: 2, title: 'Task 2', status: 'Done', total_hours: 3.0 }
      ];

      executeQueryRows.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/reports/time')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.report).toHaveProperty('tasks');
      expect(response.body.report.tasks).toHaveLength(2);
      expect(response.body.report.summary).toHaveProperty('grandTotalHours');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Route not found');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).get('/api/tasks');
      // No Authorization header
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });
});
