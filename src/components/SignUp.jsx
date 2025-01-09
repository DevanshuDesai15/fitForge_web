import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, TextField, Button, Alert } from '@mui/material';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signup } = useAuth();

    async function handleSubmit(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password);
            navigate('/');
        } catch (error) {
            setError('Failed to create an account: ' + error.message);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-[#f5f5f5] flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader
                    title="Sign Up"
                    subheader="Create your FitForge account"
                />
                <CardContent>
                    {error && <Alert severity="error" className="mb-4">{error}</Alert>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            margin="normal"
                        />
                        <Button
                            variant="contained"
                            type="submit"
                            fullWidth
                            disabled={loading}
                        >
                            Sign Up
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        Already have an account? <Link to="/signin" className="text-blue-600">Sign In</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 