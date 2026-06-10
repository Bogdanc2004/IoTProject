// Auth service for Planta
// Currently uses localStorage mock. Replace with AWS Cognito when ready.

const AUTH_KEY = 'planta_auth';

function getStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredAuth(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function getCurrentUser() {
  return getStoredAuth();
}

export async function login(email, password) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 600));

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  if (password.length < 6) {
    throw new Error('Invalid credentials');
  }

  // Mock: accept any valid-looking email + password >= 6 chars
  const user = {
    id: 'user-' + email.replace(/[^a-z0-9]/gi, ''),
    email,
    name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    createdAt: Date.now(),
  };

  setStoredAuth(user);
  return user;
}

export async function signup(name, email, password) {
  await new Promise(r => setTimeout(r, 800));

  if (!name || !email || !password) {
    throw new Error('All fields are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  if (!email.includes('@')) {
    throw new Error('Please enter a valid email address');
  }

  const user = {
    id: 'user-' + Date.now(),
    email,
    name,
    createdAt: Date.now(),
  };

  setStoredAuth(user);
  return user;
}

export async function logout() {
  await new Promise(r => setTimeout(r, 200));
  clearStoredAuth();
}

// --- AWS Cognito integration (ready to enable) ---
// To switch to Cognito:
// 1. npm install @aws-amplify/auth
// 2. Uncomment the code below and remove the mock implementations above
// 3. Set your Cognito User Pool ID and Client ID in environment variables
//
// import { Amplify } from 'aws-amplify';
// import { signIn, signUp, signOut, getCurrentUser as cognitoGetUser } from '@aws-amplify/auth';
//
// Amplify.configure({
//   Auth: {
//     Cognito: {
//       userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
//       userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
//     }
//   }
// });
//
// export async function login(email, password) {
//   const result = await signIn({ username: email, password });
//   return result;
// }
//
// export async function signup(name, email, password) {
//   const result = await signUp({
//     username: email,
//     password,
//     options: { userAttributes: { name } }
//   });
//   return result;
// }
//
// export async function logout() {
//   await signOut();
// }
