import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';

// Protected Route Component
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Layout component to conditionally show Navbar
function Layout() {
    const location = useLocation();
    const hideNavbarRoutes = ['/login', '/signup'];
    const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

    return (
        <>
            {shouldShowNavbar && <Navbar />}
            <main className="min-h-screen bg-gray-50">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Layout />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
