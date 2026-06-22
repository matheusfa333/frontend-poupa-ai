// src/app/(authenticated)/whatsapp-ai/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  MessageCircle,
  Bot,
  CheckCircle2,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { whatsappSchema, type WhatsAppFormData } from "@/lib/validator/profile";
import { getWhatsAppStatus, linkWhatsApp, unlinkWhatsApp } from "@/lib/api/profile";
import { maskWhatsAppNumber } from "@/lib/utils";

const BOT_NUMBER_DISPLAY = "+55 34 99668-8345";
const BOT_NUMBER_RAW = "5534996688345";

export default function WhatsappAiPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ isLinked: boolean; phoneNumber?: string }>({
    isLinked: false,
  });

  const form = useForm<WhatsAppFormData>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: { phoneNumber: "" },
  });

  const loadStatus = async () => {
    try {
      const result = await getWhatsAppStatus();
      setStatus({ isLinked: result.isLinked, phoneNumber: result.phoneNumber });
    } catch {
      // mantém status atual se a busca falhar
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleLink = async (data: WhatsAppFormData) => {
    setIsLoading(true);
    try {
      await linkWhatsApp(data.phoneNumber);
      toast.success("WhatsApp vinculado com sucesso!");
      await loadStatus();
    } catch (error) {
      toast.error("Erro ao vincular", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    setIsLoading(true);
    try {
      await unlinkWhatsApp();
      toast.success("WhatsApp desvinculado");
      form.reset();
      await loadStatus();
    } catch (error) {
      toast.error("Erro ao desvincular", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const whatsappUrl = `https://wa.me/${BOT_NUMBER_RAW}?text=${encodeURIComponent("Olá!")}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-01">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray dark:text-white flex items-center justify-center gap-3">
            <Bot className="h-8 w-8 text-green" />
            PoupaAI Zap
          </h1>
          <p className="text-gray dark:text-gray-400">
            Vincule seu número para registrar transações pelo WhatsApp.
          </p>
        </div>

        <Card className="shadow-xl border-light-gray dark:border-dark-gray">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green" />
                Status da vinculação
              </span>
              {status.isLinked ? (
                <span className="flex items-center gap-1 text-green text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Vinculado
                </span>
              ) : (
                <span className="text-sm text-gray-500">Não vinculado</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status.isLinked ? (
              <>
                <p className="text-sm text-gray dark:text-gray-300">
                  Número vinculado: <strong>{status.phoneNumber}</strong>
                </p>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full h-12 bg-green hover:bg-green/90 text-white">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Abrir conversa com o bot
                  </Button>
                </a>
                <Button variant="destructive" className="w-full" onClick={handleUnlink} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Desvincular WhatsApp
                </Button>
              </>
            ) : (
              <form onSubmit={form.handleSubmit(handleLink)} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Seu número de WhatsApp</Label>
                  <Input
                    id="phoneNumber"
                    inputMode="numeric"
                    value={form.watch("phoneNumber")}
                    onChange={(e) =>
                      form.setValue("phoneNumber", maskWhatsAppNumber(e.target.value), {
                        shouldValidate: true,
                      })
                    }
                    placeholder="+55 (34) 99763-3889"
                  />
                  {form.formState.errors.phoneNumber && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.phoneNumber.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Digite com DDD e o 9 na frente do número, ex: +55 (34) 99763-3889
                  </p>
                </div>
                <Button type="submit" className="w-full h-12 bg-green hover:bg-green/90 text-white" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Vincular WhatsApp
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Separator />

        <Card className="border-light-gray dark:border-dark-gray">
          <CardHeader>
            <CardTitle className="text-lg">Como usar</CardTitle>
            <CardDescription>
              Depois de vincular, envie mensagens de texto para {BOT_NUMBER_DISPLAY}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray dark:text-gray-300">
            <div className="flex items-start gap-3">
              <TrendingDown className="h-4 w-4 text-green mt-0.5" />
              <span>&quot;Gastei 50 com almoço&quot; — registra uma despesa</span>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-4 w-4 text-green mt-0.5" />
              <span>&quot;Recebi 1200 de salário&quot; — registra uma receita</span>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-4 w-4 text-green mt-0.5" />
              <span>&quot;Saldo&quot; — consulta seu saldo atual</span>
            </div>
            <div className="flex items-start gap-3 pt-2">
              <ShieldCheck className="h-4 w-4 text-green mt-0.5" />
              <span>O bot só responde ao número vinculado à sua conta.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
