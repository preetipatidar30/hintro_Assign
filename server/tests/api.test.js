const mongoose = require('mongoose');
const request = require('supertest');

// Setup env before requiring app
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/taskflow_test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:5173';

const { app, server } = require('../server');

let token;
let userId;
let boardId;
let listId;
let taskId;

beforeAll(async () => {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Clear test database
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.connection.close();
    server.close();
});

describe('Auth API', () => {
    test('POST /api/auth/signup - should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ name: 'Test User', email: 'test@test.com', password: 'password123' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('_id');
        expect(res.body.user.email).toBe('test@test.com');
        token = res.body.token;
        userId = res.body.user._id;
    });

    test('POST /api/auth/signup - should reject duplicate email', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ name: 'Test User', email: 'test@test.com', password: 'password123' });

        expect(res.status).toBe(400);
    });

    test('POST /api/auth/login - should login with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: 'wrongpassword' });

        expect(res.status).toBe(400);
    });

    test('GET /api/auth/me - should return current user', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe('test@test.com');
    });

    test('GET /api/auth/me - should reject without token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });
});

describe('Board API', () => {
    test('POST /api/boards - should create a board', async () => {
        const res = await request(app)
            .post('/api/boards')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Test Board', description: 'A test board' });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Test Board');
        boardId = res.body._id;
    });

    test('GET /api/boards - should list boards', async () => {
        const res = await request(app)
            .get('/api/boards')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.boards.length).toBeGreaterThan(0);
        expect(res.body).toHaveProperty('pagination');
    });

    test('GET /api/boards/:id - should get board details', async () => {
        const res = await request(app)
            .get(`/api/boards/${boardId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.board.title).toBe('Test Board');
        expect(res.body).toHaveProperty('lists');
        expect(res.body).toHaveProperty('tasks');
    });

    test('PUT /api/boards/:id - should update a board', async () => {
        const res = await request(app)
            .put(`/api/boards/${boardId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Updated Board' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated Board');
    });
});

describe('List API', () => {
    test('POST /api/boards/:boardId/lists - should create a list', async () => {
        const res = await request(app)
            .post(`/api/boards/${boardId}/lists`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'To Do' });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('To Do');
        listId = res.body._id;
    });

    test('PUT /api/lists/:id - should update a list', async () => {
        const res = await request(app)
            .put(`/api/lists/${listId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Updated List' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated List');
    });
});

describe('Task API', () => {
    test('POST /api/lists/:listId/tasks - should create a task', async () => {
        const res = await request(app)
            .post(`/api/lists/${listId}/tasks`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Test Task', description: 'A test task', priority: 'high' });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Test Task');
        expect(res.body.priority).toBe('high');
        taskId = res.body._id;
    });

    test('PUT /api/tasks/:id - should update a task', async () => {
        const res = await request(app)
            .put(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Updated Task', priority: 'urgent' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated Task');
        expect(res.body.priority).toBe('urgent');
    });

    test('PUT /api/tasks/:id/assign - should assign user to task', async () => {
        const res = await request(app)
            .put(`/api/tasks/${taskId}/assign`)
            .set('Authorization', `Bearer ${token}`)
            .send({ userId, action: 'assign' });

        expect(res.status).toBe(200);
        expect(res.body.assignees.length).toBe(1);
    });

    test('GET /api/boards/:boardId/tasks/search - should search tasks', async () => {
        const res = await request(app)
            .get(`/api/boards/${boardId}/tasks/search?q=Updated`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.tasks.length).toBeGreaterThan(0);
    });

    test('DELETE /api/tasks/:id - should delete a task', async () => {
        const res = await request(app)
            .delete(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });
});

describe('Activity API', () => {
    test('GET /api/boards/:boardId/activity - should return activity log', async () => {
        const res = await request(app)
            .get(`/api/boards/${boardId}/activity`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('activities');
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.activities.length).toBeGreaterThan(0);
    });
});

describe('Health Check', () => {
    test('GET /api/health - should return OK', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
    });
});
