/**
 * WidgetGrid — Dashboard kéo thả widget (Customizable Grid Dashboard).
 * Lưu layout vào localStorage per-user.
 */
import { useState, useEffect, useCallback } from 'react';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';

const STORAGE_KEY = 'edusmart-widget-layout';

const loadLayout = (userId) => {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};

const saveLayout = (userId, layout) => {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(layout));
  } catch { /* ignore */ }
};

export default function WidgetGrid({ userId, widgets = [], defaultLayout = [] }) {
  const [layout, setLayout] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  // Load layout from localStorage or use default
  useEffect(() => {
    const saved = loadLayout(userId);
    if (saved && saved.length > 0) {
      setLayout(saved);
    } else {
      setLayout(defaultLayout.length > 0 ? defaultLayout : widgets.map((w, i) => ({
        id: w.id,
        size: w.defaultSize || 'medium',
        order: i,
      })));
    }
  }, [userId, widgets, defaultLayout]);

  // Save layout on change
  useEffect(() => {
    if (layout.length > 0 && userId) {
      saveLayout(userId, layout);
    }
  }, [layout, userId]);

  const handleDragStart = (e, idx) => {
    setDragging(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragging === null || dragging === idx) return;

    const newLayout = [...layout];
    const draggedItem = newLayout[dragging];
    newLayout.splice(dragging, 1);
    newLayout.splice(idx, 0, draggedItem);
    setLayout(newLayout);
    setDragging(idx);
  };

  const handleDragEnd = () => setDragging(null);

  const toggleCollapse = (id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const cycleSize = (idx) => {
    const sizes = ['small', 'medium', 'large', 'full'];
    const newLayout = [...layout];
    const currentSize = newLayout[idx].size || 'medium';
    const nextIdx = (sizes.indexOf(currentSize) + 1) % sizes.length;
    newLayout[idx] = { ...newLayout[idx], size: sizes[nextIdx] };
    setLayout(newLayout);
  };

  const removeWidget = (idx) => {
    const newLayout = layout.filter((_, i) => i !== idx);
    setLayout(newLayout);
  };

  const sizeClass = (size) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-1 md:col-span-2';
      case 'large': return 'col-span-1 md:col-span-3';
      case 'full': return 'col-span-1 md:col-span-4';
      default: return 'col-span-1 md:col-span-2';
    }
  };

  const widgetMap = {};
  widgets.forEach((w) => { widgetMap[w.id] = w; });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {layout.map((item, idx) => {
        const widget = widgetMap[item.id];
        if (!widget) return null;
        const isCollapsed = collapsed[item.id];

        return (
          <div
            key={item.id}
            className={`${sizeClass(item.size)} bg-white rounded-lg border shadow-sm transition-all ${
              dragging === idx ? 'opacity-50 ring-2 ring-teal-400' : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
          >
            {/* Widget Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-slate-50 rounded-t-lg cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2 min-w-0">
                <GripVertical size={14} className="text-slate-300 shrink-0" />
                {widget.icon && <widget.icon size={16} className="text-teal-500 shrink-0" />}
                <h3 className="text-sm font-semibold text-slate-700 truncate">{widget.title}</h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => cycleSize(idx)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-400"
                  title="Đổi kích thước"
                >
                  {isCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                </button>
                <button
                  onClick={() => toggleCollapse(item.id)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-400"
                  title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                >
                  {isCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                </button>
                <button
                  onClick={() => removeWidget(idx)}
                  className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500"
                  title="Xóa widget"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Widget Body */}
            {!isCollapsed && (
              <div className="p-4">
                {widget.component}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
