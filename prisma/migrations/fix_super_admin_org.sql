-- Remove organization from Super Admin users
-- Super Admin users should not belong to any organization

UPDATE "User"
SET "organizationId" = NULL
WHERE "role" = 'SUPER_ADMIN';
