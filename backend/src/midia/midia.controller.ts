import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { MidiaService } from './midia.service';
import { uploadOptions, MIMES_IMAGEM, MIMES_DOCUMENTO } from '../common/upload/upload.config';

type Usuario = { id: number; tipo: 'cliente' | 'advogado' };

@ApiTags('midia')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class MidiaController {
  constructor(private midia: MidiaService) {}

  @Post('me/foto')
  @ApiOperation({ summary: 'Envia/atualiza a foto de perfil (pública) do usuário logado' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('arquivo', uploadOptions('fotos', MIMES_IMAGEM)))
  enviarFoto(@UsuarioAtual() u: Usuario, @UploadedFile() arquivo?: Express.Multer.File) {
    if (!arquivo) throw new BadRequestException('Arquivo não enviado');
    return this.midia.salvarFoto(u, arquivo.filename);
  }

  @Post('me/documento')
  @ApiOperation({ summary: 'Cliente envia documento pessoal (privado, não público)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('arquivo', uploadOptions('documentos', MIMES_DOCUMENTO)))
  enviarDocumento(@UsuarioAtual() u: Usuario, @UploadedFile() arquivo?: Express.Multer.File) {
    if (u.tipo !== 'cliente') throw new ForbiddenException('Apenas clientes enviam documento');
    if (!arquivo) throw new BadRequestException('Arquivo não enviado');
    return this.midia.salvarDocumento(u.id, arquivo.filename);
  }

  @Get('me/documento')
  @ApiOperation({ summary: 'Cliente baixa o PRÓPRIO documento (autenticado; terceiros não têm acesso)' })
  async baixarDocumento(@UsuarioAtual() u: Usuario, @Res() res: Response) {
    if (u.tipo !== 'cliente') throw new ForbiddenException('Apenas o dono acessa o documento');
    const caminho = await this.midia.caminhoDocumento(u.id);
    res.sendFile(caminho);
  }
}
