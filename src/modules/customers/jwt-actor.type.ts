import { User } from '../users/entities/user.entity';

export type JwtActor = Pick<User, 'id' | 'role'>;
