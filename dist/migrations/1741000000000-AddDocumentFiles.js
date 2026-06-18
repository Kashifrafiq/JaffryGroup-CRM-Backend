"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDocumentFiles1741000000000 = void 0;
class AddDocumentFiles1741000000000 {
    name = 'AddDocumentFiles1741000000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_application_document_files (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "customerApplicationDocumentId" uuid NOT NULL,
        "storageKey" varchar(1024),
        bucket varchar(255),
        "originalFilename" varchar(512),
        "mimeType" varchar(255),
        "sizeBytes" bigint,
        "uploadedAt" timestamptz,
        "uploadedByUserId" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_document_files_document"
          FOREIGN KEY ("customerApplicationDocumentId")
          REFERENCES customer_application_documents(id) ON DELETE CASCADE,
        CONSTRAINT "FK_document_files_uploaded_by"
          FOREIGN KEY ("uploadedByUserId")
          REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_document_files_document_id"
      ON customer_application_document_files ("customerApplicationDocumentId")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS customer_application_document_files`);
    }
}
exports.AddDocumentFiles1741000000000 = AddDocumentFiles1741000000000;
//# sourceMappingURL=1741000000000-AddDocumentFiles.js.map