"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAssociateDocumentAssignments1742000000000 = void 0;
class AddAssociateDocumentAssignments1742000000000 {
    name = 'AddAssociateDocumentAssignments1742000000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS associate_customer_application_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "associateId" uuid NOT NULL,
        "customerApplicationDocumentId" uuid NOT NULL,
        CONSTRAINT "UQ_associate_document_assignment"
          UNIQUE ("associateId", "customerApplicationDocumentId"),
        CONSTRAINT "FK_associate_document_associate"
          FOREIGN KEY ("associateId")
          REFERENCES associate_profiles(id) ON DELETE CASCADE,
        CONSTRAINT "FK_associate_document_document"
          FOREIGN KEY ("customerApplicationDocumentId")
          REFERENCES customer_application_documents(id) ON DELETE CASCADE
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_associate_document_associate_id"
      ON associate_customer_application_documents ("associateId")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_associate_document_document_id"
      ON associate_customer_application_documents ("customerApplicationDocumentId")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS associate_customer_application_documents`);
    }
}
exports.AddAssociateDocumentAssignments1742000000000 = AddAssociateDocumentAssignments1742000000000;
//# sourceMappingURL=1742000000000-AddAssociateDocumentAssignments.js.map