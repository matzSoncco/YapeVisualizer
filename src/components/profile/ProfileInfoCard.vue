<template>
  <Card class="profile-card user-info-card">
    <template #content>
      <div class="user-info-body">
        <div class="avatar-ring">
          <Avatar
            :label="userInitial"
            size="xlarge"
            shape="circle"
            class="user-avatar-lg"
          />
        </div>

        <div class="user-details">
          <h2 class="user-name">{{ userName }}</h2>
          <p class="user-email">{{ user?.email }}</p>
          <Tag
            value="Administrador"
            severity="secondary"
            rounded
            class="user-role-tag"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'

const props = defineProps({
  user: {
    type: Object,
    default: null
  }
})

const userName = computed(() =>
  props.user?.displayName || 'Usuario Admin'
)

const userInitial = computed(() =>
  (props.user?.email || 'A').charAt(0).toUpperCase()
)
</script>

<style scoped>
/* en ProfileInfoCard.vue */
.profile-card {
  grid-column: 1 / -1;
}

.user-info-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

/* Anillo decorativo alrededor del avatar */
.avatar-ring {
  padding: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
  line-height: 0; /* evita espacio extra bajo el inline-flex */
}

/* Sobreescribimos el fondo y color del Avatar de PrimeVue */
:deep(.user-avatar-lg) {
  width: 84px !important;
  height: 84px !important;
  background: var(--color-primary) !important;
  color: var(--color-accent) !important;
  font-size: 2rem !important;
  font-weight: 800 !important;
  border: 3px solid var(--bg-app); /* separa del anillo */
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.user-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0;
  line-height: 1.2;
}

.user-email {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  margin: 0;
  word-break: break-all;
}

.user-role-tag {
  margin-top: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>