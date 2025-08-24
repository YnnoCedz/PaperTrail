// src/components/Notification.jsx
import React from 'react';

const Notification = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  const color = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  }[type];

  return (
    <div className={`p-4 rounded shadow ${color} mb-4`}>
      <div className="flex justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="text-sm ml-4 underline">
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default Notification;
