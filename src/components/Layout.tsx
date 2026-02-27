import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { ToastContainer } from './ui/ToastContainer';

export function Layout() {
    return (
        <div className="h-screen flex flex-col bg-background text-text-primary font-sans transition-colors duration-300">
            {/* Top: Sidebar + Content side by side */}
            <div className="flex-1 flex overflow-hidden">
                {/* Desktop Sidebar — hidden on mobile */}
                <aside className="hidden lg:flex lg:w-64 flex-shrink-0">
                    <SideNav />
                </aside>

                {/* Content Area — scrollable */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-5xl mx-auto px-0 sm:px-4 lg:px-8 pb-4 overflow-x-hidden">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Toast notifications — above BottomNav */}
            <ToastContainer />

            {/* Quick Access — full width, single continuous border line */}
            <div className="flex-shrink-0">
                <BottomNav />
            </div>
        </div>
    );
}
