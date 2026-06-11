"use client";

import { useState, useEffect } from "react";
import {
  listRecurringTransactions,
  createRecurringTransaction,
  toggleRecurringTransaction,
  deleteRecurringTransaction,
} from "@/lib/api/recurring-transaction";
import {
  RecurringTransaction,
  FREQUENCY_LABELS,
  DAY_OF_WEEK_LABELS,
  CreateRecurringTransactionData,
} from "@/types/recurring-transaction";
import { formatCurrency, centsToReais, getTodayISO, formatDateShort } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Power, Trash2, Repeat, DollarSign, Calendar, FileText, Tag, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type RecurringTypeFilter = "ALL" | RecurringTransaction["type"];

const recurringTypeFilters: Array<{
  value: RecurringTypeFilter;
  label: string;
}> = [
  { value: "ALL", label: "Todas" },
  { value: "INCOME", label: "Receitas" },
  { value: "INVESTMENT", label: "Investimentos" },
  { value: "EXPENSE", label: "Despesas" },
];

const recurringTypeOrder: Record<RecurringTransaction["type"], number> = {
  INCOME: 0,
  INVESTMENT: 1,
  EXPENSE: 2,
};

export default function RecurringTransactionsPage() {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState("");
  const [typeFilter, setTypeFilter] = useState<RecurringTypeFilter>("ALL");
  const [formData, setFormData] = useState<CreateRecurringTransactionData>({
    type: "EXPENSE",
    category: "ALIMENTACAO",
    amount: 0,
    frequency: "MONTHLY",
    startDate: getTodayISO(),
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await listRecurringTransactions();
      console.log('✅ Transações carregadas:', data);
      setTransactions(data.recurringTransactions || []);
    } catch (error) {
      console.error("Erro ao carregar transações fixas:", error);
      toast.error("Erro ao carregar transações fixas", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
      // Se falhar ao carregar, define array vazio para evitar erros na UI
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, "");

    if (!numbersOnly) {
      setAmountDisplay("");
      setFormData({ ...formData, amount: 0 });
      return;
    }

    const amount = parseInt(numbersOnly, 10) / 100;
    const formatted = amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    setAmountDisplay(formatted);
    setFormData({ ...formData, amount });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = getTodayISO();

    // Validar amount
    if (!formData.amount || formData.amount <= 0 || isNaN(formData.amount)) {
      toast.warning("Valor inválido", {
        description: "Por favor, insira um valor maior que zero"
      });
      return;
    }

    // Validar campos obrigatórios por frequência
    if (formData.frequency === "MONTHLY" && !formData.dayOfMonth) {
      toast.warning("Campo obrigatório", {
        description: "Selecione o dia do mês para transações mensais"
      });
      return;
    }

    if (
      formData.frequency === "MONTHLY" &&
      formData.dayOfMonth &&
      (formData.dayOfMonth < 1 || formData.dayOfMonth > 28)
    ) {
      toast.warning("Dia do mês inválido", {
        description: "Escolha um dia entre 1 e 28 para evitar meses sem esse dia"
      });
      return;
    }

    if (formData.frequency === "WEEKLY" && formData.dayOfWeek === undefined) {
      toast.warning("Campo obrigatório", {
        description: "Selecione o dia da semana para transações semanais"
      });
      return;
    }

    if (formData.startDate < today) {
      toast.warning("Data de início inválida", {
        description: "A data de início não pode ser anterior a hoje"
      });
      return;
    }

    if (formData.endDate && formData.endDate <= formData.startDate) {
      toast.warning("Data de fim inválida", {
        description: "A data de fim deve ser posterior à data de início"
      });
      return;
    }

    try {
      // Limpar campos não utilizados baseado na frequência
      const cleanedData = { ...formData };
      if (formData.frequency !== "MONTHLY") {
        delete cleanedData.dayOfMonth;
      }
      if (formData.frequency !== "WEEKLY") {
        delete cleanedData.dayOfWeek;
      }

      console.log('📋 Dados do formulário:', cleanedData);
      await createRecurringTransaction(cleanedData);

      toast.success("Transação fixa criada com sucesso!");

      setIsDialogOpen(false);
      loadTransactions();
      setFormData({
        type: "EXPENSE",
        category: "ALIMENTACAO",
        amount: 0,
        frequency: "MONTHLY",
        startDate: getTodayISO(),
      });
      setAmountDisplay("");
    } catch (error) {
      console.error('Erro completo:', error);
      toast.error("Erro ao criar transação fixa", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleRecurringTransaction(id);

      toast.success("Status alterado com sucesso");

      loadTransactions();
    } catch (error) {
      toast.error("Erro ao alterar status", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente deletar esta transação fixa?")) return;
    try {
      await deleteRecurringTransaction(id);

      toast.success("Transação fixa excluída");

      loadTransactions();
    } catch (error) {
      toast.error("Erro ao excluir transação fixa", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "INCOME":
        return "Receita";
      case "EXPENSE":
        return "Despesa";
      case "INVESTMENT":
        return "Investimento";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INCOME":
        return "text-green dark:text-green-400";
      case "EXPENSE":
        return "text-red-500 dark:text-red-400";
      case "INVESTMENT":
        return "text-blue-500 dark:text-blue-400";
      default:
        return "";
    }
  };

  const displayedTransactions = [...transactions]
    .filter((transaction) =>
      typeFilter === "ALL" ? true : transaction.type === typeFilter
    )
    .sort((a, b) => {
      const typeDiff = recurringTypeOrder[a.type] - recurringTypeOrder[b.type];

      if (typeDiff !== 0) {
        return typeDiff;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transações Fixas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green hover:bg-green/90">
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação Fixa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Repeat className="h-6 w-6 text-green" />
                Nova Transação Fixa
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Configure uma transação que se repete automaticamente
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              {/* Seção: Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Informações Básicas
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span>Tipo</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value as CreateRecurringTransactionData['type'] })
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Receita</SelectItem>
                        <SelectItem value="EXPENSE">Despesa</SelectItem>
                        <SelectItem value="INVESTMENT">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span>Categoria</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALIMENTACAO">Alimentação</SelectItem>
                        <SelectItem value="TRANSPORTE">Transporte</SelectItem>
                        <SelectItem value="LAZER">Lazer</SelectItem>
                        <SelectItem value="SAUDE">Saúde</SelectItem>
                        <SelectItem value="EDUCACAO">Educação</SelectItem>
                        <SelectItem value="MORADIA">Moradia</SelectItem>
                        <SelectItem value="VESTUARIO">Vestuário</SelectItem>
                        <SelectItem value="SALARIO">Salário</SelectItem>
                        <SelectItem value="FREELANCE">Freelance</SelectItem>
                        <SelectItem value="INVESTIMENTO">Investimento</SelectItem>
                        <SelectItem value="PRESENTE">Presente</SelectItem>
                        <SelectItem value="OUTROS">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Valor</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-white font-semibold">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={amountDisplay}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0,00"
                      className="h-11 pl-12 text-lg font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Descrição</span>
                  </Label>
                  <Input
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Ex: Aluguel, Netflix, Academia..."
                    className="h-11"
                  />
                </div>
              </div>

              {/* Seção: Recorrência */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Configuração de Recorrência
                </h3>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span>Frequência</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, frequency: value as CreateRecurringTransactionData['frequency'] })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Diário</SelectItem>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                      <SelectItem value="YEARLY">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.frequency === "MONTHLY" && (
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-muted">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Dia do Mês</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="28"
                      value={formData.dayOfMonth || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dayOfMonth: parseInt(e.target.value),
                        })
                      }
                      placeholder="Ex: 5"
                      className="h-11"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Escolha um dia entre 1 e 28
                    </p>
                  </div>
                )}

                {formData.frequency === "WEEKLY" && (
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-muted">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Dia da Semana</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.dayOfWeek?.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, dayOfWeek: parseInt(value) })
                      }
                      required
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DAY_OF_WEEK_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Seção: Período */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Período
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span>Data de Início</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      min={getTodayISO()}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Fim (opcional)</Label>
                    <Input
                      type="date"
                      value={formData.endDate || ""}
                      min={formData.startDate || getTodayISO()}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value || undefined })
                      }
                      className="h-11"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Se não definir uma data de fim, a transação continuará indefinidamente
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="min-w-[100px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-green hover:bg-green/90 min-w-[100px]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Transação
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {recurringTypeFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
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

        {transactions.length > 0 && (
          <p className="text-sm text-gray-500">
            Total: <span className="font-medium">{displayedTransactions.length}</span>{" "}
            {displayedTransactions.length === 1 ? "fixa" : "fixas"}
          </p>
        )}
      </div>

      {isLoading ? (
        <Card className="p-6">
          <p>Carregando...</p>
        </Card>
      ) : displayedTransactions.length === 0 ? (
        <Card className="p-6">
          <p className="text-gray-500 text-center">
            Nenhuma transação fixa cadastrada
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedTransactions.map((transaction) => (
            <Card key={transaction.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Repeat className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    {FREQUENCY_LABELS[transaction.frequency]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(transaction.id)}
                    className={transaction.active ? "" : "opacity-50"}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">{getTypeLabel(transaction.type)}</p>
                  <p className={`text-2xl font-bold ${getTypeColor(transaction.type)}`}>
                    {formatCurrency(centsToReais(transaction.amount))}
                  </p>
                </div>

                {transaction.description && (
                  <p className="text-sm">{transaction.description}</p>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <p>Categoria: {transaction.category}</p>
                  {transaction.dayOfMonth && (
                    <p>Dia do mês: {transaction.dayOfMonth}</p>
                  )}
                  {transaction.dayOfWeek !== null && (
                    <p>Dia da semana: {DAY_OF_WEEK_LABELS[transaction.dayOfWeek]}</p>
                  )}
                  <p>
                    Início:{" "}
                    {formatDateShort(transaction.startDate)}
                  </p>
                  {transaction.endDate && (
                    <p>
                      Fim: {formatDateShort(transaction.endDate)}
                    </p>
                  )}
                  <p className={transaction.active ? "text-green" : "text-red-500"}>
                    {transaction.active ? "Ativa" : "Inativa"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
