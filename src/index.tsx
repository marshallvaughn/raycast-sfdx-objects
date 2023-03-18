import { Action, ActionPanel, Icon, List, Cache } from "@raycast/api";
import { useEffect, useState } from "react";
import { QueryResult } from "jsforce";
import { AuthInfo, Connection, ConfigAggregator, OrgConfigProperties } from "@salesforce/core";
import { EntityDefinition, State, SetupUrlMapItem, SetupSubpath } from "./types";
import { getAuthInfo, getConnection } from "./lib";

process.env.SFDX_USE_GENERIC_UNIX_KEYCHAIN = "true";

const cache = new Cache();
console.log("Starting...");

const fieldKeys = [
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

const soqlLimit = 500;
const soqlQuery = `SELECT ${fieldKeys.join(", ")} 
FROM EntityDefinition 
WHERE IsLayoutable = TRUE
ORDER BY QualifiedApiName, KeyPrefix, NamespacePrefix LIMIT ${soqlLimit}`;

export default function Command(): JSX.Element {
  const [state, setState] = useState<State>({});
  useEffect(() => {
    async function fetchRecords() {
      if (cache.has("response") === false) {
        try {
          const result = await getSchema();
          setState({ items: result.records });
        } catch (error) {
          setState({
            error: error instanceof Error ? error : new Error("Something went wrong"),
          });
        }
      } else {
        const cachedResponse = cache.get("response");
        const response: QueryResult<EntityDefinition> = cachedResponse ? JSON.parse(cachedResponse) : {};
        console.log(`cached here is: ${cachedResponse}`);
        setState({ items: response.records });
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

function RecordListItem(props: { item: EntityDefinition; index: number }) {
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

function getSetupUrl(entity: EntityDefinition, setupSubpath?: SetupSubpath): string {
  setupSubpath = setupSubpath || "Details";
  const baseUrl = cache.get("baseUrl");
  console.log(baseUrl);
  return `${baseUrl}/lightning/setup/ObjectManager/${entity.QualifiedApiName}/${setupSubpath}/view`;
}

// async function getDefaultDevHubUsername() {
//   if (!cache.has("username")) {
//     console.log("No cached username found. Making a new one.");
//     const { value } = (await ConfigAggregator.create()).getInfo(OrgConfigProperties.TARGET_DEV_HUB);
//     cache.set("username", value as string);
//     return value as string;
//   } else {
//     console.log("Found cached username.");
//     return cache.get("username");
//   }
// }

// async function getAuthInfo(username: string): Promise<AuthInfo> {
//   if (cache.has("authInfo")) {
//     const cachedAuthInfo = cache.get("authInfo");
//     if (JSON.parse(cachedAuthInfo) instanceof AuthInfo) {
//       return JSON.parse(cachedAuthInfo) as AuthInfo;
//     }
//   } else {
//     const authInfo = await AuthInfo.create({
//       username: username,
//     });
//     cache.set("authInfo", JSON.stringify(authInfo));
//     return authInfo;
//   }
// }

// async function getConnection(): Promise<Connection> {
//   console.log("Getting connection.");
//   const cachedConnection = cache.get("connection");
//   if (!cache.has("connection")) {
//     console.log("No cached connection found. Making a new one.");
//     const sfdxUsername: string = (await getDefaultDevHubUsername()) || "";
//     console.log(`Found username: ${sfdxUsername}`);
//     console.log("Getting authInfo.");
//     // const auth = await AuthInfo.create({ username: sfdxUsername });
//     // console.log(`Created authInfo: ${JSON.stringify(auth, null, 2)}`);
//     const connection: Connection = await Connection.create({
//       authInfo: await getAuthInfo(sfdxUsername),
//     });
//     console.log(`Found username: ${sfdxUsername}`);
//     cache.set("connection", JSON.stringify(connection));
//     console.log(JSON.stringify(connection));
//     return connection;
//   } else {
//     console.log("Found cached connection.");
//     return cachedConnection ? JSON.parse(cachedConnection) : {};
//   }
// }

async function getSchema(): Promise<QueryResult<EntityDefinition>> {
  console.log("Getting schema.");
  const cachedResponse = cache.get("response");
  if (!cachedResponse) {
    return await runQuery();
  } else {
    return JSON.parse(cachedResponse) as QueryResult<EntityDefinition>;
  }
}

async function runQuery(): Promise<QueryResult<EntityDefinition>> {
  console.log("Running query.");
  const connection: Connection = await getConnection();
  cache.set("baseUrl", connection._baseUrl().replace(/.com\/.*/g, ".com"));
  const response: QueryResult<EntityDefinition> = await connection.tooling.query(soqlQuery);
  cache.set("response", JSON.stringify(response));
  console.log("Query complete.");
  return response;
}
