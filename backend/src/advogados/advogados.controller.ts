import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdvogadosService } from './advogados.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import {
  AtualizarPerfilAdvogadoDto,
  AdicionarAreaDto,
  TrocarPlanoDto,
} from './dto/atualizar-perfil-advogado.dto';
import { BuscarAdvogadosQueryDto } from './dto/buscar-advogados-query.dto';

@ApiTags('advogados')
@Controller('api/v1/advogados')
export class AdvogadosController {
  constructor(private advogados: AdvogadosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar advogados disponíveis (com filtro por especialização)' })
  @ApiQuery({ name: 'especializacao', required: false })
  findAll(@Query('especializacao') especializacao?: string) {
    return this.advogados.findAll(especializacao);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil completo do advogado logado' })
  meuPerfil(@UsuarioAtual() usuario: { id: number }) {
    return this.advogados.findPerfil(usuario.id);
  }

  @Patch('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar dados do próprio perfil (nome/OAB/estado/cidade)' })
  atualizarPerfil(@UsuarioAtual() u: { id: number }, @Body() dto: AtualizarPerfilAdvogadoDto) {
    return this.advogados.atualizarPerfil(u.id, dto);
  }

  @Post('perfil/areas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar área de atuação ao próprio perfil' })
  adicionarArea(@UsuarioAtual() u: { id: number }, @Body() dto: AdicionarAreaDto) {
    return this.advogados.adicionarArea(u.id, dto.areaId);
  }

  @Delete('perfil/areas/:areaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover área de atuação do próprio perfil' })
  removerArea(@UsuarioAtual() u: { id: number }, @Param('areaId', ParseIntPipe) areaId: number) {
    return this.advogados.removerArea(u.id, areaId);
  }

  @Patch('perfil/plano')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trocar o próprio plano (efetiva; cota recalcula)' })
  trocarPlano(@UsuarioAtual() u: { id: number }, @Body() dto: TrocarPlanoDto) {
    return this.advogados.trocarPlano(u.id, dto.planoId);
  }

  @Get('buscar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar advogados com filtros (área/nota/estado/vínculo) e paginação' })
  buscar(@UsuarioAtual() u: { id: number; tipo: string }, @Query() q: BuscarAdvogadosQueryDto) {
    const clienteId = u.tipo === 'cliente' ? u.id : undefined;
    return this.advogados.buscar(q, clienteId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver perfil público de um advogado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.advogados.findOne(id);
  }
}
