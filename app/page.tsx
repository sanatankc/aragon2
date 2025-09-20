'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import UploadPanel from '@/components/UploadPanel';
import ImageGrid from '@/components/ImageGrid';
import Toast from '@/components/Toast';

interface UploadedFile {
  name: string;
  size: number;
  url: string;
}

interface RejectedFile {
  file: UploadedFile;
  reason: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uploadingFiles, setUploadingFiles] = useState<UploadedFile[]>([]);
  const [acceptedFiles, setAcceptedFiles] = useState<UploadedFile[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const initializeSubmission = async () => {
      // Check if submission ID exists in URL
      const urlSubmissionId = searchParams.get('submission');
      
      if (urlSubmissionId) {
        // Use existing submission ID from URL
        console.log('Using existing submission ID from URL:', urlSubmissionId);
        setSubmissionId(urlSubmissionId);
      } else {
        // Create new submission
        try {
          console.log('Creating new submission...');
          const response = await fetch("/api/submissions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          });
          console.log('Submission response:', response);
          const data = await response.json();
          console.log('Submission data:', data);
          
          // Update URL with new submission ID
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('submission', data.id);
          router.replace(newUrl.pathname + newUrl.search);
          
          setSubmissionId(data.id);
        } catch (error) {
          console.error("Error creating submission:", error);
          addToast("Failed to create submission", "error");
        }
      }
    };
    
    initializeSubmission();
  }, [searchParams, router]);

  useEffect(() => {
    if (!submissionId) return;

    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/submissions/${submissionId}/images`);
        const data = await response.json();

        const newAccepted: UploadedFile[] = [];
        const newRejected: RejectedFile[] = [];
        const newUploading: UploadedFile[] = [];

        data.items.forEach((img: any) => {
          const file = { name: img.id, size: img.sizeBytes, url: img.thumbUrl || img.originalUrl };
          if (img.status === "accepted") {
            newAccepted.push(file);
          } else if (img.status === "rejected") {
            newRejected.push({ file, reason: img.rejectionSummary || "Unknown reason" });
          } else {
            newUploading.push(file);
          }
        });

        setAcceptedFiles(newAccepted);
        setRejectedFiles(newRejected);
        setUploadingFiles(newUploading);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages(); // Initial fetch
    const interval = setInterval(fetchImages, 2000); // Poll every 2 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [submissionId]);

  const handleUploadComplete = (res: any) => {
    if (res) {
      setUploadingFiles(prevFiles => prevFiles.filter(f => !res.find((r: any) => r.name === f.name)));
      setAcceptedFiles(prevFiles => [...prevFiles, ...res]);
      addToast("Your photos have been successfully uploaded!", "success");
    }
    console.log("Files: ", res);
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    addToast(`Upload failed: ${error.message}`, "error");
  };

  const handleUploadBegin = (name: string) => {
    setUploadingFiles(prevFiles => [...prevFiles, { name, size: 0, url: '' }]);
  };

  const handleDeleteImage = (file: UploadedFile) => {
    setAcceptedFiles(prevFiles => prevFiles.filter(f => f.name !== file.name));
    addToast("Photo deleted", "info");
  };

  const totalUploaded = acceptedFiles.length + rejectedFiles.length;
  const progressPercentage = Math.min((totalUploaded / 10) * 100, 100);

  return (
    <div className="min-h-screen bg-white">
      <Header progress={progressPercentage} />
      
      <div className="flex h-[calc(100vh-80px)]">
        <UploadPanel
          submissionId={submissionId}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onUploadBegin={handleUploadBegin}
        />
        
        <ImageGrid
          acceptedFiles={acceptedFiles}
          rejectedFiles={rejectedFiles}
          uploadingFiles={uploadingFiles}
          onDeleteImage={handleDeleteImage}
        />
      </div>

      {/* Toast notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export default Home;