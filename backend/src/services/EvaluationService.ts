import { Grid, GridData, EvaluationResult } from '../models/Grid';

export interface UpdateCellRequest {
  cellId: string;
  input: string;
}

export interface AddRowRequest {
  title?: string;
}

export interface AddColumnRequest {
  title?: string;
}

export interface UpdateHeaderRequest {
  index: number;
  title: string;
}

export interface DeleteRowRequest {
  index: number;
}

export interface DeleteColumnRequest {
  index: number;
}

export class EvaluationService {
  private grid: Grid;

  constructor(initialRows: number = 5, initialCols: number = 3) {
    this.grid = new Grid(initialRows, initialCols);
  }

  /**
   * Get current grid state
   */
  public getGrid(): GridData {
    return this.grid.toGridData();
  }

  /**
   * Update a cell's input
   */
  public updateCell(request: UpdateCellRequest): { success: boolean; error?: string; grid?: GridData } {
    const result = this.grid.setCellInput(request.cellId, request.input);
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      grid: this.grid.toGridData()
    };
  }

  /**
   * Evaluate the entire grid
   */
  public evaluateGrid(): EvaluationResult {
    return this.grid.evaluate();
  }

  /**
   * Add a new row
   */
  public addRow(request: AddRowRequest): { success: boolean; error?: string; grid?: GridData } {
    try {
      this.grid.addRow(request.title);
      return {
        success: true,
        grid: this.grid.toGridData()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error adding row'
      };
    }
  }

  /**
   * Add a new column
   */
  public addColumn(request: AddColumnRequest): { success: boolean; error?: string; grid?: GridData } {
    try {
      this.grid.addColumn(request.title);
      return {
        success: true,
        grid: this.grid.toGridData()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error adding column'
      };
    }
  }

  /**
   * Update row header
   */
  public updateRowHeader(request: UpdateHeaderRequest): { success: boolean; error?: string; grid?: GridData } {
    const result = this.grid.updateRowHeader(request.index, request.title);
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      grid: this.grid.toGridData()
    };
  }

  /**
   * Update column header
   */
  public updateColumnHeader(request: UpdateHeaderRequest): { success: boolean; error?: string; grid?: GridData } {
    const result = this.grid.updateColumnHeader(request.index, request.title);
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      grid: this.grid.toGridData()
    };
  }

  /**
   * Delete a row
   */
  public deleteRow(request: DeleteRowRequest): { success: boolean; error?: string; grid?: GridData } {
    const result = this.grid.deleteRow(request.index);
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      grid: this.grid.toGridData()
    };
  }

  /**
   * Delete a column
   */
  public deleteColumn(request: DeleteColumnRequest): { success: boolean; error?: string; grid?: GridData } {
    const result = this.grid.deleteColumn(request.index);
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      grid: this.grid.toGridData()
    };
  }

  /**
   * Reset grid to initial state
   */
  public resetGrid(rows: number = 5, cols: number = 3): { success: boolean; grid: GridData } {
    this.grid = new Grid(rows, cols);
    return {
      success: true,
      grid: this.grid.toGridData()
    };
  }

  /**
   * Load grid from data
   */
  public loadGrid(data: GridData): { success: boolean; error?: string; grid?: GridData } {
    try {
      this.grid = Grid.fromGridData(data);
      return {
        success: true,
        grid: this.grid.toGridData()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error loading grid'
      };
    }
  }

  /**
   * Get cell details
   */
  public getCellDetails(cellId: string): { success: boolean; cell?: any; error?: string } {
    const cell = this.grid.getCell(cellId);
    
    if (!cell) {
      return {
        success: false,
        error: `Cell ${cellId} not found`
      };
    }

    return {
      success: true,
      cell: cell.toJSON()
    };
  }

  /**
   * Validate a formula without applying it
   */
  public validateFormula(formula: string): { isValid: boolean; error?: string; dependencies?: string[] } {
    const validation = require('../models/FormulaParser').FormulaParser.validateFormula(formula);
    
    if (!validation.isValid) {
      return validation;
    }

    const dependencies = require('../models/FormulaParser').FormulaParser.extractCellReferences(formula);
    
    return {
      isValid: true,
      dependencies
    };
  }
}