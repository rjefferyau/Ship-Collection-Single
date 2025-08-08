import React, { useEffect, useMemo, useRef, useState } from 'react';
import ModalContainer from './ModalContainer';
import { Starship } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  starships: Starship[];
  onSelectStarship: (id: string) => void;
  onAction: (action: string, payload?: any) => void;
  currentEdition?: string;
}

const actions = (
  currentEdition?: string
): { id: string; label: string; section: string; payload?: any }[] => [
  { id: 'view:table', label: 'Switch to Table view', section: 'View' },
  { id: 'view:gallery', label: 'Switch to Gallery view', section: 'View' },
  { id: 'view:overview', label: 'Switch to Overview', section: 'View' },
  currentEdition ? { id: `jump:edition:${currentEdition}`, label: `Stay on ${currentEdition}`, section: 'Edition', payload: currentEdition } : undefined,
].filter(Boolean) as any;

const fuseLikeScore = (query: string, text: string) => {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const idx = t.indexOf(q);
  return idx === -1 ? Infinity : idx;
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, starships, onSelectStarship, onAction, currentEdition }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const items = useMemo(() => {
    const shipItems = (starships || []).slice(0, 200).map(s => ({
      id: `ship:${s._id}`,
      label: `${s.shipName} — Issue ${s.issue}`,
      section: 'Starships',
      payload: s._id
    }));

    const baseActions = actions(currentEdition);

    const list = [...baseActions, ...shipItems];

    if (!query) return list;

    return list
      .map(it => ({ ...it, score: fuseLikeScore(query, it.label) }))
      .filter(it => it.score !== Infinity)
      .sort((a, b) => (a.score as number) - (b.score as number));
  }, [starships, currentEdition, query]);

  const handleSelect = (item: any) => {
    if (item.id.startsWith('ship:')) {
      onSelectStarship(item.payload);
      onClose();
      return;
    }
    if (item.id.startsWith('view:')) {
      onAction(item.id);
      onClose();
      return;
    }
    if (item.id.startsWith('jump:edition:')) {
      onAction('jump:edition', item.payload);
      onClose();
      return;
    }
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} maxWidth="xl" showCloseButton>
      <div className="p-4">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or search ships..."
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />

        <div className="mt-3 max-h-96 overflow-auto divide-y">
          {items.map((item) => (
            <button
              key={item.id}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={() => handleSelect(item)}
            >
              <div className="text-sm text-gray-900">{item.label}</div>
              <div className="text-xs text-gray-500">{item.section}</div>
            </button>
          ))}
          {items.length === 0 && (
            <div className="px-3 py-6 text-sm text-gray-500">No results</div>
          )}
        </div>
      </div>
    </ModalContainer>
  );
};

export default CommandPalette;
