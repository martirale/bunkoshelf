import clsx from "clsx";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "light" | "dark" | "accent" | "lightAlt" | "destructive";
type ButtonSize = "default" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  light:
    "border-pearl bg-pearl text-onix hover:border-lilah hover:bg-lilah hover:text-pearl",
  dark: "border-blackamber bg-blackamber text-sand hover:border-sand hover:bg-sand hover:text-onix",
  accent:
    "border-lilah bg-lilah text-pearl hover:border-pearl hover:bg-pearl hover:text-onix",
  lightAlt:
    "border-sand bg-sand text-onix hover:border-blackamber hover:bg-blackamber hover:text-sand",
  destructive:
    "border-danger-alt bg-danger-alt text-pearl hover:border-blackamber hover:bg-blackamber hover:text-danger-alt",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "light", size = "default", className, ...props }, ref) => (
    <button
      ref={ref}
      {...props}
      className={clsx(
        "inline-flex cursor-pointer items-center justify-center rounded-lg border font-bold uppercase leading-none transition-all duration-300",
        variantStyles[variant],
        size === "icon" && "size-10 p-0",
        className,
      )}
    />
  ),
);

Button.displayName = "Button";

export default Button;
