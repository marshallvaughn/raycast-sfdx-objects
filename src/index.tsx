import { Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { QueryResult, Record } from "jsforce";
import { AuthInfo, Connection, ConfigAggregator, OrgConfigProperties } from "@salesforce/core";

process.env.SFDX_USE_GENERIC_UNIX_KEYCHAIN = 'true';
const fieldKeys = [
  'Id',
  'KeyPrefix',
  'Description',
  'DeveloperName',
  'QualifiedApiName',
  'DurableId',
  'EditDefinitionUrl',
  'EditUrl',
  'MasterLabel',
  'NamespacePrefix',
  'PluralLabel'
];
interface EntityDefinition extends Record {
  Id: string;
  KeyPrefix: string | 'N/A';
  Description: string;
  DeveloperName: string;
  QualifiedApiName: string;
  DurableId: string;
  EditDefinitionUrl: string;
  EditUrl: string;
  MasterLabel: string;
  NamespacePrefix: string;
  PluralLabel: string;
}
const soqlQuery = `SELECT ${fieldKeys.join(', ')} FROM EntityDefinition ORDER BY QualifiedApiName, KeyPrefix, NamespacePrefix LIMIT 10`;


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
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label title="QualifiedApiName" text={props.item.QualifiedApiName} />

              <List.Item.Detail.Metadata.Separator />

              {/* <List.Item.Detail.Metadata.Label title="MasterLabel" text={props.item.MasterLabel} />
              <List.Item.Detail.Metadata.Label title="PluralLabel" text={props.item.PluralLabel} /> */}

              <List.Item.Detail.Metadata.Separator />

              {/* <List.Item.Detail.Metadata.Label title="DurableId" text={props.item.DurableId} /> */}
              {/* <List.Item.Detail.Metadata.Label title="EditUrl" text={props.item.EditUrl} /> */}

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Link title="Edit Definition" text="Open Edit URL" target={props.item.EditDefinitionUrl} />
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

async function runQuery(): Promise<QueryResult<EntityDefinition>> {
  console.log(ConfigAggregator.getValue('defaultusername'));
  const sfdxUsername = await getDefaultDevHubUsername();
  console.log(`using defaultdevhubusername: ${sfdxUsername}`);
  const connection = await Connection.create({ authInfo: await AuthInfo.create({ username: 'devhub@marshallvaughn.com' }) });
  return await connection.tooling.query(soqlQuery);
}