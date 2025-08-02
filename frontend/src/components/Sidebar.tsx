import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import {
  HomeIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Amenities', href: '/amenities', icon: BuildingOfficeIcon },
  { name: 'Booking Jobs', href: '/booking-jobs', icon: ClipboardDocumentListIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar() {
  const { userInfo } = useUser();

  if (!userInfo) return null;

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-2">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">LJX Booking</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? 'bg-gray-50 text-primary-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                      )
                    }
                  >
                    <item.icon
                      className={classNames(
                        'h-6 w-6 shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{userInfo.lastName}</p>
                <p className="text-gray-600">{userInfo.email}</p>
                <p className="text-gray-500">Unit {userInfo.unitNumber}</p>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
} 