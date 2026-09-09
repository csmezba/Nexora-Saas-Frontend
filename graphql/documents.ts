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

export const TEAM_PROJECTS_QUERY = `
  query TeamProjects($teamPubId: String!) {
    teamProjects(teamPubId: $teamPubId) {
      pubId
      name
      key
      description
      status
      startDate
      dueDate
      memberCount
      createdAt
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

export const ORGANIZATION_ROLE_ENUM_QUERY = `
  query OrganizationRoleEnum {
    __type(name: "OrganizationRole") {
      enumValues {
        name
        description
      }
    }
  }
`;

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

// --- PROJECT QUERIES & MUTATIONS ---

export const ORGANIZATION_PROJECTS_QUERY = `
  query OrganizationProjects($organizationPubId: String!) {
    organizationProjects(organizationPubId: $organizationPubId) {
      pubId
      name
      key
      description
      status
      startDate
      dueDate
      memberCount
      organizationPubId
      teamPubId
      team {
        pubId
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const PROJECT_QUERY = `
  query Project($pubId: String!) {
    project(pubId: $pubId) {
      pubId
      name
      key
      description
      status
      startDate
      dueDate
      memberCount
      organizationPubId
      teamPubId
      team {
        pubId
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      pubId
      name
      key
      description
      status
      startDate
      dueDate
      memberCount
      organizationPubId
      teamPubId
      team {
        pubId
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PROJECT_MUTATION = `
  mutation UpdateProject($pubId: String!, $input: UpdateProjectInput!) {
    updateProject(pubId: $pubId, input: $input) {
      pubId
      name
      key
      description
      status
      startDate
      dueDate
      memberCount
      organizationPubId
      teamPubId
      team {
        pubId
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_PROJECT_MUTATION = `
  mutation DeleteProject($pubId: String!) {
    deleteProject(pubId: $pubId) {
      success
      message
    }
  }
`;

// --- TASK QUERIES & MUTATIONS ---

export const PROJECT_TASKS_QUERY = `
  query ProjectTasks($projectPubId: String!, $priority: TaskPriority, $status: TaskStatus, $sprintPubId: String) {
    projectTasks(projectPubId: $projectPubId, priority: $priority, status: $status, sprintPubId: $sprintPubId) {
      pubId
      title
      description
      status
      priority
      position
      dueDate
      projectPubId
      project {
        pubId
        name
        key
      }
      creator {
        pubId
        fullName
        email
      }
      assignees {
        user {
          pubId
          fullName
          email
        }
      }
      labels {
        pubId
        name
        color
      }
      comments {
        pubId
        content
        createdAt
        author {
          pubId
          fullName
          email
        }
      }
      dependencies {
        pubId
        dependsOnTaskPubId
        type
      }
      createdAt
      updatedAt
    }
  }
`;

export const TASK_QUERY = `
  query Task($pubId: String!) {
    task(pubId: $pubId) {
      pubId
      title
      description
      status
      priority
      position
      dueDate
      projectPubId
      project {
        pubId
        name
        key
      }
      creator {
        pubId
        fullName
        email
      }
      assignees {
        user {
          pubId
          fullName
          email
        }
      }
      labels {
        pubId
        name
        color
      }
      comments {
        pubId
        content
        createdAt
        author {
          pubId
          fullName
          email
        }
      }
      dependencies {
        pubId
        dependsOnTaskPubId
        type
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_TASK_MUTATION = `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      pubId
      title
      description
      status
      priority
      position
      dueDate
      projectPubId
      project {
        pubId
        name
        key
      }
      creator {
        pubId
        fullName
        email
      }
      assignees {
        pubId
        user {
          pubId
          fullName
          email
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TASK_MUTATION = `
  mutation UpdateTask($pubId: String!, $input: UpdateTaskInput!) {
    updateTask(pubId: $pubId, input: $input) {
      pubId
      title
      description
      status
      priority
      position
      dueDate
      assignees {
        pubId
        user {
          pubId
          fullName
          email
        }
      }
      updatedAt
    }
  }
`;

export const UPDATE_TASK_POSITION_MUTATION = `
  mutation UpdateTaskPosition($input: UpdateTaskPositionInput!) {
    updateTaskPosition(input: $input) {
      pubId
      title
      status
      position
      updatedAt
    }
  }
`;

export const DELETE_TASK_MUTATION = `
  mutation DeleteTask($pubId: String!) {
    deleteTask(pubId: $pubId) {
      success
      message
    }
  }
`;

export const ASSIGN_TASK_MUTATION = `
  mutation AssignTask($input: AssignTaskInput!) {
    assignTask(input: $input) {
      success
      message
    }
  }
`;

export const UNASSIGN_TASK_MUTATION = `
  mutation UnassignTask($input: UnassignTaskInput!) {
    unassignTask(input: $input) {
      success
      message
    }
  }
`;

export const CREATE_TASK_COMMENT_MUTATION = `
  mutation CreateTaskComment($input: CreateTaskCommentInput!) {
    createTaskComment(input: $input) {
      pubId
      taskPubId
      content
      createdAt
      author {
        pubId
        fullName
        email
      }
    }
  }
`;

export const ADD_TASK_DEPENDENCY_MUTATION = `
  mutation AddTaskDependency($input: AddTaskDependencyInput!) {
    addTaskDependency(input: $input) {
      pubId
      taskPubId
      dependsOnTaskPubId
      type
      createdAt
    }
  }
`;

export const REMOVE_TASK_DEPENDENCY_MUTATION = `
  mutation RemoveTaskDependency($input: RemoveTaskDependencyInput!) {
    removeTaskDependency(input: $input) {
      success
      message
    }
  }
`;

// --- SPRINT QUERIES & MUTATIONS ---

export const PROJECT_SPRINTS_QUERY = `
  query ProjectSprints($projectPubId: String!, $status: SprintStatus) {
    projectSprints(projectPubId: $projectPubId, status: $status) {
      pubId
      name
      goal
      status
      startDate
      endDate
      taskCount
      projectPubId
      tasks {
        pubId
        title
        status
        priority
        position
      }
      createdAt
      updatedAt
    }
  }
`;

export const SPRINT_QUERY = `
  query Sprint($pubId: String!) {
    sprint(pubId: $pubId) {
      pubId
      name
      goal
      status
      startDate
      endDate
      taskCount
      projectPubId
      tasks {
        pubId
        title
        status
        priority
        position
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_SPRINT_MUTATION = `
  mutation CreateSprint($input: CreateSprintInput!) {
    createSprint(input: $input) {
      pubId
      name
      goal
      status
      startDate
      endDate
      taskCount
      projectPubId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SPRINT_MUTATION = `
  mutation UpdateSprint($pubId: String!, $input: UpdateSprintInput!) {
    updateSprint(pubId: $pubId, input: $input) {
      pubId
      name
      goal
      status
      startDate
      endDate
      taskCount
      projectPubId
      updatedAt
    }
  }
`;

export const DELETE_SPRINT_MUTATION = `
  mutation DeleteSprint($pubId: String!) {
    deleteSprint(pubId: $pubId) {
      success
      message
    }
  }
`;

export const ADD_TASK_TO_SPRINT_MUTATION = `
  mutation AddTaskToSprint($input: AddSprintTaskInput!) {
    addTaskToSprint(input: $input) {
      success
      message
    }
  }
`;

export const REMOVE_TASK_FROM_SPRINT_MUTATION = `
  mutation RemoveTaskFromSprint($input: RemoveSprintTaskInput!) {
    removeTaskFromSprint(input: $input) {
      success
      message
    }
  }
`;



