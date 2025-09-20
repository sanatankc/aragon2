'use client';

import { useState, useRef } from 'react';
import { ArrowUp, Cloud } from 'lucide-react';

interface UploadPanelProps {
  submissionId: string | null;
  onUploadComplete: (res: any) => void;
  onUploadError: (error: Error) => void;
  onUploadBegin: (name: string) => void;
}

export default function UploadPanel({ 
  submissionId, 
  onUploadComplete, 
  onUploadError, 
  onUploadBegin 
}: UploadPanelProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    if (!submissionId) {
      onUploadError(new Error("No submission ID available"));
      return;
    }

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        onUploadBegin(file.name);
        
        // Create FormData to send file directly to server
        const formData = new FormData();
        formData.append('file', file);
        formData.append('submissionId', submissionId);

        // Upload file directly to our API (which handles HEIC conversion and S3 upload)
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload error:', {
            status: response.status,
            statusText: response.statusText,
            errorText,
          });
          throw new Error(`Failed to upload file: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();

        return {
          name: result.processedFileName || file.name,
          size: result.sizeBytes,
          url: result.url,
          imageId: result.imageId,
        };
      } catch (error) {
        console.error('Upload error:', error);
        onUploadError(error as Error);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result !== null);
      
      if (successfulUploads.length > 0) {
        onUploadComplete(successfulUploads);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex-1 p-8">
      {/* Back button */}
      <button className="flex items-center text-gray-600 hover:text-gray-800 mb-6">
        <ArrowUp className="w-4 h-4 rotate-90 mr-2" />
        Back
      </button>

      {/* Title and instructions */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mr-3">Upload photos.</h1>
          <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
          </div>
        </div>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
          Now the fun begins! Select at least 6 of your best photos. Uploading a mix of close-ups, 
          selfies and mid-range shots can help the AI better capture your face and body type.
        </p>
      </div>

      {/* Upload area */}
      <div className="mb-8">
        <div 
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-orange-400 bg-orange-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex items-center justify-center mb-6">
            {/* Large cloud icon */}
            <div className="relative">
              <Cloud className="w-32 h-32 text-gray-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ArrowUp className="w-16 h-16 text-gray-600" />
              </div>
            </div>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.heic,.heif"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-2">
            <p className="text-gray-600 text-lg">
              {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-gray-500">
              PNG, JPG, HEIC up to 4MB (HEIC files will be converted to PNG)
            </p>
            <p className="text-sm text-gray-400">
              {isUploading ? 'Please wait...' : 'Uploads are processed automatically.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
