export function isCustomerPipelineStepVisible(step: { isActive?: boolean }): boolean {
  return step.isActive !== false;
}
