'use client';

import { X } from 'lucide-react';

interface HeaderProps {
  progress?: number;
  totalUploaded?: number;
  onClose?: () => void;
}

export default function Header({ progress = 0, totalUploaded = 0, onClose }: HeaderProps) {
  return (
    <div className="w-full bg-red-">
      {/* Thin progress rail */}
      <div className="h-1 w-full bg-gray-200">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Main header */}
      <div className="bg-white  px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="text-xl font-bold text-gray-900">Aragon.ai</span>
        </div>
        
        {/* Counters and optional close */}
        <div className="flex items-center space-x-4">
        
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
      </div>
    </div>
  );
}
