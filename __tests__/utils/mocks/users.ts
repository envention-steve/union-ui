export const testUsers = {
  validUser: {
    username: 'test_user1',
    password: 'envention',
    email: 'test_user1@gmail.com',
    name: 'Test User',
    preferred_username: 'test_user1',
    roles: ['client_admin', 'manage-account'],
  },
  
  invalidUser: {
    username: 'invalid_user',
    password: 'wrong_password',
    email: 'invalid@example.com',
  },

  adminUser: {
    username: 'admin_user',
    password: 'admin_password',
    email: 'admin@union.org',
    name: 'Admin User',
    preferred_username: 'admin_user',
    roles: ['admin', 'client_admin'],
  },

  regularUser: {
    username: 'regular_user',
    password: 'user_password',
    email: 'user@union.org',
    name: 'Regular User',
    preferred_username: 'regular_user',
    roles: ['member'],
  },
}

export const keycloakUserResponse = {
  sub: '34d060e6-3f3b-426a-94f1-4095086bfc69',
  email_verified: true,
  name: 'Test User',
  preferred_username: 'test_user1',
  given_name: 'Test',
  family_name: 'User',
  email: 'test_user1@gmail.com',
  realm_access: {
    roles: ['default-roles-union', 'offline_access', 'uma_authorization', 'client_admin'],
  },
  resource_access: {
    account: {
      roles: ['manage-account', 'manage-account-links', 'view-profile'],
    },
  },
}
