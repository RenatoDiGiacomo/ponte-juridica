import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterClienteDto } from './dto/register-cliente.dto';
import { RegisterAdvogadoDto } from './dto/register-advogado.dto';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('cliente/login')
  @ApiOperation({ summary: 'Login do cliente/solicitante' })
  loginCliente(@Body() dto: LoginDto) {
    return this.auth.loginCliente(dto);
  }

  @Post('advogado/login')
  @ApiOperation({ summary: 'Login do advogado' })
  loginAdvogado(@Body() dto: LoginDto) {
    return this.auth.loginAdvogado(dto);
  }

  @Post('cliente/registro')
  @ApiOperation({ summary: 'Cadastro de novo cliente/solicitante' })
  registrarCliente(@Body() dto: RegisterClienteDto) {
    return this.auth.registrarCliente(dto);
  }

  @Post('advogado/registro')
  @ApiOperation({ summary: 'Cadastro de novo advogado' })
  registrarAdvogado(@Body() dto: RegisterAdvogadoDto) {
    return this.auth.registrarAdvogado(dto);
  }
}
