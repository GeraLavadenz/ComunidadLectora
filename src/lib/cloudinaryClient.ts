// src/lib/cloudinaryClient.ts

/**
 * Subida UNSIGNED a Cloudinary
 * - No usa API Secret (seguro para frontend)
 * - Con logs para depurar
 * - Con validaciones de cloudName y preset
 * - Con mensaje de error claro
 */

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
      throw new Error("No se pudo conectar a Cloudinary: " + (networkError as any)?.message);
    }
  
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  
    if (!res.ok) {
      console.error("Cloudinary Error Response:", data);
  
      // Errores típicos explicados
      if (data?.error?.message?.includes("Upload preset not found")) {
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
  
    return {
      url: data.secure_url,
      public_id: data.public_id,
      raw: data,
    };
  }
  