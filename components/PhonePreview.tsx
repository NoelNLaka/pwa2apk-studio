
import React from 'react';
import { PwaMetadata } from '../types';

interface PhonePreviewProps {
  metadata: PwaMetadata | null;
  url: string;
}

const PhonePreview: React.FC<PhonePreviewProps> = ({ metadata, url }) => {
  return (
    <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
      <div className="w-[148px] h-[18px] bg-gray-800 top-0 left-1/2 -translate-x-1/2 absolute rounded-b-[1rem]"></div>
      <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
      <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
      <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
      <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white flex flex-col">
        {/* Status Bar */}
        <div className="h-6 bg-slate-900 flex items-center justify-between px-4 text-[10px] text-white">
          <span>9:41</span>
          <div className="flex gap-1">
            <i className="fas fa-signal"></i>
            <i className="fas fa-wifi"></i>
            <i className="fas fa-battery-full"></i>
          </div>
        </div>
        
        {/* App Splash/Content */}
        <div 
          className="flex-1 flex flex-col items-center justify-center p-6 text-center"
          style={{ backgroundColor: metadata?.backgroundColor || '#ffffff' }}
        >
          {metadata ? (
            <>
              <div 
                className="w-20 h-20 rounded-2xl shadow-lg mb-4 flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: metadata.themeColor }}
              >
                {metadata.shortName[0]}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{metadata.name}</h3>
              <p className="text-sm text-slate-500 mt-2">{metadata.description.substring(0, 100)}...</p>
              <div className="mt-8 px-4 py-2 bg-slate-100 rounded-full text-[10px] text-slate-400 truncate w-full">
                {url}
              </div>
            </>
          ) : (
            <div className="text-slate-300 animate-pulse">
              <i className="fas fa-globe text-6xl mb-4"></i>
              <p>Waiting for URL...</p>
            </div>
          )}
        </div>
        
        {/* Navigation Bar */}
        <div className="h-12 bg-slate-50 border-t border-slate-200 flex items-center justify-around text-slate-400">
          <i className="fas fa-chevron-left"></i>
          <i className="far fa-circle"></i>
          <i className="fas fa-square"></i>
        </div>
      </div>
    </div>
  );
};

export default PhonePreview;
