<template>
  <nav aria-label="Breadcrumb" class="min-w-0 overflow-hidden">
    <ol class="flex items-center gap-1 list-none m-0 p-0 text-sm min-w-0 flex-wrap">
      <li class="shrink-0">
        <router-link :to="{ name: homeRouteName }" class="text-typo-500 no-underline hover:text-brand-600 transition-colors">
          <i class="ri-home-4-line" />
        </router-link>
      </li>
      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <li class="text-typo-500 text-base leading-none shrink-0">
          <i class="ri-arrow-right-s-line" />
        </li>
        <li class="min-w-0">
          <router-link
            v-if="index < breadcrumbs.length - 1 && crumb.to"
            :to="crumb.to"
            class="text-typo-500 no-underline hover:text-brand-600 transition-colors"
          >
            {{ crumb.label }}
          </router-link>
          <span v-else class="text-brand-600 font-medium block truncate">{{ crumb.label }}</span>
        </li>
      </template>
    </ol>
  </nav>
</template>

<script>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'AppBreadcrumb',

  setup() {
    const route  = useRoute()
    const router = useRouter()
    const store  = useStore()

    const homeRouteName = computed(() => 'Dashboard')

    const breadcrumbs = computed(() => {
      const crumbs = route.matched
        .filter((r) => r.meta?.breadcrumb)
        .map((r) => ({
          // Grouping-only records (e.g. "My Workspace") have no component/
          // redirect of their own — they exist purely to nest child routes
          // and namespace the breadcrumb, so navigating to their bare path
          // 404s. Only linkify a crumb that actually resolves to a page.
          label: r.meta.breadcrumb,
          to: r.path !== route.path && (r.redirect || r.components?.default) ? { path: r.path } : null,
        }))

      // Detail/edit/create pages (e.g. LeaveDetails) are siblings of their
      // list page in routes.js, not nested under it, so `route.matched`
      // skips the list entirely. `meta.breadcrumbParent` names that list
      // route — splice it back in just before the current page so e.g.
      // "Leave Details" still breadcrumbs back through "My Leaves".
      //
      // A page reachable from more than one list (e.g. ProjectDetails, from
      // both My Projects and the operations Projects list) instead carries
      // `meta.breadcrumbParentByQuery`, keyed by `?from=` — the linking list
      // page sets that query param so the breadcrumb parent matches wherever
      // the user actually came from, falling back to `breadcrumbParent`.
      const parentName = route.meta?.breadcrumbParentByQuery?.[route.query.from] ?? route.meta?.breadcrumbParent
      if (parentName) {
        const resolved = router.resolve({ name: parentName })
        if (resolved.name === parentName && resolved.meta?.breadcrumb) {
          crumbs.splice(crumbs.length - 1, 0, { label: resolved.meta.breadcrumb, to: { path: resolved.path } })
        }
      }

      return crumbs
    })

    return { breadcrumbs, homeRouteName }
  },
}
</script>
