/**
 * Máscara de moeda (BRL) para inputs. Aceita SOMENTE dígitos (interpretados como
 * centavos). Ex.: "150000" → "1.500,00".
 */
export function mascaraMoeda(valor: string): string {
  const digitos = valor.replace(/\D/g, '');
  if (!digitos) return '';
  const num = Number(digitos) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Converte o valor mascarado ("1.500,00") no número correspondente (1500). */
export function moedaParaNumero(valorMascarado: string): number {
  const digitos = valorMascarado.replace(/\D/g, '');
  return digitos ? Number(digitos) / 100 : 0;
}
