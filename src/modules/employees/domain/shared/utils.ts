export function isAValidDate(value: string): boolean {
    const date = Date.parse(value);

    if (isNaN(date)) {
        return false;
    }
    return true;
}


export function isAValidGuid(value: string): boolean {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(value);
}