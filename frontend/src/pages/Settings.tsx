import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { TrashIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const { userInfo, clearUserInfo } = useUser();

  const handleClearInfo = () => {
    if (confirm('Are you sure you want to clear your information? You will need to re-enter your details.')) {
      clearUserInfo();
    }
  };

  if (!userInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Please provide your information to access settings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your booking automation preferences
        </p>
      </div>

      {/* User Information */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your current information used for bookings
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userInfo.email}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userInfo.lastName}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Unit number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userInfo.unitNumber}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Actions</h3>
          <div className="mt-5">
            <button
              onClick={handleClearInfo}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Clear Information
            </button>
            <p className="mt-2 text-sm text-gray-500">
              This will clear your stored information and you'll need to re-enter your details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 