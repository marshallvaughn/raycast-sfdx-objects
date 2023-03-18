import { Action, ActionPanel, Icon, List, Cache, Detail, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { QueryResult } from "jsforce";
import { AuthInfo, Connection, ConfigAggregator, OrgConfigProperties } from "@salesforce/core";
import { EntityDefinition, FieldDefinition, State, SetupUrlMapItem, SetupSubpath } from "./types";

process.env.SFDX_USE_GENERIC_UNIX_KEYCHAIN = "true";

const cache = new Cache();
console.log("Starting...");
let connection: Connection;

export default function Command(): JSX.Element {
  const [state, setState] = useState<State>({});
  useEffect(() => {
    async function fetchRecords() {
      try {
        console.debug("getting connection");
        connection = await getConnection();
        console.log("got connection");
        let queryResult: QueryResult<EntityDefinition>;
        const cachedQueryResult = cache.get("queryResult");
        if (!cachedQueryResult) {
          console.log("No cached query result, querying");
          queryResult = await getEntityDefinitionsQueryResult(connection);
          // queryResult = await connection.tooling.query(soqlQuery);
          // fieldQueryResult = null;
          cache.set("queryResult", JSON.stringify(queryResult));
        } else {
          console.log("Using cached query result");
          queryResult = JSON.parse(cachedQueryResult) as QueryResult<EntityDefinition>;
        }
        setState({ items: queryResult.records });
      } catch (error) {
        setState({
          error: error instanceof Error ? error : new Error("Something went wrong"),
        });
      }
    }
    fetchRecords();
  }, []);

  return (
    <List isLoading={!state.items && !state.error} isShowingDetail={true}>
      {state.items?.map((item, index) => (
        <EntityDefinitionListItem key={item.Id} item={item as EntityDefinition} index={index} />
      ))}
    </List>
  );
}

export function FieldList(connection: Connection, entity: EntityDefinition): JSX.Element {
  const [state, setState] = useState<State>({});
  useEffect(() => {
    async function fetchRecords() {
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Uploading image",
      });
      try {
        const queryResult: QueryResult<FieldDefinition> = await getFieldDefinitionsQueryResult(connection, entity);
        toast.title = `Fetched FieldDefinitions for ${entity.QualifiedApiName}`;
        toast.style = Toast.Style.Success;
        setState({ items: queryResult.records });
      } catch (error) {
        setState({
          error: error instanceof Error ? error : new Error("Something went wrong"),
        });
      }
    }
    fetchRecords();
  }, []);

  return (
    <List isLoading={!state.items && !state.error} isShowingDetail={true}>
      {state.items?.map((item, index) => (
        <FieldDefinitionListItem key={item.Id} item={item as FieldDefinition} index={index} />
      ))}
    </List>
  );
}

/**
 * Map for configuration of Setup URLs and actions
 */
const setupUrlMap: SetupUrlMapItem[] = [
  {
    name: "Details",
    label: "Details",
    icon: Icon.Info,
  },
  {
    name: "FieldsAndRelationships",
    label: "Fields & Relationships",
    icon: Icon.Filter,
  },
  {
    name: "Layouts",
    label: "Layouts",
    icon: Icon.AppWindowList,
  },
  {
    name: "LightningPages",
    label: "Lightning Pages",
    icon: Icon.AppWindowGrid3x3,
  },
  {
    name: "Limits",
    label: "Limits",
    icon: Icon.Gauge,
  },
  {
    name: "Triggers",
    label: "Triggers",
    icon: Icon.Bolt,
  },
  {
    name: "FlowTriggers",
    label: "Flow Triggers",
    icon: Icon.Bolt,
  },
];

function EntityDefinitionDetail(props: { item: EntityDefinition }) {
  useEffect(() => {
    async function fetchFields() {
      try {
        console.debug("getting connection");
        connection = await getConnection();
        console.log("got connection");
        let queryResult: QueryResult<EntityDefinition>;
        const cachedQueryResult = cache.get("queryResult");
        if (!cachedQueryResult) {
          console.log("No cached query result, querying");
          queryResult = await getEntityDefinitionsQueryResult(connection);
          // queryResult = await connection.tooling.query(soqlQuery);
          // fieldQueryResult = null;
          cache.set("queryResult", JSON.stringify(queryResult));
        } else {
          console.log("Using cached query result");
          queryResult = JSON.parse(cachedQueryResult) as QueryResult<EntityDefinition>;
        }
        return queryResult.records;
      } catch (error) {
        return error;
      }
    }
    fetchFields();
  }, []);

  return (
    <Detail
      metadata={
        <Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="KeyPrefix" text={props.item.KeyPrefix || "–"} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel title={"Actions"}>
          <Action.Push title="Show Fields" icon={Icon.Filter} target={FieldList(connection, props.item)} />
        </ActionPanel>
      }
    />
  );
}

function EntityDefinitionListItem(props: { item: EntityDefinition; index: number }) {
  return (
    <List.Item
      title={props.item.QualifiedApiName}
      icon={Icon.Box}
      // subtitle={props.item.MasterLabel}
      id={props.item.DurableId}
      keywords={[
        props.item.KeyPrefix,
        props.item.QualifiedApiName,
        props.item.DurableId,
        props.item.DeveloperName,
        props.item.MasterLabel,
        props.item.PluralLabel,
      ]}
      accessories={[
        {
          text: props.item.KeyPrefix,
          // icon: Icon.Key,
          tooltip: `KeyPrefix for ${props.item.QualifiedApiName} SObject`,
        },
      ]}
      detail={
        <List.Item.Detail
          markdown={props.item.Description}
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Link
                title={`${props.item.QualifiedApiName} Setup`}
                text="Go to Setup"
                target={getSetupUrl(props.item)}
              />

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="KeyPrefix" text={props.item.KeyPrefix || "–"} />

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="QualifiedApiName" text={props.item.QualifiedApiName || "–"} />
              <List.Item.Detail.Metadata.Label title="MasterLabel" text={props.item.MasterLabel || "–"} />
              <List.Item.Detail.Metadata.Label title="PluralLabel" text={props.item.PluralLabel || "–"} />

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="Description" text={props.item.Description || "–"} />

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="NamespacePrefix" text={props.item.NamespacePrefix || "–"} />
              <List.Item.Detail.Metadata.Label title="DeveloperName" text={props.item.DeveloperName || "–"} />
              <List.Item.Detail.Metadata.Label title="DurableId" text={props.item.DurableId || "–"} />

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="DetailUrl" text={props.item.DetailUrl || "–"} />
              <List.Item.Detail.Metadata.Label title="EditUrl" text={props.item.EditUrl || "–"} />
              <List.Item.Detail.Metadata.Label title="NewUrl" text={props.item.NewUrl || "–"} />
            </List.Item.Detail.Metadata>
          }
        />
      }
      actions={
        <ActionPanel title={"Actions"}>
          <ActionPanel.Section title="Quick Actions">
            <Action.Push
              title="Step into detail"
              icon={Icon.ArrowRightCircle}
              target={<EntityDefinitionDetail item={props.item} />}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title={`${props.item.QualifiedApiName} Setup`}>
            {setupUrlMap.map((item) => {
              return (
                <Action.OpenInBrowser title={item.label} url={getSetupUrl(props.item, item.name)} icon={item.icon} />
              );
            })}
          </ActionPanel.Section>
          <ActionPanel.Section title="Copy">
            <Action.CopyToClipboard title="Copy QualifiedApiName" content={props.item.QualifiedApiName} />
            <Action.CopyToClipboard title="Copy MasterLabel" content={props.item.MasterLabel} />
            <Action.CopyToClipboard title="Copy KeyPrefix" content={props.item.KeyPrefix} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

const entityDefinitionFieldKeys = [
  "Id",
  "KeyPrefix",
  "Description",
  "DeveloperName",
  "QualifiedApiName",
  "IsCustomizable",
  "DurableId",
  "EditDefinitionUrl",
  "EditUrl",
  "NewUrl",
  "DetailUrl",
  "MasterLabel",
  "NamespacePrefix",
  "PluralLabel",
];

const entityDefinitionSoqlLimit = 1000;
const entityDefinitionSoqlQuery = `SELECT ${entityDefinitionFieldKeys.join(", ")} 
FROM EntityDefinition 
WHERE IsLayoutable = TRUE
ORDER BY QualifiedApiName, KeyPrefix, NamespacePrefix LIMIT ${entityDefinitionSoqlLimit}`;

async function getEntityDefinitionsQueryResult(connection: Connection): Promise<QueryResult<EntityDefinition>> {
  return await connection.tooling.query(entityDefinitionSoqlQuery);
}

const fieldDefinitionFieldKeys = [
  "Id",
  "DataType",
  "ComplianceGroup",
  "DeveloperName",
  "DurableId",
  "ExtraTypeInfo",
  "Length",
  "Label",
  "MasterLabel",
  "NamespacePrefix",
  "Precision",
  "Publisher.Name",
  "QualifiedApiName",
  "RelationshipName",
  "Scale",
];

// function pushFieldDefinitions(entity: EntityDefinition): Promise<React.ReactElement> {
//   const queryResult = await getFieldDefinitionsQueryResult(entity);
//   const items = queryResult.records;
//   return FieldDefinitionList({ items: items, index: 0 } as any);
// }

async function getFieldDefinitionsQueryResult(
  connection: Connection,
  entity: EntityDefinition
): Promise<QueryResult<FieldDefinition>> {
  const fieldDefinitionSoqlQuery = `SELECT ${fieldDefinitionFieldKeys.join(
    ", "
  )} FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName = '${entity.QualifiedApiName}'`;
  const queryResult: QueryResult<FieldDefinition> = await connection.tooling.query(fieldDefinitionSoqlQuery);
  return queryResult;
}

// async function FieldDefinitionList(entity: EntityDefinition) {
//   const items = await getFieldDefinitionsQueryResult(entity);
//   return (
//     <List>
//       {items?.map((item, index) => (
//         <FieldDefinitionListItem item={item} index={index} />
//       ))}
//     </List>
//   )
// }

function FieldDefinitionListItem(props: { item: FieldDefinition; index: number }) {
  return (
    <List.Item
      title={props.item.QualifiedApiName}
      icon={Icon.Text}
      detail={
        <List.Item.Detail
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label title="DurableId" text={props.item.DurableId} />
              <List.Item.Detail.Metadata.Label title="DataType" text={props.item.DataType.replace('( ', '(', /g/)} />

              <List.Item.Detail.Metadata.Separator />

              <List.Item.Detail.Metadata.Label title="QualifiedApiName" text={props.item.QualifiedApiName} />
              <List.Item.Detail.Metadata.Label title="DeveloperName" text={props.item.DeveloperName} />
              <List.Item.Detail.Metadata.Label title="MasterLabel" text={props.item.MasterLabel} />
              <List.Item.Detail.Metadata.Label title="Label" text={props.item.Label} />
            </List.Item.Detail.Metadata>
          }
        />
      }
    />
  );
}

/**
 * @description Returns the setup URL for the given EntityDefinition object
 * @param entity The EntityDefinition object to get setup URLs for
 * @param setupSubpath The subpath to use for the setup URL, e.g. 'Details', 'FieldsAndRelationships', 'Layouts', 'LightningPages', 'Limits', 'Triggers', 'FlowTriggers', etc.
 * @returns The setup URL for the given EntityDefinition object
 */
function getSetupUrl(entity: EntityDefinition, setupSubpath?: SetupSubpath): string {
  setupSubpath = setupSubpath || "Details";
  const baseUrl = cache.get("baseUrl");
  // console.log(baseUrl);
  return `${baseUrl}/lightning/setup / ObjectManager / ${entity.QualifiedApiName} /${setupSubpath}/view`;
}

/**
 * @description Returns the default DevHub username from local sfdx config
 * @returns {Promise<string>} The DevHub username
 */
async function getDefaultDevHubUsername(): Promise<string> {
  const { value } = (await ConfigAggregator.create()).getInfo(OrgConfigProperties.TARGET_DEV_HUB);
  return value as string;
}

/**
 * @description Returns a Connection object, preferably a cached one
 * @param {string} username The username to use to create or get the Connection object
 */
async function getConnection(): Promise<Connection> {
  const sfdxUsername = cache.get("username") || (await getDefaultDevHubUsername());
  const authInfo = await AuthInfo.create({ username: sfdxUsername });
  const connection = await Connection.create({ authInfo: authInfo });
  const cachedBaseUrl = cache.get("baseUrl");
  if (!cachedBaseUrl) {
    console.log("No cached baseUrl, setting it now...");
    cache.set("baseUrl", connection._baseUrl().replace(/.com\/.*/g, ".com"));
    console.log("baseUrl set");
  }
  return connection;
}
