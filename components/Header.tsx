'use client';

import { X } from 'lucide-react';

interface HeaderProps {
  progress?: number;
  onClose?: () => void;
}

export default function Header({ progress = 0, onClose }: HeaderProps) {
  return (
    <div className="w-full">
      {/* Top dark bar */}
      <div className="h-1 bg-gray-800"></div>
      
      {/* Main header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="text-xl font-bold text-gray-900">Aragon.ai</span>
        </div>
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-gray-200">
        <div 
          className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
