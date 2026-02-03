import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                    Welcome to Primetrade
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    Manage your tasks efficiently and stay organized
                </p>
                {user ? (
                    <Link
                        to="/dashboard"
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 inline-block"
                    >
                        Go to Dashboard
                    </Link>
                ) : (
                    <div className="space-x-4">
                        <Link
                            to="/signup"
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 inline-block"
                        >
                            Get Started
                        </Link>
                        <Link
                            to="/login"
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 inline-block border-2 border-blue-600"
                        >
                            Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
