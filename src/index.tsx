import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { QueryResult, Record } from "jsforce";
import { AuthInfo, Connection, ConfigAggregator, OrgConfigProperties } from "@salesforce/core";

process.env.SFDX_USE_GENERIC_UNIX_KEYCHAIN = 'true';
const file = { baseUrl: '' };
const fieldKeys = [
  'Id',
  'KeyPrefix',
  'Description',
  'DeveloperName',
  'QualifiedApiName',
  'IsCustomizable',
  'DurableId',
  'EditDefinitionUrl',
  'EditUrl',
  'NewUrl',
  'DetailUrl',
  'MasterLabel',
  'NamespacePrefix',
  'PluralLabel'
];
interface EntityDefinition extends Record {
  Id: string;
  KeyPrefix: string | '–';
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
const soqlLimit = 500;
const soqlQuery = `SELECT ${fieldKeys.join(', ')} 
FROM EntityDefinition 
WHERE IsLayoutable = TRUE
ORDER BY QualifiedApiName, KeyPrefix, NamespacePrefix LIMIT ${soqlLimit}`;


interface State {
  items?: EntityDefinition[];
  error?: Error;
}

export default function Command(): JSX.Element {
  const [state, setState] = useState<State>({});
  useEffect(() => {
    async function fetchRecords() {
      try {
        const result = await runQuery();
        setState({ items: result.records });
      } catch (error) {
        setState({
          error: error instanceof Error ? error : new Error("Something went wrong")
        })
      }
    }
    fetchRecords();
  }, []);

  return (
    <List isLoading={!state.items && !state.error} isShowingDetail={true}>
      {state.items?.map((item, index) => (
        <RecordListItem key={item.Id} item={item} index={index} />
      ))}
    </List>
  );
}

interface SetupUrlMapItem {
  name: SetupSubpath;
  label: string;
  icon: Icon;
}

const setupUrlMap: SetupUrlMapItem[] = [
  {
    name: 'Details',
    label: 'Details',
    icon: Icon.Info
  },
  {
    name: 'FieldsAndRelationships',
    label: 'Fields & Relationships',
    icon: Icon.Filter
  },
  {
    name: 'Layouts',
    label: 'Layouts',
    icon: Icon.AppWindowList
  },
  {
    name: 'LightningPages',
    label: 'Lightning Pages',
    icon: Icon.AppWindowGrid3x3
  },
  {
    name: 'Limits',
    label: 'Limits',
    icon: Icon.Gauge
  },
  {
    name: 'Triggers',
    label: 'Triggers',
    icon: Icon.Bolt
  },
  {
    name: 'FlowTriggers',
    label: 'Flow Triggers',
    icon: Icon.Bolt
  }
]

function RecordListItem(props: { item: EntityDefinition, index: number }) {
  return (
    <List.Item
      title={props.item.QualifiedApiName}
      icon={Icon.Box}
      // subtitle={props.item.MasterLabel}
      id={props.item.DurableId}
      keywords={[props.item.KeyPrefix, props.item.QualifiedApiName, props.item.DurableId, props.item.DeveloperName, props.item.MasterLabel, props.item.PluralLabel]}
      accessories={[
        {
          text: props.item.KeyPrefix,
          tooltip: `KeyPrefix for ${props.item.QualifiedApiName} SObject`
        }
      ]}
      detail={
        <List.Item.Detail
          markdown={props.item.Description}
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Link title={`${props.item.QualifiedApiName} Setup`} text="Go to Setup" target={getSetupUrl(props.item)} />

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="KeyPrefix" text={props.item.KeyPrefix || '–'} />

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="QualifiedApiName" text={props.item.QualifiedApiName || '–'} />
              <List.Item.Detail.Metadata.Label title="MasterLabel" text={props.item.MasterLabel || '–'} />
              <List.Item.Detail.Metadata.Label title="PluralLabel" text={props.item.PluralLabel || '–'} />

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="Description" text={props.item.Description || '–'} />

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="NamespacePrefix" text={props.item.NamespacePrefix || '–'} />
              <List.Item.Detail.Metadata.Label title="DeveloperName" text={props.item.DeveloperName || '–'} />
              <List.Item.Detail.Metadata.Label title="DurableId" text={props.item.DurableId || '–'} />

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="DetailUrl" text={props.item.DetailUrl || '–'} />
              <List.Item.Detail.Metadata.Label title="EditUrl" text={props.item.EditUrl || '–'} />
              <List.Item.Detail.Metadata.Label title="NewUrl" text={props.item.NewUrl || '–'} />
            </List.Item.Detail.Metadata>
          }
        />
      }

      actions={
        <ActionPanel title={'Actions'}>
          <ActionPanel.Section title={`${props.item.QualifiedApiName} Setup`}>
            {
              setupUrlMap.map((item) => {
                return <Action.OpenInBrowser title={item.label} url={getSetupUrl(props.item, item.name)} icon={item.icon} />
              })
            }
          </ActionPanel.Section>
          <ActionPanel.Section title="Copy">
            <Action.CopyToClipboard
              title="Copy QualifiedApiName"
              content={props.item.QualifiedApiName}
            />
            <Action.CopyToClipboard
              title="Copy MasterLabel"
              content={props.item.MasterLabel}
            />
            <Action.CopyToClipboard
              title="Copy KeyPrefix"
              content={props.item.KeyPrefix}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  )
}

async function getDefaultDevHubUsername() {
  const { value } = (await ConfigAggregator.create()).getInfo(OrgConfigProperties.TARGET_DEV_HUB);
  return value as string;
}

type SetupSubpath = 'FieldsAndRelationships' | 'LightningPages' | 'Details' | 'Layouts' | 'Limits' | 'Triggers' | 'FlowTriggers' | 'ValidationRules'
function getSetupUrl(entity: EntityDefinition, setupSubpath: SetupSubpath): string {
  setupSubpath = setupSubpath || 'Details'
  return `${file.baseUrl}/lightning/setup/ObjectManager/${entity.QualifiedApiName}/${setupSubpath}/view`
}

async function runQuery(): Promise<QueryResult<EntityDefinition>> {
  const sfdxUsername = await getDefaultDevHubUsername();
  const connection = await Connection.create({ authInfo: await AuthInfo.create({ username: sfdxUsername }) });
  file.baseUrl = connection._baseUrl();
  file.baseUrl = file.baseUrl.replace(/.com\/.*/g, '.com')
  return await connection.tooling.query(soqlQuery);
}