import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, TextField, Button, Alert } from '@mui/material';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (error) {
            setError('Failed to sign in: ' + error.message);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-[#f5f5f5] flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader
                    title="Sign In"
                    subheader="Welcome back to FitForge"
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
                        <Button
                            variant="contained"
                            type="submit"
                            fullWidth
                            disabled={loading}
                        >
                            Sign In
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        Need an account? <Link to="/signup" className="text-blue-600">Sign Up</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 