export type AndroidVariant = {
  name: string;
  taskNamePart: string;
  buildType?: string;
  flavorName?: string;
  installTask?: string;
  assembleTask?: string;
  unitTestTask?: string;
  connectedTestTask?: string;
  applicationId?: string;
};
