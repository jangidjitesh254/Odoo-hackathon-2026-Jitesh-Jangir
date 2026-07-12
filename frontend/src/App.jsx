import { useState } from 'react';
import AuthLayout from './components/AuthLayout';
import Login from './components/Login';
import Signup from './components/Signup';
import './Auth.css';

/**
 * Main application component. Manages navigation state between login and signup,
 * and renders components inside AuthLayout.
 */
export default function App() {
  const [currentView, setCurrentView] = useState('login');

  const showLoginView = () => setCurrentView('login');
  const showSignupView = () => setCurrentView('signup');

  return (
    <AuthLayout>
      {currentView === 'login' ? (
        <Login onNavigateToSignup={showSignupView} />
      ) : (
        <Signup onNavigateToLogin={showLoginView} />
      )}
    </AuthLayout>
  );
}
