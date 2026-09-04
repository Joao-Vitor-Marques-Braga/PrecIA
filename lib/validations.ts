import { z } from "zod";

// Regex estrito para CEP brasileiro: 00000-000 ou 00000000
export const cepRegex = /^\d{5}-?\d{3}$/;

// Função de sanitização de texto contra injeção e caracteres maliciosos
export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .replace(/[<>]/g, "") // Remove tags HTML/scripts
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove caracteres de controle
    .trim();
}

/**
 * Validação para busca de preços em tempo real
 */
export const searchQuerySchema = z.object({
  query: z
    .string({
      required_error: "O termo de busca é obrigatório.",
    })
    .min(2, "O termo de busca deve conter pelo menos 2 caracteres.")
    .max(150, "O termo de busca não pode exceder 150 caracteres.")
    .transform(sanitizeText)
    .refine((val) => val.length >= 2, {
      message: "Termo de busca inválido após sanitização.",
    }),
  cep: z
    .string({
      required_error: "O CEP é obrigatório para cálculo de frete.",
    })
    .regex(cepRegex, "Formato de CEP inválido. Use o padrão 00000-000."),
  physicalStorePrice: z
    .number()
    .positive("O preço na loja física deve ser um valor positivo.")
    .optional(),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

/**
 * Validação para imagem de etiqueta (Visão Computacional)
 */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const visionPayloadSchema = z.object({
  // Suporte a Data URL base64 ou string base64 pura
  imageBase64: z
    .string({
      required_error: "A imagem é obrigatória.",
    })
    .refine(
      (val) => {
        // Se for data URL, valida o MIME
        if (val.startsWith("data:")) {
          const mimeMatch = val.match(/^data:([^;]+);base64,/);
          if (!mimeMatch) return false;
          const mime = mimeMatch[1];
          return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
        }
        return true; // Se for base64 puro, validamos pelo mimeType informado à parte
      },
      {
        message: "Tipo de arquivo inválido. Permitido apenas JPEG, PNG ou WEBP.",
      }
    )
    .refine(
      (val) => {
        // Cálculo aproximado do tamanho em bytes do base64: (length * 3) / 4
        const pureBase64 = val.includes(",") ? val.split(",")[1] : val;
        const sizeInBytes = (pureBase64.length * 3) / 4;
        return sizeInBytes <= MAX_FILE_SIZE_BYTES;
      },
      {
        message: "O arquivo excede o limite máximo permitido de 5MB.",
      }
    ),
  mimeType: z
    .enum(ALLOWED_MIME_TYPES, {
      errorMap: () => ({
        message: "Tipo MIME inválido. Permitido apenas image/jpeg, image/png ou image/webp.",
      }),
    })
    .optional(),
});

export type VisionPayloadInput = z.infer<typeof visionPayloadSchema>;

/**
 * Schema para o output estrito retornado pela LLM de visão
 */
export const visionLLMOutputSchema = z.object({
  success: z.boolean(),
  brand: z.string().optional().default(""),
  model: z.string().optional().default(""),
  full_query: z.string(),
  confidence_score: z.number().min(0).max(1),
  detected_price: z.number().optional().nullable(),
  notes: z.string().optional(),
});

export type VisionLLMOutput = z.infer<typeof visionLLMOutputSchema>;
