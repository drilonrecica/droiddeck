export function lowerFirst(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value[0]!.toLowerCase() + value.slice(1);
}

export function upperFirst(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value[0]!.toUpperCase() + value.slice(1);
}

export function taskPartToVariantName(taskNamePart: string): string {
  return lowerFirst(taskNamePart);
}

export function variantNameToTaskPart(variantName: string): string {
  return upperFirst(variantName);
}
