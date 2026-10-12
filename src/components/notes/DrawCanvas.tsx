import React, { useRef, useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  RotateCcw, 
  RotateCw, 
  Check, 
  PenTool, 
  Highlighter, 
  Eraser, 
  Trash2
} from 'lucide-react';

interface DrawCanvasProps {
  initialDrawing?: string;
  onSave: (drawingData: string) => void;
  onBack: () => void;
}

function renderDefaultIllustration(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  
  // Note doodle icon at top
  const centerX = width / 2;
  const startY = Math.max(80, height * 0.18);

  // Note paper doodle
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(centerX - 30, startY);
  ctx.lineTo(centerX + 15, startY);
  ctx.lineTo(centerX + 30, startY + 18);
  ctx.lineTo(centerX + 30, startY + 50);
  ctx.lineTo(centerX - 30, startY + 50);
  ctx.closePath();
  ctx.stroke();

  // Folded corner
  ctx.beginPath();
  ctx.moveTo(centerX + 15, startY);
  ctx.lineTo(centerX + 15, startY + 18);
  ctx.lineTo(centerX + 30, startY + 18);
  ctx.stroke();

  // Pen doodle across note
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(centerX + 5, startY + 4);
  ctx.lineTo(centerX + 36, startY - 20);
  ctx.stroke();

  // Hand-drawn text "Draw"
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 54px "Caveat", "Comic Sans MS", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Draw', centerX, startY + 130);

  // Hand-drawn text "Your"
  ctx.fillText('Your', centerX, startY + 205);

  // Orange Hand-Drawn Loop around "Your" matching media_1791719356647.png
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(centerX, startY + 192, 85, 34, -0.05, 0, Math.PI * 2);
  ctx.stroke();

  // Hand-drawn text "Note"
  ctx.fillText('Note', centerX, startY + 280);

  // Scribble underline below
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(centerX - 60, startY + 340);
  ctx.lineTo(centerX + 60, startY + 340);
  ctx.moveTo(centerX - 50, startY + 348);
  ctx.lineTo(centerX + 50, startY + 348);
  ctx.stroke();

  ctx.restore();
}

export const DrawCanvas: React.FC<DrawCanvasProps> = ({
  initialDrawing,
  onSave,
  onBack
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#8b5cf6'); // Default soft purple as in screenshot
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const DRAW_COLORS = [
    { id: 'purple', hex: '#8b5cf6' },
    { id: 'orange', hex: '#ea580c' },
    { id: 'black', hex: '#0f172a' },
    { id: 'green', hex: '#16a34a' },
    { id: 'blue', hex: '#2563eb' }
  ];

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(data);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI resolution
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    if (initialDrawing) {
      const img = new Image();
      img.src = initialDrawing;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
    } else {
      // Draw initial charming illustration matching media_1791719356647.png
      renderDefaultIllustration(ctx, rect.width, rect.height);
    }
  }, [initialDrawing]);

  const undo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(history[nextIdx], 0, 0);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(history[nextIdx], 0, 0);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 24;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor + '66'; // 40% opacity
      ctx.lineWidth = 18;
      ctx.lineCap = 'square';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const handleDone = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
    onBack();
  };

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 580,
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {/* Engineering Dot-Grid Canvas Background (media_1791719356647.png) */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: '22px 22px',
          pointerEvents: 'none'
        }}
      />

      {/* Top Navigation Bar */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#0f172a',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
          title="Back"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={undo}
            disabled={historyIndex <= 0}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: historyIndex > 0 ? 'pointer' : 'default',
              opacity: historyIndex > 0 ? 1 : 0.35,
              color: '#0f172a',
              display: 'flex',
              padding: 6
            }}
            title="Undo"
          >
            <RotateCcw size={18} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: historyIndex < history.length - 1 ? 'pointer' : 'default',
              opacity: historyIndex < history.length - 1 ? 1 : 0.35,
              color: '#0f172a',
              display: 'flex',
              padding: 6
            }}
            title="Redo"
          >
            <RotateCw size={18} />
          </button>
        </div>

        {/* Done / Checkmark Dark Button */}
        <button
          type="button"
          onClick={handleDone}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#0f172a',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
          title="Save & Done"
        >
          <Check size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Drawing Canvas Surface */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: tool === 'eraser' ? 'cell' : 'crosshair',
            touchAction: 'none'
          }}
        />
      </div>

      {/* Floating Bottom Toolbar (media_1791719356647.png) */}
      <div 
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          borderRadius: 9999,
          background: '#ffffff',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.14)',
          border: '1px solid #e2e8f0',
          zIndex: 10
        }}
      >
        {/* Color Picker Swatch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 6, borderRight: '1px solid #e2e8f0' }}>
          {DRAW_COLORS.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCurrentColor(c.hex);
                if (tool === 'eraser') setTool('pen');
              }}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: c.hex,
                border: currentColor === c.hex && tool !== 'eraser' ? '2.5px solid #0f172a' : '1px solid rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transform: currentColor === c.hex && tool !== 'eraser' ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.12s ease'
              }}
            />
          ))}
        </div>

        {/* Pen Tool */}
        <button
          type="button"
          onClick={() => setTool('pen')}
          style={{
            padding: 8,
            borderRadius: '50%',
            background: tool === 'pen' ? '#f1f5f9' : 'transparent',
            border: 'none',
            color: tool === 'pen' ? '#0f172a' : '#64748b',
            cursor: 'pointer'
          }}
          title="Pen"
        >
          <PenTool size={18} />
        </button>

        {/* Highlighter Tool */}
        <button
          type="button"
          onClick={() => setTool('highlighter')}
          style={{
            padding: 8,
            borderRadius: '50%',
            background: tool === 'highlighter' ? '#f1f5f9' : 'transparent',
            border: 'none',
            color: tool === 'highlighter' ? '#0f172a' : '#64748b',
            cursor: 'pointer'
          }}
          title="Highlighter"
        >
          <Highlighter size={18} />
        </button>

        {/* Eraser Tool */}
        <button
          type="button"
          onClick={() => setTool('eraser')}
          style={{
            padding: 8,
            borderRadius: '50%',
            background: tool === 'eraser' ? '#f1f5f9' : 'transparent',
            border: 'none',
            color: tool === 'eraser' ? '#0f172a' : '#64748b',
            cursor: 'pointer'
          }}
          title="Eraser"
        >
          <Eraser size={18} />
        </button>

        {/* Clear Canvas */}
        <button
          type="button"
          onClick={clearCanvas}
          style={{
            padding: 8,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer'
          }}
          title="Clear Canvas"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
};
