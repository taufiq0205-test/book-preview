'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Upscaler from 'upscaler';

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [upscaling, setUpscaling] = useState({});
  const [allowLowRes, setAllowLowRes] = useState(false);
  const searchParams = useSearchParams();
  const orientation = searchParams.get('orientation');

  useEffect(() => {
    const fetchUploadedImages = async () => {
      const { data, error } = await supabase.storage.from('image-upload').list('public', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      const imageUrls = data
        .filter(file => file.name !== '.emptyFolderPlaceholder')
        .map(file => {
            const { publicUrl } = supabase.storage.from('image-upload').getPublicUrl(`public/${file.name}`).data;
            return publicUrl;
        });

      setUploadedImageUrls(imageUrls);
    };

    fetchUploadedImages();
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + uploadedImageUrls.length > 9) {
        setError('You can upload a maximum of 9 images (1 cover + 8 pages).');
        return;
    }
    setError(null);
    setSuccess(false);

    const newPreviews = [];
    const resolutionErrors = [];

    const checkFileResolution = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new window.Image();
          img.onload = () => {
            const isLowRes = img.width < 1200 || img.height < 1200;
            newPreviews.push({
              src: URL.createObjectURL(file),
              name: file.name,
              lowRes: isLowRes
            });
            if (isLowRes) {
                resolutionErrors.push(file.name)
            }
            resolve();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    };

    Promise.all(selectedFiles.map(checkFileResolution)).then(() => {
        setFiles(selectedFiles)
        setPreviews(newPreviews);
      if (resolutionErrors.length > 0) {
        setError(`The following images may be too low quality for printing: ${resolutionErrors.join(', ')}. You can upscale them or choose to continue.`);
      }
    });
  };

  const handleUpscale = async (fileName) => {
    setUpscaling(prev => ({...prev, [fileName]: true}));
    const fileToUpscale = files.find(f => f.name === fileName);

    const upscaler = new Upscaler();
    const image = new window.Image();
    image.src = URL.createObjectURL(fileToUpscale);
    image.onload = async () => {
        const upscaledImage = await upscaler.upscale(image, { patchSize: 64, padding: 2 });
        const response = await fetch(upscaledImage);
        const blob = await response.blob();
        const upscaledFile = new File([blob], `upscaled-${fileName}`, { type: blob.type });

        setFiles(prev => prev.map(f => f.name === fileName ? upscaledFile : f));
        setPreviews(prev => prev.map(p => p.name === fileName ? {...p, src: URL.createObjectURL(upscaledFile), lowRes: false, name: upscaledFile.name} : p))
        setUpscaling(prev => ({...prev, [fileName]: false}));
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lowResFiles = previews.filter(p => p.lowRes);
    if (lowResFiles.length > 0 && !allowLowRes) {
      setError('You have low-resolution images. Please upscale them or check the box to upload anyway.');
      return;
    }
    if (files.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    const newImageUrls = [...uploadedImageUrls];

    for (const file of files) {
      const filePath = `public/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('image-upload')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        setError(`Error uploading ${file.name}: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const { publicUrl } = supabase.storage.from('image-upload').getPublicUrl(filePath).data;
      if (!newImageUrls.includes(publicUrl)) {
        newImageUrls.push(publicUrl);
      }
    }

    setUploading(false);
    setSuccess(true);
    setFiles([]);
    setPreviews([]);
    setUploadedImageUrls(newImageUrls);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Upload Your Photos</h1>
        <p className="text-center text-gray-600 mb-4">You can upload up to 9 photos (1 for the cover and 8 for the pages).</p>
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
                {preview.lowRes && (
                    <div className="absolute bottom-0 left-0 right-0 bg-yellow-500 text-black text-xs text-center p-1">
                        Low Quality
                        <button type="button" onClick={() => handleUpscale(preview.name)} disabled={upscaling[preview.name]} className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs disabled:bg-gray-400">
                            {upscaling[preview.name] ? 'Upscaling...' : 'Upscale'}
                        </button>
                    </div>
                )}
              </div>
            ))}
          </div>
        )}

        {previews.some(p => p.lowRes) && (
            <div className="mb-4">
                <label className="inline-flex items-center">
                    <input type="checkbox" className="form-checkbox" checked={allowLowRes} onChange={() => setAllowLowRes(!allowLowRes)} />
                    <span className="ml-2 text-sm text-gray-700">I want to upload low-quality images at my own risk.</span>
                </label>
            </div>
        )}

        {uploading && <p className="text-blue-500">Uploading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">Upload successful!</p>}

        <div className="flex items-center justify-between mt-4">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
            disabled={uploading || files.length === 0}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <Link href={`/preview?orientation=${orientation}`} passHref>
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400" disabled={uploadedImageUrls.length === 0}>
                Go to Preview
            </button>
          </Link>
        </div>
      </form>

      {uploadedImageUrls.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-4">Your Uploaded Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadedImageUrls.map((url, index) => (
              <div key={index} className="relative">
                <Image
                  src={url}
                  alt={`Uploaded image ${index + 1}`}
                  className="w-full h-auto rounded-lg"
                  width={200}
                  height={200}
                  objectFit="cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
