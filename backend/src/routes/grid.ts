import { Router, Request, Response } from 'express';
import { EvaluationService } from '../services/EvaluationService';

const router = Router();
const evaluationService = new EvaluationService();

// Get current grid state
router.get('/', (req: Request, res: Response) => {
  try {
    const grid = evaluationService.getGrid();
    res.json({
      success: true,
      data: grid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a cell
router.put('/cell/:cellId', (req: Request, res: Response) => {
  try {
    const { cellId } = req.params;
    const { input } = req.body;

    if (typeof input !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Input must be a string'
      });
    }

    const result = evaluationService.updateCell({ cellId, input });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get cell details
router.get('/cell/:cellId', (req: Request, res: Response) => {
  try {
    const { cellId } = req.params;
    const result = evaluationService.getCellDetails(cellId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Evaluate the entire grid
router.post('/evaluate', (req: Request, res: Response) => {
  try {
    const result = evaluationService.evaluateGrid();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a new row
router.post('/row', (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const result = evaluationService.addRow({ title });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a new column
router.post('/column', (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const result = evaluationService.addColumn({ title });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update row header
router.put('/row/:index/header', (req: Request, res: Response) => {
  try {
    const index = parseInt(req.params.index);
    const { title } = req.body;

    if (isNaN(index)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid row index'
      });
    }

    if (typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Title must be a string'
      });
    }

    const result = evaluationService.updateRowHeader({ index, title });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update column header
router.put('/column/:index/header', (req: Request, res: Response) => {
  try {
    const index = parseInt(req.params.index);
    const { title } = req.body;

    if (isNaN(index)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid column index'
      });
    }

    if (typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Title must be a string'
      });
    }

    const result = evaluationService.updateColumnHeader({ index, title });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a row
router.delete('/row/:index', (req: Request, res: Response) => {
  try {
    const index = parseInt(req.params.index);

    if (isNaN(index)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid row index'
      });
    }

    const result = evaluationService.deleteRow({ index });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a column
router.delete('/column/:index', (req: Request, res: Response) => {
  try {
    const index = parseInt(req.params.index);

    if (isNaN(index)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid column index'
      });
    }

    const result = evaluationService.deleteColumn({ index });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reset grid
router.post('/reset', (req: Request, res: Response) => {
  try {
    const { rows = 5, cols = 3 } = req.body;
    const result = evaluationService.resetGrid(rows, cols);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate formula
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { formula } = req.body;

    if (typeof formula !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Formula must be a string'
      });
    }

    const result = evaluationService.validateFormula(formula);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;