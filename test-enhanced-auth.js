const BASE_URL = 'http://localhost:3000';

async function testEnhancedAuth() {
  console.log('🧪 Testing Enhanced Authentication System\n');

  // Test data
  const testUser = {
    email: 'testuser3@example.com',
    username: 'testuser789',
    password: 'Password123',
    firstName: 'Test',
    lastName: 'User',
    bio: 'Test user for authentication system'
  };

  let authToken = null;

  try {
    // 1. Test Registration with Enhanced Fields
    console.log('1️⃣ Testing Registration with Enhanced Fields...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerResponse.json();
    console.log('   Status:', registerResponse.status);
    console.log('   Response:', JSON.stringify(registerData, null, 2));

    if (registerResponse.status === 201) {
      console.log('   ✅ Registration successful with enhanced fields\n');
      authToken = registerData.data?.token;
    } else {
      console.log('   ❌ Registration failed:', registerData.error || registerData.message);
      console.log('');
    }

    // 2. Test Login with Email
    console.log('2️⃣ Testing Login with Email...');
    const emailLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
         emailOrUsername: testUser.email,
         password: testUser.password,
         rememberMe: false
       }),
    });

    const emailLoginData = await emailLoginResponse.json();
    console.log('   Status:', emailLoginResponse.status);
    console.log('   Response:', JSON.stringify(emailLoginData, null, 2));

    if (emailLoginResponse.status === 200) {
      console.log('   ✅ Email login successful\n');
      authToken = emailLoginData.data?.token;
    } else {
      console.log('   ❌ Email login failed:', emailLoginData.error || emailLoginData.message);
      console.log('');
    }

    // 3. Test Login with Username
    console.log('3️⃣ Testing Login with Username...');
    const usernameLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
         emailOrUsername: testUser.username,
         password: testUser.password,
         rememberMe: true
       }),
    });

    const usernameLoginData = await usernameLoginResponse.json();
    console.log('   Status:', usernameLoginResponse.status);
    console.log('   Response:', JSON.stringify(usernameLoginData, null, 2));

    if (usernameLoginResponse.status === 200) {
      console.log('   ✅ Username login successful with Remember Me\n');
      authToken = usernameLoginData.data?.token;
    } else {
      console.log('   ❌ Username login failed:', usernameLoginData.error || usernameLoginData.message);
      console.log('');
    }

    // 4. Test /api/auth/me endpoint
    if (authToken) {
      console.log('4️⃣ Testing /api/auth/me endpoint...');
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const meData = await meResponse.json();
      console.log('   Status:', meResponse.status);
      console.log('   Response:', JSON.stringify(meData, null, 2));

      if (meResponse.status === 200) {
        console.log('   ✅ Auth verification successful\n');
      } else {
        console.log('   ❌ Auth verification failed:', meData.error || meData.message);
        console.log('');
      }
    } else {
      console.log('4️⃣ Skipping /api/auth/me test - no auth token available\n');
    }

    // 5. Test Duplicate Registration Prevention
    console.log('5️⃣ Testing Duplicate Registration Prevention...');
    const duplicateResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const duplicateData = await duplicateResponse.json();
    console.log('   Status:', duplicateResponse.status);
    console.log('   Response:', JSON.stringify(duplicateData, null, 2));

    if (duplicateResponse.status === 409) {
      console.log('   ✅ Duplicate email prevention working\n');
    } else {
      console.log('   ❌ Duplicate prevention failed:', duplicateData.error || duplicateData.message);
      console.log('');
    }

    // 6. Test Invalid Credentials
    console.log('6️⃣ Testing Invalid Credentials...');
    const invalidResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
         emailOrUsername: testUser.email,
         password: 'wrongpassword',
       }),
    });

    const invalidData = await invalidResponse.json();
    console.log('   Status:', invalidResponse.status);
    console.log('   Response:', JSON.stringify(invalidData, null, 2));

    if (invalidResponse.status === 401) {
      console.log('   ✅ Invalid credentials properly rejected\n');
    } else {
      console.log('   ❌ Invalid credentials test failed:', invalidData.error || invalidData.message);
      console.log('');
    }

    console.log('🎯 Enhanced Authentication System Test Complete!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testEnhancedAuth();