import { Icon, List } from "@raycast/api";
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

  console.log(state.items + ' ' + state.error);

  return (
    <List isLoading={!state.items && !state.error} isShowingDetail={true}>
      {state.items?.map((item, index) => (
        <RecordListItem key={item.Id} item={item} index={index} />
      ))}
    </List>
  );
}

function RecordListItem(props: { item: EntityDefinition, index: number }) {
  return (
    <List.Item
      title={props.item.QualifiedApiName}
      icon={Icon.Box}
      subtitle='nope'
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
              <List.Item.Detail.Metadata.Label title="NewUrl" text={getSetupUrl(props.item) || '–'} />
            </List.Item.Detail.Metadata>
          }
        />
      }
    />
  )
}

async function getDefaultDevHubUsername() {
  const { value } = (await ConfigAggregator.create()).getInfo(OrgConfigProperties.TARGET_DEV_HUB);
  return value as string;
}

function getSetupUrl(entity: EntityDefinition): string {
  return `${file.baseUrl}/lightning/setup/ObjectManager/${entity.QualifiedApiName}/Details/view`
}

async function runQuery(): Promise<QueryResult<EntityDefinition>> {
  console.log(ConfigAggregator.getValue('defaultusername'));
  const sfdxUsername = await getDefaultDevHubUsername();
  console.log(`using defaultdevhubusername: ${sfdxUsername}`);
  const connection = await Connection.create({ authInfo: await AuthInfo.create({ username: 'devhub@marshallvaughn.com' }) });
  file.baseUrl = connection._baseUrl();
  file.baseUrl = file.baseUrl.replace(/.com\/.*/g, '.com')
  return await connection.tooling.query(soqlQuery);
}