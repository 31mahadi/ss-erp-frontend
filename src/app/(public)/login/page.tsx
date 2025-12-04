"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n/i18n";
import { useLogin } from "@/modules/auth/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "01.mahadi@gmail.com",
      password: "SuperAdmin@123",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await loginMutation.mutateAsync({ email: data.email, password: data.password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom duration-500">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-xl font-bold text-primary-foreground">SS</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SS ERP</h1>
              <p className="text-xs text-muted-foreground">Enterprise Resource Planning</p>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-border/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">{t("auth.login")}</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the system
            </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...register("email")}
                disabled={loginMutation.isPending}
                  className="h-11 transition-shadow focus:shadow-sm"
              />
                {errors.email && (
                  <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    {errors.email.message}
                  </p>
                )}
            </div>
            <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  disabled={loginMutation.isPending}
                    className="h-11 pr-10 transition-shadow focus:shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none disabled:opacity-50 transition-colors"
                  disabled={loginMutation.isPending}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                  <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    {errors.password.message}
                  </p>
              )}
            </div>
            {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200">
                {error}
              </div>
            )}
              <Button 
                type="submit" 
                className="w-full h-11 font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {t("common.loading")}
                  </span>
                ) : (
                  t("auth.login")
                )}
            </Button>
          </form>
        </CardContent>
      </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} SS ERP. All rights reserved.
        </p>
      </div>
    </div>
  );
}
