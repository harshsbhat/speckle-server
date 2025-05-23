<template>
  <div
    class="flex flex-col gap-y-2 md:gap-y-0 md:flex-row md:justify-between md:items-center mt-3"
  >
    <h1 class="block text-heading-lg md:text-heading-xl">Automations</h1>
    <div v-if="showHeader" class="flex flex-col gap-2 md:flex-row md:items-center">
      <FormTextInput
        name="search"
        color="foundation"
        placeholder="Search automations..."
        wrapper-classes="shrink-0"
        show-clear
        v-bind="bind"
        v-on="on"
      />
      <FormButton color="outline" class="shrink-0" :to="exploreFunctionsRoute">
        {{ exploreFunctionsMessage }}
      </FormButton>
      <div v-tippy="creationDisabledMessage" class="shrink-0">
        <FormButton
          class="shrink-0"
          :disabled="!!creationDisabledMessage"
          @click="$emit('new-automation')"
        >
          New automation
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useDebouncedTextInput } from '@speckle/ui-components'
import {
  publicAutomateFunctionsRoute,
  workspaceFunctionsRoute
} from '~/lib/common/helpers/route'

defineEmits<{
  'new-automation': []
}>()

const props = defineProps<{
  workspaceSlug?: string
  showHeader?: boolean
  creationDisabledMessage?: string
}>()

const exploreFunctionsMessage = computed(() =>
  props.workspaceSlug ? 'View functions' : 'Explore functions'
)
const exploreFunctionsRoute = computed(() =>
  props.workspaceSlug
    ? workspaceFunctionsRoute(props.workspaceSlug)
    : publicAutomateFunctionsRoute
)

const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })
</script>
