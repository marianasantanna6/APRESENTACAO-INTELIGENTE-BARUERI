import {
  BadGatewayException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

const MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024;

type StoredProfilePicture = {
  path: string;
  publicUrl: string;
};

export async function uploadProfilePicture(
  dataUrl: string,
): Promise<StoredProfilePicture> {
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,([\s\S]+)$/i);

  if (!match) {
    throw new BadRequestException(
      'A foto de perfil deve ser enviada como PNG ou JPEG em formato data URL',
    );
  }

  const mimeType = match[1].toLowerCase();
  const base64 = match[2];
  const imageBuffer = Buffer.from(base64, 'base64');

  if (
    imageBuffer.length === 0 ||
    imageBuffer.length > MAX_PROFILE_PICTURE_BYTES ||
    imageBuffer.toString('base64') !== base64
  ) {
    throw new BadRequestException(
      'A foto de perfil está vazia, excede 5 MB ou possui dados inválidos',
    );
  }

  const isPng =
    mimeType === 'image/png' &&
    imageBuffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  const isJpeg =
    mimeType === 'image/jpeg' &&
    imageBuffer[0] === 0xff &&
    imageBuffer[1] === 0xd8 &&
    imageBuffer[2] === 0xff;

  if (!isPng && !isJpeg) {
    throw new BadRequestException(
      'O conteúdo da foto não corresponde ao formato PNG ou JPEG informado',
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  const bucketName = process.env.SUPABASE_PROFILE_PICTURE_BUCKET;

  if (!supabaseUrl || !supabaseKey || !bucketName) {
    throw new InternalServerErrorException(
      'Configuração do Supabase incompleta',
    );
  }

  const extension = isPng ? 'png' : 'jpg';
  const path = `${randomUUID()}.${extension}`;
  const encodedPath = encodeURIComponent(path);
  const encodedBucket = encodeURIComponent(bucketName);

  let response: Response;

  try {
    response = await fetch(
      `${supabaseUrl}/storage/v1/object/${encodedBucket}/${encodedPath}`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          'Content-Type': mimeType,
          'x-upsert': 'false',
        },
        body: new Uint8Array(imageBuffer),
        signal: AbortSignal.timeout(60_000),
      },
    );
  } catch {
    throw new BadGatewayException(
      'Não foi possível enviar a foto de perfil ao Supabase Storage',
    );
  }

  if (!response.ok) {
    const details = await response.text().catch(() => '');

    throw new BadGatewayException(
      `Falha no upload da foto de perfil: HTTP ${response.status}${
        details ? `: ${details.slice(0, 500)}` : ''
      }`,
    );
  }

  return {
    path,
    publicUrl:
      `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`,
  };
}

export async function deleteProfilePicture(path: string): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  const bucketName = process.env.SUPABASE_PROFILE_PICTURE_BUCKET;

  if (!supabaseUrl || !supabaseKey || !bucketName) {
    throw new Error('Configuração do Supabase incompleta');
  }

  const encodedPath = encodeURIComponent(path);
  const encodedBucket = encodeURIComponent(bucketName);
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${encodedBucket}/${encodedPath}`,
    {
      method: 'DELETE',
      headers: { apikey: supabaseKey },
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!response.ok) {
    throw new Error('Não foi possível remover a foto do Supabase Storage');
  }
}
