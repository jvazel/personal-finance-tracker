import React from 'react';
import Modal from '../common/Modal';

const NoteModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Note: ${transaction.description}`}
    >
      <div className="note-content">
        {transaction.note}
      </div>
    </Modal>
  );
};

export default NoteModal;