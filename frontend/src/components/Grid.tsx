import React, { useState } from 'react';
import { GridProps } from '../types';
import Cell from './Cell';
import ErrorDisplay from './ErrorDisplay';

const Grid: React.FC<GridProps> = ({
  data,
  onCellUpdate,
  onAddRow,
  onAddColumn,
  onDeleteRow,
  onDeleteColumn,
  onUpdateRowHeader,
  onUpdateColumnHeader,
  onEvaluate,
  isLoading = false,
  evaluationResult
}) => {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editingHeader, setEditingHeader] = useState<{ type: 'row' | 'column'; index: number } | null>(null);
  const [headerEditValue, setHeaderEditValue] = useState('');

  const handleCellEdit = (cellId: string, newValue: string) => {
    setEditingCell(null);
    if (newValue !== data.cells.find(row => row.find(cell => cell.id === cellId))?.input) {
      onCellUpdate(cellId, newValue);
    }
  };

  const handleHeaderEdit = (type: 'row' | 'column', index: number, newValue: string) => {
    setEditingHeader(null);
    if (type === 'row') {
      onUpdateRowHeader(index, newValue);
    } else {
      onUpdateColumnHeader(index, newValue);
    }
  };

  const startHeaderEdit = (type: 'row' | 'column', index: number, currentValue: string) => {
    setEditingHeader({ type, index });
    setHeaderEditValue(currentValue);
  };

  const renderColumnHeaders = () => (
    <tr>
      <th className="corner-cell">
        <button 
          onClick={() => onAddRow()}
          className="add-button"
          title="Add Row"
        >
          +
        </button>
      </th>
      {data.columnHeaders.map((header, index) => (
        <th key={index} className="column-header">
          <div className="header-container">
            {editingHeader?.type === 'column' && editingHeader.index === index ? (
              <input
                type="text"
                value={headerEditValue}
                onChange={(e) => setHeaderEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleHeaderEdit('column', index, headerEditValue);
                  } else if (e.key === 'Escape') {
                    setEditingHeader(null);
                  }
                }}
                onBlur={() => handleHeaderEdit('column', index, headerEditValue)}
                className="header-input"
                autoFocus
              />
            ) : (
              <>
                <div 
                  onClick={() => startHeaderEdit('column', index, header)}
                  className="header-content"
                  title="Click to edit column header"
                >
                  {header}
                </div>
                {data.cols > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteColumn(index);
                    }}
                    className="delete-button"
                    title="Delete Column"
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        </th>
      ))}
      <th className="add-column-cell">
        <button 
          onClick={() => onAddColumn()}
          className="add-button"
          title="Add Column"
        >
          +
        </button>
      </th>
    </tr>
  );

  const renderRow = (rowIndex: number) => (
    <tr key={rowIndex}>
      <th className="row-header">
        <div className="header-container">
          {editingHeader?.type === 'row' && editingHeader.index === rowIndex ? (
            <input
              type="text"
              value={headerEditValue}
              onChange={(e) => setHeaderEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleHeaderEdit('row', rowIndex, headerEditValue);
                } else if (e.key === 'Escape') {
                  setEditingHeader(null);
                }
              }}
              onBlur={() => handleHeaderEdit('row', rowIndex, headerEditValue)}
              className="header-input"
              autoFocus
            />
          ) : (
            <>
              <div 
                onClick={() => startHeaderEdit('row', rowIndex, data.rowHeaders[rowIndex])}
                className="header-content"
                title="Click to edit row header"
              >
                {data.rowHeaders[rowIndex]}
              </div>
              {data.rows > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRow(rowIndex);
                  }}
                  className="delete-button"
                  title="Delete Row"
                >
                  ×
                </button>
              )}
            </>
          )}
        </div>
      </th>
      {data.cells[rowIndex]?.map((cell, colIndex) => (
        <Cell
          key={cell.id}
          cell={cell}
          isEditing={editingCell === cell.id}
          onStartEdit={() => setEditingCell(cell.id)}
          onFinishEdit={(newValue) => handleCellEdit(cell.id, newValue)}
          onCancelEdit={() => setEditingCell(null)}
        />
      ))}
      <td className="add-column-placeholder"></td>
    </tr>
  );

  return (
    <div className="grid-container">
      {/* Toolbar */}
      <div className="toolbar">
        <button 
          onClick={onEvaluate}
          disabled={isLoading}
          className="evaluate-button secondary-button"
        >
          {isLoading ? 'Evaluating...' : 'Re-evaluate All'}
        </button>
        
        <div className="toolbar-group">
          <button 
            onClick={() => onAddRow()}
            className="secondary-button"
          >
            Add Row
          </button>
          <button 
            onClick={() => onAddColumn()}
            className="secondary-button"
          >
            Add Column
          </button>
        </div>

        {evaluationResult && (
          <div className="evaluation-status">
            {evaluationResult.success ? (
              <span className="status-success">✓ Auto-evaluation active</span>
            ) : (
              <span className="status-error">
                ⚠ {evaluationResult.errors?.length || 0} error(s) found
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {evaluationResult && !evaluationResult.success && (
        <ErrorDisplay evaluationResult={evaluationResult} />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Evaluating...</div>
        </div>
      )}

      {/* Grid Table */}
      <div className="grid-wrapper">
        <table className="grid-table">
          <thead>
            {renderColumnHeaders()}
          </thead>
          <tbody>
            {Array.from({ length: data.rows }, (_, rowIndex) => renderRow(rowIndex))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h3>How to use:</h3>
        <ul>
          <li><strong>Enter values:</strong> Click a cell and type a number or text</li>
          <li><strong>Enter formulas:</strong> Start with = (e.g., =A1+B1, =A1*1.2)</li>
          <li><strong>Cell references:</strong> Use A1, B2, etc. to reference other cells</li>
          <li><strong>Operators:</strong> Use +, -, *, / for arithmetic</li>
          <li><strong>Headers:</strong> Click row/column headers to edit them</li>
          <li><strong>Auto-evaluation:</strong> Formulas calculate automatically as you type</li>
          <li><strong>Delete:</strong> Click the × button on headers to delete rows/columns</li>
        </ul>
      </div>
    </div>
  );
};

export default Grid;