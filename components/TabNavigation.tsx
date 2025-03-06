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
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = currentPath === `${basePath}${tab.href}`;
              return (
                <Link
                  key={tab.name}
                  href={`${basePath}${tab.href}`}
                  className={`${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
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