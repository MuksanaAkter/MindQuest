import { getAuth } from "@mindquest/server/auth";
export const runtime = "nodejs";
const handler = (request: Request) => getAuth().handler(request);
export { handler as GET, handler as POST };
