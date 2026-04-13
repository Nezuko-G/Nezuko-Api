declare module "libphonenumber-js" {
  export function isValidPhoneNumber(
    phone: string,
    defaultCountry?: string,
  ): boolean;
}