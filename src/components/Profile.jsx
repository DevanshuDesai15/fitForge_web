import { Card, CardContent, CardHeader, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IoMdArrowRoundBack } from "react-icons/io";


export default function Profile() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-4 md:p-8 bg-[#f5f5f5]">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader
                        title="Profile"
                        action={
                            <Button
                                startIcon={<IoMdArrowRoundBack />}
                                onClick={() => navigate('/')}
                            >
                                Back to Home
                            </Button>
                        }
                    />
                    <CardContent className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Email</h3>
                            <p>{currentUser?.email}</p>
                        </div>
                        {/* Add more profile information here */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}