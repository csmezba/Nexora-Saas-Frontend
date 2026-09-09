// --- AUTH QUERIES & MUTATIONS ---

export const ME_QUERY = `
  query Me {
    me {
      pubId
      email
      firstName
      lastName
      fullName
      createdAt
      updatedAt
    }
  }
`;

export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      expiresIn
      tokenType
      user {
        pubId
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      expiresIn
      tokenType
      user {
        pubId
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      accessToken
      refreshToken
      expiresIn
      tokenType
      user {
        pubId
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

export const LOGOUT_MUTATION = `
  mutation Logout {
    logout {
      success
    }
  }
`;

// --- ORGANIZATION QUERIES & MUTATIONS ---

export const MY_ORGANIZATIONS_QUERY = `
  query MyOrganizations {
    myOrganizations {
      pubId
      name
      slug
      description
      logoUrl
      memberCount
      currentUserRole
      createdAt
      updatedAt
    }
  }
`;

export const ORGANIZATION_QUERY = `
  query Organization($pubIdOrSlug: String!) {
    organization(pubIdOrSlug: $pubIdOrSlug) {
      pubId
      name
      slug
      description
      logoUrl
      memberCount
      currentUserRole
      createdAt
      updatedAt
    }
  }
`;

export const ORGANIZATION_BY_SLUG_QUERY = `
  query OrganizationBySlug($slug: String!) {
    organizationBySlug(slug: $slug) {
      pubId
      name
      slug
      description
      logoUrl
      memberCount
      currentUserRole
      createdAt
      updatedAt
    }
  }
`;

export const ORGANIZATION_MEMBERS_QUERY = `
  query OrganizationMembers($organizationPubId: String!) {
    organizationMembers(organizationPubId: $organizationPubId) {
      pubId
      role
      joinedAt
      user {
        pubId
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

export const CREATE_ORGANIZATION_MUTATION = `
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      pubId
      name
      slug
      description
      logoUrl
      memberCount
      currentUserRole
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ORGANIZATION_MUTATION = `
  mutation UpdateOrganization($pubId: String!, $input: UpdateOrganizationInput!) {
    updateOrganization(pubId: $pubId, input: $input) {
      pubId
      name
      slug
      description
      logoUrl
      memberCount
      currentUserRole
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_ORGANIZATION_MUTATION = `
  mutation DeleteOrganization($pubId: String!) {
    deleteOrganization(pubId: $pubId) {
      success
      message
    }
  }
`;

export const ADD_ORGANIZATION_MEMBER_MUTATION = `
  mutation AddOrganizationMember($input: AddOrganizationMemberInput!) {
    addOrganizationMember(input: $input) {
      success
      message
      member {
        pubId
        role
        joinedAt
        user {
          pubId
          email
          fullName
        }
      }
    }
  }
`;

export const UPDATE_ORGANIZATION_MEMBER_ROLE_MUTATION = `
  mutation UpdateOrganizationMemberRole($input: UpdateMemberRoleInput!) {
    updateOrganizationMemberRole(input: $input) {
      success
      message
      member {
        pubId
        role
        joinedAt
        user {
          pubId
          email
          fullName
        }
      }
    }
  }
`;

export const REMOVE_ORGANIZATION_MEMBER_MUTATION = `
  mutation RemoveOrganizationMember($input: RemoveMemberInput!) {
    removeOrganizationMember(input: $input) {
      success
      message
    }
  }
`;

export const LEAVE_ORGANIZATION_MUTATION = `
  mutation LeaveOrganization($organizationPubId: String!) {
    leaveOrganization(organizationPubId: $organizationPubId) {
      success
      message
    }
  }
`;

// --- TEAM QUERIES & MUTATIONS ---

export const ORGANIZATION_TEAMS_QUERY = `
  query OrganizationTeams($organizationPubId: String!) {
    organizationTeams(organizationPubId: $organizationPubId) {
      pubId
      name
      description
      organizationPubId
      memberCount
      createdAt
      updatedAt
      members {
        pubId
        teamPubId
        joinedAt
        user {
          pubId
          email
          fullName
        }
      }
    }
  }
`;

export const TEAM_QUERY = `
  query Team($pubId: String!) {
    team(pubId: $pubId) {
      pubId
      name
      description
      organizationPubId
      memberCount
      createdAt
      updatedAt
      members {
        pubId
        teamPubId
        joinedAt
        user {
          pubId
          email
          fullName
        }
      }
    }
  }
`;

export const USER_TEAMS_QUERY = `
  query UserTeams($organizationPubId: String) {
    userTeams(organizationPubId: $organizationPubId) {
      pubId
      name
      description
      organizationPubId
      memberCount
      createdAt
      updatedAt
    }
  }
`;

export const TEAM_MEMBERS_QUERY = `
  query TeamMembers($teamPubId: String!) {
    teamMembers(teamPubId: $teamPubId) {
      pubId
      teamPubId
      joinedAt
      user {
        pubId
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

export const CREATE_TEAM_MUTATION = `
  mutation CreateTeam($input: CreateTeamInput!) {
    createTeam(input: $input) {
      pubId
      name
      description
      organizationPubId
      memberCount
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TEAM_MUTATION = `
  mutation UpdateTeam($pubId: String!, $input: UpdateTeamInput!) {
    updateTeam(pubId: $pubId, input: $input) {
      pubId
      name
      description
      organizationPubId
      memberCount
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_TEAM_MUTATION = `
  mutation DeleteTeam($pubId: String!) {
    deleteTeam(pubId: $pubId) {
      success
      message
    }
  }
`;

export const ADD_TEAM_MEMBER_MUTATION = `
  mutation AddTeamMember($input: AddTeamMemberInput!) {
    addTeamMember(input: $input) {
      success
      message
    }
  }
`;

export const REMOVE_TEAM_MEMBER_MUTATION = `
  mutation RemoveTeamMember($input: RemoveTeamMemberInput!) {
    removeTeamMember(input: $input) {
      success
      message
    }
  }
`;

// --- ROLE & PERMISSION QUERIES & MUTATIONS ---

export const ORGANIZATION_ROLES_QUERY = `
  query OrganizationRoles($organizationPubId: String!) {
    organizationRoles(organizationPubId: $organizationPubId) {
      pubId
      name
      description
      createdAt
      updatedAt
      permissions {
        pubId
        resource
        action
        description
      }
    }
  }
`;

export const ROLE_QUERY = `
  query Role($pubId: String!) {
    role(pubId: $pubId) {
      pubId
      name
      description
      createdAt
      updatedAt
      permissions {
        pubId
        resource
        action
        description
      }
    }
  }
`;

export const ORGANIZATION_MEMBER_ROLES_QUERY = `
  query OrganizationMemberRoles($organizationPubId: String!, $memberPubId: String!) {
    organizationMemberRoles(organizationPubId: $organizationPubId, memberPubId: $memberPubId) {
      pubId
      name
      description
      permissions {
        pubId
        resource
        action
        description
      }
    }
  }
`;

export const PERMISSIONS_QUERY = `
  query Permissions {
    permissions {
      pubId
      resource
      action
      description
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_ROLE_MUTATION = `
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      pubId
      name
      description
      createdAt
      updatedAt
      permissions {
        pubId
        resource
        action
      }
    }
  }
`;

export const UPDATE_ROLE_MUTATION = `
  mutation UpdateRole($pubId: String!, $input: UpdateRoleInput!) {
    updateRole(pubId: $pubId, input: $input) {
      pubId
      name
      description
    }
  }
`;

export const DELETE_ROLE_MUTATION = `
  mutation DeleteRole($pubId: String!) {
    deleteRole(pubId: $pubId) {
      success
      message
    }
  }
`;

export const ASSIGN_PERMISSIONS_TO_ROLE_MUTATION = `
  mutation AssignPermissionsToRole($input: AssignPermissionsInput!) {
    assignPermissionsToRole(input: $input) {
      pubId
      name
      permissions {
        pubId
        resource
        action
      }
    }
  }
`;

export const CREATE_PERMISSION_MUTATION = `
  mutation CreatePermission($input: CreatePermissionInput!) {
    createPermission(input: $input) {
      pubId
      resource
      action
      description
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PERMISSION_MUTATION = `
  mutation UpdatePermission($pubId: String!, $input: UpdatePermissionInput!) {
    updatePermission(pubId: $pubId, input: $input) {
      pubId
      resource
      action
      description
    }
  }
`;

export const DELETE_PERMISSION_MUTATION = `
  mutation DeletePermission($pubId: String!) {
    deletePermission(pubId: $pubId) {
      success
      message
    }
  }
`;

export const ASSIGN_ROLE_TO_MEMBER_MUTATION = `
  mutation AssignRoleToMember($input: AssignRoleToMemberInput!) {
    assignRoleToMember(input: $input) {
      success
      message
      role {
        pubId
        name
      }
    }
  }
`;

export const REMOVE_ROLE_FROM_MEMBER_MUTATION = `
  mutation RemoveRoleFromMember($input: RemoveRoleFromMemberInput!) {
    removeRoleFromMember(input: $input) {
      success
      message
      role {
        pubId
        name
      }
    }
  }
`;
