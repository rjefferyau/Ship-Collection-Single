import React from 'react';
import ModalContainer from './ModalContainer';

interface ShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = ({ isOpen, onClose }) => {
  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      showCloseButton
      closeButtonText="Close"
    >
      <div className="px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Keyboard shortcuts</h3>
        <p className="text-sm text-gray-600 mb-4">Speed up common actions anywhere in the app.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Global</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><span className="font-mono bg-white border px-2 py-0.5 rounded shadow-sm">Ctrl</span> + <span className="font-mono bg-white border px-2 py-0.5 rounded shadow-sm">K</span> — Open command palette</li>
              <li><span className="font-mono bg-white border px-2 py-0.5 rounded shadow-sm">?</span> — Show this help</li>
              <li><span className="font-mono bg-white border px-2 py-0.5 rounded shadow-sm">Esc</span> — Close dialogs</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Item actions (when a row is selected)</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><span className="font-mono bg-white border px-2 py-0.5 rounded shadow-sm">W</span> — Toggle wishlist</li>
              <li><span className="font-mono bg-white border px-2 py-0.5 rounded shadow-sm">O</span> — Toggle owned</li>
              <li><span className="font-mono bg-white border px-2 py-0.5 rounded shadow-sm">R</span> — Toggle on order</li>
              <li><span className="font-mono bg-white border px-2 py-0.5 rounded shadow-sm">N</span> — Mark not owned</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Navigation</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>Use the command palette to switch view modes and jump to editions</li>
            </ul>
          </div>
        </div>
      </div>
    </ModalContainer>
  );
};

export default ShortcutsOverlay;
