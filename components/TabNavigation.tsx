import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface TabItem {
  name: string;
  href: string;
}

interface TabNavigationProps {
  tabs: TabItem[];
  basePath: string;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, basePath }) => {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <nav className="flex space-x-2" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = currentPath === `${basePath}${tab.href}`;
              return (
                <Link
                  key={tab.name}
                  href={`${basePath}${tab.href}`}
                  className={`${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  } whitespace-nowrap py-2 px-3 rounded-md font-medium text-sm transition-colors`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default TabNavigation; 