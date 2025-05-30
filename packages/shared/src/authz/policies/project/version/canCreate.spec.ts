import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../../../tests/helpers/types.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import { getProjectFake, getWorkspaceFake } from '../../../../tests/fakes.js'
import { Roles } from '../../../../core/constants.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { canCreateProjectVersionPolicy } from './canCreate.js'
import { TIME_MS } from '../../../../core/index.js'

describe('canReceiveProjectVersionPolicy', () => {
  const buildSUT = (overrides?: OverridesOf<typeof canCreateProjectVersionPolicy>) =>
    canCreateProjectVersionPolicy({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null,
        isPublic: false,
        isDiscoverable: false
      }),
      getProjectRole: async () => Roles.Stream.Contributor,
      getEnv: async () => parseFeatureFlags({}),
      getServerRole: async () => Roles.Server.Guest,
      getWorkspaceRole: async () => null,
      getWorkspace: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      ...overrides
    })

  const buildWorkspaceSUT = (
    overrides?: OverridesOf<typeof canCreateProjectVersionPolicy>
  ) =>
    buildSUT({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: 'workspace-id',
        isPublic: false,
        isDiscoverable: false
      }),
      getWorkspace: getWorkspaceFake({
        id: 'workspace-id'
      }),
      getProjectRole: async () => null,
      getWorkspaceRole: async () => Roles.Workspace.Admin,
      getWorkspaceSsoSession: async () => ({
        userId: 'user-id',
        providerId: 'provider-id',
        validUntil: new Date(Date.now() + TIME_MS.hour)
      }),
      getWorkspaceSsoProvider: async () => ({
        providerId: 'provider-id'
      }),
      ...overrides
    })

  it('should allow for members+', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeOKResult()
  })

  it('shouldnt allow for server admin w/o project role', async () => {
    const sut = buildSUT({
      getServerRole: async () => Roles.Server.Admin,
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('fail for reviewer', async () => {
    const sut = buildSUT({
      getProjectRole: async () => Roles.Stream.Reviewer
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  it('fails without user', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: undefined,
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('fails if user not found', async () => {
    const sut = buildSUT({
      getServerRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('fails if user has no project role', async () => {
    const sut = buildSUT({
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('fails if project not found', async () => {
    const sut = buildSUT({
      getProject: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  describe('with workspace project', () => {
    it('succeeds w/ implicit project role', async () => {
      const sut = buildWorkspaceSUT()

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails w/ too low of an implicit project role', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNotEnoughPermissionsError.code
      })
    })

    it('fails w/o workspace role, even if valid project role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => Roles.Stream.Contributor,
        getWorkspaceRole: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })

    it('fails w/o implicit project role', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceRole: async () => null,
        getProjectRole: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNoAccessError.code
      })
    })

    it('succeeds w/o sso, if not needed', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null,
        getWorkspaceSsoProvider: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails w/o sso', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })

    it('fails if sso session expired', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => ({
          userId: 'user-id',
          providerId: 'provider-id',
          validUntil: new Date(Date.now() - TIME_MS.hour)
        })
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
  })
})
