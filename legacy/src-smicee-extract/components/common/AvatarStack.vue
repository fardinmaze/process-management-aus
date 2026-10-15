<template>
  <div v-if="members?.length" class="avatar-stack">
    <span
      v-for="(m, idx) in visibleMembers"
      :key="m?.id ?? idx"
      class="avatar-stack__item"
      :title="memberName(m)"
    >
      <img v-if="memberPhotoUrl(m)" :src="memberPhotoUrl(m)" :alt="memberName(m)" />
      <span v-else>{{ getInitials(memberName(m)) }}</span>
    </span>
    <span
      v-if="hiddenCount > 0"
      class="avatar-stack__more"
      :title="`+${hiddenCount} more`"
    >
      +{{ hiddenCount }}
    </span>
  </div>
  <span v-else class="text-muted text-sm">—</span>
</template>

<script>
import { getInitials, memberName, memberPhotoUrl } from '@/utils/helpers'

// Overlapping-avatars-plus-overflow cell used anywhere a table lists everyone
// an item was referred/assigned/reported to (EOD, leave, ticket lists, ...).
export default {
  name: 'AvatarStack',

  props: {
    members: { type: Array, default: () => [] },
    limit:   { type: Number, default: 5 },
  },

  computed: {
    visibleMembers() {
      return this.members.slice(0, this.limit)
    },
    hiddenCount() {
      return Math.max(0, this.members.length - this.limit)
    },
  },

  methods: {
    getInitials,
    memberName,
    memberPhotoUrl,
  },
}
</script>
