import { Box, CircularProgress } from '@mui/material';

/**
 * Shared loading fallback for React.lazy() Suspense boundaries.
 * Shows a centered spinner matching the app's dark theme.
 */
export default function LoadingFallback() {
    return (
        <Box
            role="status"
            aria-label="Loading content"
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--surface-a0, #121212)',
            }}
        >
            <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
    );
}
