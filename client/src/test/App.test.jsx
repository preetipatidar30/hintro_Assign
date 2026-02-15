import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

// Simple smoke tests for component rendering
describe('App Components', () => {
    it('renders login page', async () => {
        const LoginPage = (await import('../pages/LoginPage')).default;
        render(
            <BrowserRouter>
                <AuthProvider>
                    <LoginPage />
                </AuthProvider>
            </BrowserRouter>
        );
        expect(screen.getByText('TaskFlow')).toBeInTheDocument();
        expect(screen.getByText('Sign in to your workspace')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    it('renders signup page', async () => {
        const SignupPage = (await import('../pages/SignupPage')).default;
        render(
            <BrowserRouter>
                <AuthProvider>
                    <SignupPage />
                </AuthProvider>
            </BrowserRouter>
        );
        expect(screen.getByText('Create your account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    it('has correct form elements on login', async () => {
        const LoginPage = (await import('../pages/LoginPage')).default;
        render(
            <BrowserRouter>
                <AuthProvider>
                    <LoginPage />
                </AuthProvider>
            </BrowserRouter>
        );
        expect(screen.getByText(/sign in/i)).toBeInTheDocument();
        expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });
});
