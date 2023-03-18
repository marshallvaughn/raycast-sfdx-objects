import { Record } from "jsforce";
import { Icon } from "@raycast/api";

export interface EntityDefinition extends Record {
  Description: string;
  DetailUrl: string;
  DeveloperName: string;
  DurableId: string;
  EditDefinitionUrl: string;
  EditUrl: string;
  Id: string;
  IsCustomizable: string;
  KeyPrefix: string | "–";
  MasterLabel: string;
  NamespacePrefix: string;
  NewUrl: string;
  PluralLabel: string;
  QualifiedApiName: string;
}

export interface FieldDefinition extends Record {
  Id: string;
  DeveloperName: string;
  Label: string;
  Type: string;
  Length: number;
  Precision: number;
  Scale: number;
  QualifiedApiName: string;
  IsCustom: boolean;
}

export interface State {
  items?: EntityDefinition[] | FieldDefinition[];
  error?: Error;
}

export type SetupSubpath =
  | "FieldsAndRelationships"
  | "LightningPages"
  | "Details"
  | "Layouts"
  | "Limits"
  | "Triggers"
  | "FlowTriggers"
  | "ValidationRules";

export interface SetupUrlMapItem {
  name: SetupSubpath;
  label: string;
  icon: Icon;
}
