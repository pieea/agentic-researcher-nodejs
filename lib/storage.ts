import { ResearchState } from './workflow/state'

// In-memory storage for active workflows (use Redis in production)
export const activeWorkflows = new Map<string, ResearchState>()

export function getWorkflowState(requestId: string): ResearchState | undefined {
  return activeWorkflows.get(requestId)
}

export function setWorkflowState(requestId: string, state: ResearchState): void {
  activeWorkflows.set(requestId, state)
}

export function deleteWorkflowState(requestId: string): void {
  activeWorkflows.delete(requestId)
}
