require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Board = require('./models/Board');
const List = require('./models/List');
const Task = require('./models/Task');
const Activity = require('./models/Activity');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Board.deleteMany({});
        await List.deleteMany({});
        await Task.deleteMany({});
        await Activity.deleteMany({});

        // Create demo users
        const alice = await User.create({
            name: 'Alice Johnson',
            email: 'alice@demo.com',
            password: 'password123'
        });

        const bob = await User.create({
            name: 'Bob Smith',
            email: 'bob@demo.com',
            password: 'password123'
        });

        const charlie = await User.create({
            name: 'Charlie Brown',
            email: 'charlie@demo.com',
            password: 'password123'
        });

        console.log('✅ Users created');

        // Create boards
        const projectBoard = await Board.create({
            title: 'Product Launch Q1',
            description: 'Planning and execution for Q1 product launch',
            owner: alice._id,
            members: [alice._id, bob._id, charlie._id],
            background: '#6366f1'
        });

        const sprintBoard = await Board.create({
            title: 'Sprint 14 - Backend',
            description: 'Sprint tasks for backend team',
            owner: bob._id,
            members: [bob._id, alice._id],
            background: '#10b981'
        });

        console.log('✅ Boards created');

        // Create lists for Product Launch board
        const backlog = await List.create({ title: 'Backlog', board: projectBoard._id, position: 0 });
        const todo = await List.create({ title: 'To Do', board: projectBoard._id, position: 1 });
        const inProgress = await List.create({ title: 'In Progress', board: projectBoard._id, position: 2 });
        const review = await List.create({ title: 'Review', board: projectBoard._id, position: 3 });
        const done = await List.create({ title: 'Done', board: projectBoard._id, position: 4 });

        // Create lists for Sprint board
        const sTodo = await List.create({ title: 'Todo', board: sprintBoard._id, position: 0 });
        const sInProgress = await List.create({ title: 'In Progress', board: sprintBoard._id, position: 1 });
        const sDone = await List.create({ title: 'Done', board: sprintBoard._id, position: 2 });

        console.log('✅ Lists created');

        // Create tasks for Product Launch board
        const tasks = [
            { title: 'Design landing page mockup', description: 'Create high-fidelity mockups for the new landing page', list: backlog._id, board: projectBoard._id, position: 0, priority: 'high', assignees: [alice._id], labels: [{ text: 'Design', color: '#ec4899' }] },
            { title: 'Write API documentation', description: 'Document all REST endpoints with examples', list: backlog._id, board: projectBoard._id, position: 1, priority: 'medium', assignees: [bob._id], labels: [{ text: 'Docs', color: '#3b82f6' }] },
            { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', list: todo._id, board: projectBoard._id, position: 0, priority: 'high', assignees: [charlie._id], labels: [{ text: 'DevOps', color: '#f59e0b' }] },
            { title: 'Implement user authentication', description: 'Add JWT-based auth with signup and login', list: todo._id, board: projectBoard._id, position: 1, priority: 'urgent', assignees: [bob._id, alice._id], labels: [{ text: 'Backend', color: '#10b981' }] },
            { title: 'Create dashboard components', description: 'Build reusable React components for the dashboard', list: inProgress._id, board: projectBoard._id, position: 0, priority: 'high', assignees: [alice._id], labels: [{ text: 'Frontend', color: '#8b5cf6' }] },
            { title: 'Database schema design', description: 'Design MongoDB schemas with proper indexing', list: inProgress._id, board: projectBoard._id, position: 1, priority: 'medium', assignees: [bob._id], labels: [{ text: 'Backend', color: '#10b981' }] },
            { title: 'Code review: Auth module', description: 'Review PR #42 for authentication module', list: review._id, board: projectBoard._id, position: 0, priority: 'medium', assignees: [charlie._id], labels: [{ text: 'Review', color: '#f97316' }] },
            { title: 'Setup project repository', description: 'Initialize repo with proper folder structure', list: done._id, board: projectBoard._id, position: 0, priority: 'low', assignees: [alice._id], labels: [{ text: 'Setup', color: '#6b7280' }] },
        ];

        // Create tasks for Sprint board
        const sprintTasks = [
            { title: 'Fix pagination bug', description: 'Pagination returns wrong count after filter', list: sTodo._id, board: sprintBoard._id, position: 0, priority: 'high', assignees: [bob._id], labels: [{ text: 'Bug', color: '#ef4444' }] },
            { title: 'Add rate limiting', description: 'Implement rate limiting on API endpoints', list: sInProgress._id, board: sprintBoard._id, position: 0, priority: 'medium', assignees: [alice._id], labels: [{ text: 'Security', color: '#f59e0b' }] },
            { title: 'Optimize DB queries', description: 'Add indexes and optimize slow queries', list: sDone._id, board: sprintBoard._id, position: 0, priority: 'low', assignees: [bob._id], labels: [{ text: 'Performance', color: '#14b8a6' }] },
        ];

        await Task.insertMany([...tasks, ...sprintTasks]);
        console.log('✅ Tasks created');

        // Create some activity entries
        const activities = [
            { user: alice._id, board: projectBoard._id, action: 'created_board', entityType: 'board', entityTitle: 'Product Launch Q1' },
            { user: alice._id, board: projectBoard._id, action: 'created_list', entityType: 'list', entityTitle: 'Backlog' },
            { user: alice._id, board: projectBoard._id, action: 'created_list', entityType: 'list', entityTitle: 'To Do' },
            { user: alice._id, board: projectBoard._id, action: 'created_list', entityType: 'list', entityTitle: 'In Progress' },
            { user: bob._id, board: projectBoard._id, action: 'created_task', entityType: 'task', entityTitle: 'Implement user authentication' },
            { user: alice._id, board: projectBoard._id, action: 'assigned_user', entityType: 'task', entityTitle: 'Create dashboard components', details: 'Assigned Alice Johnson' },
            { user: charlie._id, board: projectBoard._id, action: 'moved_task', entityType: 'task', entityTitle: 'Setup project repository', details: 'Moved task to Done' },
            { user: alice._id, board: projectBoard._id, action: 'added_member', entityType: 'user', entityTitle: 'Charlie Brown', details: 'Alice Johnson added Charlie Brown to the board' },
        ];

        await Activity.insertMany(activities);
        console.log('✅ Activities created');

        console.log('\n🎉 Seed completed successfully!\n');
        console.log('Demo Accounts:');
        console.log('┌───────────────────┬───────────────┐');
        console.log('│ Email             │ Password      │');
        console.log('├───────────────────┼───────────────┤');
        console.log('│ alice@demo.com    │ password123   │');
        console.log('│ bob@demo.com      │ password123   │');
        console.log('│ charlie@demo.com  │ password123   │');
        console.log('└───────────────────┴───────────────┘\n');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedData();
