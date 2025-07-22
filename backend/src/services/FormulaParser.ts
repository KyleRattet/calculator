import { Cell } from '../models/Cell';

export class FormulaParser {
  // Regex to match cell references like A1, B2, Z99
  private static readonly CELL_REFERENCE_REGEX = /\b[A-Z][1-9][0-9]*\b/g;
  
  // Regex to validate basic arithmetic expressions
  private static readonly ARITHMETIC_REGEX = /^[A-Z0-9\s\+\-\*\/\(\)\.]+$/;

  /**
   * Extract all cell references from a formula
   */
  public static extractCellReferences(formula: string): string[] {
    if (!formula.startsWith('=')) {
      return [];
    }

    const expression = formula.slice(1); // Remove the '=' prefix
    const matches = expression.match(this.CELL_REFERENCE_REGEX);
    return matches ? [...new Set(matches)] : []; // Remove duplicates
  }

  /**
   * Validate formula syntax
   */
  public static validateFormula(formula: string): { isValid: boolean; error?: string } {
    if (!formula.startsWith('=')) {
      return { isValid: false, error: 'Formula must start with =' };
    }

    const expression = formula.slice(1);
    
    if (expression.trim() === '') {
      return { isValid: false, error: 'Formula cannot be empty' };
    }

    // Basic syntax validation
    if (!this.ARITHMETIC_REGEX.test(expression)) {
      return { isValid: false, error: 'Formula contains invalid characters' };
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of expression) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) {
        return { isValid: false, error: 'Mismatched parentheses' };
      }
    }

    if (parenCount !== 0) {
      return { isValid: false, error: 'Unbalanced parentheses' };
    }

    return { isValid: true };
  }

  /**
   * Evaluate a formula given cell values
   */
  public static evaluateFormula(
    formula: string, 
    cellValues: Map<string, number | string>
  ): { result: number | string | null; error?: string } {
    try {
      if (!formula.startsWith('=')) {
        return { result: null, error: 'Formula must start with =' };
      }

      const validation = this.validateFormula(formula);
      if (!validation.isValid) {
        return { result: null, error: validation.error };
      }

      let expression = formula.slice(1); // Remove '=' prefix

      // Replace cell references with their values
      const cellRefs = this.extractCellReferences(formula);
      
      for (const cellRef of cellRefs) {
        const cellValue = cellValues.get(cellRef);
        
        if (cellValue === undefined || cellValue === null) {
          return { result: null, error: `Cell ${cellRef} is empty or undefined` };
        }

        if (typeof cellValue === 'string') {
          return { result: null, error: `Cell ${cellRef} contains non-numeric value: ${cellValue}` };
        }

        // Replace all instances of this cell reference
        const regex = new RegExp(`\\b${cellRef}\\b`, 'g');
        expression = expression.replace(regex, cellValue.toString());
      }

      // Evaluate the mathematical expression
      const result = this.evaluateExpression(expression);
      
      if (isNaN(result) || !isFinite(result)) {
        return { result: null, error: 'Formula evaluation resulted in invalid number' };
      }

      return { result };

    } catch (error) {
      return { result: null, error: `Formula evaluation error: ${error}` };
    }
  }

  /**
   * Safely evaluate a mathematical expression
   * Note: In a production app, you'd want to use a proper expression parser
   * For this demo, we'll use a simple eval with safety checks
   */
  private static evaluateExpression(expression: string): number {
    // Additional safety: only allow numbers, basic operators, and parentheses
    const safeExpression = expression.replace(/[^0-9\+\-\*\/\(\)\.\s]/g, '');
    
    if (safeExpression !== expression) {
      throw new Error('Expression contains unsafe characters');
    }

    // Use Function constructor instead of eval for slightly better safety
    try {
      const result = new Function(`"use strict"; return (${expression})`)();
      return Number(result);
    } catch (error) {
      throw new Error(`Invalid expression: ${expression}`);
    }
  }

  /**
   * Parse a literal value (non-formula)
   */
  public static parseLiteralValue(input: string): { value: number | string; error?: string } {
    if (input.trim() === '') {
      return { value: '' };
    }

    // Try to parse as number
    const numValue = parseFloat(input);
    if (!isNaN(numValue) && isFinite(numValue)) {
      return { value: numValue };
    }

    // Return as string
    return { value: input };
  }

  /**
   * Check if a cell reference is valid (within bounds)
   */
  public static isValidCellReference(cellRef: string, maxRows: number, maxCols: number): boolean {
    try {
      const coord = Cell.idToCoordinate(cellRef);
      return coord.row >= 0 && 
             coord.row < maxRows && 
             coord.col >= 0 && 
             coord.col < maxCols;
    } catch {
      return false;
    }
  }
}