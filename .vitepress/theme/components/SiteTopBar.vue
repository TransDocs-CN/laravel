<script setup lang="ts">
import { inBrowser } from 'vitepress'
import { computed } from 'vue'
import { sites } from '../sites'

const props = withDefaults(
  defineProps<{
    currentKey?: string
  }>(),
  {
    currentKey: ''
  }
)

const activeKey = computed(() => {
  if (inBrowser) {
    const currentHost = window.location.host
    const matched = sites.find((site) => {
      try {
        return new URL(site.url).host === currentHost
      } catch {
        return false
      }
    })
    if (matched) return matched.key
  }
  return props.currentKey
})
</script>

<template>
  <div class="SiteTopBar">
    <div class="SiteTopBar-inner">
      <span class="SiteTopBar-label">文档站点</span>
      <ul class="SiteTopBar-list">
        <li v-for="site in sites" :key="site.key" class="SiteTopBar-item">
          <a
            :href="site.url"
            class="SiteTopBar-link"
            :class="{ 'is-active': site.key === activeKey }"
            :title="site.fullName"
            :aria-label="site.fullName"
            :aria-current="site.key === activeKey ? 'page' : undefined"
          >
            {{ site.name }}
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.SiteTopBar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: var(--vp-z-index-layout-top);
  height: var(--vp-layout-top-height);
  display: flex;
  align-items: center;
  background-color: var(--vp-site-topbar-bg);
  border-bottom: 1px solid var(--vp-site-topbar-border);
}

.SiteTopBar-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 auto;
  padding: 0 16px;
  width: 100%;
  max-width: var(--vp-layout-max-width);
  overflow-x: auto;
  scrollbar-width: none;
}

.SiteTopBar-inner::-webkit-scrollbar {
  display: none;
}

.SiteTopBar-label {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-site-topbar-fg-muted);
  user-select: none;
}

.SiteTopBar-list {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.SiteTopBar-link {
  display: inline-flex;
  align-items: center;
  padding: 2px 12px;
  border-radius: 999px;
  font-size: 12.5px;
  line-height: 1.9;
  color: var(--vp-site-topbar-fg);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.SiteTopBar-link:hover {
  background-color: var(--vp-site-topbar-hover-bg);
}

.SiteTopBar-link.is-active {
  background-color: var(--vp-c-brand-2);
  color: #ffffff;
  font-weight: 600;
}

@media (max-width: 480px) {
  .SiteTopBar-inner {
    gap: 8px;
    padding: 0 10px;
  }

  .SiteTopBar-label {
    display: none;
  }

  .SiteTopBar-link {
    padding: 2px 10px;
    font-size: 12px;
  }
}
</style>
