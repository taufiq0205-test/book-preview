
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { ImageIcon, Loader } from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';

const Page = React.forwardRef(({ children, imageSrc, alt }, ref) => {
    return (
      <div className="w-full h-full bg-white relative" ref={ref}>
         {imageSrc ? (
            <Image src={imageSrc} alt={alt} layout="fill" objectFit="cover" />
        ) : (
            <div className="p-6 w-full h-full">
                <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-100/50">
                    <div className="text-center text-gray-400">
                        <ImageIcon className="mx-auto h-12 w-12" />
                         <p className="mt-2 text-sm">{children}</p>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
});
Page.displayName = 'Page'

export default function PreviewPage() {
  const [frontCoverUrl, setFrontCoverUrl] = useState(null);
  const [backCoverUrl, setBackCoverUrl] = useState(null);
  const [pageUrls, setPageUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const searchParams = useSearchParams();
  const orientation = searchParams.get('orientation') || 'landscape';
  const flipBook = useRef();

  useEffect(() => {
    const fetchUploadedImages = async () => {
        setIsLoading(true);
        const { data } = await supabase.storage.from('image-upload').list('public');
        if(!data) {
            setIsLoading(false);
            return;
        }

        const urls = data.reduce((acc, file) => {
            acc[file.name] = supabase.storage.from('image-upload').getPublicUrl(`public/${file.name}`).data.publicUrl;
            return acc;
        }, {});

        setFrontCoverUrl(urls['cover_front.jpg'] || null);
        setBackCoverUrl(urls['cover_back.jpg'] || null);

        const newPageUrls = [];
        for(let i=1; i<=8; i++) {
            if(urls[`page_${i}.jpg`]) newPageUrls.push(urls[`page_${i}.jpg`]);
        }
        setPageUrls(newPageUrls);
        setIsLoading(false);
    };
    fetchUploadedImages();
  }, []);

  const generatePdf = async () => {
    setIsGenerating(true);
    const allUrls = [frontCoverUrl, ...pageUrls, backCoverUrl].filter(Boolean);
    const doc = new jsPDF({
        orientation: orientation,
        unit: 'px',
        format: orientation === 'landscape' ? [600, 400] : [500, 500]
    });

    for (let i = 0; i < allUrls.length; i++) {
        if (i > 0) doc.addPage();
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = allUrls[i];
        await new Promise(resolve => img.onload = resolve);
        doc.addImage(img, 'JPEG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());
    }

    doc.save('photobook.pdf');
    setIsGenerating(false);
  }

  const bookWidth = orientation === 'landscape' ? 550 : 500;
  const bookHeight = orientation === 'landscape' ? 450 : 500;

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-7xl mx-auto p-8 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center mb-8">Your Photobook</h1>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[500px]">
                <Loader className="animate-spin h-12 w-12 text-blue-500" />
                <p className="mt-4 text-lg">Loading your photobook...</p>
            </div>
        ) : (
             <HTMLFlipBook 
                width={bookWidth} 
                height={bookHeight} 
                ref={flipBook} 
                showCover={true}
                flippingTime={1000}
                easing="ease-in-out"
            >
                <Page imageSrc={frontCoverUrl} alt="Front cover of the photobook">Front Cover</Page>
                {pageUrls.map((url, index) => (
                    <Page key={index} imageSrc={url} alt={`Photobook page ${index + 1}`}>Page {index + 1}</Page>
                ))}
                 <Page imageSrc={backCoverUrl} alt="Back cover of the photobook">Back Cover</Page>
            </HTMLFlipBook>
        )}


        <div className="flex justify-center mt-8 gap-4">
          <button onClick={() => flipBook.current?.pageFlip().flipPrev()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" disabled={isLoading}>
            Previous
          </button>
          <button onClick={() => flipBook.current?.pageFlip().flipNext()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" disabled={isLoading}>
            Next
          </button>
        </div>
         <div className="text-center mt-8">
            <button onClick={generatePdf} disabled={isGenerating || isLoading} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400">
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
