import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number) {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .map((item) => stripUndefined(item))
      .filter((item) => item !== undefined) as unknown as T;
  }

  // Handle complex objects (like Firestore FieldValue)
  const prototype = Object.getPrototypeOf(obj);
  if (prototype !== null && prototype !== Object.prototype) {
    return obj;
  }

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as any)[key];
      if (value !== undefined) {
        const strippedValue = stripUndefined(value);
        if (strippedValue !== undefined) {
          result[key] = strippedValue;
        }
      }
    }
  }

  return result as T;
}
