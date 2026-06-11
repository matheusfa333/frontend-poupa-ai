"use client";

import { Transaction } from "@/types/transaction";
import {
  TRANSACTION_TYPE_LABELS,
  CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/types/transaction";
import { formatCurrency, formatDateShort, parseDateOnly } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CircleDollarSign,
  MoreHorizontal,
  CreditCard,
  TrendingUp,
  Wallet,
  Repeat,
} from "lucide-react";

import { DeleteDialog } from "./delete-dialog";
import { CreateTransactionData } from "@/lib/validator/transaction";
import { TransactionForm } from "./TransactionForm";
import { Pagination } from "@/components/ui/pagination";

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdate: (id: string, data: CreateTransactionData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
}

export function TransactionTable({
  transactions,
  onUpdate,
  onDelete,
  onRefresh,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
}: TransactionTableProps) {
  // Ordenar transações por data (mais recente primeiro)
  const sortedTransactions = [...transactions].sort(
    (a, b) => parseDateOnly(b.date).getTime() - parseDateOnly(a.date).getTime()
  );

  // Calcular paginação
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);


  // Função para retornar o ícone baseado no método de pagamento
  const getPaymentIcon = (transaction: Transaction) => {
    const iconClass = "w-4 h-4";

    if (transaction.recurringTransactionId) {
      return <Repeat className={iconClass} />;
    }

    const iconMap: Record<string, React.ReactElement> = {
      PIX: <CircleDollarSign className={iconClass} />,
      BOLETO: <CreditCard className={iconClass} />,
      CARTAO: <CreditCard className={iconClass} />,
      TRANSFERENCIA: <TrendingUp className={iconClass} />,
      DINHEIRO: <Wallet className={iconClass} />,
    };

    return iconMap[transaction.paymentMethod] || <MoreHorizontal className={iconClass} />;
  };

  // Função para retornar a cor do ícone baseado no tipo (sem fundo)
  const getIconColor = (type: string) => {
    switch (type) {
      case "INCOME":
        return "text-green";
      case "EXPENSE":
        return "text-red";
      case "INVESTMENT":
        return "text-gray";
      default:
        return "text-gray";
    }
  };

  function getTypeVariant(type: Transaction["type"]) {
    switch (type) {
      case "INCOME":
        return "default"; // Verde
      case "EXPENSE":
        return "destructive"; // Vermelho
      case "INVESTMENT":
        return "secondary"; // Azul/Cinza
      default:
        return "outline";
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-dark-gray bg-white dark:bg-background-02 p-12 text-center">
        <p className="text-gray text-lg">
          Nenhuma transação encontrada.
          <br />
          <span className="text-sm">
            Comece adicionando sua primeira transação!
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-dark-gray bg-white dark:bg-background-02 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-background-02">
          <TableRow className="border-gray-200 dark:border-dark-gray hover:bg-transparent">
            <TableHead className="text-gray dark:text-light-gray font-bold text-sm">
              Descrição
            </TableHead>
            <TableHead className="text-gray dark:text-light-gray font-bold text-sm">
              Tipo
            </TableHead>
            <TableHead className="text-gray dark:text-light-gray font-bold text-sm">
              Categoria
            </TableHead>
            <TableHead className="text-gray dark:text-light-gray font-bold text-sm">
              Método
            </TableHead>
            <TableHead className="text-gray dark:text-light-gray font-bold text-sm">
              Data
            </TableHead>
            <TableHead className="text-gray dark:text-light-gray font-bold text-sm text-right">
              Valor
            </TableHead>
            <TableHead className="text-gray dark:text-light-gray font-bold text-sm text-right">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTransactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              className="border-gray-200 dark:border-dark-gray hover:bg-gray-50 dark:hover:bg-dark-gray transition-colors"
            >
              <TableCell className="font-medium text-gray dark:text-white">
                <div className="flex items-center gap-3">
                  <div className={getIconColor(transaction.type)}>
                    {getPaymentIcon(transaction)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>{transaction.description}</span>
                    {transaction.recurringTransactionId && (
                      <div className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400">
                        <Repeat className="w-3 h-3" />
                        <span>Transação Fixa</span>
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={getTypeVariant(transaction.type)}
                  className="font-medium "
                >
                  {TRANSACTION_TYPE_LABELS[transaction.type]}
                </Badge>
              </TableCell>
              <TableCell className="text-gray dark:text-light-gray">
                {transaction.category
                  ? CATEGORY_LABELS[transaction.category]
                  : "-"}
              </TableCell>
              <TableCell className="text-gray dark:text-light-gray">
                {transaction.recurringTransactionId
                  ? "Fixa"
                  : PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
              </TableCell>
              <TableCell className="text-gray dark:text-light-gray">
                {formatDateShort(transaction.date)}
              </TableCell>
              <TableCell
                className={`text-right font-semibold text-base ${
                  transaction.type === "INCOME"
                    ? "text-green"
                    : transaction.type === "EXPENSE"
                    ? "text-red"
                    : "text-green"
                }`}
              >
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {!transaction.recurringTransactionId && (
                    <TransactionForm
                      transaction={transaction}
                      onSuccess={onRefresh}
                      onSubmit={(data) => onUpdate(transaction.id, data)}
                    />
                  )}
                  {transaction.recurringTransactionId && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                      Gerada automaticamente
                    </span>
                  )}
                  <DeleteDialog
                    transactionId={transaction.id}
                    transactionDescription={transaction.description}
                    onDelete={onDelete}
                    onSuccess={onRefresh}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Paginação */}
      {onPageChange && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          itemsPerPage={itemsPerPage}
          totalItems={sortedTransactions.length}
        />
      )}
    </div>
  );
}
