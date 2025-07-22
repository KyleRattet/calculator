import { Cell, CellData } from './Cell';
import { FormulaParser } from '../services/FormulaParser';

export interface GridData {
  cells: CellData[][];
  rowHeaders: string[];
  columnHeaders: string[];
  rows: number;
  cols: number;
}

export interface EvaluationResult {
  success: boolean;
  grid: GridData;
  errors: { cellId: string; error: string }[];
  circularReferences?: string[];
}

export class Grid {
  private cells: Map<string, Cell> = new Map();
  private rowHeaders: string[] = [];
  private columnHeaders: string[] = [];
  public rows: number;
  public cols: number;
  
  // For cycle detection
  private visitedCells = new Set<string>();
  private recursionStack = new Set<string>();

  constructor(rows: number = 5, cols: number = 3) {
    this.rows = rows;
    this.cols = cols;
    this.initializeGrid();
  }

  private initializeGrid(): void {
    // Initialize column headers (A, B, C, ...)
    this.columnHeaders = [];
    for (let col = 0; col < this.cols; col++) {
      this.columnHeaders.push(String.fromCharCode(65 + col));
    }

    // Initialize row headers (1, 2, 3, ...)
    this.rowHeaders = [];
    for (let row = 0; row < this.rows; row++) {
      this.rowHeaders.push((row + 1).toString());
    }

    // Initialize cells
    this.cells.clear();
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = new Cell(row, col);
        this.cells.set(cell.id, cell);
      }
    }
  }

  /**
   * Add a new row
   */
  public addRow(title?: string): void {
    const newRowIndex = this.rows;
    this.rows++;
    
    // Add row header
    this.rowHeaders.push(title || (newRowIndex + 1).toString());

    // Create new cells for the row
    for (let col = 0; col < this.cols; col++) {
      const cell = new Cell(newRowIndex, col);
      this.cells.set(cell.id, cell);
    }
  }

  /**
   * Delete a row
   */
  public deleteRow(rowIndex: number): { success: boolean; error?: string } {
    if (rowIndex < 0 || rowIndex >= this.rows) {
      return { success: false, error: 'Row index out of bounds' };
    }

    if (this.rows <= 1) {
      return { success: false, error: 'Cannot delete the last row' };
    }

    // Remove cells from the deleted row
    for (let col = 0; col < this.cols; col++) {
      const cellId = Cell.coordinateToId(rowIndex, col);
      const cell = this.cells.get(cellId);
      if (cell) {
        this.clearCellDependencies(cell);
        this.cells.delete(cellId);
      }
    }

    // Remove row header
    this.rowHeaders.splice(rowIndex, 1);
    this.rows--;

    // Update all cells below the deleted row
    this.updateCellsAfterRowDeletion(rowIndex);

    return { success: true };
  }

  /**
   * Add a new column
   */
  public addColumn(title?: string): void {
    const newColIndex = this.cols;
    this.cols++;

    // Add column header
    if (newColIndex < 26) { // Support up to Z
      this.columnHeaders.push(title || String.fromCharCode(65 + newColIndex));
    } else {
      throw new Error('Maximum 26 columns supported (A-Z)');
    }

    // Create new cells for the column
    for (let row = 0; row < this.rows; row++) {
      const cell = new Cell(row, newColIndex);
      this.cells.set(cell.id, cell);
    }
  }

  /**
   * Delete a column
   */
  public deleteColumn(colIndex: number): { success: boolean; error?: string } {
    if (colIndex < 0 || colIndex >= this.cols) {
      return { success: false, error: 'Column index out of bounds' };
    }

    if (this.cols <= 1) {
      return { success: false, error: 'Cannot delete the last column' };
    }

    // Remove cells from the deleted column
    for (let row = 0; row < this.rows; row++) {
      const cellId = Cell.coordinateToId(row, colIndex);
      const cell = this.cells.get(cellId);
      if (cell) {
        this.clearCellDependencies(cell);
        this.cells.delete(cellId);
      }
    }

    // Remove column header
    this.columnHeaders.splice(colIndex, 1);
    this.cols--;

    // Update all cells to the right of the deleted column
    this.updateCellsAfterColumnDeletion(colIndex);

    return { success: true };
  }

  /**
   * Set cell value or formula
   */
  public setCellInput(cellId: string, input: string): { success: boolean; error?: string } {
    const cell = this.cells.get(cellId);
    if (!cell) {
      return { success: false, error: `Cell ${cellId} not found` };
    }

    // Clear previous dependencies
    this.clearCellDependencies(cell);

    // Update cell input
    cell.updateInput(input);

    return { success: true };
  }

  /**
   * Get cell by ID
   */
  public getCell(cellId: string): Cell | undefined {
    return this.cells.get(cellId);
  }

  /**
   * Evaluate all cells in the grid
   */
  public evaluate(): EvaluationResult {
    const errors: { cellId: string; error: string }[] = [];
    
    // Reset all cell values and dependencies
    this.resetEvaluation();

    // Build dependency graph
    this.buildDependencyGraph();

    // Check for circular references
    const circularRefs = this.detectCircularReferences();
    if (circularRefs.length > 0) {
      // Mark circular reference cells as errors
      circularRefs.forEach(cellId => {
        const cell = this.cells.get(cellId);
        if (cell) {
          cell.setError('Circular reference detected');
          errors.push({ cellId, error: 'Circular reference detected' });
        }
      });
    }

    // Evaluate non-circular cells
    for (const [cellId, cell] of this.cells) {
      if (!circularRefs.includes(cellId)) {
        const result = this.evaluateCell(cell);
        if (!result.success) {
          errors.push({ cellId, error: result.error || 'Unknown error' });
        }
      }
    }

    return {
      success: errors.length === 0,
      grid: this.toGridData(),
      errors,
      circularReferences: circularRefs.length > 0 ? circularRefs : undefined
    };
  }

  /**
   * Build dependency graph for all formula cells
   */
  private buildDependencyGraph(): void {
    for (const [cellId, cell] of this.cells) {
      if (cell.isFormula) {
        const dependencies = FormulaParser.extractCellReferences(cell.input);
        
        cell.clearDependencies();
        
        for (const depId of dependencies) {
          // Validate dependency exists and is within bounds
          if (FormulaParser.isValidCellReference(depId, this.rows, this.cols)) {
            cell.addDependency(depId);
            
            // Add reverse dependency
            const depCell = this.cells.get(depId);
            if (depCell) {
              depCell.addDependent(cellId);
            }
          }
        }
      }
    }
  }

  /**
   * Detect circular references using DFS
   */
  private detectCircularReferences(): string[] {
    const circularRefs: string[] = [];
    this.visitedCells.clear();
    this.recursionStack.clear();

    for (const [cellId] of this.cells) {
      if (!this.visitedCells.has(cellId)) {
        const cycle = this.dfsCircularCheck(cellId);
        if (cycle.length > 0) {
          circularRefs.push(...cycle);
        }
      }
    }

    return [...new Set(circularRefs)]; // Remove duplicates
  }

  /**
   * DFS helper for circular reference detection
   */
  private dfsCircularCheck(cellId: string): string[] {
    this.visitedCells.add(cellId);
    this.recursionStack.add(cellId);

    const cell = this.cells.get(cellId);
    if (!cell) return [];

    for (const depId of cell.dependencies) {
      if (!this.visitedCells.has(depId)) {
        const cycle = this.dfsCircularCheck(depId);
        if (cycle.length > 0) {
          return cycle;
        }
      } else if (this.recursionStack.has(depId)) {
        // Found a cycle - return all cells in the cycle
        return [cellId, depId];
      }
    }

    this.recursionStack.delete(cellId);
    return [];
  }

  /**
   * Evaluate a single cell
   */
  private evaluateCell(cell: Cell): { success: boolean; error?: string } {
    if (cell.error) {
      return { success: false, error: cell.error };
    }

    if (!cell.isFormula) {
      // Handle literal value
      const result = FormulaParser.parseLiteralValue(cell.input);
      if (result.error) {
        cell.setError(result.error);
        return { success: false, error: result.error };
      }
      cell.setValue(result.value);
      return { success: true };
    }

    // Handle formula
    const cellValues = new Map<string, number | string>();
    
    // First, ensure all dependencies are evaluated
    for (const depId of cell.dependencies) {
      const depCell = this.cells.get(depId);
      if (!depCell) {
        const error = `Dependency ${depId} not found`;
        cell.setError(error);
        return { success: false, error };
      }

      // Recursively evaluate dependency if not already evaluated
      if (depCell.value === null && !depCell.error) {
        const depResult = this.evaluateCell(depCell);
        if (!depResult.success) {
          const error = `Dependency ${depId} evaluation failed: ${depResult.error}`;
          cell.setError(error);
          return { success: false, error };
        }
      }

      if (depCell.error) {
        const error = `Dependency ${depId} has error: ${depCell.error}`;
        cell.setError(error);
        return { success: false, error };
      }

      if (depCell.value !== null) {
        cellValues.set(depId, depCell.value);
      }
    }

    // Evaluate the formula
    const result = FormulaParser.evaluateFormula(cell.input, cellValues);
    if (result.error) {
      cell.setError(result.error);
      return { success: false, error: result.error };
    }

    cell.setValue(result.result);
    return { success: true };
  }

  /**
   * Clear cell dependencies and dependents
   */
  private clearCellDependencies(cell: Cell): void {
    // Remove this cell from its dependencies' dependent lists
    for (const depId of cell.dependencies) {
      const depCell = this.cells.get(depId);
      if (depCell) {
        depCell.dependents = depCell.dependents.filter(id => id !== cell.id);
      }
    }

    // Remove this cell from its dependents' dependency lists
    for (const depId of cell.dependents) {
      const depCell = this.cells.get(depId);
      if (depCell) {
        depCell.dependencies = depCell.dependencies.filter(id => id !== cell.id);
      }
    }

    cell.clearDependencies();
    cell.clearDependents();
  }

  /**
   * Reset evaluation state
   */
  private resetEvaluation(): void {
    for (const [, cell] of this.cells) {
      if (cell.isFormula) {
        cell.value = null;
        cell.error = null;
      }
      // Clear dependency relationships
      cell.clearDependents();
    }
  }

  /**
   * Convert grid to serializable format
   */
  public toGridData(): GridData {
    const cellMatrix: CellData[][] = [];
    
    for (let row = 0; row < this.rows; row++) {
      const rowData: CellData[] = [];
      for (let col = 0; col < this.cols; col++) {
        const cellId = Cell.coordinateToId(row, col);
        const cell = this.cells.get(cellId);
        if (cell) {
          rowData.push(cell.toJSON());
        } else {
          // Fallback cell data
          const fallbackCell = new Cell(row, col);
          rowData.push(fallbackCell.toJSON());
        }
      }
      cellMatrix.push(rowData);
    }

    return {
      cells: cellMatrix,
      rowHeaders: [...this.rowHeaders],
      columnHeaders: [...this.columnHeaders],
      rows: this.rows,
      cols: this.cols
    };
  }

  /**
   * Load grid from data
   */
  public static fromGridData(data: GridData): Grid {
    const grid = new Grid(data.rows, data.cols);
    grid.rowHeaders = [...data.rowHeaders];
    grid.columnHeaders = [...data.columnHeaders];

    // Load cell data
    for (let row = 0; row < data.rows; row++) {
      for (let col = 0; col < data.cols; col++) {
        if (data.cells[row] && data.cells[row][col]) {
          const cellData = data.cells[row][col];
          const cell = grid.cells.get(cellData.id);
          if (cell && cellData.input) {
            cell.updateInput(cellData.input);
          }
        }
      }
    }

    return grid;
  }

  /**
   * Update row header
   */
  public updateRowHeader(index: number, title: string): { success: boolean; error?: string } {
    if (index < 0 || index >= this.rows) {
      return { success: false, error: 'Row index out of bounds' };
    }
    this.rowHeaders[index] = title;
    return { success: true };
  }

  /**
   * Update column header
   */
  public updateColumnHeader(index: number, title: string): { success: boolean; error?: string } {
    if (index < 0 || index >= this.cols) {
      return { success: false, error: 'Column index out of bounds' };
    }
    this.columnHeaders[index] = title;
    return { success: true };
  }

  /**
   * Update cells after row deletion - shift all cells up
   */
  private updateCellsAfterRowDeletion(deletedRowIndex: number): void {
    const cellsToUpdate = new Map<string, Cell>();

    // Collect cells that need to be moved
    for (let row = deletedRowIndex + 1; row < this.rows + 1; row++) {
      for (let col = 0; col < this.cols; col++) {
        const oldCellId = Cell.coordinateToId(row, col);
        const cell = this.cells.get(oldCellId);
        if (cell) {
          // Update cell coordinates
          cell.coordinate.row = row - 1;
          cell.id = Cell.coordinateToId(row - 1, col);
          
          // Update formulas that reference moved cells
          this.updateFormulasAfterRowDeletion(cell, deletedRowIndex);
          
          cellsToUpdate.set(cell.id, cell);
          this.cells.delete(oldCellId);
        }
      }
    }

    // Add updated cells back to the map
    for (const [id, cell] of cellsToUpdate) {
      this.cells.set(id, cell);
    }

    // Update all formulas to account for deleted row
    this.updateAllFormulasAfterRowDeletion(deletedRowIndex);
  }

  /**
   * Update cells after column deletion - shift all cells left
   */
  private updateCellsAfterColumnDeletion(deletedColIndex: number): void {
    const cellsToUpdate = new Map<string, Cell>();

    // Collect cells that need to be moved
    for (let row = 0; row < this.rows; row++) {
      for (let col = deletedColIndex + 1; col < this.cols + 1; col++) {
        const oldCellId = Cell.coordinateToId(row, col);
        const cell = this.cells.get(oldCellId);
        if (cell) {
          // Update cell coordinates
          cell.coordinate.col = col - 1;
          cell.id = Cell.coordinateToId(row, col - 1);
          
          // Update formulas that reference moved cells
          this.updateFormulasAfterColumnDeletion(cell, deletedColIndex);
          
          cellsToUpdate.set(cell.id, cell);
          this.cells.delete(oldCellId);
        }
      }
    }

    // Add updated cells back to the map
    for (const [id, cell] of cellsToUpdate) {
      this.cells.set(id, cell);
    }

    // Update all formulas to account for deleted column
    this.updateAllFormulasAfterColumnDeletion(deletedColIndex);
  }

  /**
   * Update formulas after row deletion
   */
  private updateFormulasAfterRowDeletion(cell: Cell, deletedRowIndex: number): void {
    if (!cell.isFormula) return;

    let updatedFormula = cell.input;
    const cellRefs = FormulaParser.extractCellReferences(cell.input);

    for (const ref of cellRefs) {
      const coord = Cell.idToCoordinate(ref);
      if (coord.row > deletedRowIndex) {
        // Update reference to shifted cell
        const newRef = Cell.coordinateToId(coord.row - 1, coord.col);
        updatedFormula = updatedFormula.replace(new RegExp(`\\b${ref}\\b`, 'g'), newRef);
      } else if (coord.row === deletedRowIndex) {
        // Reference to deleted cell - mark as error
        cell.setError(`Reference to deleted cell: ${ref}`);
        return;
      }
    }

    if (updatedFormula !== cell.input) {
      cell.updateInput(updatedFormula);
    }
  }

  /**
   * Update formulas after column deletion
   */
  private updateFormulasAfterColumnDeletion(cell: Cell, deletedColIndex: number): void {
    if (!cell.isFormula) return;

    let updatedFormula = cell.input;
    const cellRefs = FormulaParser.extractCellReferences(cell.input);

    for (const ref of cellRefs) {
      const coord = Cell.idToCoordinate(ref);
      if (coord.col > deletedColIndex) {
        // Update reference to shifted cell
        const newRef = Cell.coordinateToId(coord.row, coord.col - 1);
        updatedFormula = updatedFormula.replace(new RegExp(`\\b${ref}\\b`, 'g'), newRef);
      } else if (coord.col === deletedColIndex) {
        // Reference to deleted cell - mark as error
        cell.setError(`Reference to deleted cell: ${ref}`);
        return;
      }
    }

    if (updatedFormula !== cell.input) {
      cell.updateInput(updatedFormula);
    }
  }

  /**
   * Update all formulas in the grid after row deletion
   */
  private updateAllFormulasAfterRowDeletion(deletedRowIndex: number): void {
    for (const [, cell] of this.cells) {
      if (cell.isFormula && !cell.error) {
        this.updateFormulasAfterRowDeletion(cell, deletedRowIndex);
      }
    }
  }

  /**
   * Update all formulas in the grid after column deletion
   */
  private updateAllFormulasAfterColumnDeletion(deletedColIndex: number): void {
    for (const [, cell] of this.cells) {
      if (cell.isFormula && !cell.error) {
        this.updateFormulasAfterColumnDeletion(cell, deletedColIndex);
      }
    }
  }
}