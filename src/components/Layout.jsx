import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Book, Users, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = () => {
    const navItems = [
        { to: '/', icon: Book, label: 'Livres' },
        { to: '/auteurs', icon: Users, label: 'Auteurs' },
        { to: '/etageres', icon: Bookmark, label: 'Étagères' },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="flat-nav sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center space-x-2"
                        >
                            <Book className="h-8 w-8 text-primary" />
                            <span className="text-xl font-bold main-title-text">
                                Bibliothèque
                            </span>
                        </motion.div>

                        <div className="flex space-x-1">
                            {navItems.map((item, index) => (
                                <motion.div
                                    key={item.to}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <NavLink
                                        to={item.to}
                                        className={({ isActive }) =>
                                            `flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'text-gray-600 hover:bg-secondary hover:text-primary'
                                            }`
                                        }
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="font-medium">
                                            {item.label}
                                        </span>
                                    </NavLink>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
