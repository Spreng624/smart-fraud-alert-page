// src/components/Navbar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { menuConfig } from '@/config/menu';

export const Navbar = () => {
  const location = useLocation();

  const isActive = (key: string, path?: string) => {
    if (key === 'home') {
      return location.pathname === '/';
    }

    if (path) {
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    }

    return location.pathname.includes(key);
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 text-white shadow-md backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/" className="text-xl font-bold tracking-tight transition hover:text-sky-300">
          智能反诈分析平台
        </Link>
        <div className="flex gap-6 lg:gap-8">
          {menuConfig.map((menu) => (
            <div key={menu.key} className="group relative cursor-pointer py-2">
              <span
                className={`transition ${
                  isActive(menu.key, menu.path) ? 'text-sky-300' : 'text-slate-100 group-hover:text-sky-200'
                }`}
              >
                {menu.path ? <Link to={menu.path}>{menu.title}</Link> : menu.title}
              </span>

              {menu.children && (
                <div className="absolute left-0 top-full hidden min-w-52 rounded-2xl border border-slate-200 bg-white py-2 text-gray-800 shadow-xl group-hover:block">
                  {menu.children.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className="block px-4 py-2 text-sm transition-colors hover:bg-sky-50 hover:text-sky-700"
                    >
                      {sub.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};
