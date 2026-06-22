export type CustomerDocumentDisplayFields = {
    requirementKey: string;
    sectionTitle: string;
    itemLabel: string;
    sortOrder: number;
    isCustom: boolean;
    isActive: boolean;
};
export declare function resolveCustomerDocumentDisplay(doc: CustomerDocumentDisplayFields): CustomerDocumentDisplayFields;
export declare function isCustomerDocumentVisible(doc: {
    isActive?: boolean;
}): boolean;
