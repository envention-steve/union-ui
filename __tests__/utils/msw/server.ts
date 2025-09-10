import { setupServer } from 'msw/node'
import { keycloakHandlers } from './keycloak-handlers'
import { authHandlers } from './auth-handlers'

// Setup MSW server with all handlers
export const server = setupServer(
  ...keycloakHandlers,
  ...authHandlers,
)
