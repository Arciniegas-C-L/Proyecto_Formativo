import React from 'react';
import "../../assets/css/SinglePage/Footer.css";
import "../../assets/css/SinglePage/FooterModal.css";

export default function FooterModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="footer-modal-overlay" onClick={onClose}>
      <div className="footer-modal" onClick={e => e.stopPropagation()}>
        <button className="footer-modal-close" onClick={onClose}>&times;</button>
        <h2 className="footer-modal-title">{title}</h2>
        <div className="footer-modal-content">{children}</div>
      </div>
    </div>
  );
}