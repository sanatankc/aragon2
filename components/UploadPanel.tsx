'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Cloud, Upload, X } from 'lucide-react';

interface UploadPanelProps {
  submissionId: string | null;
  onUploadComplete: (res: any) => void;
  onUploadError: (error: Error) => void;
  onUploadBegin: (file: { name: string; previewUrl: string }) => void;
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
  const [queuedFiles, setQueuedFiles] = useState<{ name: string; status: 'uploading' | 'queued' }[]>([]);

  const handleFileUpload = async (files: FileList) => {
    if (!submissionId) {
      onUploadError(new Error("No submission ID available"));
      return;
    }

    setIsUploading(true);
    const newQueued = Array.from(files).map(f => ({ name: f.name, status: 'uploading' as const }));
    setQueuedFiles(prev => [...prev, ...newQueued]);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const previewUrl = URL.createObjectURL(file);
        onUploadBegin({ name: file.name, previewUrl });
        
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
      // clear uploaded from queue
      setQueuedFiles([]);
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
    <div className="w-[350px] p-8 overflow-scroll-y">
      {/* Back button */}
      <button className="flex items-center text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4  mr-2" />
        Back
      </button>

      {/* Title and instructions */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mr-3">Upload photos.</h1>
        </div>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
          Now the fun begins! Select at least 6 of your best photos. Uploading a mix of close-ups, 
          selfies and mid-range shots can help the AI better capture your face and body type.
        </p>
      </div>

      {/* Upload area */
      }
      <div className="mb-8">
        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-orange-300 bg-orange-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.heic,.heif"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleClick}
                className={`inline-flex items-center px-4 py-2 rounded-md text-white bg-orange-500 hover:bg-orange-600 transition-colors ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading…' : 'Upload files'}
              </button>
            </div>
            <p className="text-gray-600 text-sm">Click to upload or drag and drop</p>
            <p className="text-gray-500 text-sm">PNG, JPG, HEIC</p>
          </div>
        </div>
      </div>

      {/* Upload queue list (visual only) */}
      {queuedFiles.length > 0 && (
        <div className="space-y-2">
          {queuedFiles.map((q) => (
            <div key={q.name} className="flex items-center justify-between border rounded-lg px-3 py-2 bg-white shadow-sm">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-8 h-8 rounded bg-gray-100 animate-pulse" />
                <span className="text-sm text-gray-700 truncate max-w-[220px]">{q.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500">{q.status === 'uploading' ? 'Uploading…' : 'Queued'}</span>
                <button className="p-1 rounded-full hover:bg-gray-100" aria-label="Remove">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
