import { AuthInfo, Connection, ConfigAggregator, OrgConfigProperties, Fields } from "@salesforce/core";
import { Cache } from "@raycast/api";
import { Field, Query, QueryResult, Record } from "jsforce";
import { EntityDefinition } from "./types";

const cache = new Cache();

// async function getAuthInfo(username: string): Promise<AuthInfo> {
//   if (cache.has("authInfo")) {
//     const cachedAuthInfo = cache.get("authInfo");
//     if (JSON.parse(cachedAuthInfo) instanceof AuthInfo) {
//       return JSON.parse(cachedAuthInfo) as AuthInfo;
//     }
//   } else {
//     const authInfo = await AuthInfo.create({
//       username: username
//     });
//     cache.set("authInfo", JSON.stringify(authInfo));
//     return authInfo;
//   }
// }

async function getDefaultDevHubUsername(): Promise<string> {
  const cachedUsername = cache.get("username");
  if (!cachedUsername) {
    console.log("No cached username found. Making a new one.");
    const { value } = (await ConfigAggregator.create()).getInfo(OrgConfigProperties.TARGET_DEV_HUB);
    cache.set("username", value as string);
    return value as string;
  } else {
    console.log(`Found cached username: ${cachedUsername}`);
    return cachedUsername;
  }
}

/**
 * @description Creates and returns an AuthInfo object
 * @param {string} username
 */
async function createAuthInfo(username: string): Promise<AuthInfo> {
  const authInfo = await new AuthInfo({ username: username });
  console.log(JSON.stringify(authInfo));
  return authInfo;
}

/**
 * @description Returns an AuthInfo object, preferably a cached one
 * @param {string} username The username to use to create or get the AuthInfo object
 */
async function getAuthInfo(username?: string): Promise<AuthInfo> {
  username = username || (await getDefaultDevHubUsername());
  const cachedAuthInfo = cache.get("authInfo");
  if (cachedAuthInfo) {
    console.log(`found cached authInfo for: ${username}`);
    console.log(`cachedAuthInfo: ${cachedAuthInfo}`);
    return JSON.parse(cachedAuthInfo) as AuthInfo;
  } else {
    console.log(`creating authInfo for: ${username}`);
    const authInfo = await createAuthInfo(username);
    cache.set("authInfo", JSON.stringify(authInfo));
    return authInfo;
  }
}

// async function createConnection(username: string): Promise<Connection> {
//   const authInfo = await getAuthInfo(username);
//   return await Connection.create({
//     authInfo: authInfo,
//   });
// }

/**
 * @description Returns a Connection object, preferably a cached one
 * @param {string} username The username to use to create or get the Connection object
 */
async function getConnection(authInfo?: AuthInfo): Promise<Connection> {
  authInfo = authInfo || (await getAuthInfo());
  const cachedConnection = cache.get("connection");
  console.log(`cachedConnection: ${cachedConnection?.toString()}`);
  if (cache.has("connection") && !!cachedConnection) {
    console.log("Enterred this");
    const cachedConnectionObj = JSON.parse(cachedConnection) as Connection;
    console.log(`found cached connection for: ${cachedConnectionObj.getUsername()}`);
    return cachedConnectionObj;
  } else {
    console.log('nawp');
    // console.log(`creating connection for: ${username}`);
    // const authInfo = await getAuthInfo();
    console.log(`fetched authInfo: ${JSON.stringify(authInfo)}`);
    console.log("-----------------");
    const connection: Connection = await Connection.create({ authInfo: authInfo });
    console.log(`connection: ${JSON.stringify(connection)}`);
    cache.set("connection", JSON.stringify(connection));
    console.log(cache.get("connection"));
    return connection;
  }
}

// async function query(soql: string, connection?: Connection): Promise<QueryResult<Record>> {
//   connection = connection || (await getConnection());
//   const queryResult = await connection.tooling.query(soql);
//   return queryResult;
// }

/**
 * @description Get a QueryResult object for EntityDefinitions
 * @param connection The connection to use for the query
 * @param query
 * @returns
 */
async function getEntityDefinitions(): Promise<QueryResult<EntityDefinition>> {
  console.log("querying...");
  const selectFields = [
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
  const soqlQuery = `SELECT ${selectFields.join(
    ", "
  )} FROM EntityDefinition WHERE IsLayoutable = TRUE ORDER BY QualifiedApiName, KeyPrefix, NamespacePrefix LIMIT 1000`;
  const connection = await getConnection();
  return await connection.tooling.query<EntityDefinition>(soqlQuery);
}

export { cache, getConnection, createAuthInfo, getAuthInfo, getEntityDefinitions };
