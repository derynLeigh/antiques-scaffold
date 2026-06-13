import { redirect } from "next/navigation";

/**
 * Root just forwards to /inventory. If you're not signed in, the
 * middleware intercepts that and sends you to /login first. So the
 * single entry point naturally routes to login-or-inventory depending
 * on session state, with no auth logic duplicated here.
 */
export default function Home() {
  redirect("/inventory");
}
