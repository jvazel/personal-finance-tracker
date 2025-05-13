import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../../styles/dateRangePicker.css';

const DateRangePicker = ({ startDate, endDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleStartDateChange = (e) => {
    const newStartDate = new Date(e.target.value);
    onChange({ startDate: newStartDate, endDate });
  };

  const handleEndDateChange = (e) => {
    const newEndDate = new Date(e.target.value);
    onChange({ startDate, endDate: newEndDate });
  };

  const togglePicker = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="date-range-picker">
      <button 
        className="date-range-button" 
        onClick={togglePicker}
      >
        {format(startDate, 'dd/MM/yyyy', { locale: fr })} - {format(endDate, 'dd/MM/yyyy', { locale: fr })}
      </button>
      
      {isOpen && (
        <div className="date-range-dropdown">
          <div className="date-inputs">
            <div className="date-input-group">
              <label>Date de début</label>
              <input 
                type="date" 
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={handleStartDateChange}
              />
            </div>
            <div className="date-input-group">
              <label>Date de fin</label>
              <input 
                type="date" 
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={handleEndDateChange}
              />
            </div>
          </div>
          <div className="date-range-actions">
            <button 
              className="date-range-close" 
              onClick={togglePicker}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;