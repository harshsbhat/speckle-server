<template>
  <ProjectPageSettingsBlock background title="Discussions" :auth-check="canUpdate">
    <template #introduction>
      <p class="text-body-xs text-foreground">
        Control who can leave comments on this project.
      </p>
    </template>
    <FormRadioGroup
      v-model="selectedOption"
      :disabled="!canUpdate.authorized"
      :options="radioOptions"
      @update:model-value="emitUpdate"
    />
  </ProjectPageSettingsBlock>
</template>

<script setup lang="ts">
import { UserGroupIcon, UserCircleIcon } from '@heroicons/vue/24/outline'
import { FormRadioGroup } from '@speckle/ui-components'
import { SimpleProjectVisibility } from '~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageSettingsGeneralBlockDiscussions_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageSettingsGeneralBlockDiscussions_Project on Project {
    id
    visibility
    allowPublicComments
    permissions {
      canUpdateAllowPublicComments {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const props = defineProps<{
  project: ProjectPageSettingsGeneralBlockDiscussions_ProjectFragment
}>()

const emit = defineEmits<{
  (event: 'update-comments-permission', value: boolean): void
}>()

enum CommentPermission {
  Anyone = 'anyone',
  TeamMembers = 'teamMembers'
}

const selectedOption = ref(
  props.project.allowPublicComments
    ? CommentPermission.Anyone
    : CommentPermission.TeamMembers
)

const canUpdate = computed(() => props.project.permissions.canUpdateAllowPublicComments)

const radioOptions = computed(() => [
  {
    value: CommentPermission.Anyone,
    title: 'Anyone',
    introduction: 'Anyone can comment',
    icon: UserGroupIcon
  },
  {
    value: CommentPermission.TeamMembers,
    title: 'Collaborators',
    introduction: 'Only collaborators can comment',
    icon: UserCircleIcon,
    help:
      props.project.visibility === SimpleProjectVisibility.Private
        ? 'Only collaborators can comment on private projects'
        : undefined
  }
])

watch(
  () => props.project.visibility,
  (newVisibility) => {
    if (newVisibility === SimpleProjectVisibility.Private) {
      selectedOption.value = CommentPermission.TeamMembers
    }
  },
  { immediate: true }
)

const emitUpdate = (value: CommentPermission) => {
  emit('update-comments-permission', value === CommentPermission.Anyone)
}
</script>
