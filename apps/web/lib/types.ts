export interface ProjectSummary {
  id: string;
  name: string;
  description?: string | null;
  status: 'draft' | 'active' | 'archived';
  taskType: string;
  createdAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  sopDocument?: string | null;
  acceptanceCriteria?: string | null;
  updatedAt: string;
}

export interface BatchSummary {
  id: string;
  projectId: string;
  name: string;
  status: 'draft' | 'in_progress' | 'ready_for_delivery' | 'closed';
  plannedTaskCount?: number | null;
  createdAt: string;
}

export interface BatchDetail extends BatchSummary {
  updatedAt: string;
}

export interface TaskSummary {
  id: string;
  batchId: string;
  externalRef?: string | null;
  title: string;
  inputPayload: Record<string, unknown>;
  status:
    | 'pending_allocation'
    | 'pending_pickup'
    | 'in_progress'
    | 'submitted'
    | 'returned';
  priority: number;
  createdAt: string;
}

export interface TaskDetail extends TaskSummary {
  updatedAt: string;
}

export interface TaskAssignment {
  id: string;
  taskItemId: string;
  operatorId?: string | null;
  assigneeId: string;
  status: 'assigned' | 'accepted' | 'completed' | 'rejected';
  assignedAt: string;
  completedAt?: string | null;
  notes?: string | null;
}

export interface DashboardOverview {
  projectCount: number;
  batchCount: number;
  taskCount: number;
  assignmentCount: number;
}

export interface AiChatResponse {
  answer: string;
}

export interface TaskSuggestionResponse {
  suggestion: string;
}
