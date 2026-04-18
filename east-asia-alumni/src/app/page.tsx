import { redirect } from "next/navigation"

export default function HomePage() {
  // Middleware handles auth-based redirects.
  // Default: send to feed (middleware will redirect to login if not authenticated)
  redirect("/feed")
}
