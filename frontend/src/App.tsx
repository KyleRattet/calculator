import { useState, useEffect } from 'react';
import axios from 'axios';
import Grid from './components/Grid';
import { GridData, EvaluationResult, ApiResponse } from './types';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize grid on component mount
  useEffect(() => {
    loadInitialGrid();
  }, []);

  const loadInitialGrid = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<ApiResponse<GridData>>(`${API_BASE}/api/grid`);
      
      if (response.data.success && response.data.data) {
        setGridData(response.data.data);
        setError(null);
      } else {
        setError('Failed to load initial grid');
      }
    } catch (err) {
      console.error('Error loading initial grid:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellUpdate = async (cellId: string, input: string) => {
    if (!gridData) return;

    try {
      const response = await axios.put<ApiResponse>(`${API_BASE}/api/grid/cell/${cellId}`, {
        input
      });

      if (response.data.success && response.data.grid) {
        setGridData(response.data.grid);
        setError(null);
        // Auto-evaluate after cell update
        await handleEvaluate();
      } else {
        setError(response.data.error || 'Failed to update cell');
      }
    } catch (err) {
      console.error('Error updating cell:', err);
      setError('Failed to update cell');
    }
  };

  const handleEvaluate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post<EvaluationResult>(`${API_BASE}/api/grid/evaluate`);
      
      setEvaluationResult(response.data);
      
      if (response.data.success && response.data.grid) {
        setGridData(response.data.grid);
      }
    } catch (err) {
      console.error('Error evaluating grid:', err);
      setError('Failed to evaluate grid');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-evaluate on initial load
  useEffect(() => {
    if (gridData && !evaluationResult) {
      handleEvaluate();
    }
  }, [gridData]);

  const handleAddRow = async (title?: string) => {
    try {
      const response = await axios.post<ApiResponse>(`${API_BASE}/api/grid/row`, {
        title
      });

      if (response.data.success && response.data.grid) {
        setGridData(response.data.grid);
        setError(null);
        // Auto-evaluate after adding row
        await handleEvaluate();
      } else {
        setError(response.data.error || 'Failed to add row');
      }
    } catch (err) {
      console.error('Error adding row:', err);
      setError('Failed to add row');
    }
  };

  const handleAddColumn = async (title?: string) => {
    try {
      const response = await axios.post<ApiResponse>(`${API_BASE}/api/grid/column`, {
        title
      });

      if (response.data.success && response.data.grid) {
        setGridData(response.data.grid);
        setError(null);
        // Auto-evaluate after adding column
        await handleEvaluate();
      } else {
        setError(response.data.error || 'Failed to add column');
      }
    } catch (err) {
      console.error('Error adding column:', err);
      setError('Failed to add column');
    }
  };

  const handleUpdateRowHeader = async (index: number, title: string) => {
    try {
      const response = await axios.put<ApiResponse>(`${API_BASE}/api/grid/row/${index}/header`, {
        title
      });

      if (response.data.success && response.data.grid) {
        setGridData(response.data.grid);
        setError(null);
      } else {
        setError(response.data.error || 'Failed to update row header');
      }
    } catch (err) {
      console.error('Error updating row header:', err);
      setError('Failed to update row header');
    }
  };

  const handleUpdateColumnHeader = async (index: number, title: string) => {
    try {
      const response = await axios.put<ApiResponse>(`${API_BASE}/api/grid/column/${index}/header`, {
        title
      });

      if (response.data.success && response.data.grid) {
        setGridData(response.data.grid);
        setError(null);
      } else {
        setError(response.data.error || 'Failed to update column header');
      }
    } catch (err) {
      console.error('Error updating column header:', err);
      setError('Failed to update column header');
    }
  };

  const handleDeleteRow = async (index: number) => {
    try {
      const response = await axios.delete<ApiResponse>(`${API_BASE}/api/grid/row/${index}`);

      if (response.data.success && response.data.grid) {
        setGridData(response.data.grid);
        setError(null);
        // Auto-evaluate after deleting row
        await handleEvaluate();
      } else {
        setError(response.data.error || 'Failed to delete row');
      }
    } catch (err) {
      console.error('Error deleting row:', err);
      setError('Failed to delete row');
    }
  };

  const handleDeleteColumn = async (index: number) => {
    try {
      const response = await axios.delete<ApiResponse>(`${API_BASE}/api/grid/column/${index}`);

      if (response.data.success && response.data.grid) {
        setGridData(response.data.grid);
        setError(null);
        // Auto-evaluate after deleting column
        await handleEvaluate();
      } else {
        setError(response.data.error || 'Failed to delete column');
      }
    } catch (err) {
      console.error('Error deleting column:', err);
      setError('Failed to delete column');
    }
  };

  if (!gridData && !error) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">Loading Calculator...</div>
      </div>
    );
  }

  if (error && !gridData) {
    return (
      <div className="app-error">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button onClick={loadInitialGrid} className="retry-button">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Calculator</h1>
      </header>

      {error && (
        <div className="app-error-banner">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="dismiss-error">×</button>
        </div>
      )}

      <main className="app-main">
        {gridData && (
          <Grid
            data={gridData}
            onCellUpdate={handleCellUpdate}
            onAddRow={handleAddRow}
            onAddColumn={handleAddColumn}
            onDeleteRow={handleDeleteRow}
            onDeleteColumn={handleDeleteColumn}
            onUpdateRowHeader={handleUpdateRowHeader}
            onUpdateColumnHeader={handleUpdateColumnHeader}
            onEvaluate={handleEvaluate}
            isLoading={isLoading}
            evaluationResult={evaluationResult}
          />
        )}
      </main>
    </div>
  );
}

export default App;