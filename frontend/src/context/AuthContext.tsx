
import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService";
import type { User } from "../services/authService";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshProfile: () => Promise<void>;
    isAuthenticated: boolean;
    sessionDegraded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [sessionDegraded, setSessionDegraded] = useState<boolean>(false);

    const refreshProfile = async () => {
        try {
            const freshUser = await authService.getProfile();
            setUser(freshUser);
        } catch (error) {
            console.error("Failed to refresh profile:", error);
        }
    };

    useEffect(() => {
        // When the Axios interceptor detects X-Session-Degraded, the RUPPI external token
        // has expired but the local JWT is still valid. Do NOT log the user out —
        // just mark the session as degraded so the UI can show a soft warning banner.
        const handleSessionDegraded = () => {
            setSessionDegraded(true);
        };
        window.addEventListener('auth:session-degraded', handleSessionDegraded);
        return () => {
            window.removeEventListener('auth:session-degraded', handleSessionDegraded);
        };
    }, []);

    useEffect(() => {
        // Check for existing session on mount
        const initAuth = async () => {
            try {
                const currentUser = authService.getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                    // Proactively refresh profile on app load
                    refreshProfile();
                }
            } catch (error) {
                console.error("Auth initialization failed:", error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const loggedInUser = await authService.login(email, password);
            setUser(loggedInUser);
            // After successful login, attempt to fetch the fresh profile
            // but don't let it block or fail the login if it errors out
            refreshProfile().catch(err => console.error("Post-login refresh failed:", err));
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setSessionDegraded(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                refreshProfile,
                isAuthenticated: !!user,
                sessionDegraded,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
