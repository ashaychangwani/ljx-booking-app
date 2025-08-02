import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const { userInfo, clearUserInfo } = useUser();

  if (!userInfo) return null;

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome back, {userInfo.lastName}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{userInfo.email}</span>
              <span className="text-sm text-gray-500">Unit {userInfo.unitNumber}</span>
              <button
                onClick={clearUserInfo}
                className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 