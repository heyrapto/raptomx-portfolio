import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { useGalleryItems } from '../../hooks/queries/use-portfolio-data';
import { GalleryProps } from '../../types/gallery';


export const Gallery: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [galleryItems, setGallery] = useState<GalleryProps[]>([]);
  const { data: galleryData, isLoading, error } = useGalleryItems();

  useEffect(() => {
    if (galleryData?.data?.gallery && galleryData.data.gallery.length > 0) {
      setGallery(galleryData.data.gallery);
    } else if (error) {
      console.warn('Failed to load gallery items, using mock data', error);
    }
  }, [galleryData, error, galleryItems.length]);

  const openImageModal = (index: number) => {
    setSelectedImage(index);
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="min-h-screen text-white flex flex-col">
      <PageHeader
        heading="Gallery"
        paragraph="Some of the memories I've shared"
      />

      {/* Status banners */}
      <div className="w-full max-w-[1200px] mx-auto px-4">
        {isLoading && (
          <p className="text-sm text-gray-400 text-center mb-4">Loading latest gallery items — showing sample content</p>
        )}
        {error && (
          <p className="text-sm text-yellow-400 text-center mb-4">Unable to load gallery items — showing sample content</p>
        )}
      </div>

      {/* Gallery grid */}
      <div className="max-w-[1200px] mx-auto px-4 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryItems?.map((item: any, index: number) => (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-[25px] border border-gray-800 
                ${index % 3 === 0 ? 'md:col-span-2 lg:col-span-1 aspect-square' :
                  index % 5 === 0 ? 'lg:col-span-2 aspect-video' : 'aspect-square'}
                cursor-pointer transition-transform duration-500 hover:scale-[1.02] group`}
              onClick={() => openImageModal(index)}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100">
                <h3 className="text-2xl font-medium mb-2">{item.title}</h3>
                <p className="text-gray-300 text-lg mb-1">{item.category}</p>
                <p className="text-gray-400 text-base">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {(!galleryItems || galleryItems.length === 0) && !isLoading && (
          <div className="flex justify-center items-center py-20">
            <p className="text-gray-400">No gallery items available</p>
          </div>
        )}
      </div>

      {/* Image modal */}
      {selectedImage !== null && galleryItems && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-white text-4xl z-10 hover:text-gray-300"
              onClick={closeImageModal}
            >
              &times;
            </button>
            <img
              src={galleryItems[selectedImage].imageUrl}
              alt={galleryItems[selectedImage].title}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-6">
              <h3 className="text-2xl font-medium mb-2">{galleryItems[selectedImage].title}</h3>
              <p className="text-gray-300">{galleryItems[selectedImage].description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};