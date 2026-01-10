/**
 * Stripe Products and Prices Configuration
 * This file defines all available services and their pricing
 */

export const BARBERSHOP_SERVICES = {
  HAIRCUT: {
    id: "haircut",
    name: "Corte de Cabelo",
    description: "Corte de cabelo profissional",
    price: 2500, // 25.00 USD in cents
    currency: "usd",
    duration: 30, // minutes
  },
  HAIR_AND_EYEBROW: {
    id: "hair_eyebrow",
    name: "Cabelo e Sobrancelha",
    description: "Corte de cabelo com aparação de sobrancelha",
    price: 3000, // 30.00 USD in cents
    currency: "usd",
    duration: 45, // minutes
  },
  FULL_SERVICE: {
    id: "full_service",
    name: "Serviço Completo",
    description: "Corte de cabelo, aparação de sobrancelha e barba",
    price: 4000, // 40.00 USD in cents
    currency: "usd",
    duration: 60, // minutes
  },
} as const;

export type ServiceKey = keyof typeof BARBERSHOP_SERVICES;
export type Service = (typeof BARBERSHOP_SERVICES)[ServiceKey];

/**
 * Get service by ID
 */
export function getServiceById(id: string): Service | undefined {
  return Object.values(BARBERSHOP_SERVICES).find((service) => service.id === id);
}

/**
 * Get service by name
 */
export function getServiceByName(name: string): Service | undefined {
  const normalized = name.toLowerCase();
  return Object.values(BARBERSHOP_SERVICES).find(
    (service) => service.name.toLowerCase() === normalized || service.id === normalized
  );
}

/**
 * Get all services
 */
export function getAllServices(): Service[] {
  return Object.values(BARBERSHOP_SERVICES);
}

/**
 * Format price for display (USD)
 */
export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}
