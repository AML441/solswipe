import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="bg-white w-auto p-6 rounded-xl shadow-xl"
          onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default Modal;
