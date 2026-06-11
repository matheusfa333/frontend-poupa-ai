"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Transaction } from "@/types/transaction";
import { CreateTransactionData } from "@/lib/validator/transaction";

import { TransactionTable } from "./components/transaction-table";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TransactionForm } from "./components/TransactionForm";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from "@/lib/api/transaction";

type TransactionTypeFilter = "ALL" | Transaction["type"];

const transactionTypeFilters: Array<{
  value: TransactionTypeFilter;
  label: string;
}> = [
  { value: "ALL", label: "Todas" },
  { value: "INCOME", label: "Receitas" },
  { value: "EXPENSE", label: "Despesas" },
  { value: "INVESTMENT", label: "Investimentos" },
];

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("ALL");
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredTransactions =
    typeFilter === "ALL"
      ? transactions
      : transactions.filter((transaction) => transaction.type === typeFilter);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listTransactions();
      setTransactions(response.transactions);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar transações";
      setError(errorMessage);

      // Se erro de autenticação, redireciona para login
      if (
        errorMessage.includes("autenticado") ||
        errorMessage.includes("401")
      ) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  async function handleCreate(data: CreateTransactionData) {
    await createTransaction(data);
    console.log("✅ Transação criada com sucesso");
  }

  async function handleUpdate(id: string, data: CreateTransactionData) {
    await updateTransaction(id, data);
    console.log("✅ Transação atualizada com sucesso");
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id);
    console.log("✅ Transação excluída com sucesso");
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    // Scroll suave para o topo da tabela
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-green mx-auto" />
          <p className="text-gray dark:text-light-gray">Carregando transações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Transações</h1>
          <p className="text-gray">
            Gerencie suas entradas, saídas e investimentos
          </p>
        </div>

        <div className="flex gap-3">
   
          <TransactionForm
            onSuccess={loadTransactions}
            onSubmit={handleCreate}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {transactionTypeFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => {
              setTypeFilter(filter.value);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              typeFilter === filter.value
                ? "border-green bg-green text-white"
                : "border-gray-200 dark:border-dark-gray bg-white dark:bg-background-02 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-gray"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Filtros e controles */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm text-gray dark:text-light-gray">
            Mostrar:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // Resetar para primeira página ao mudar itens por página
            }}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-gray rounded-md bg-white dark:bg-background-02 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray dark:text-light-gray">
            por página
          </span>
        </div>
        
        {transactions.length > 0 && (
          <p className="text-sm text-gray dark:text-light-gray">
            Total: <span className="font-medium">{filteredTransactions.length}</span>{" "}
            {filteredTransactions.length === 1 ? "transação" : "transações"}
          </p>
        )}
      </div>

      {/* Erro */}
      {error && (
        <Alert className="mb-6 border-red bg-red/10">
          <AlertCircle className="h-4 w-4 text-red" />
          <AlertTitle className="text-red">Erro</AlertTitle>
          <AlertDescription className="text-red">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabela de Transações */}
      <TransactionTable
        transactions={filteredTransactions}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={loadTransactions}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
