import { createRootRoute, createRoute, createRouter, RouterProvider as TanStackRouterProvider } from "@tanstack/solid-router";
import { GraphPage } from "./routes/index";

const rootRoute = createRootRoute();
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GraphPage,
});

const routeTree = rootRoute.addChildren([indexRoute]);
const router = createRouter({ routeTree });

export function RouterProvider() {
  return <TanStackRouterProvider router={router} />;
}
