import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { AssociatesController } from './associates.controller';
import { AssociatesService } from './associates.service';

@Module({
  imports: [TypeOrmModule.forFeature([AssociateProfile])],
  controllers: [AssociatesController],
  providers: [AssociatesService],
})
export class AssociatesModule {}
