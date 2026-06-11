export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'INVESTMENT';

export interface RecurringTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: string;
  paymentMethod: string | null;
  amount: number; // Em centavos
  description: string | null;
  frequency: RecurrenceFrequency;
  startDate: string; // ISO string
  endDate: string | null; // ISO string
  dayOfMonth: number | null; // 1-28 para MONTHLY
  dayOfWeek: number | null; // 0-6 para WEEKLY
  active: boolean;
  lastProcessed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListRecurringTransactionsResponse {
  recurringTransactions: RecurringTransaction[];
}

export interface CreateRecurringTransactionData {
  type: TransactionType;
  category: string;
  paymentMethod?: string;
  amount: number; // Em reais (será convertido para centavos)
  description?: string;
  frequency: RecurrenceFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  dayOfMonth?: number;
  dayOfWeek?: number;
}

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
};

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};
