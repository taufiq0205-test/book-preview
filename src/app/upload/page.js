
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { ImageIcon, X } from 'lucide-react';

export default function UploadPage() {
    const [frontCover, setFrontCover] = useState({ file: null, preview: null });
    const [backCover, setBackCover] = useState({ file: null, preview: null });
    const [pages, setPages] = useState(Array(8).fill({ file: null, preview: null }));

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const searchParams = useSearchParams();
    const orientation = searchParams.get('orientation');

    useEffect(() => {
        // Fetch existing images and populate the state
        const fetchImages = async () => {
            const { data } = await supabase.storage.from('image-upload').list('public');
            if(data) {
                const urls = data.reduce((acc, file) => {
                    acc[file.name] = supabase.storage.from('image-upload').getPublicUrl(`public/${file.name}`).data.publicUrl;
                    return acc;
                }, {});

                if(urls['cover_front.jpg']) setFrontCover(p => ({...p, preview: urls['cover_front.jpg']}));
                if(urls['cover_back.jpg']) setBackCover(p => ({...p, preview: urls['cover_back.jpg']}));
                const newPages = [...pages];
                for(let i=0; i<8; i++){
                    if(urls[`page_${i+1}.jpg`]) newPages[i] = {...newPages[i], preview: urls[`page_${i+1}.jpg`]};
                }
                setPages(newPages);
            }
        };
        fetchImages();
    }, []);


    const handleFileSelect = (e, type, index = null) => {
        const file = e.target.files[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);

        if (type === 'front') {
            setFrontCover({ file, preview });
        } else if (type === 'back') {
            setBackCover({ file, preview });
        } else if (type === 'page') {
            const newPages = [...pages];
            newPages[index] = { file, preview };
            setPages(newPages);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        setError(null);
        setSuccess(false);

        const uploads = [];
        if (frontCover.file) uploads.push(supabase.storage.from('image-upload').upload('public/cover_front.jpg', frontCover.file, { upsert: true }));
        if (backCover.file) uploads.push(supabase.storage.from('image-upload').upload('public/cover_back.jpg', backCover.file, { upsert: true }));
        pages.forEach((page, index) => {
            if (page.file) uploads.push(supabase.storage.from('image-upload').upload(`public/page_${index + 1}.jpg`, page.file, { upsert: true }));
        });

        const results = await Promise.all(uploads);
        const uploadError = results.find(res => res.error);

        if (uploadError) {
            setError(`Error uploading: ${uploadError.error.message}`);
        } else {
            setSuccess('All images uploaded successfully!');
        }

        setUploading(false);
    };

    const renderFileInput = (id, onChange) => (
        <input id={id} type="file" onChange={onChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
    );

    const renderImageSlot = (state, type, index = null) => {
        const id = type === 'page' ? `page-upload-${index}` : `${type}-upload`;
        let altText = "Image upload slot";
        if (type === 'front') altText = "Front cover preview";
        else if (type === 'back') altText = "Back cover preview";
        else if (type === 'page') altText = `Page ${index + 1} preview`;

        return (
             <div className="w-32 h-40 border-2 border-dashed rounded-lg flex items-center justify-center relative bg-gray-50">
                {state.preview ? (
                    <Image src={state.preview} alt={altText} layout="fill" objectFit="cover" className="rounded-lg"/>
                ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400"/>
                )}
                {renderFileInput(id, (e) => handleFileSelect(e, type, index))}
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center mb-8">Upload Your Photos</h1>

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
                {/* Covers */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-center">Covers</h2>
                    <div className="flex justify-center gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <h3 className="font-medium">Front Cover</h3>
                            {renderImageSlot(frontCover, 'front')}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                             <h3 className="font-medium">Back Cover</h3>
                            {renderImageSlot(backCover, 'back')}
                        </div>
                    </div>
                </div>

                {/* Pages */}
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold mb-4 text-center">Pages</h2>
                     <div className="grid grid-cols-4 gap-4">
                        {pages.map((page, index) => (
                           <div key={index} className="flex flex-col items-center gap-2">
                                <h3 className="font-medium text-sm">Page {index + 1}</h3>
                                {renderImageSlot(page, 'page', index)}
                           </div>
                        ))}
                     </div>
                </div>

                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                {success && <p className="text-green-500 mb-4 text-center">{success}</p>}

                <div className="flex items-center justify-center mt-8 gap-4">
                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-gray-400" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Upload & Save'}
                    </button>
                    <Link href={`/preview?orientation=${orientation}`} passHref>
                        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline">
                            Go to Preview
                        </button>
                    </Link>
                </div>
            </form>
        </div>
    );
}
