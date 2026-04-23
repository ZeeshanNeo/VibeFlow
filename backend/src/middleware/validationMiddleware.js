const Joi = require('joi');

/**
 * Generic validation middleware
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().min(6).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Task schemas
  createTask: Joi.object({
    title: Joi.string().max(255).required(),
    assigneeId: Joi.number().integer().positive().allow(null),
    dueDate: Joi.date().iso().allow(null),
    status: Joi.string().valid(
      'Backlog', 'Todo', 'In Progress', 'Review', 
      'Testing', 'Done', 'Blocked', 'Archived'
    ).default('Backlog'),
  }),

  updateTask: Joi.object({
    title: Joi.string().max(255),
    assigneeId: Joi.number().integer().positive().allow(null),
    dueDate: Joi.date().iso().allow(null),
  }).min(1),

  updateStatus: Joi.object({
    status: Joi.string().valid(
      'Backlog', 'Todo', 'In Progress', 'Review', 
      'Testing', 'Done', 'Blocked', 'Archived'
    ).required(),
  }),

  reorderTasks: Joi.object({
    taskIds: Joi.array().items(Joi.number().integer().positive()).required(),
  }),

  // Assignment schemas
  assignTask: Joi.object({
    assigneeId: Joi.number().integer().positive().allow(null).required(),
  }),

  // Worklog schemas
  createWorkLog: Joi.object({
    hoursLogged: Joi.number().positive().required(),
    description: Joi.string().max(1000).required(),
  }),

  // Pagination schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  // Date range schemas
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
  }),
};

module.exports = {
  validate,
  schemas,
};