'use client';

import React, { useState, useRef, DragEvent } from 'react';
import { Upload, X, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FILE_UPLOAD_LIMITS } from '@/lib/constants';

interface FileUploadProps {
    accept?: string;
    maxSizeMB?: number;
    multiple?: boolean;
    onFilesSelected: (files: File[]) => void;
    onFileRemove?: (index: number) => void;
    files?: File[];
    disabled?: boolean;
    className?: string;
}

export function FileUpload({
    accept = FILE_UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.join(','),
    maxSizeMB = FILE_UPLOAD_LIMITS.MAX_IMAGE_SIZE_MB,
    multiple = false,
    onFilesSelected,
    onFileRemove,
    files = [],
    disabled = false,
    className = '',
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const validateFiles = (fileList: FileList | File[]): File[] | null => {
        const filesArray = Array.from(fileList);
        const acceptedTypes = accept.split(',').map((type) => type.trim());

        // Validate each file
        for (const file of filesArray) {
            // Check file size
            if (file.size > maxSizeBytes) {
                setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
                return null;
            }

            // Check file type
            if (!acceptedTypes.includes(file.type)) {
                setError(
                    `File "${file.name}" is not an accepted type. Allowed: ${acceptedTypes.join(', ')}`
                );
                return null;
            }
        }

        setError(null);
        return filesArray;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const validatedFiles = validateFiles(e.target.files);
            if (validatedFiles) {
                onFilesSelected(validatedFiles);
            }
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const validatedFiles = validateFiles(e.dataTransfer.files);
            if (validatedFiles) {
                onFilesSelected(validatedFiles);
            }
            e.dataTransfer.clearData();
        }
    };

    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Drop Zone */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-all duration-200 ease-in-out
          ${isDragging
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                        : 'border-gray-300 dark:border-gray-700'
                    }
          ${disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/10'
                    }
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                    disabled={disabled}
                    className="hidden"
                    aria-label="File upload input"
                />

                <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <div
                        className={`
            p-4 rounded-full
            ${isDragging
                                ? 'bg-purple-200 dark:bg-purple-800'
                                : 'bg-gray-100 dark:bg-gray-800'
                            }
          `}
                    >
                        <Upload
                            className={`w-8 h-8 ${isDragging ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600'
                                }`}
                        />
                    </div>

                    <div>
                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                            {isDragging ? (
                                'Drop files here'
                            ) : (
                                <>
                                    <span className="text-purple-600 dark:text-purple-400">Click to upload</span>
                                    {' or drag and drop'}
                                </>
                            )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {accept.includes('image')
                                ? `Images up to ${maxSizeMB}MB (JPG, PNG, WebP, SVG)`
                                : `Files up to ${maxSizeMB}MB`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Selected Files List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Selected Files ({files.length})
                    </p>
                    <div className="space-y-2">
                        {files.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileImage className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                {onFileRemove && !disabled && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onFileRemove(index)}
                                        className="ml-2 text-gray-500 hover:text-red-500"
                                        aria-label={`Remove file ${file.name}`}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
