<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/composables/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="
      cn(
        'rounded-lg border bg-card text-card-foreground',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
