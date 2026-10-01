import { z } from "zod";

export const bankDetailsSchema = z.object({
  bank_name: z.string().trim().min(2, "Enter a bank name.").max(100),
  account_number: z.string().regex(/^\d{10}$/, "Enter a 10-digit account number."),
  account_name: z.string().trim().min(2, "Enter the account holder's name.").max(120),
});