function printPlaceholder(commandName: string): void {
  console.log(`Not implemented yet: ${commandName}`);
}

export function doctorCommand(): void {
  printPlaceholder("doctor");
}

export function variantsCommand(): void {
  printPlaceholder("variants");
}

export function devicesCommand(): void {
  printPlaceholder("devices");
}

export function useCommand(_variantOrAlias: string): void {
  printPlaceholder("use");
}

export function deviceCommand(_deviceId: string): void {
  printPlaceholder("device");
}

export function runCommand(_variantOrAlias?: string): void {
  printPlaceholder("run");
}

export function logsCommand(_variantOrAlias?: string): void {
  printPlaceholder("logs");
}

export function testCommand(_variantOrAlias?: string): void {
  printPlaceholder("test");
}

export function clearCommand(_variantOrAlias?: string): void {
  printPlaceholder("clear");
}

export function launchCommand(_variantOrAlias?: string): void {
  printPlaceholder("launch");
}

export function killCommand(_variantOrAlias?: string): void {
  printPlaceholder("kill");
}

export function uninstallCommand(_variantOrAlias?: string): void {
  printPlaceholder("uninstall");
}

export function screenshotCommand(_variantOrAlias?: string): void {
  printPlaceholder("screenshot");
}
