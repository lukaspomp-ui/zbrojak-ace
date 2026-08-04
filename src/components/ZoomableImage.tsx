import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import { useState } from "react";

export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  // If the image can't load, hide the box entirely rather than showing a
  // broken image or the alt text inside the frame.
  if (failed) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block w-full overflow-hidden rounded-xl border border-border"
      >
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="h-auto w-full object-cover"
        />
        <span className="absolute bottom-2 right-2 rounded-full bg-background/80 p-2">
          <ZoomIn className="h-4 w-4" />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              aria-label="Zavřít"
              className="absolute right-4 top-4 rounded-full bg-elevated p-2"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={src}
              alt={alt}
              className="max-h-full max-w-full rounded-xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
