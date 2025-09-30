'use client';

import { Trash2, ChevronUp, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import Tooltip from './Tooltip';
import { useState } from 'react';

interface UploadedFile {
  name: string;
  size: number;
  url: string;
}

interface RejectedFile {
  file: UploadedFile;
  reason: string;
}

interface ImageGridProps {
  acceptedFiles: UploadedFile[];
  rejectedFiles: RejectedFile[];
  uploadingFiles: UploadedFile[];
  onDeleteImage?: (file: UploadedFile) => void;
}

export default function ImageGrid({ 
  acceptedFiles, 
  rejectedFiles, 
  uploadingFiles, 
  onDeleteImage 
}: ImageGridProps) {
  const [expandedSections, setExpandedSections] = useState({
    accepted: true,
    requirements: false,
    restrictions: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const totalUploaded = acceptedFiles.length + rejectedFiles.length;
  const isValidating = uploadingFiles.length > 0;
  const progressPercentage = Math.min((totalUploaded / 10) * 100, 100);

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-scroll">
      {/* Uploaded Images Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900">Uploaded Images</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{totalUploaded} of 10</span>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Checking grid while validating */}
      {isValidating && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Hang tight – we're checking your photos</h3>
          <p className="text-sm text-gray-600 mb-4">We're verifying the quality of your uploads to make sure you get the best results.</p>
          <div className="grid grid-cols-3 gap-5">
                {uploadingFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-white shadow">
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      className="absolute top-2 right-2 p-1 bg-white text-gray-700 rounded-full shadow"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
        </div>
      )}

      {/* Accepted Photos Section - only when not validating and we have accepted images */}
      {!isValidating && acceptedFiles.length > 0 && (
        <div className="mb-6 rounded-2xl bg-green-50 border border-green-100 p-5">
          <button
            onClick={() => toggleSection('accepted')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">Accepted Photos</span>
            </div>
            {expandedSections.accepted ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.accepted && (
            <div className="mt-3">
              <p className="text-sm text-gray-700 mb-4">
                These images passed our scoring test and will all be used to generate your AI photos.
              </p>
              <div className="grid grid-cols-3 gap-5">
                {acceptedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-white shadow">
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      className="absolute top-2 right-2 p-1 bg-white text-gray-700 rounded-full shadow"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

       {/* Conditional 'Some Photos Didn’t Meet' - only when there are rejected images */}
       {rejectedFiles.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('restrictions')}
            className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="font-medium text-gray-900">Some Photos Didn’t Meet Our Guidelines</span>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {rejectedFiles.length}
              </span>
            </div>
            {expandedSections.restrictions ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.restrictions && (
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-4">
                {rejectedFiles.map((rejected, index) => (
                  <div key={index} className="relative bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="aspect-square bg-gray-100">
                      <img src={rejected.file.url} alt={rejected.file.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <Tooltip content={rejected.reason}>
                        <p className="text-xs text-red-600 truncate cursor-help">{rejected.reason}</p>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo Requirements */ }
      <div className="mb-6">
        <button
          onClick={() => toggleSection('requirements')}
          className="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-medium text-gray-900">Photo Requirements</span>
          </div>
          {expandedSections.requirements ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.requirements && (
          <div className="mt-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-gray-900 mb-3">Image Quality Requirements:</h4>
              <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-500" /><span>Clear, in-focus face</span></li>
                <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-500" /><span>Single person only</span></li>
                <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-500" /><span>JPG, PNG, HEIC</span></li>
                <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-500" /><span>No near-duplicates</span></li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Static Photo Restrictions explanation section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('requirements')}
          className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="font-medium text-gray-900">Photo Restrictions</span>
          </div>
          {expandedSections.requirements ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.requirements && (
          <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>No blurry faces</li>
              <li>No group photos or multiple faces</li>
              <li>No near-duplicate images</li>
              <li>Face not too small or too far</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
