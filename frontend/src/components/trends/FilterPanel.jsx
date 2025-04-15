import React from 'react';
import DatePicker from 'react-datepicker';
import { fr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

const FilterPanel = ({
  timeframe,
  setTimeframe,
  selectedDate,
  setSelectedDate,
  categories,
  selectedCategories,
  handleCategoryChange,
  toggleAllCategories
}) => {
  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3>Période</h3>
        <div className="timeframe-buttons">
          <button 
            className={`timeframe-button ${timeframe === 'week' ? 'active' : ''}`}
            onClick={() => setTimeframe('week')}
          >
            Semaine
          </button>
          <button 
            className={`timeframe-button ${timeframe === 'month' ? 'active' : ''}`}
            onClick={() => setTimeframe('month')}
          >
            Mois
          </button>
          <button 
            className={`timeframe-button ${timeframe === 'quarter' ? 'active' : ''}`}
            onClick={() => setTimeframe('quarter')}
          >
            Trimestre
          </button>
          <button 
            className={`timeframe-button ${timeframe === 'year' ? 'active' : ''}`}
            onClick={() => setTimeframe('year')}
          >
            Année
          </button>
        </div>
      </div>
      
      <div className="filter-section">
        <h3>Date</h3>
        <DatePicker
          selected={selectedDate}
          onChange={date => setSelectedDate(date)}
          locale={fr}
          dateFormat={
            timeframe === 'week' ? 'dd/MM/yyyy' :
            timeframe === 'month' ? 'MM/yyyy' :
            timeframe === 'quarter' ? 'QQQ yyyy' :
            'yyyy'
          }
          showMonthYearPicker={timeframe === 'month'}
          showQuarterYearPicker={timeframe === 'quarter'}
          showYearPicker={timeframe === 'year'}
          className="date-picker"
        />
      </div>
      
      <div className="filter-section">
        <div className="filter-header">
          <h3>Catégories</h3>
          <button 
            className="toggle-all-button"
            onClick={toggleAllCategories}
          >
            {selectedCategories.length === categories.length ? 'Désélectionner tout' : 'Sélectionner tout'}
          </button>
        </div>
        <div className="categories-list">
          {categories.map(category => (
            <div key={category._id} className="category-checkbox">
              <input
                type="checkbox"
                id={`category-${category._id}`}
                checked={selectedCategories.includes(category._id)}
                onChange={() => handleCategoryChange(category._id)}
              />
              <label htmlFor={`category-${category._id}`} style={{ color: category.color }}>
                {category.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;