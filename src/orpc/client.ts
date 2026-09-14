import { createORPCClient, type Client } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { GraphData, NodeSource } from "./router";

type SkillsClient = {
  skillsGraph: Client<Record<never, never>, undefined, GraphData, unknown>;
  nodeSource: Client<Record<never, never>, { id: string }, NodeSource, unknown>;
};

export const orpc = createORPCClient<SkillsClient>(
  new RPCLink({ url: new URL("/rpc", window.location.origin) }),
);
