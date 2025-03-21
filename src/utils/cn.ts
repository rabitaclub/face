import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function for constructing class names conditionally.
 * It combines clsx for conditional class joining with tailwind-merge to handle Tailwind CSS conflicts.
 * 
 * @example cn("px-2 py-1", true && "bg-blue-500", false && "text-gray-500")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 