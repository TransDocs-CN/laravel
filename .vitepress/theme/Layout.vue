<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import SiteTopBar from './components/SiteTopBar.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-top>
      <SiteTopBar current-key="laravel" />
    </template>
  </Layout>
</template>
