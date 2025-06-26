import React, { useEffect } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useLocation,
    useSearchParams,
} from 'react-router-dom';
import Layout from '@/components/Layout';
import BooksPage from '@/pages/BooksPage';
import AuthorsPage from '@/pages/AuthorsPage';
import ShelvesPage from '@/pages/ShelvesPage';
import FullscreenToggle from '@/components/FullscreenToggle';
import { Toaster } from '@/components/ui/toaster';

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

function AppContent() {
    const [searchParams] = useSearchParams();
    const navigateSearchTerm = searchParams.get('search');

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route
                    index
                    element={
                        <BooksPage
                            key={navigateSearchTerm || 'books'}
                            initialSearchTerm={navigateSearchTerm}
                        />
                    }
                />
                <Route path="auteurs" element={<AuthorsPage />} />
                <Route path="etageres" element={<ShelvesPage />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <Router
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            <ScrollToTop />
            <div className="min-h-screen">
                <AppContent />
                <Toaster />
                <FullscreenToggle />
            </div>
        </Router>
    );
}

export default App;
