// frontend/src/components/Settings.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Categories from './Categories';

const Settings = () => {
  return (
    <div className="settings-container">
      <Routes>
        <Route path="/" element={<Navigate to="/settings/categories" replace />} />
        <Route path="/categories" element={<Categories />} />
      </Routes>
    </div>
  );
};

export default Settings;