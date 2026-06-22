/**
 * SideDrawer Premium — Glassmorphism AI Assistant.
 * backdrop-blur-lg bg-white/90 + smooth slide + transition workspace.
 */
import { useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import ChatPopup from './ChatPopup';

export default function SideDrawer({ open, onClose, context }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-[400px] max-w-[90vw] transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full bg-white/90 backdrop-blur-lg border-l border-zinc-100 shadow-2xl shadow-zinc-200/50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-zinc-800">AI Trợ lý</span>
                {context?.label && (
                  <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                    {context.label}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <X size={16} className="text-zinc-400" />
            </button>
          </div>

          {/* Chat content */}
          <div className="flex-1 overflow-hidden">
            <ChatPopup mode="inline" context={context} />
          </div>
        </div>
      </div>
    </>
  );
}
