'use client'
import { Info } from 'lucide-react'
import { useState } from 'react'

const InfoTooltip = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <span 
        className="relative inline-flex cursor-pointer items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Info className="-mt-0.5 h-4 w-4 shrink-0" />
      </span>

      {/* Desktop tooltip - positioned to the left */}
      {isOpen && (
        <div className="hidden md:block">
          <div className="z-10 mt-2 w-60 rounded-md bg-[#F6F6F6] px-3 py-4 text-center text-xs font-bold text-black shadow-md sm:w-80 sm:-ml-32">
            <span className="block whitespace-normal wrap-break-words">{content}</span>
          </div>
        </div>
      )}

      {/* Mobile tooltip - fixed positioning overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:hidden"
          onClick={() => setIsOpen(false)}
        >
          <div className="w-full max-w-sm rounded-md bg-[#F6F6F6] px-4 py-5 text-center text-xs font-bold text-black shadow-lg">
            <span className="block whitespace-normal wrap-break-words">{content}</span>
          </div>
        </div>
      )}
    </>
  )
}

export default InfoTooltip