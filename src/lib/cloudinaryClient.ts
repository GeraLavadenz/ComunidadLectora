// src/lib/cloudinaryClient.ts

/**
 * Subida UNSIGNED a Cloudinary
 * - No usa API Secret (seguro para frontend)
 * - Con logs para depurar
 * - Con validaciones de cloudName y preset
 * - Con mensaje de error claro
 */

interface CloudinarySuccessResponse {
  secure_url: string;
  public_id: string;
}

interface CloudinaryErrorResponse {
  error: {
    message: string;
  };
}

function isCloudinaryErrorResponse(data: unknown): data is CloudinaryErrorResponse {
  return typeof data === 'object' && data !== null && 'error' in data && typeof (data as CloudinaryErrorResponse).error.message === 'string';
}

export async function uploadImageUnsigned(file: File, preset?: string) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME;
    const uploadPreset =
      preset || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "KOLLComunidadLectora";
  
    // DEBUG: mostrar qué valores está usando el frontend
    console.log("Cloudinary DEBUG →", {
      cloudName,
      uploadPreset,
      envCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME,
      envPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    });
  
    if (!cloudName) {
      throw new Error(
        "Cloudinary cloud name NO definido. Falta NEXT_PUBLIC_CLOUDINARY_CLOUDNAME en .env.local"
      );
    }
  
    if (!uploadPreset) {
      throw new Error(
        "Cloudinary upload preset NO definido. Falta NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET en .env.local"
      );
    }
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
  
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        body: formData,
      });
    } catch (networkError) {
      throw new Error("No se pudo conectar a Cloudinary: " + (networkError instanceof Error ? networkError.message : String(networkError)));
    }
  
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  
    if (!res.ok) {
      console.error("Cloudinary Error Response:", data);

      // Errores típicos explicados
      if (isCloudinaryErrorResponse(data) && data.error.message.includes("Upload preset not found")) {
        throw new Error(
          `Cloudinary: EL PRESET NO EXISTE.
  Asegúrate que "${uploadPreset}":
  - Existe en Cloudinary (Dashboard → Settings → Upload → Upload presets)
  - Está en modo UNSIGNED (No firmado)
  - Está bien escrito (sensible a mayúsculas/minúsculas)`
        );
      }

      throw new Error(`Cloudinary upload failed: ${res.status} → ${JSON.stringify(data)}`);
    }

    // At this point, res.ok is true, so data should be CloudinarySuccessResponse
    const successData = data as CloudinarySuccessResponse;
    return {
      url: successData.secure_url,
      public_id: successData.public_id,
      raw: data,
    };
  }
  