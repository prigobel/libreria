'use client';

import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

interface CameraCaptureProps {
  onTextExtracted: (text: string) => void;
}

export default function CameraCapture({ onTextExtracted }: CameraCaptureProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(imageUrl, 'ita+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const extractedText = result.data.text.trim();
      console.log('Testo estratto:', extractedText);
      onTextExtracted(extractedText);
    } catch (error) {
      console.error('Errore OCR:', error);
      alert('Errore durante il riconoscimento del testo. Riprova.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleRetake = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!image ? (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            className="hidden"
            id="camera-input"
          />
          <label
            htmlFor="camera-input"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <div className="text-6xl mb-4">📸</div>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Tocca per fotografare</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Scatta una foto al dorso del libro
              </p>
            </div>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="Libro fotografato"
              className="w-full h-full object-contain"
            />
          </div>

          {isProcessing ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Riconoscimento testo in corso...
                </span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleRetake}
              className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Scatta un&apos;altra foto
            </button>
          )}
        </div>
      )}
    </div>
  );
}
