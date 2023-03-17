import { Record } from "jsforce";

export interface EntityDefinition extends Record {
  Id: string;
  KeyPrefix: string | "–";
  Description: string;
  DeveloperName: string;
  QualifiedApiName: string;
  IsCustomizable: string;
  DurableId: string;
  EditDefinitionUrl: string;
  EditUrl: string;
  NewUrl: string;
  DetailUrl: string;
  MasterLabel: string;
  NamespacePrefix: string;
  PluralLabel: string;
}

export interface State {
  items?: EntityDefinition[];
  error?: Error;
}

export interface SetupUrlMapItem {
  name: SetupSubpath;
  label: string;
  icon: Icon;
}