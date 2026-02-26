// Утилита для загрузки файлов в Vercel Blob.
// Принимает файл, отдаёт URL — больше ничего не делает.

import { put } from "@vercel/blob"

export async function uploadFile(
  file: File,
  folder: string = "frames"
): Promise<string> {
  const filename = `${folder}/${Date.now()}-${file.name}`
  
  const { url } = await put(filename, file, {
    access: "public", // файл доступен без авторизации
  })

  return url
}