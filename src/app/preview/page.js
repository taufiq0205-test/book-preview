
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { ImageIcon } from 'lucide-react';

export default function PreviewPage() {
  const [imageUrls, setImageUrls] = useState([]);
  const [currentPage, setCurrentPage] = useState(-1); // -1 for cover, 0 for spread 1, etc.
  const [isGenerating, setIsGenerating] = useState(false);
  const searchParams = useSearchParams();
  const orientation = searchParams.get('orientation') || 'landscape';

  useEffect(() => {
    const fetchUploadedImages = async () => {
      const { data, error } = await supabase.storage.from('image-upload').list('public', {
        limit: 8, // Limit to 8 images
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      const urls = data
        .filter(file => file.name !== '.emptyFolderPlaceholder')
        .map(file => {
          const { publicUrl } = supabase.storage.from('image-upload').getPublicUrl(`public/${file.name}`).data;
          return publicUrl;
        });
      setImageUrls(urls);
    };
    fetchUploadedImages();
  }, []);

  const totalPages = Math.min(imageUrls.length, 8);
  const totalSpreads = Math.ceil(totalPages / 2);

  const handleNextPage = () => {
    if (currentPage < totalSpreads - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > -1) {
      setCurrentPage(currentPage - 1);
    }
  };

    const generatePdf = async () => {
    setIsGenerating(true);
    const doc = new jsPDF({
        orientation: orientation,
        unit: 'px',
        format: orientation === 'landscape' ? [600, 400] : [500, 500]
    });

    for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
            doc.addPage();
        }
        const img = new window.Image();
        img.crossOrigin = "Anonymous"; // Important for loading images from other domains
        img.src = imageUrls[i];
        await new Promise(resolve => img.onload = resolve);
        doc.addImage(img, 'JPEG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());
    }

    doc.save('photobook.pdf');
    setIsGenerating(false);
  }


  const renderCover = () => (
    <div className="flex justify-center items-center gap-0">
        <div className="w-[550px] h-[550px] bg-neutral-50 p-6 flex flex-col gap-4 transform transition-transform duration-500 ease-in-out hover:rotate-y-2">
            <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-100/50 relative">
                <div className="text-center text-gray-400">
                    <ImageIcon className="mx-auto h-12 w-12" />
                    <p className="mt-2 text-sm">Back Cover</p>
                </div>
            </div>
        </div>
        <div className="h-[550px] flex">
            <div className="w-2 h-full bg-gray-200"></div>
            <div className="w-9 h-full bg-gray-300"></div>
            <div className="w-2 h-full bg-gray-200"></div>
        </div>
        <div className="w-[550px] h-[550px] bg-neutral-50 transform transition-transform duration-500 ease-in-out hover:-rotate-y-2 relative">
             {imageUrls[0] ? (
                <Image src={imageUrls[0]} alt="Front Cover" layout="fill" objectFit="cover" />
             ) : (
                <div className="p-6 w-full h-full">
                    <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-100/50">
                        <div className="text-center text-gray-400">
                            <ImageIcon className="mx-auto h-12 w-12" />
                            <p className="mt-2 text-sm">Front Cover</p>
                        </div>
                    </div>
                </div>
             )}
        </div>
    </div>
  )

  const renderSpread = (pageIndex) => {
    const leftImageIndex = pageIndex * 2;
    const rightImageIndex = pageIndex * 2 + 1;
    const leftImageUrl = imageUrls[leftImageIndex + 1]; // +1 to offset cover
    const rightImageUrl = imageUrls[rightImageIndex + 1];

    return (
        <div className="flex justify-center items-center gap-0">
            <div className="w-[550px] h-[550px] bg-white relative">
                {leftImageUrl ? (
                    <Image src={leftImageUrl} alt={`Page ${leftImageIndex + 1}`} layout="fill" objectFit="cover" />
                ) : (
                    <div className="p-6 w-full h-full">
                      <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-100/50">
                          <div className="text-center text-gray-400">
                              <ImageIcon className="mx-auto h-12 w-12" />
                              <p className="mt-2 text-sm">Page {leftImageIndex + 1}</p>
                          </div>
                      </div>
                    </div>
                )}
            </div>
            <div className="w-px h-[550px] bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300"></div>
            <div className="w-[550px] h-[550px] bg-white relative">
                 {rightImageUrl ? (
                    <Image src={rightImageUrl} alt={`Page ${rightImageIndex + 2}`} layout="fill" objectFit="cover" />
                ) : (
                    <div className="p-6 w-full h-full">
                      <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-100/50">
                          <div className="text-center text-gray-400">
                              <ImageIcon className="mx-auto h-12 w-12" />
                              <p className="mt-2 text-sm">Page {rightImageIndex + 2}</p>
                          </div>
                      </div>
                    </div>
                )}
            </div>
        </div>
    )
  }


  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-8">Your Photobook</h1>

        {currentPage === -1 ? renderCover() : renderSpread(currentPage)}

        <div className="flex justify-center mt-8 gap-4">
          <button onClick={handlePreviousPage} disabled={currentPage === -1} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400">
            Previous
          </button>
          <button onClick={handleNextPage} disabled={currentPage >= totalSpreads - 1} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400">
            Next
          </button>
        </div>
        <div className="text-center mt-4">
            <p>
                {currentPage === -1 ? 'Cover' : `Spread ${currentPage + 1} of ${totalSpreads}`}
            </p>
        </div>
         <div className="text-center mt-8">
            <button onClick={generatePdf} disabled={isGenerating || imageUrls.length === 0} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400">
                {isGenerating ? 'Generating PDF...' : 'Download PDF'}
            </button>
        </div>
        <div className="text-center mt-4">
          <Link href={`/upload?orientation=${orientation}`} passHref>
            <button className="text-blue-500 hover:underline">
              Back to Upload
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
