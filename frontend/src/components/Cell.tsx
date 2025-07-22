import React, { useState, useEffect, useRef } from 'react';
import { CellProps } from '../types';

const Cell: React.FC<CellProps> = ({
  cell,
  isEditing,
  onStartEdit,
  onFinishEdit,
  onCancelEdit
}) => {
  const [editValue, setEditValue] = useState(cell.input);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(cell.input);
  }, [cell.input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onFinishEdit(editValue);
    } else if (e.key === 'Escape') {
      setEditValue(cell.input);
      onCancelEdit();
    }
  };

  const handleBlur = () => {
    onFinishEdit(editValue);
  };

  const displayValue = () => {
    if (cell.error) {
      return `#ERROR: ${cell.error}`;
    }
    
    if (cell.value === null || cell.value === undefined) {
      return '';
    }
    
    if (typeof cell.value === 'number') {
      // Format numbers nicely
      return cell.value.toLocaleString();
    }
    
    return String(cell.value);
  };

  const getCellClassName = () => {
    let className = 'cell';
    
    if (cell.error) {
      className += ' cell-error';
    } else if (cell.isFormula) {
      className += ' cell-formula';
    }
    
    // Add number alignment class for both direct numbers and formula results
    if (typeof cell.value === 'number') {
      className += ' cell-number';
    }
    
    if (isEditing) {
      className += ' cell-editing';
    }
    
    return className;
  };

  if (isEditing) {
    return (
      <td className={getCellClassName()}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="cell-input"
          placeholder="Enter value or formula (e.g., =A1+B1)"
        />
      </td>
    );
  }

  return (
    <td 
      className={getCellClassName()}
      onClick={onStartEdit}
      title={cell.isFormula ? `Formula: ${cell.input}` : undefined}
    >
      <div className="cell-content">
        {displayValue()}
      </div>
    </td>
  );
};

export default Cell;