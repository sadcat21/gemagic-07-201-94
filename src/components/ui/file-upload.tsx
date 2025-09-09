import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  className?: string;
  accept?: 'image' | 'audio';
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  selectedFile,
  className,
  accept = 'image'
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      onFileSelect(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onFileSelect]);

  const acceptedFileTypes = accept === 'audio' 
    ? { 'audio/*': ['.mp3', '.wav', '.aiff', '.aac', '.ogg', '.flac'] }
    : { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: false
  });

  const clearFile = () => {
    setPreview(null);
    onFileSelect(null as any);
  };

  return (
    <div className={cn("w-full", className)}>
      {!preview ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-smooth",
            "hover:border-primary hover:bg-gradient-card",
            isDragActive 
              ? "border-primary bg-gradient-card shadow-elegant" 
              : "border-border bg-card"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-primary">
              <Upload className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold arabic-text">
                {isDragActive 
                  ? (accept === 'audio' ? "اسحب الملف الصوتي هنا" : "اسحب الصورة هنا")
                  : (accept === 'audio' ? "اختر ملف صوتي أو اسحبه هنا" : "اختر صورة أو اسحبها هنا")
                }
              </h3>
              <p className="text-muted-foreground arabic-text">
                {accept === 'audio' 
                  ? "يدعم MP3، WAV، AIFF، AAC، OGG، FLAC"
                  : "يدعم PNG، JPG، JPEG، GIF، WEBP"
                }
              </p>
            </div>
            <Button variant="outline" className="arabic-text">
              <ImageIcon className="w-4 h-4 ml-2" />
              اختر ملف
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden bg-gradient-card p-4">
          <div className="relative">
{accept === 'audio' ? (
              <div className="w-full h-48 bg-gradient-primary rounded-lg flex items-center justify-center">
                <div className="text-center text-primary-foreground">
                  <Upload className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-lg font-semibold">ملف صوتي محمل</p>
                  <p className="text-sm opacity-90">{selectedFile?.name}</p>
                </div>
              </div>
            ) : (
              <img
                src={preview}
                alt="معاينة الصورة"
                className="w-full h-auto max-h-96 object-contain rounded-lg shadow-elegant"
              />
            )}
            <Button
              onClick={clearFile}
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-3 text-center">
            <p className="text-sm text-muted-foreground arabic-text">
              {selectedFile?.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};