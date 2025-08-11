
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { 
    ImageIcon, 
    Loader, 
    BookOpen, 
    ArrowLeft, 
    ArrowRight,
    Clock,
    Shuffle,
    Palette,
    LayoutGrid,
    Frame,
    Info,
    MoveVertical
} from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';
import { FastAverageColor } from 'fast-average-color';
import Color from 'color';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortablePageItem = ({ id, page, index }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({id: id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (page.type === 'chapter') {
        return (
             <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-4 bg-purple-800/50 p-2 rounded mb-2 w-full">
                <div className="flex-shrink-0 w-16 h-12 bg-purple-900 rounded flex items-center justify-center">
                </div>
                <div className="flex-grow text-sm">
                    <p className="font-semibold text-purple-200">{page.title}</p>
                    <p className="text-xs text-purple-400">Chapter Divider</p>
                </div>
            </div>
        )
    }

    const representativeImage = page.images[0];

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-4 bg-gray-700 p-2 rounded mb-2 w-full">
             <div className="flex-shrink-0 w-16 h-12 bg-gray-600 rounded overflow-hidden relative">
                {representativeImage && (
                    <Image src={representativeImage.url} alt={`Thumbnail of page ${index + 1}`} layout="fill" objectFit="cover" />
                )}
            </div>
            <div className="flex-grow text-sm">
                <p className="font-semibold">Page {index + 1}</p>
                 <p className="text-xs text-gray-400">{page.images.length} image(s)</p>
            </div>
            <MoveVertical className="text-gray-500"/>
        </div>
    );
}


const Page = React.forwardRef(({ page, alt }, ref) => {
    
    if (page.type === 'chapter') {
        return (
            <div className="w-full h-full bg-gray-100 shadow-lg relative flex items-center justify-center p-10" ref={ref}>
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-gray-800 tracking-tight">{page.title}</h2>
                    <p className="text-lg text-gray-500 mt-2">{page.dateRange}</p>
                </div>
            </div>
        )
    }

    const { images, layout, backgroundColor = 'white' } = page;

    // If a single imageSrc is provided, maintain the old behavior
    if (typeof images === 'string') {
        return (
            <div className="w-full h-full bg-white shadow-lg relative" ref={ref}>
                <Image src={images} alt={alt} layout="fill" objectFit="cover" />
            </div>
        );
    }
    
    // If no images or layout are provided, show the placeholder
    if (!images || images.length === 0) {
        return (
            <div className="w-full h-full bg-white shadow-lg relative" ref={ref}>
                <div className="p-6 w-full h-full">
                    <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <div className="text-center text-gray-400">
                            <ImageIcon className="mx-auto h-12 w-12" />
                            <p className="mt-2 text-sm">Empty Page</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default to a simple layout if none is provided
    const layoutConfig = layout || {
        type: 'single',
        positions: [{ top: 0, left: 0, width: '100%', height: '100%' }]
    };

    return (
        <div className="w-full h-full bg-white shadow-lg relative" ref={ref} style={{ backgroundColor: backgroundColor}}>
            {images.map((image, index) => {
                const pos = layoutConfig.positions[index] || {};
                return (
                    <div key={index} style={{
                        position: 'absolute',
                        top: pos.top || 0,
                        left: pos.left || 0,
                        width: pos.width || '100%',
                        height: pos.height || '100%',
                        padding: layoutConfig.type === 'minimalist' ? '24px' : '4px' 
                    }}>
                        <div className="relative w-full h-full shadow-md">
                            <Image
                                src={image.url}
                                alt={alt || `Collage image ${index + 1}`}
                                layout="fill"
                                objectFit={layoutConfig.type === 'minimalist' ? 'contain' : 'cover'}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    );
});
Page.displayName = 'Page'

const StyleButton = ({ icon: Icon, label, isActive, onClick, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-3 px-4 py-2 rounded text-left transition-colors w-full ${
            isActive ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
    </button>
);


export default function AutoLayoutPage() {
  const [frontCoverUrl, setFrontCoverUrl] = useState(null);
  const [backCoverUrl, setBackCoverUrl] = useState(null);
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [layoutStyle, setLayoutStyle] = useState('chronological');
  const [showDebug, setShowDebug] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const searchParams = useSearchParams();
  const orientation = searchParams.get('orientation') || 'landscape';
  const flipBook = useRef();
  
  const [imageData, setImageData] = useState([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchAndProcessImages = async () => {
        setIsLoading(true);
        const { data: files, error } = await supabase.storage.from('image-upload').list('public');

        if (error || !files) {
            console.error('Error fetching files:', error);
            setIsLoading(false);
            return;
        }

        const fac = new FastAverageColor();
        
        const pageFiles = files.filter(file => file.name.startsWith('page_') && file.name !== '.emptyFolderPlaceholder');
        
        const processedImageData = await Promise.all(
            pageFiles.map(async (file) => {
                const url = supabase.storage.from('image-upload').getPublicUrl(`public/${file.name}`).data.publicUrl;
                try {
                    const color = await fac.getColorAsync(url, { "mode": "cover" });
                    return { ...file, id: file.name, url, color: Color.rgb(color.rgb).hex(), colorObj: Color(color.rgb) };
                } catch (e) {
                    console.error(`Failed to get color for ${url}`, e);
                    return { ...file, id: file.name, url, color: '#808080', colorObj: Color('#808080') };
                }
            })
        );
        
        setImageData(processedImageData);

        const { data: frontCoverData } = supabase.storage.from('image-upload').getPublicUrl('public/cover_front.jpg');
        const { data: backCoverData } = supabase.storage.from('image-upload').getPublicUrl('public/cover_back.jpg');
        setFrontCoverUrl(frontCoverData.publicUrl);
        setBackCoverUrl(backCoverData.publicUrl);

        setIsLoading(false);
    };

    fetchAndProcessImages();
  }, []);

  // Define layout templates
  const layoutTemplates = {
    collageTwo: {
        type: 'collage',
        positions: [
            { top: 0, left: 0, width: '50%', height: '100%' },
            { top: 0, left: '50%', width: '50%', height: '100%' }
        ]
    },
    collageThree: {
        type: 'collage',
        positions: [
            { top: 0, left: 0, width: '50%', height: '100%' },
            { top: 0, left: '50%', width: '50%', height: '50%' },
            { top: '50%', left: '50%', width: '50%', height: '50%' }
        ]
    },
    minimalist: {
        type: 'minimalist',
        positions: [
            { top: 0, left: 0, width: '100%', height: '100%' }
        ]
    }
  }

  useEffect(() => {
    if (imageData.length === 0) return;

    let newPages = [];
    let pageCounter = 0;
    const createPage = (images, layout, backgroundColor) => ({ id: `page-${pageCounter++}`, images, layout, backgroundColor });

    if (layoutStyle === 'chronological') {
        newPages = imageData.map((img) => createPage([img]));
    } else if (layoutStyle === 'shuffle') {
        let tempImages = [...imageData];
        for (let i = tempImages.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tempImages[i], tempImages[j]] = [tempImages[j], tempImages[i]];
        }
        newPages = tempImages.map(img => createPage([img]));
    } else if (layoutStyle === 'color') {
        const tempImages = [...imageData].sort((a, b) => a.colorObj.hue() - b.colorObj.hue());
        newPages = tempImages.map(img => createPage([img]));
    } else if (layoutStyle === 'collage') {
        let remainingImages = [...imageData];
        while(remainingImages.length > 0) {
            if (remainingImages.length >= 3) {
                newPages.push(createPage(remainingImages.splice(0, 3), layoutTemplates.collageThree));
            } else if (remainingImages.length >= 2) {
                newPages.push(createPage(remainingImages.splice(0, 2), layoutTemplates.collageTwo));
            } else {
                newPages.push(createPage(remainingImages.splice(0, 1), null));
            }
        }
    } else if (layoutStyle === 'minimalist') {
        newPages = imageData.map(img => createPage(
            [img], 
            layoutTemplates.minimalist,
            img.colorObj.lighten(0.4).desaturate(0.2).hex()
        ));
    }

    setPages(newPages);

  }, [layoutStyle, imageData]);
  
  function handleDragEnd(event) {
    const {active, over} = event;
    
    if (active.id !== over.id) {
      setPages((pages) => {
        const oldIndex = pages.findIndex((p) => p.id === active.id);
        const newIndex = pages.findIndex((p) => p.id === over.id);
        
        return arrayMove(pages, oldIndex, newIndex);
      });
    }
  }

  const bookWidth = orientation === 'landscape' ? 550 : 500;
  const bookHeight = orientation === 'landscape' ? 450 : 500;
  
  const currentDebugData = pages[currentPageIndex - 1]?.images?.[0];

  return (
    <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
    >
    <div className="bg-gray-800 min-h-screen flex flex-col md:flex-row items-center justify-center font-sans text-white">
      {/* Control Panel */}
      <aside className="w-full md:w-96 p-8 bg-gray-900 h-full md:h-screen md:fixed md:left-0 md:top-0 flex flex-col">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-3 mb-10">
                <BookOpen className="h-8 w-8 text-purple-400" />
                <h1 className="text-2xl font-bold">Auto-Layout Editor</h1>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto -mr-4 pr-4">
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold mb-3 text-gray-400">Layout Style</h2>
                    <div className="flex flex-col space-y-2">
                        <StyleButton icon={Clock} label="Chronological" isActive={layoutStyle === 'chronological'} onClick={() => setLayoutStyle('chronological')} />
                        <StyleButton icon={Palette} label="Color Harmony" isActive={layoutStyle === 'color'} onClick={() => setLayoutStyle('color')} />
                        <StyleButton icon={Shuffle} label="Shuffle" isActive={layoutStyle === 'shuffle'} onClick={() => setLayoutStyle('shuffle')} />
                        <div className="pt-4 mt-4 border-t border-gray-700"><h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Experimental Styles</h3></div>
                        <StyleButton icon={LayoutGrid} label="Dynamic Collage" isActive={layoutStyle === 'collage'} onClick={() => setLayoutStyle('collage')} />
                        <StyleButton icon={Frame} label="Minimalist Showcase" isActive={layoutStyle === 'minimalist'} onClick={() => setLayoutStyle('minimalist')} />
                    </div>
                </div>

                 <div className="pt-4 mt-4 border-t border-gray-700">
                     <h2 className="text-lg font-semibold mb-3 text-gray-400">Page Manager</h2>
                     <div className="h-48 overflow-y-auto pr-2">
                        <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
                            {pages.map((page, index) => (
                                <SortablePageItem key={page.id} id={page.id} page={page} index={index} />
                            ))}
                        </SortableContext>
                     </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-3 text-gray-400">Navigation</h2>
                    <div className="flex justify-between items-center bg-gray-700 rounded p-2">
                        <button onClick={() => flipBook.current?.pageFlip().flipPrev()} className="p-2 hover:bg-gray-600 rounded" disabled={isLoading}><ArrowLeft/></button>
                        <span className="text-sm">Turn Page</span>
                        <button onClick={() => flipBook.current?.pageFlip().flipNext()} className="p-2 hover:bg-gray-600 rounded" disabled={isLoading}><ArrowRight/></button>
                    </div>
                </div>
                 <div className="pt-4 mt-4 border-t border-gray-700">
                    <h2 className="text-lg font-semibold mb-3 text-gray-400">Debug</h2>
                     <StyleButton icon={Info} label={showDebug ? "Hide Debug Info" : "Show Debug Info"} isActive={showDebug} onClick={() => setShowDebug(!showDebug)} />
                </div>
            </div>
          </div>

          <div className="text-center mt-8 flex-shrink-0">
            <Link href={`/preview?orientation=${orientation}`} passHref>
                <button className="text-purple-400 hover:underline">Back to Manual Layout</button>
            </Link>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 flex items-center justify-center p-8 md:ml-96">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[500px]">
                <Loader className="animate-spin h-12 w-12 text-purple-400" />
                <p className="mt-4 text-lg">Loading and arranging your photobook...</p>
            </div>
        ) : (
             <div className="relative">
                <div style={{width: bookWidth * 2 + 40, height: bookHeight + 40}} className="flex items-center justify-center">
                    <HTMLFlipBook 
                        width={bookWidth} 
                        height={bookHeight} 
                        ref={flipBook} 
                        showCover={true}
                        flippingTime={1000}
                        easing="ease-in-out"
                        key={pages.map(p => p.id).join('-')}
                        onFlip={(e) => { if (showDebug) { setCurrentPageIndex(e.data); } }}
                    >
                        <Page page={{ images: frontCoverUrl, layout: null }} alt="Front cover of the photobook"/>
                        {pages.map((page, index) => (
                            <Page 
                                key={page.id} 
                                page={page}
                                alt={`Photobook page ${index + 1}`}
                            />
                        ))}
                         <Page page={{ images: backCoverUrl, layout: null }} alt="Back cover of the photobook" />
                    </HTMLFlipBook>
                </div>
                {showDebug && currentDebugData && (
                    <div className="absolute bottom-[-100px] left-0 w-full bg-gray-900/80 backdrop-blur-sm p-4 rounded-lg text-xs">
                        <h3 className="font-bold text-base mb-2">Debug Info (Page: {currentPageIndex})</h3>
                        <p><span className="font-semibold text-purple-400">File:</span> {currentDebugDataname}</p>
                        <p><span className="font-semibold text-purple-400">Timestamp:</span> {new Date(currentDebugData.created_at).toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-purple-400">Avg. Color:</span> 
                            <div className="w-4 h-4 rounded-full border border-gray-500" style={{backgroundColor: currentDebugData.color}}></div>
                            <span>{currentDebugData.color}</span>
                        </div>
                    </div>
                )}
             </div>
        )}
      </main>
    </div>
    </DndContext>
  );
}
