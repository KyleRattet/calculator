export interface CellCoordinate {
    row: number;
    col: number;
  }
  
  export interface CellData {
    id: string;
    coordinate: CellCoordinate;
    input: string; // What the user entered (value or formula)
    value: number | string | null; // Evaluated result
    error: string | null;
    isFormula: boolean;
    dependencies: string[]; // Cell IDs this cell depends on
    dependents: string[]; // Cell IDs that depend on this cell
  }
  
  export class Cell {
    public id: string;
    public coordinate: CellCoordinate;
    public input: string;
    public value: number | string | null;
    public error: string | null;
    public isFormula: boolean;
    public dependencies: string[];
    public dependents: string[];
  
    constructor(row: number, col: number, input: string = '') {
      this.coordinate = { row, col };
      this.id = this.coordinateToId(row, col);
      this.input = input;
      this.value = null;
      this.error = null;
      this.isFormula = input.startsWith('=');
      this.dependencies = [];
      this.dependents = [];
    }
  
    public updateInput(input: string): void {
      this.input = input;
      this.isFormula = input.startsWith('=');
      this.value = null;
      this.error = null;
      this.dependencies = [];
    }
  
    public setValue(value: number | string | null): void {
      this.value = value;
      this.error = null;
    }
  
    public setError(error: string): void {
      this.error = error;
      this.value = null;
    }
  
    public addDependency(cellId: string): void {
      if (!this.dependencies.includes(cellId)) {
        this.dependencies.push(cellId);
      }
    }
  
    public addDependent(cellId: string): void {
      if (!this.dependents.includes(cellId)) {
        this.dependents.push(cellId);
      }
    }
  
    public clearDependencies(): void {
      this.dependencies = [];
    }
  
    public clearDependents(): void {
      this.dependents = [];
    }
  
    public static coordinateToId(row: number, col: number): string {
      const colLetter = String.fromCharCode(65 + col); // A=0, B=1, etc.
      return `${colLetter}${row + 1}`;
    }
  
    public static idToCoordinate(id: string): CellCoordinate {
      const colLetter = id.charAt(0);
      const rowNumber = parseInt(id.slice(1));
      return {
        col: colLetter.charCodeAt(0) - 65,
        row: rowNumber - 1
      };
    }
  
    private coordinateToId(row: number, col: number): string {
      return Cell.coordinateToId(row, col);
    }
  
    public toJSON(): CellData {
      return {
        id: this.id,
        coordinate: this.coordinate,
        input: this.input,
        value: this.value,
        error: this.error,
        isFormula: this.isFormula,
        dependencies: [...this.dependencies],
        dependents: [...this.dependents]
      };
    }
  }