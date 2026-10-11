<template>
  <div class="flex min-h-screen bg-[#FAFBFF]">
    <AppSidebar />

    <div
      class="body-wrap flex flex-col flex-1 min-w-0 pt-16 transition-[margin] duration-[250ms]"
      :class="collapsed ? 'md:ml-[70px]' : 'md:ml-[260px]'"
    >
      <AppNavbar />

      <main class="flex-1">
        <div class="w-full p-6">
          <AppBreadcrumb class="mb-4" />

          <router-view v-slot="{ Component, route }">
            <transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </div>
      </main>

      <footer class="px-6 py-4 text-xs text-slate-400 border-t border-slate-200 bg-[#FAFBFF]  shrink-0">
        &copy; {{ year }} Process Management. All rights reserved.
      </footer>
    </div>

    <ChatWidget />
  </div>
</template>

<script>
import { computed }  from 'vue'
import { useStore }  from 'vuex'
import AppSidebar    from '@/components/common/Sidebar.vue'
import AppNavbar     from '@/components/common/Navbar.vue'
import AppBreadcrumb from '@/components/common/Breadcrumb.vue'
import ChatWidget    from '@/components/chat/ChatWidget.vue'

export default {
  name: 'AdminLayout',
  components: { AppSidebar, AppNavbar, AppBreadcrumb, ChatWidget },

  setup() {
    const store     = useStore()
    const collapsed = computed(() => store.getters['sidebar/collapsed'])
    const year      = new Date().getFullYear()
    return { collapsed, year }
  },
}
</script>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 767px) {
  .body-wrap { margin-left: 0 !important; }
}
</style>
