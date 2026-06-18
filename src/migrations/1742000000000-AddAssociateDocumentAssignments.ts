import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssociateDocumentAssignments1742000000000 implements MigrationInterface {
  name = 'AddAssociateDocumentAssignments1742000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS associate_customer_application_documents`);
  }
}
