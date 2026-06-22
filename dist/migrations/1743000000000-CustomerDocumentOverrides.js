"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerDocumentOverrides1743000000000 = void 0;
class CustomerDocumentOverrides1743000000000 {
    name = 'CustomerDocumentOverrides1743000000000';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE customer_application_documents
      ADD COLUMN IF NOT EXISTS "requirementKey" varchar(160),
      ADD COLUMN IF NOT EXISTS "sectionTitle" varchar(512),
      ADD COLUMN IF NOT EXISTS "itemLabel" text,
      ADD COLUMN IF NOT EXISTS "sortOrder" int,
      ADD COLUMN IF NOT EXISTS "isCustom" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true
    `);
        await queryRunner.query(`
      UPDATE customer_application_documents d
      SET
        "requirementKey" = r."requirementKey",
        "sectionTitle" = r."sectionTitle",
        "itemLabel" = r."itemLabel",
        "sortOrder" = r."sortOrder",
        "isCustom" = false,
        "isActive" = true
      FROM application_document_requirements r
      WHERE d."documentRequirementId" = r.id
        AND d."requirementKey" IS NULL
    `);
        await queryRunner.query(`
      UPDATE customer_application_documents
      SET
        "requirementKey" = 'legacy_' || id::text,
        "sectionTitle" = 'Documents',
        "itemLabel" = 'Document',
        "sortOrder" = 0,
        "isCustom" = false,
        "isActive" = true
      WHERE "requirementKey" IS NULL
    `);
        await queryRunner.query(`
      ALTER TABLE customer_application_documents
      ALTER COLUMN "requirementKey" SET NOT NULL,
      ALTER COLUMN "sectionTitle" SET NOT NULL,
      ALTER COLUMN "itemLabel" SET NOT NULL,
      ALTER COLUMN "sortOrder" SET NOT NULL
    `);
        await queryRunner.query(`
      ALTER TABLE customer_application_documents
      DROP CONSTRAINT IF EXISTS "UQ_customer_application_documents_customerApplicationId_documentRequi"
    `);
        await queryRunner.query(`
      ALTER TABLE customer_application_documents
      DROP CONSTRAINT IF EXISTS "UQ_customer_application_documents_customerApplicationId_documentRequirementId"
    `);
        await queryRunner.query(`
      ALTER TABLE customer_application_documents
      ALTER COLUMN "documentRequirementId" DROP NOT NULL
    `);
        await queryRunner.query(`
      ALTER TABLE customer_application_documents
      DROP CONSTRAINT IF EXISTS "FK_customer_application_documents_documentRequirementId"
    `);
        await queryRunner.query(`
      ALTER TABLE customer_application_documents
      DROP CONSTRAINT IF EXISTS "FK_document_requirement"
    `);
        await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'customer_application_documents_documentRequirementId_fkey'
        ) THEN
          ALTER TABLE customer_application_documents
          DROP CONSTRAINT customer_application_documents_documentRequirementId_fkey;
        END IF;
      END $$;
    `);
        await queryRunner.query(`
      ALTER TABLE customer_application_documents
      ADD CONSTRAINT "FK_customer_application_documents_documentRequirementId"
        FOREIGN KEY ("documentRequirementId")
        REFERENCES application_document_requirements(id) ON DELETE SET NULL
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_customer_app_documents_app_requirement_key"
      ON customer_application_documents ("customerApplicationId", "requirementKey")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_customer_app_documents_app_requirement_key"
    `);
        await queryRunner.query(`
      ALTER TABLE customer_application_documents
      DROP COLUMN IF EXISTS "requirementKey",
      DROP COLUMN IF EXISTS "sectionTitle",
      DROP COLUMN IF EXISTS "itemLabel",
      DROP COLUMN IF EXISTS "sortOrder",
      DROP COLUMN IF EXISTS "isCustom",
      DROP COLUMN IF EXISTS "isActive"
    `);
    }
}
exports.CustomerDocumentOverrides1743000000000 = CustomerDocumentOverrides1743000000000;
//# sourceMappingURL=1743000000000-CustomerDocumentOverrides.js.map