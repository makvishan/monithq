import { NextResponse } from 'next/server';
import { verifyToken } from './crypto';
import prisma from './prisma';
import { USER_ROLES } from './constants';

/**
 * Extract token from request
 */
function getTokenFromRequest(request) {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const cookies = request.cookies;
  const token = cookies.get('token')?.value;
  if (token) {
    return token;
  }

  return null;
}

/**
 * Middleware to verify authentication
 * Returns user object if authenticated, null otherwise
 */
export async function authenticate(request) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return null;
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return null;
    }

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Middleware to require authentication
 * Returns error response if not authenticated
 */
export async function requireAuth(request) {
  const user = await authenticate(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }

  return user;
}

/**
 * Middleware to require specific role
 */
export async function requireRole(request, allowedRoles = []) {
  const user = await authenticate(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden. You do not have permission to access this resource.' },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Middleware to check if user is super admin
 */
export async function requireSuperAdmin(request) {
  return requireRole(request, [USER_ROLES.SUPER_ADMIN]);
}

/**
 * Middleware to check if user is org admin or super admin
 */
export async function requireOrgAdmin(request) {
  return requireRole(request, [USER_ROLES.ORG_ADMIN, USER_ROLES.SUPER_ADMIN]);
}

/**
 * Check if user owns a resource (within their organization)
 */
export async function checkOrganizationAccess(user, resourceOrgId) {
  if (user.role === USER_ROLES.SUPER_ADMIN) {
    return true; // Super admin can access all organizations
  }

  return user.organizationId === resourceOrgId;
}

/**
 * Audit log helper
 */
export async function createAuditLog(action, entity, entityId, userId = null, details = null, request = null) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        details,
        ipAddress: request ? request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') : null,
        userAgent: request ? request.headers.get('user-agent') : null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
