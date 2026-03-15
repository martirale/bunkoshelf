export const ROLES = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  GUEST: "GUEST",
}

const ROLE_HIERARCHY = [ROLES.GUEST, ROLES.MEMBER, ROLES.ADMIN]

const PERMISSIONS = {
  "users:manage": [ROLES.ADMIN],
  "settings:access": [ROLES.ADMIN],
  "library:scan": [ROLES.ADMIN],
  "logs:view": [ROLES.ADMIN],
  "logs:clear": [ROLES.ADMIN],
  "db:download": [ROLES.ADMIN],
  "upload:library": [ROLES.ADMIN],

  "library:read": [ROLES.ADMIN, ROLES.MEMBER],
  "progress:manage": [ROLES.ADMIN, ROLES.MEMBER],
  "favorites:manage": [ROLES.ADMIN, ROLES.MEMBER],
  "ratings:manage": [ROLES.ADMIN, ROLES.MEMBER],
  "reading:manage": [ROLES.ADMIN, ROLES.MEMBER],
  "challenges:manage": [ROLES.ADMIN, ROLES.MEMBER],
  "push:subscribe": [ROLES.ADMIN, ROLES.MEMBER],
  "profile:edit": [ROLES.ADMIN, ROLES.MEMBER],

  "library:browse": [ROLES.ADMIN, ROLES.MEMBER, ROLES.GUEST],
}

export function isSuperAdmin(user) {
  return user?.isAdmin === true
}

export function hasPermission(user, permission) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const allowed = PERMISSIONS[permission]
  if (!allowed) return false
  return allowed.includes(user.role)
}

export function requireRole(user, role) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const userLevel = ROLE_HIERARCHY.indexOf(user.role)
  const requiredLevel = ROLE_HIERARCHY.indexOf(role)
  if (userLevel === -1 || requiredLevel === -1) return false
  return userLevel >= requiredLevel
}
