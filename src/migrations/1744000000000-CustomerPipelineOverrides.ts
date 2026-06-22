import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomerPipelineOverrides1744000000000 implements MigrationInterface {
  name = 'CustomerPipelineOverrides1744000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customer_application_pipeline_progress
      ADD COLUMN IF NOT EXISTS "pipelineStepTemplateId" uuid,
      ADD COLUMN IF NOT EXISTS "isCustom" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      UPDATE customer_application_pipeline_progress cpp
      SET
        "pipelineStepTemplateId" = t.id,
        "isCustom" = false,
        "isActive" = true
      FROM customer_applications ca,
           application_pipeline_step_templates t
      WHERE cpp."customerApplicationId" = ca.id
        AND t."applicationTypeId" = ca."applicationTypeId"
        AND t."stepIndex" = cpp."stepIndex"
        AND cpp."pipelineStepTemplateId" IS NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_pipeline_progress_step_template'
        ) THEN
          ALTER TABLE customer_application_pipeline_progress
          ADD CONSTRAINT "FK_pipeline_progress_step_template"
            FOREIGN KEY ("pipelineStepTemplateId")
            REFERENCES application_pipeline_step_templates(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customer_application_pipeline_progress
      DROP CONSTRAINT IF EXISTS "FK_pipeline_progress_step_template"
    `);
    await queryRunner.query(`
      ALTER TABLE customer_application_pipeline_progress
      DROP COLUMN IF EXISTS "pipelineStepTemplateId",
      DROP COLUMN IF EXISTS "isCustom",
      DROP COLUMN IF EXISTS "isActive"
    `);
  }
}
