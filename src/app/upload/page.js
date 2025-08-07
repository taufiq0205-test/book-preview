'use client';

import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
    setSuccess(false);

    const newPreviews = selectedFiles.map(file => ({
      src: URL.createObjectURL(file),
      name: file.name
    }));
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    for (const file of files) {
      // Store files in a 'public' folder
      const filePath = `public/${file.name}`;
      const { error } = await supabase.storage
        .from('image-upload')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // Set to true if you want to overwrite existing files
        });

      if (error) {
        setError(`Error uploading ${file.name}: ${error.message}`);
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    setSuccess(true);
    setFiles([]);
    setPreviews([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Upload Your Photos</h1>
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6">
          <label htmlFor="file-upload" className="block text-gray-700 text-sm font-bold mb-2">
            Select Images
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            accept="image/*"
            disabled={uploading}
          />
        </div>

        {previews.length > 0 && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {previews.map((preview) => (
              <div key={preview.name} className="relative">
                <Image
                  src={preview.src}
                  alt={`Preview of ${preview.name}`}
                  className="w-full h-auto rounded-lg"
                  width={150}
                  height={150}
                  objectFit="cover"
                />
              </div>
            ))}
          </div>
        )}

        {uploading && <p className="text-blue-500">Uploading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">Upload successful! You can now view your images in the gallery.</p>}

        <div className="flex items-center justify-between mt-4">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
            disabled={uploading || files.length === 0}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  );
}
