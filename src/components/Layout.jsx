import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Book, Users, SquareLibrary, BrickWall } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import KubeIcon from './KubeIcon';

const Layout = () => {
    const navItems = [
        { to: '/', icon: Book, label: 'Livres' },
        { to: '/auteurs', icon: Users, label: 'Auteurs' },
        { to: '/etageres', icon: SquareLibrary, label: 'Étagères' },
        { to: '/kubes', icon: BrickWall, label: 'Kubes' },
    ];

    return (
        <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
            <header className="flat-nav">
                <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between md:h-16">
                        <Link
                            to="/"
                            className="flex min-w-0 items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <KubeIcon className="h-8 w-8 flex-shrink-0 text-primary" />
                            <span className="truncate text-lg font-bold main-title-text sm:text-xl">
                                Kubothèque
                            </span>
                        </Link>

                        <div className="flex items-center gap-2 md:gap-4">
                            <nav
                                className="hidden items-center space-x-1 md:flex"
                                aria-label="Navigation principale"
                            >
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.to === '/'}
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
                                ))}
                            </nav>

                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl min-w-0 px-3 pt-16 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 md:py-8 md:pt-24 md:pb-8 lg:px-8">
                <Outlet />
            </main>

            <nav
                className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
                aria-label="Navigation principale mobile"
            >
                <div className="mx-auto flex max-w-md items-stretch gap-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            aria-label={item.label}
                            className={({ isActive }) =>
                                `flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default Layout;
