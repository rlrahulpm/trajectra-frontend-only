export interface SankeyNode {
  name: string;
  index?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  value?: number;
}

export interface TmlData {
  [circuitId: string]: string[];
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  tmls?: TmlData;
  width?: number;
}

export interface CorrosionData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

