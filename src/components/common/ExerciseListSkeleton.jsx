import { Skeleton } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledSkeleton = styled(Skeleton)(({ theme }) => ({
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    '&::after': {
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
    },
}));

export default function ExerciseListSkeleton() {
    return (
        <>
            {[...Array(5)].map((_, index) => (
                <StyledSkeleton
                    key={index}
                    variant="rectangular"
                    height={56}
                    sx={{ 
                        mb: 1, 
                        borderRadius: 1,
                        animation: 'pulse 1.5s ease-in-out 0.5s infinite'
                    }}
                />
            ))}
        </>
    );
}