import React from 'react';
import { EvaluationResult } from '../types/index';

interface ErrorDisplayProps {
  evaluationResult: EvaluationResult;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ evaluationResult }) => {
  if (evaluationResult.success) {
    return null;
  }

  const { errors, circularReferences } = evaluationResult;

  return (
    <div className="error-display">
      <div className="error-header">
        <h3>⚠ Evaluation Errors</h3>
      </div>
      
      <div className="error-content">
        {circularReferences && circularReferences.length > 0 && (
          <div className="error-section">
            <h4>🔄 Circular References Detected:</h4>
            <ul className="error-list">
              {circularReferences.map((cellId, index) => (
                <li key={index} className="error-item circular-ref">
                  <strong>{cellId}</strong> - This cell is part of a circular reference chain
                </li>
              ))}
            </ul>
            <p className="error-help">
              Circular references occur when cells reference each other in a loop (e.g., A1 = B1, B1 = A1).
              Please check your formulas and remove the circular dependencies.
            </p>
          </div>
        )}

        {errors && errors.length > 0 && (
          <div className="error-section">
            <h4>❌ Formula Errors:</h4>
            <ul className="error-list">
              {errors.map((error, index) => (
                <li key={index} className="error-item formula-error">
                  <strong>{error.cellId}:</strong> {error.error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="error-actions">
        <button 
          className="dismiss-button"
          onClick={() => window.location.reload()}
        >
          Reset Grid
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;