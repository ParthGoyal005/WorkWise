const { ACCESS_TYPES, ROLES } = require('../config/constants');

/**
 * Returns true if the given user may access the document.
 * Admins can always access every document.
 */
function canUserAccessDocument(user, document) {
  if (!user || !document) {
    return false;
  }

  if (user.role === ROLES.ADMIN) {
    return true;
  }

  const permissions = document.permissions || {};
  const accessType = permissions.accessType || ACCESS_TYPES.PUBLIC;

  switch (accessType) {
    case ACCESS_TYPES.PUBLIC:
      return true;

    case ACCESS_TYPES.DEPARTMENT: {
      const allowed = permissions.allowedDepartments || [];
      return allowed.includes(user.department);
    }

    case ACCESS_TYPES.ROLE: {
      const allowed = permissions.allowedRoles || [];
      return allowed.includes(user.role);
    }

    case ACCESS_TYPES.SPECIFIC_USERS: {
      const allowed = (permissions.allowedUsers || []).map((id) =>
        id.toString()
      );
      return allowed.includes(user._id.toString());
    }

    default:
      return false;
  }
}

/**
 * Filters a list of documents down to those the user can access.
 */
function filterAccessibleDocuments(user, documents) {
  return documents.filter((doc) => canUserAccessDocument(user, doc));
}

/**
 * Builds a MongoDB query fragment that matches documents accessible to the user.
 * Used before vector / keyword search so restricted docs never enter the pipeline.
 */
function buildAccessibleDocumentFilter(user) {
  if (user.role === ROLES.ADMIN) {
    return {};
  }

  return {
    $or: [
      { 'permissions.accessType': ACCESS_TYPES.PUBLIC },
      {
        'permissions.accessType': ACCESS_TYPES.DEPARTMENT,
        'permissions.allowedDepartments': user.department,
      },
      {
        'permissions.accessType': ACCESS_TYPES.ROLE,
        'permissions.allowedRoles': user.role,
      },
      {
        'permissions.accessType': ACCESS_TYPES.SPECIFIC_USERS,
        'permissions.allowedUsers': user._id,
      },
    ],
  };
}

function normalizePermissionsInput(input = {}) {
  const accessType = input.accessType || ACCESS_TYPES.PUBLIC;

  return {
    accessType,
    allowedRoles: Array.isArray(input.allowedRoles) ? input.allowedRoles : [],
    allowedDepartments: Array.isArray(input.allowedDepartments)
      ? input.allowedDepartments
      : [],
    allowedUsers: Array.isArray(input.allowedUsers) ? input.allowedUsers : [],
  };
}

module.exports = {
  canUserAccessDocument,
  filterAccessibleDocuments,
  buildAccessibleDocumentFilter,
  normalizePermissionsInput,
};
