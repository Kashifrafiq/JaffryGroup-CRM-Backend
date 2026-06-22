"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCustomerDocumentDisplay = resolveCustomerDocumentDisplay;
exports.isCustomerDocumentVisible = isCustomerDocumentVisible;
function resolveCustomerDocumentDisplay(doc) {
    return {
        requirementKey: doc.requirementKey,
        sectionTitle: doc.sectionTitle,
        itemLabel: doc.itemLabel,
        sortOrder: doc.sortOrder,
        isCustom: doc.isCustom,
        isActive: doc.isActive,
    };
}
function isCustomerDocumentVisible(doc) {
    return doc.isActive !== false;
}
//# sourceMappingURL=customer-document-display.js.map