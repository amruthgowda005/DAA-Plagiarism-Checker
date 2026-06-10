import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Upload, 
  FileSearch, 
  Layers,
  ShieldCheck,
  LogOut, 
  BookOpenCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...classes) => twMerge(clsx(classes));

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Upload Documents', href: '/upload', icon: Upload },
    { name: '1v1 Compare', href: '/compare', icon: FileSearch },
    { name: 'Multi Compare', href: '/multi-compare', icon: Layers },
    { name: 'Media Verify', href: '/media-analysis', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="flex items-center gap-3 p-6 border-b border-slate-800">
          <BookOpenCheck className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="font-bold text-lg leading-tight">DAA Project</h1>
            <p className="text-xs text-slate-400">Plagiarism Checker</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-slate-800">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">
            {navigation.find(n => n.href === location.pathname)?.name || 'Results Dashboard'}
          </h2>
          <div className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
            Divide & Conquer Algorithm Implementation
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
