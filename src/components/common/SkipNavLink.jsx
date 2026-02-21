import { Box } from '@mui/material';

/**
 * SkipNavLink — visually hidden until focused via keyboard.
 * Lets keyboard/screen-reader users skip past navigation to main content.
 */
const SkipNavLink = () => (
    <Box
        component="a"
        href="#main-content"
        sx={{
            position: 'absolute',
            left: '-9999px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            zIndex: 9999,
            '&:focus': {
                position: 'fixed',
                top: 8,
                left: 8,
                width: 'auto',
                height: 'auto',
                padding: '12px 24px',
                background: '#dded00',
                color: '#121212',
                fontWeight: 700,
                fontSize: '0.95rem',
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(221, 237, 0, 0.4)',
            },
        }}
    >
        Skip to main content
    </Box>
);

export default SkipNavLink;
