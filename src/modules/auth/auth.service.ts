import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async adminLogin(adminLoginDto: AdminLoginDto) {
    const user = await this.findUserForLogin(adminLoginDto.email);
    const names = this.getUserNames(user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(adminLoginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can login here');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: names.firstName,
        lastName: names.lastName,
        role: user.role,
      },
    };
  }

  async associateLogin(associateLoginDto: AdminLoginDto) {
    const user = await this.findUserForLogin(associateLoginDto.email);
    const names = this.getUserNames(user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(associateLoginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== UserRole.ASSOCIATE) {
      throw new ForbiddenException('Only associate can login here');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: names.firstName,
        lastName: names.lastName,
        role: user.role,
      },
    };
  }

  private async findUserForLogin(emailInput: string): Promise<User> {
    const email = emailInput.trim().toLowerCase();
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.adminProfile', 'adminProfile')
      .leftJoinAndSelect('user.associateProfile', 'associateProfile')
      .leftJoinAndSelect('user.customerProfile', 'customerProfile')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private getUserNames(user: User): { firstName: string; lastName: string } {
    const profile = user.adminProfile ?? user.associateProfile ?? user.customerProfile;
    if (!profile) {
      throw new UnauthorizedException('Profile missing for user');
    }

    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
  }
}
