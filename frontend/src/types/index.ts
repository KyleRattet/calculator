// Client-side type definitions

export interface CellCoordinate {
  row: number;
  col: number;
}

export interface CellData {
  id: string;
  coordinate: CellCoordinate;
  input: string;
  value: number | string | null;
  error: string | null;
  isFormula: boolean;
  dependencies: string[];
  dependents: string[];
}

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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  grid?: GridData;
  errors?: { cellId: string; error: string }[];
  circularReferences?: string[];
}

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

export interface CellProps {
  cell: CellData;
  isEditing: boolean;
  onStartEdit: () => void;
  onFinishEdit: (newValue: string) => void;
  onCancelEdit: () => void;
}

export interface GridProps {
  data: GridData;
  onCellUpdate: (cellId: string, input: string) => void;
  onAddRow: (title?: string) => void;
  onAddColumn: (title?: string) => void;
  onDeleteRow: (index: number) => void;
  onDeleteColumn: (index: number) => void;
  onUpdateRowHeader: (index: number, title: string) => void;
  onUpdateColumnHeader: (index: number, title: string) => void;
  onEvaluate: () => void;
  isLoading?: boolean;
  evaluationResult?: EvaluationResult | null;
}