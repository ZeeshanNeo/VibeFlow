# Backend Project Structure

## Folder Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── jwt.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── taskController.js
│   │   ├── assignmentController.js
│   │   ├── worklogController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── validationMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── AssignmentHistory.js
│   │   └── WorkLog.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── assignmentRoutes.js
│   │   ├── worklogRoutes.js
│   │   └── reportRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── taskService.js
│   │   ├── assignmentService.js
│   │   ├── worklogService.js
│   │   └── reportService.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── helpers.js
│   │   └── logger.js
│   └── app.js
├── tests/
│   ├── unit/
│   │   ├── auth.test.js
│   │   ├── task.test.js
│   │   ├── assignment.test.js
│   │   ├── worklog.test.js
│   │   └── report.test.js
│   └── integration/
│       └── api.test.js
├── package.json
├── .env.example
├── .gitignore
├── Dockerfile
└── README.md
```

## Package.json Dependencies
```json
{
  "name": "vibeflow-backend",
  "version": "1.0.0",
  "description": "VibeFlow Kanban Board Backend API",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "oracledb": "^6.0.0",
    "express-validator": "^6.15.0",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "nodemon": "^2.0.22"
  }
}
```

## Core Files Overview

### 1. Database Configuration (`src/config/database.js`)
```javascript
const oracledb = require('oracledb');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING || 'DESKTOP-8RJAQKG/XE',
};

async function initialize() {
  await oracledb.createPool(dbConfig);
}

async function close() {
  await oracledb.getPool().close();
}

module.exports = { initialize, close, getConnection: () => oracledb.getConnection() };
```

### 2. Main Application (`src/app.js`)
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { initialize } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
// ... other routes

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
// ... other route mounts

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    await initialize();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### 3. Model Example (`src/models/Task.js`)
```javascript
class Task {
  static async findAll() {
    const connection = await require('../config/database').getConnection();
    const result = await connection.execute(
      `SELECT t.*, u.email as assignee_email, 
              creator.email as created_by_email
       FROM TASKS t
       LEFT JOIN USERS u ON t.assignee_id = u.id
       LEFT JOIN USERS creator ON t.created_by = creator.id
       ORDER BY t.position`
    );
    await connection.close();
    return result.rows;
  }

  static async create(taskData) {
    const connection = await require('../config/database').getConnection();
    const result = await connection.execute(
      `INSERT INTO TASKS (title, status, created_by, position)
       VALUES (:title, :status, :created_by, :position)
       RETURNING id INTO :id`,
      {
        title: taskData.title,
        status: taskData.status || 'Backlog',
        created_by: taskData.created_by,
        position: taskData.position || 0,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    await connection.close();
    return result.outBinds.id[0];
  }
  
  // ... other methods
}

module.exports = Task;
```

### 4. Route Example (`src/routes/taskRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');

router.use(authMiddleware);

router.get('/', taskController.getAllTasks);
router.post('/', validationMiddleware.validateTask, taskController.createTask);
router.put('/:id', validationMiddleware.validateTask, taskController.updateTask);
router.put('/:id/move', taskController.moveTask);
router.put('/:id/assignee', taskController.updateAssignee);

module.exports = router;
```

## Setup Steps
1. Create `backend` directory
2. Initialize npm: `npm init -y`
3. Install dependencies
4. Create folder structure as above
5. Configure environment variables
6. Set up database connection
7. Implement core modules in order

## Environment Variables
```
PORT=8080
DB_USER=your_username
DB_PASSWORD=your_password
DB_CONNECT_STRING=DESKTOP-8RJAQKG/XE
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h
```

## Testing Strategy
- Unit tests for service layer logic
- Integration tests for API endpoints
- Mock database for unit tests
- Test coverage for all KPIs