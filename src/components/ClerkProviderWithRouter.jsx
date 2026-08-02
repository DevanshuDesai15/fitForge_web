import { ClerkProvider } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

export default function ClerkProviderWithRouter({ children }) {
    const navigate = useNavigate();
    return (
        <ClerkProvider
            publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
            afterSignOutUrl="/"
            routerPush={(to) => navigate(to)}
            routerReplace={(to) => navigate(to, { replace: true })}
        >
            {children}
        </ClerkProvider>
    );
}

ClerkProviderWithRouter.propTypes = { children: PropTypes.node.isRequired };
