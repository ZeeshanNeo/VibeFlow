import axios from 'axios';

const runTest = async () => {
  const loginUrl = 'http://localhost:8080/api/auth/login';
  const createUrl = 'http://localhost:8080/api/tasks';

  try {
    console.log('Logging in...');
    const loginRes = await axios.post(loginUrl, {
      email: 'admin@vibeflow.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('Token received:', token.substring(0, 10) + '...');
    
    console.log('Creating task...');
    try {
      const createRes = await axios.post(createUrl, {
        title: 'Test Task from Script',
        status: 'Backlog'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Success:', createRes.data);
    } catch (err) {
      if (err.response) {
        console.log('Error 400 response:', err.response.data);
      } else {
        console.log('Error:', err.message);
      }
    }
  } catch (err) {
    console.error('Login failed:', err.message);
  }
};

runTest();
