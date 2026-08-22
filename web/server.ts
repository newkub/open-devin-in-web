import { Elysia } from "elysia";
import { RPCHandler } from "@orpc/server/fetch";
import { router } from "./src/orpc/router";

const handler = new RPCHandler(router, {});

const app = new Elysia()
  .all(
    "/rpc*",
    async ({ request }: { request: Request }) => {
      const { response } = await handler.handle(request, { prefix: "/rpc" });
      return response ?? new Response("Not Found", { status: 404 });
    },
    { parse: "none" }
  )
  .listen(3000);

console.log("oRPC + Elysia server running at http://localhost:3000");
