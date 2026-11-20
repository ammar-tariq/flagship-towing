export const memberDisplayName = (user) => {
  if (!user) return "—"
  if (typeof user === "string") return "—"
  const name =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim()
  return name || user?.email || "—"
}
