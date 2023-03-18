import { AuthInfo, Connection, ConfigAggregator, OrgConfigProperties, Fields } from "@salesforce/core";
import { Cache } from "@raycast/api";
import { Field, Query, QueryResult, Record } from "jsforce";
import { EntityDefinition } from "./types";

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







// async function createConnection(username: string): Promise<Connection> {
//   const authInfo = await getAuthInfo(username);
//   return await Connection.create({
//     authInfo: authInfo,
//   });
// }



// async function query(soql: string, connection?: Connection): Promise<QueryResult<Record>> {
//   connection = connection || (await getConnection());
//   const queryResult = await connection.tooling.query(soql);
//   return queryResult;
// }



// async function getConnectionAgain(cache: Cache): Promise<Connection> {
//   const cachedConnection = cache.get("connection");
//   if (!cachedConnection) {
//     const sfdxUsername = await getDefaultDevHubUsername(cache);
//     const connection: Connection = await Connection.create({
//       authInfo: await AuthInfo.create({ username: sfdxUsername }),
//     });
//     cache.set("connection", JSON.stringify(connection));
//     return connection;
//   } else {
//     return JSON.parse(cachedConnection) as Connection;
//   }
// }

// export { cache, getConnection, getConnectionAgain, createAuthInfo, getAuthInfo, getEntityDefinitions };
