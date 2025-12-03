export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validatePrice = (price: number): boolean => {
  return price > 0 && price < 1000000
}

export const validateQuantity = (quantity: number, stock: number): boolean => {
  return quantity > 0 && quantity <= stock
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}

