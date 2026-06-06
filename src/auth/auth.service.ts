import { Injectable, UnauthorizedException, InternalServerErrorException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(fullname: string ,email: string, password: string) {
    const exist = await this.prisma.user.findUnique({
      where: {
        email: email
      }
    })

    if (exist) throw new ConflictException("Email already in use");

    try {
      const hash = await bcrypt.hash(password, 10);
      const user =  await this.prisma.user.create({
        data: {fullname, email, passwordHash: hash },
      });
      const payload = { sub: user.id, email: user.email, role: user.role };

      const { passwordHash, ...result } = user;

      return { access_token: this.jwtService.sign(payload), user: result };

    } catch (error) {
      throw new InternalServerErrorException('Signup failed');
    }
  }

  async validateUser(email: string, password: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) throw new UnauthorizedException('Invalid credentials');
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid credentials');
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Validation failed');
    }
  }

  async login(email: string, password: string) {
    try {
      const user = await this.validateUser(email, password);
      const payload = { sub: user.id, email: user.email, role: user.role };
      const { passwordHash, ...result } = user;
      return { access_token: this.jwtService.sign(payload), user: result };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Login failed');
    }
  }

  async verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      const serverUser = await this.prisma.user.findUnique({ where: { id: decoded.sub }, omit: { passwordHash: true } });
      if (!serverUser) throw new UnauthorizedException('Invalid token');
      return serverUser;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}