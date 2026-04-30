// ============================================================
// GenoNexus Visualization Service — Shared TypeScript Types
// ============================================================

// -----------------------------------------------------------
// Generic API Response Types
// -----------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  cached: boolean;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  cached: boolean;
  timestamp: string;
}

// -----------------------------------------------------------
// 3D Genome Browser Types
// -----------------------------------------------------------

export interface ChromosomeData {
  id: number;
  label: string;
  height: number;
  hasMutation: boolean;
  mutationType: "pathogenic" | "uncertain" | "benign";
  gene: string;
  variant: string;
  impact: "High" | "Moderate" | "Low";
}

export interface GenomicRegion {
  chromosome: string;
  start: number;
  end: number;
  sequence: string;
  genes: GeneAnnotation[];
  gcContent: number;
}

export interface GeneAnnotation {
  name: string;
  start: number;
  end: number;
  strand: "+" | "-";
  type: string;
}

export interface MutationOverlay {
  position: number;
  type: "pathogenic" | "uncertain" | "benign";
  gene: string;
  variant: string;
  impact: "High" | "Moderate" | "Low";
  color: string;
  confidence: number;
}

export interface HelixVertexData {
  positions: number[];
  colors: number[];
  normals: number[];
  basePairCount: number;
}

// -----------------------------------------------------------
// Digital Cell Twin Types
// -----------------------------------------------------------

export interface CellMetric {
  label: string;
  unit: string;
  value: number;
  base: number;
  color: string;
  barPercent: number;
}

export interface SimulationResult {
  simulationId: string;
  drugId: string;
  drugName: string;
  status: "completed" | "running" | "failed";
  metrics: CellMetric[];
  organelles: OrganelleStatus[];
  totalTimeSteps: number;
  completedAt: string;
}

export interface OrganelleStatus {
  name: string;
  status: string;
  healthy: boolean;
}

export interface SimulationTimeStep {
  timeStep: number;
  timestamp: number;
  metrics: CellMetric[];
  organelles: OrganelleStatus[];
}

export interface SimulationTimeline {
  simulationId: string;
  totalDuration: number;
  totalSteps: number;
  timeSteps: SimulationTimeStep[];
}

// -----------------------------------------------------------
// Phylogenetic Tree Types
// -----------------------------------------------------------

export interface TreeNode {
  id: string;
  label: string;
  type: "species" | "mutation";
  color: string;
  time: number;
  info: string;
  branchLength?: number;
  children: TreeNode[];
  expanded?: boolean;
}

export interface PhyloTreeData {
  treeId: string;
  name: string;
  description: string;
  root: TreeNode;
  totalNodes: number;
  maxDepth: number;
  format: "newick" | "nexus" | "json";
  createdAt: string;
}

export interface SampleTree {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
  organism: string;
}

// -----------------------------------------------------------
// Virus Mutation Tracker Types
// -----------------------------------------------------------

export interface OutbreakPoint {
  id: string;
  label: string;
  x: string;
  y: string;
  severity: number;
  variant: string;
  cases: number;
  lastUpdated: string;
}

export interface MutationEvent {
  time: string;
  label: string;
  severity: "high" | "med" | "low";
  position?: number;
  variant?: string;
  region?: string;
}

export interface TimeSeriesData {
  data: number[];
  labels: string[];
  period: string;
  unit: string;
}

export interface WebSocketMessage {
  type: "mutation_update" | "outbreak_alert" | "heartbeat" | "error";
  data: Record<string, unknown>;
  timestamp: string;
}

// -----------------------------------------------------------
// Cache Types
// -----------------------------------------------------------

export interface CacheConfig {
  ttlSeconds: number;
  namespace: string;
}

// -----------------------------------------------------------
// Express Augmentation
// -----------------------------------------------------------

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email?: string;
        role?: string;
      };
      authMethod?: "jwt" | "api-key";
    }
  }
}
