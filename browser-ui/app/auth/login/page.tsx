"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LOGIN_FORM_SCHEMA, LoginFormSchema } from "@/lib/form-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconEyeClosed, IconEyeFilled } from "@tabler/icons-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormSchema>({
    resolver: zodResolver(LOGIN_FORM_SCHEMA),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormSchema) => {
    // Handle login logic here
    console.log(data);
    // Example: await login(data.email, data.password);
  };

  return (
    <div className="min-w-screen min-h-screen flex justify-center items-center bg-background">
      <div className="flex flex-col gap-6 max-w-sm">
        <Card className="w-full">
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <FieldSet>
                  <p className="text-3xl text-center">Login</p>
                  <FieldDescription className="text-center">
                    Enter your credentials to access your account
                  </FieldDescription>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        {...register("email")}
                        disabled={isSubmitting}
                      />
                      <FieldError errors={errors.email} />
                    </Field>
                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 text-xs h-auto font-normal"
                          onClick={() => {
                            // Handle forgot password logic
                            console.log("Forgot password clicked");
                          }}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...register("password")}
                          disabled={isSubmitting}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <IconEyeClosed className="h-4 w-4" />
                          ) : (
                            <IconEyeFilled className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FieldError errors={errors.password} />
                    </Field>
                    <Field>
                      <Button type="submit">Login</Button>
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <FieldDescription className="px-6 text-center">
          By logging in, you agree to our{" "}
          <Button variant="link" className="p-0 h-auto text-xs">
            Terms & Conditions
          </Button>{" "}
          and{" "}
          <Button variant="link" className="p-0 h-auto text-xs">
            Privacy Policy
          </Button>
        </FieldDescription>
      </div>
    </div>
  );
}
