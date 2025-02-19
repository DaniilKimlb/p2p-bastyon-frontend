<script setup lang="ts" generic="T extends any, O extends any">
defineOptions({
  name: 'IndexPage',
})

const router = useRouter()

router.push(`trade/all-payments/`)
</script>
