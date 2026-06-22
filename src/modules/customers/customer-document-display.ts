export type CustomerDocumentDisplayFields = {
  requirementKey: string;
  sectionTitle: string;
  itemLabel: string;
  sortOrder: number;
  isCustom: boolean;
  isActive: boolean;
};

export function resolveCustomerDocumentDisplay(
  doc: CustomerDocumentDisplayFields,
): CustomerDocumentDisplayFields {
  return {
    requirementKey: doc.requirementKey,
    sectionTitle: doc.sectionTitle,
    itemLabel: doc.itemLabel,
    sortOrder: doc.sortOrder,
    isCustom: doc.isCustom,
    isActive: doc.isActive,
  };
}

export function isCustomerDocumentVisible(doc: { isActive?: boolean }): boolean {
  return doc.isActive !== false;
}
