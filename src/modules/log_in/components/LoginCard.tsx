import React from 'react';
import '../styles/login.css';

interface LoginCardProps {
  children: React.ReactNode;
}

export default function LoginCard({ children }: LoginCardProps) {
  return (
    <div className="login-card">
      <div className="blob" />
      {children}
    </div>
  );
}
