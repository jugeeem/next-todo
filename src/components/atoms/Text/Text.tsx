import { BaseComponentProps } from "@/types/components";

interface TextProps extends BaseComponentProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "default" | "muted" | "primary" | "danger";
  weight?: "normal" | "medium" | "bold";
  as?: "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "label";
}

export const Text: React.FC<TextProps> = ({
  children,
  size = "md",
  color = "default",
  weight = "normal",
  as: Component = "p",
  className,
  testId,
  ...props
}) => {
  // サイズに応じたCSSクラスを決める
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  // 色に応じたCSSクラスを決める
  const colorClasses = {
    default: "text-gray-900",
    muted: "text-gray-500",
    primary: "text-blue-600",
    danger: "text-red-600",
  };

  // フォントウェイトに応じたCSSクラスを決める
  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    bold: "font-bold",
  };

  const classes = [
    sizeClasses[size],
    colorClasses[color],
    weightClasses[weight],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component 
        className={classes} 
        data-testid={testId} 
        {...props}
    >
        {children}
    </Component>
  );
};
