'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomUrl: string;
  question: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  roomCode,
  roomUrl,
  question,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-border z-10 text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-foreground">
              Scan to Join Room
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 px-2">
              &ldquo;{question}&rdquo;
            </p>

            <div className="my-6 inline-flex p-4 rounded-2xl bg-white shadow-inner border border-border">
              <QRCodeSVG
                value={roomUrl}
                size={200}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"><circle cx="12" cy="12" r="10"/></svg>',
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>

            <div className="bg-secondary rounded-xl p-3 flex items-center justify-between gap-2 mb-4 border border-border/50">
              <div className="text-left overflow-hidden">
                <div className="text-[11px] font-medium text-muted-foreground">
                  Room Code
                </div>
                <div className="font-mono font-bold text-sm tracking-widest text-indigo-600 dark:text-indigo-400 truncate">
                  {roomCode}
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card text-foreground hover:bg-accent shadow-sm transition active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Share with friends or teammates to let them vote in real time.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
