'use client';

import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface CameraCaptureProps {
  onTextExtracted: (text: string) => void;
  onISBNDetected?: (isbn: string) => void;
  debugMode?: boolean;
}

type CaptureMode = 'camera' | 'gallery';
type RecognitionType = 'text' | 'barcode' | 'auto';

export default function CameraCapture({
  onTextExtracted,
  onISBNDetected,
  debugMode = false
}: CameraCaptureProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('camera');
  const [recognitionType, setRecognitionType] = useState<RecognitionType>('auto');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const addDebugLog = (message: string) => {
    if (debugMode) {
      const timestamp = new Date().toLocaleTimeString();
      setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
      console.log(`[CameraCapture] ${message}`);
    }
  };

  const detectBarcode = async (imageUrl: string): Promise<string | null> => {
    try {
      addDebugLog('Inizio riconoscimento barcode...');
      const codeReader = new BrowserMultiFormatReader();

      // Crea un elemento immagine
      const img = new Image();
      img.src = imageUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      addDebugLog(`Immagine caricata: ${img.width}x${img.height}`);

      // Decodifica il barcode
      const result = await codeReader.decodeFromImageElement(img);

      if (result && result.getText()) {
        const barcode = result.getText();
        addDebugLog(`Barcode trovato: ${barcode} (formato: ${result.getBarcodeFormat()})`);

        // Valida che sia un ISBN (10 o 13 cifre)
        const cleaned = barcode.replace(/[^0-9]/g, '');
        if (cleaned.length === 10 || cleaned.length === 13) {
          addDebugLog(`ISBN valido rilevato: ${cleaned}`);
          return cleaned;
        } else {
          addDebugLog(`Barcode non valido come ISBN (${cleaned.length} cifre)`);
        }
      }

      return null;
    } catch (error) {
      addDebugLog(`Errore riconoscimento barcode: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const performOCR = async (imageUrl: string): Promise<string> => {
    addDebugLog('Inizio riconoscimento OCR...');

    const result = await Tesseract.recognize(imageUrl, 'ita+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
          if (debugMode && m.progress % 0.2 < 0.05) {
            addDebugLog(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      },
    });

    const text = result.data.text.trim();
    addDebugLog(`OCR completato. Caratteri rilevati: ${text.length}`);
    return text;
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>, mode: CaptureMode) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addDebugLog(`File selezionato: ${file.name} (${file.size} bytes, ${file.type})`);

    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);
    setIsProcessing(true);
    setProgress(0);

    try {
      let isbnFound = false;

      // Modalità AUTO: prova prima barcode, poi OCR
      if (recognitionType === 'auto' || recognitionType === 'barcode') {
        addDebugLog('Tentativo riconoscimento barcode...');
        const isbn = await detectBarcode(imageUrl);

        if (isbn && onISBNDetected) {
          addDebugLog(`✓ ISBN trovato: ${isbn}`);
          onISBNDetected(isbn);
          isbnFound = true;

          // Se è solo barcode mode, non fare OCR
          if (recognitionType === 'barcode') {
            setIsProcessing(false);
            return;
          }
        } else {
          addDebugLog('Nessun barcode ISBN rilevato');
        }
      }

      // Se non ha trovato barcode O siamo in modalità text/auto, fa OCR
      if (recognitionType === 'auto' || recognitionType === 'text') {
        const extractedText = await performOCR(imageUrl);

        if (extractedText) {
          addDebugLog(`✓ Testo estratto con successo`);
          onTextExtracted(extractedText);
        } else {
          addDebugLog('⚠ Nessun testo estratto');
        }
      }

      if (!isbnFound && recognitionType === 'auto') {
        addDebugLog('Completato: nessun ISBN, usato OCR per testo');
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto';
      addDebugLog(`❌ ERRORE: ${errorMsg}`);
      console.error('Errore durante il riconoscimento:', error);
      alert('Errore durante il riconoscimento. Riprova.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleRetake = () => {
    setImage(null);
    setDebugInfo([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const triggerCapture = (mode: CaptureMode) => {
    setCaptureMode(mode);
    if (mode === 'camera') {
      fileInputRef.current?.click();
    } else {
      galleryInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Debug Info */}
      {debugMode && debugInfo.length > 0 && (
        <div className="bg-gray-900 text-green-400 text-xs font-mono p-4 rounded-lg max-h-48 overflow-y-auto">
          {debugInfo.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Settings Controls */}
      {!image && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modalità riconoscimento
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setRecognitionType('auto')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  recognitionType === 'auto'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                🤖 Auto
              </button>
              <button
                onClick={() => setRecognitionType('barcode')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  recognitionType === 'barcode'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                📊 Barcode
              </button>
              <button
                onClick={() => setRecognitionType('text')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  recognitionType === 'text'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                📝 Testo
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {recognitionType === 'auto' && '🤖 Prova prima barcode ISBN, poi OCR testo'}
              {recognitionType === 'barcode' && '📊 Solo riconoscimento codice a barre ISBN'}
              {recognitionType === 'text' && '📝 Solo riconoscimento testo OCR'}
            </p>
          </div>
        </div>
      )}

      {!image ? (
        <div className="space-y-3">
          {/* Camera Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleCapture(e, 'camera')}
            className="hidden"
            id="camera-input"
          />

          {/* Gallery Input */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleCapture(e, 'gallery')}
            className="hidden"
            id="gallery-input"
          />

          {/* Camera Button */}
          <button
            onClick={() => triggerCapture('camera')}
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-lg cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="text-6xl mb-3">📸</div>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                Scatta una foto
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                Usa la fotocamera
              </p>
            </div>
          </button>

          {/* Gallery Button */}
          <button
            onClick={() => triggerCapture('gallery')}
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="text-4xl mb-2">🖼️</div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Carica dalla galleria
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Scegli una foto esistente
              </p>
            </div>
          </button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            💡 Funziona con: dorsi libri, copertine, codici a barre ISBN
          </p>
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
                  {recognitionType === 'barcode'
                    ? 'Riconoscimento barcode in corso...'
                    : recognitionType === 'text'
                    ? 'Riconoscimento testo in corso...'
                    : 'Analisi immagine in corso...'}
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
              📸 Scatta/Carica un&apos;altra foto
            </button>
          )}
        </div>
      )}
    </div>
  );
}
