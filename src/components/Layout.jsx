import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Book, Users, Bookmark } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import KubeIcon from './KubeIcon';

const Layout = () => {
    const navItems = [
        { to: '/', icon: Book, label: 'Livres' },
        { to: '/auteurs', icon: Users, label: 'Auteurs' },
        { to: '/etageres', icon: Bookmark, label: 'Étagères' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navigation */}
            <nav className="flat-nav">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">                        <div className="flex items-center space-x-2">
                            <KubeIcon className="h-8 w-8 text-primary" />
                            <span className="text-xl font-bold main-title-text">
                                Kubothèque
                            </span>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-1">
                                {navItems.map((item) => (
                                    <div key={item.to}>
                                        <NavLink
                                            to={item.to}
                                            className={({ isActive }) =>
                                                `flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                                }`
                                            }
                                        >
                                            <item.icon className="h-5 w-5" />
                                            <span className="font-medium">
                                                {item.label}
                                            </span>
                                        </NavLink>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Theme Toggle */}
                            <ThemeToggle />
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
