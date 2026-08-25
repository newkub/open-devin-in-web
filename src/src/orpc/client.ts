import { createORPCClient, type Client } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { GraphData } from "./router";

type SkillsClient = { skillsGraph: Client<Record<never, never>, undefined, GraphData, unknown> };

export const orpc = createORPCClient<SkillsClient>(new RPCLink({ url: "/rpc" }));
