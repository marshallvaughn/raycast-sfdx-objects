import { AuthInfo, Connection, ConfigAggregator, OrgConfigProperties } from "@salesforce/core";
import { Cache } from "@raycast/api";
import { Query, QueryResult, Record } from "jsforce";
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
  console.log(`creating authInfo for ${username}...`);
  const authInfo = await new AuthInfo({ username: username });
  console.log(`created authInfo for ${username}...`);
  console.log(JSON.stringify(authInfo));
  return authInfo;
}

/**
 * @description Returns an AuthInfo object, preferably a cached one
 * @param {string} username The username to use to create or get the AuthInfo object
 */
async function getAuthInfo(username: string): Promise<AuthInfo> {
  const cachedAuthInfo = cache.get("authInfo");
  if (cachedAuthInfo) {
    return JSON.parse(cachedAuthInfo) as AuthInfo;
  } else {
    return await createAuthInfo(username);
  }
}

async function createConnection(username: string): Promise<Connection> {
  const authInfo = await getAuthInfo(username);
  return await Connection.create({
    authInfo: authInfo,
  });
}

/**
 * @description Returns a Connection object, preferably a cached one
 * @param {string} username The username to use to create or get the Connection object
 */
async function getConnection(username?: string): Promise<Connection> {
  username = username || (await getDefaultDevHubUsername());
  const cachedConnection = cache.get("connection");
  if (cachedConnection) {
    return JSON.parse(cachedConnection) as Connection;
  } else {
    return await createConnection(username);
  }
}

/**
 * @description Run a SOQL query against the Tooling API
 * @param connection The connection to use for the query
 * @param query A SOQL query string
 * @returns A QueryResult object
 */
async function query(connection: Connection, query: string): Promise<QueryResult<Record>> {
  const queryResult = await connection.tooling.query(query);
  return queryResult;
}

/**
 * @description Get a QueryResult object for EntityDefinitions
 * @param connection The connection to use for the query
 * @param query 
 * @returns 
 */
async function getEntityDefinitions(connection: Connection, query: string): Promise<any> {
  const queryResult = await connection.tooling.query(query);
  return queryResult;
}

export { cache, createAuthInfo, getAuthInfo, getConnection, getEntityDefinitions };
