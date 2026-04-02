import { createContext, useContext, useMemo } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const { user, isLoaded: isUserLoaded } = useUser();
    const { isLoaded: isAuthLoaded } = useClerkAuth();
    const { signOut, openSignIn, openSignUp } = useClerk();

    const loading = !isUserLoaded || !isAuthLoaded;

    // Map Clerk's user object to a format similar to what Firebase provided
    // so downstream components do not crash.
    const currentUser = useMemo(() => {
        if (!user) return null;
        return {
            uid: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            displayName: user.fullName || user.firstName,
            photoURL: user.imageUrl,
            ...user
        };
    }, [user]);

    const value = {
        currentUser,
        loading,
        // Methods that replace Firebase's raw signIn/signUp with Clerk's highly secure managed modals
        signup: () => openSignUp(),
        login: () => openSignIn(),
        loginWithGoogle: () => openSignIn(),
        logout: () => signOut()
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}