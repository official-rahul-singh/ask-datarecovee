import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        categories: resolve(root, 'categories.html'),
        answer: resolve(root, 'answer-pg.html'),
        form: resolve(root, 'form-pg.html'),
        tag: resolve(root, 'tag-pg.html'),
        member: resolve(root, 'member-pg.html'),
        profile: resolve(root, 'user-profile.html'),
        login: resolve(root, 'login-pg.html'),
        signup: resolve(root, 'signup-pg.html'),
        forget: resolve(root, 'forget-password.html'),
        error: resolve(root, 'error-pg.html'),
        skMain: resolve(root, 'skeleton/index.html'),
        skCategories: resolve(root, 'skeleton/categories.html'),
        skAnswer: resolve(root, 'skeleton/answer-pg.html'),
        skForm: resolve(root, 'skeleton/form-pg.html'),
        skTag: resolve(root, 'skeleton/tag-pg.html'),
        skMember: resolve(root, 'skeleton/member-pg.html'),
        skProfile: resolve(root, 'skeleton/user-profile.html'),
        skForget: resolve(root, 'skeleton/forget-password.html'),
      },
    },
  },
})
