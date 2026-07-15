import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export type ArquivoUpload = { uri: string; name: string; type: string };

/** Abre a galeria e devolve a imagem escolhida (ou null se cancelado/sem permissão). */
export async function escolherFoto(): Promise<ArquivoUpload | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (r.canceled || !r.assets?.length) return null;
  const a = r.assets[0];
  return {
    uri: a.uri,
    name: a.fileName ?? `foto-${Date.now()}.jpg`,
    type: a.mimeType ?? 'image/jpeg',
  };
}

/** Abre o seletor de documentos (jpg/png/pdf) e devolve o arquivo escolhido (ou null). */
export async function escolherDocumento(): Promise<ArquivoUpload | null> {
  const r = await DocumentPicker.getDocumentAsync({
    type: ['image/jpeg', 'image/png', 'application/pdf'],
    copyToCacheDirectory: true,
  });
  if (r.canceled || !r.assets?.length) return null;
  const a = r.assets[0];
  return {
    uri: a.uri,
    name: a.name ?? `documento-${Date.now()}`,
    type: a.mimeType ?? 'application/octet-stream',
  };
}
