import { useState } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import AppShell from './components/AppShell.jsx';
import { fetchSessionUser, isLoggedIn } from './services/auth.js';

export default function App() {
  const [user, setUser] = useState(() => (isLoggedIn() ? fetchSessionUser() : null));

  if (!user) {
    return <LoginPage onLoginSuccess={setUser} />;
  }

  return <AppShell user={user} />;
}
