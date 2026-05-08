import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { AssociatesController } from './associates.controller';
import { AssociateInviteMailService } from './associate-invite-mail.service';
import { AssociatesService } from './associates.service';
import { AssociateInvite } from './entities/associate-invite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssociateProfile, AssociateInvite, User, Task])],
  controllers: [AssociatesController],
  providers: [AssociatesService, AssociateInviteMailService],
  exports: [TypeOrmModule],
})
export class AssociatesModule {}
