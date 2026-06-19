import { Body, Controller, Get, Post } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('usuarios')
@Roles(Perfil.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
