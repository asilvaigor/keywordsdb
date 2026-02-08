import { Firestore } from "@google-cloud/firestore";

const firestore = new Firestore({
  databaseId: `keywordsdb-${process.env.NEXT_PUBLIC_ENV}`,
  ignoreUndefinedProperties: true,
});
export default firestore;
