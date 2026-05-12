/**
 * Document Upload Component
 * Allows user to upload a proof document (Aadhaar, Passport, Voter ID, etc.)
 */

import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Upload, FileImage, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadProps {
    onUploadComplete: (dataUrl: string) => void;
    onBack?: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadComplete, onBack }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): boolean => {
        // Check file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (JPG or PNG)');
            return false;
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('File size must be less than 5MB');
            return false;
        }

        return true;
    };

    const handleFileSelect = (file: File) => {
        if (!validateFile(file)) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setPreview(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleContinue = () => {
        if (preview) {
            onUploadComplete(preview);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">Requirements:</p>
                        <ul className="space-y-1 text-blue-800 ml-1">
                            <li>• Upload the <strong>front side</strong> of your proof document (Aadhaar / Passport / Voter ID etc.)</li>
                            <li>• Ensure photo is <strong>clear and readable</strong></li>
                            <li>• Your <strong>face should be visible</strong></li>
                            <li>• Maximum file size: 5MB</li>
                        </ul>
                    </div>
                </div>
            </div>

            {!preview ? (
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${isDragging
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                        }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg mb-2">Drop your proof document here</p>
                    <p className="text-sm text-gray-600 mb-4">or click to browse</p>
                    <Button variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}>
                        <FileImage className="w-4 h-4 mr-2" />
                        Select File
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileInput}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <img
                            src={preview}
                            alt="Proof Document Preview"
                            className="w-full h-auto object-contain max-h-96"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRemove}
                            className="flex-1"
                        >
                            Remove
                        </Button>
                        <Button
                            onClick={handleContinue}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            )}

            {onBack && (
                <Button variant="ghost" onClick={onBack} className="w-full">
                    Back
                </Button>
            )}
        </div>
    );
};
