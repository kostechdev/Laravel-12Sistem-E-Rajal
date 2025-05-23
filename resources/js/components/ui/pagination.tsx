import * as React from "react";
import { cn } from "@/lib/utils";

const Pagination = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
));
Pagination.displayName = "Pagination";

const PaginationItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
  }
>(({ className, active, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-8 min-w-8 items-center justify-center rounded-md border px-3 text-sm",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
      props.disabled && "pointer-events-none opacity-50",
      className
    )}
    {...props}
  />
));
PaginationItem.displayName = "PaginationItem";

const PaginationEllipsis = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("flex h-8 w-8 items-center justify-center", className)}
    {...props}
  >
    <span className="text-sm">...</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

// Create a new type that extends the Pagination component with Item and Ellipsis properties
type PaginationWithExtras = typeof Pagination & {
  Item: typeof PaginationItem;
  Ellipsis: typeof PaginationEllipsis;
};

// Export components
export { PaginationItem, PaginationEllipsis };

// Add Item and Ellipsis as properties and cast to the extended type
(Pagination as PaginationWithExtras).Item = PaginationItem;
(Pagination as PaginationWithExtras).Ellipsis = PaginationEllipsis;

// Export the enhanced Pagination component
export { Pagination as default };
export { Pagination };
