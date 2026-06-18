"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalizeDeprecatedSchema1740000000000 = void 0;
class NormalizeDeprecatedSchema1740000000000 {
    name = 'NormalizeDeprecatedSchema1740000000000';
    async up(queryRunner) {
        const hasLegacyAssignments = await queryRunner.hasTable('associate_customers');
        if (hasLegacyAssignments) {
            await queryRunner.query(`
        INSERT INTO associate_pipeline_steps ("associateId", "pipelineProgressId")
        SELECT DISTINCT ac."associateId", cpp.id
        FROM associate_customers ac
        INNER JOIN customer_applications ca ON ca."customerId" = ac."customerId"
        INNER JOIN customer_application_pipeline_progress cpp
          ON cpp."customerApplicationId" = ca.id
        WHERE NOT EXISTS (
          SELECT 1
          FROM associate_pipeline_steps aps
          WHERE aps."associateId" = ac."associateId"
            AND aps."pipelineProgressId" = cpp.id
        )
      `);
            await queryRunner.query(`DROP TABLE associate_customers CASCADE`);
        }
        await queryRunner.query(`ALTER TABLE customers DROP COLUMN IF EXISTS "applicationType"`);
        await queryRunner.query(`ALTER TABLE customer_applications DROP COLUMN IF EXISTS pipeline`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS "firstName"`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS "lastName"`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS address`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS "dateOfBirth"`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS "profilePhoto"`);
        const documentsTable = await queryRunner.getTable('customer_application_documents');
        const uploadedByColumn = documentsTable?.findColumnByName('uploadedByUserId');
        if (uploadedByColumn) {
            await queryRunner.query(`
        UPDATE customer_application_documents
        SET "uploadedByUserId" = NULL
        WHERE "uploadedByUserId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM users u WHERE u.id = customer_application_documents."uploadedByUserId"
          )
      `);
            const hasFk = documentsTable?.foreignKeys.some((fk) => fk.columnNames.includes('uploadedByUserId'));
            if (!hasFk) {
                await queryRunner.query(`
          ALTER TABLE customer_application_documents
          ADD CONSTRAINT "FK_customer_application_documents_uploadedByUserId"
          FOREIGN KEY ("uploadedByUserId") REFERENCES users(id) ON DELETE SET NULL
        `);
            }
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE customer_application_documents
      DROP CONSTRAINT IF EXISTS "FK_customer_application_documents_uploadedByUserId"
    `);
        await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "firstName" varchar`);
        await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastName" varchar`);
        await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "phoneNumber" varchar`);
        await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address varchar`);
        await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "dateOfBirth" timestamptz`);
        await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "profilePhoto" varchar`);
        await queryRunner.query(`ALTER TABLE customer_applications ADD COLUMN IF NOT EXISTS pipeline jsonb`);
        await queryRunner.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS "applicationType" varchar(128)`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS associate_customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "associateId" uuid NOT NULL,
        "customerId" uuid NOT NULL,
        CONSTRAINT "UQ_associate_customers_associate_customer" UNIQUE ("associateId", "customerId")
      )
    `);
    }
}
exports.NormalizeDeprecatedSchema1740000000000 = NormalizeDeprecatedSchema1740000000000;
//# sourceMappingURL=1740000000000-NormalizeDeprecatedSchema.js.map