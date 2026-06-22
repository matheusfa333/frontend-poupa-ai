import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "O nome é obrigatório")
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "O nome deve conter apenas letras"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "A senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(1, "A nova senha é obrigatória")
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número"
      ),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "A nova senha deve ser diferente da senha atual",
    path: ["newPassword"],
  });

export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const whatsappSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "O número do WhatsApp é obrigatório")
    .transform((val) => val.replace(/\D/g, "")) // Remove caracteres não numéricos primeiro
    .refine(
      (val) => val.length === 12 || val.length === 13,
      "O número deve ter 12 ou 13 dígitos no formato: 5534997633889"
    )
    .refine(
      (val) => /^55[1-9][0-9]9?\d{8}$/.test(val),
      "Formato inválido. Use: 55 + DDD + (9) + 8 dígitos do número (ex: 5534997633889)"
    ),
});

export type WhatsAppFormData = z.infer<typeof whatsappSchema>;
