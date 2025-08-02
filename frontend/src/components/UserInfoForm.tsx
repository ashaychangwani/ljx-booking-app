import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { UserInfo } from '@/contexts/UserContext';

interface UserInfoFormProps {
  onSubmit: (userInfo: UserInfo) => void;
}

export default function UserInfoForm({ onSubmit }: UserInfoFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    lastName: '',
    unitNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email && formData.lastName && formData.unitNumber) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-primary-600 rounded-xl">
            <CalendarIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            LJX Booking Automation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your information to start booking amenities
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your email address"
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your last name"
              />
            </div>
            
            <div>
              <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700">
                Unit Number
              </label>
              <input
                id="unitNumber"
                name="unitNumber"
                type="text"
                required
                value={formData.unitNumber}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your unit number (e.g., 4103)"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!formData.email || !formData.lastName || !formData.unitNumber}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Continue to Amenities
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By using this application, you agree to automatically book amenities at La Jolla Crossroads
            according to your preferences.
          </p>
        </div>
      </div>
    </div>
  );
} 