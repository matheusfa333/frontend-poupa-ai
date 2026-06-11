"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { registerSchema, type RegisterFormData } from "@/lib/validator/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api/config";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = form.watch("password");
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[!@#$%^&*]/.test(pass)) strength++;

    const levels = [
      { strength: 1, label: "Fraca", color: "bg-red-500" },
      { strength: 2, label: "Média", color: "bg-yellow-500" },
      { strength: 3, label: "Forte", color: "bg-green-500" },
      { strength: 4, label: "Muito Forte", color: "bg-green-600" },
    ];

    return levels.find((l) => l.strength === strength) || levels[0];
  };

  const passwordStrength = getPasswordStrength(password);

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, acceptTerms, ...registerData } = data;

      const response = await fetch(
        `${API_BASE_URL}/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || "Erro ao cadastrar usuário";

        // Toast específico para email duplicado
        if (errorMessage.toLowerCase().includes("já existe") || errorMessage.toLowerCase().includes("já cadastrado")) {
          toast.error("Este e-mail já está cadastrado", {
            description: "Por favor, use outro e-mail ou faça login"
          });
        } else {
          toast.error("Erro ao criar conta", {
            description: errorMessage
          });
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ Cadastro realizado com sucesso:", result);


      toast.success("Conta criada com sucesso!", {
        description: "Você será redirecionado para fazer login"
      });

      router.push("/login");
    } catch (error) {
      console.error("❌ Erro no cadastro:", error instanceof Error ? error.message : error);
      // Toast já foi mostrado dentro do if (!response.ok)
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-white">Crie sua conta</h1>
        <p className="text-base text-gray-400 leading-relaxed">
          Comece a gerenciar suas finanças de forma inteligente com a ajuda da
          IA. Experimente gratuitamente e escolha o plano ideal para você!
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-medium text-[#39BE00]">
          Faça seu cadastro
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Nome Completo */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-400">
                    Nome Completo
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Digite seu nome completo"
                      disabled={isLoading}
                      autoComplete="name"
                      className="h-14 bg-white border-gray-300 text-gray placeholder:text-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-400">
                    E-mail
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Digite seu e-mail"
                      disabled={isLoading}
                      autoComplete="email"
                      className="h-14 bg-white border-gray-300 text-gray placeholder:text-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            {/* Senha */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-400">Senha</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Crie uma senha forte"
                          disabled={isLoading}
                          autoComplete="new-password"
                          className="h-14 bg-white border-gray-300 text-gray placeholder:text-gray-400 pr-12"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      {/* Indicador de Força da Senha */}
                      {password && (
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-colors ${
                                  level <= passwordStrength.strength
                                    ? passwordStrength.color
                                    : "bg-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-400">
                            Força: {passwordStrength.label}
                          </p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            {/* Confirmar Senha */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-400">
                    Confirmar Senha
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Digite a senha novamente"
                        disabled={isLoading}
                        autoComplete="new-password"
                        className="h-14 bg-white border-gray-300 text-gray placeholder:text-gray pr-12"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray hover:text-gray transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            {/* Termos de Uso */}
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm text-gray font-normal cursor-pointer">
                      Eu aceito os{" "}
                      <Link
                        href="#"
                        className="text-[#39BE00] hover:underline"
                        target="_blank"
                      >
                        termos de uso
                      </Link>{" "}
                      e a{" "}
                      <Link
                        href="#"
                        className="text-[#39BE00] hover:underline"
                        target="_blank"
                      >
                        política de privacidade
                      </Link>
                    </FormLabel>
                    <FormMessage className="text-red-500 text-sm" />
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#39BE00] hover:bg-[#2da000] text-white text-base font-medium rounded transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Criar Conta
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="space-y-4">
          <p className="text-base text-gray text-center">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-[#39BE00] hover:underline"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
