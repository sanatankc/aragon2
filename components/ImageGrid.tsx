'use client';

import { Trash2, ChevronUp, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
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
  const progressPercentage = Math.min((totalUploaded / 10) * 100, 100);

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-scroll">
      {/* Uploaded Images Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Uploaded Images</h2>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-600">?</span>
            </div>
            <span className="text-sm text-gray-600">{totalUploaded} of 10</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mb-2">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-600">6</span>
            </div>
            <span className="text-sm text-gray-500">Minimum required</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Accepted Photos Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('accepted')}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-medium text-gray-900">Accepted Photos</span>
          </div>
          {expandedSections.accepted ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.accepted && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">
              These images passed our scoring test and will all be used to generate your AI photos.
            </p>
            
            {acceptedFiles.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {acceptedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {onDeleteImage && (
                      <button
                        onClick={() => onDeleteImage(file)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No accepted photos yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo Requirements */}
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
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Minimum resolution: 400x400 pixels</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Minimum file size: 20 KB</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Supported formats: JPG, PNG, HEIC</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No duplicate or very similar images</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Clear, non-blurry images</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Single face visible and properly sized</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Photo Restrictions */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('restrictions')}
          className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="font-medium text-gray-900">Photo Restrictions</span>
            {rejectedFiles.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {rejectedFiles.length}
              </span>
            )}
          </div>
          {expandedSections.restrictions ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.restrictions && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">
              These images didn't meet our quality requirements and cannot be used for AI generation.
            </p>
            
            {rejectedFiles.length > 0 ? (
              <div className="space-y-3">
                {rejectedFiles.map((rejected, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-red-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                        <img 
                          src={rejected.file.url} 
                          alt={rejected.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{rejected.file.name}</p>
                        <p className="text-sm text-red-600">Reason: {rejected.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <XCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No rejected photos yet</p>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Uploading Files (if any) */}
      {uploadingFiles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Uploading...</h3>
          <div className="space-y-3">
            {uploadingFiles.map((file, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-200 animate-pulse"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">Uploading...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
