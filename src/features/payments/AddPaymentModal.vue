<template>
  <div>
    <!-- Кнопка, открывающая диалог -->
    <Button @click="isModalOpen = true" class="mt-4">Настроить платеж</Button>

    <Dialog v-model:open="isModalOpen">
      <DialogHeader>
        <DialogTitle>Настроить платеж</DialogTitle>
      </DialogHeader>
      <DialogContent class="sm:max-w-[425px] grid-rows-[auto_minmax(0,1fr)_auto] p-2 max-h-[90dvh]">
        <!-- Форма Vee-Validate -->
        <form @submit="submitPayment" class="space-y-6 overflow-y-auto" novalidate>
          <!-- 🔹 Основные настройки платежа -->
          <div class="border rounded-lg p-4 bg-muted">
            <h3 class="text-lg font-semibold mb-3">Основные параметры</h3>

            <FormField name="minPkoin" v-slot="{ componentField }">
              <div>
                <label class="block text-sm font-medium mb-1">Минимальный PKOIN</label>
                <Input type="number" v-bind="componentField" placeholder="Введите мин. PKOIN" />
                <FormMessage />
              </div>
            </FormField>

            <FormField name="maxPkoin" v-slot="{ componentField }">
              <div>
                <label class="block text-sm font-medium mb-1">Максимальный PKOIN</label>
                <Input type="number" v-bind="componentField" placeholder="Введите макс. PKOIN" />
                <FormMessage />
              </div>
            </FormField>

            <FormField name="margin" v-slot="{ componentField }">
              <div>
                <label class="block text-sm font-medium mb-1">Маржа (%)</label>
                <Input type="number" v-bind="componentField" placeholder="Введите маржу" />
                <FormMessage />
              </div>
            </FormField>
          </div>

          <!-- 🔹 Контактные данные -->
          <div class="border rounded-lg p-4 bg-muted">
            <h3 class="text-lg font-semibold mb-3">Контактная информация</h3>

            <FormField name="telegram" v-slot="{ componentField }">
              <div>
                <label class="block text-sm font-medium mb-1">Телеграм</label>
                <Input v-bind="componentField" placeholder="Введите телеграм" />
                <FormMessage />
              </div>
            </FormField>

            <FormField name="transferTime" v-slot="{ componentField }">
              <div>
                <label class="block text-sm font-medium mb-1">Время перевода (мин)</label>
                <Input v-bind="componentField" placeholder="Введите время перевода" />
                <FormMessage />
              </div>
            </FormField>
          </div>

          <!-- 🔹 Способы оплаты -->
          <div class="border rounded-lg p-4 bg-muted">
            <h3 class="text-lg font-semibold mb-3">Способы оплаты</h3>

            <div v-for="(field, index) in fields" :key="field.key" class="border rounded p-3 mb-4 bg-white shadow-sm">
              <h4 class="text-md font-semibold mb-2">Способ {{ index + 1 }}</h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1">Метод платежа</label>
                  <Select v-model="field.value.paymentMethod">
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите метод" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Банковский перевод">Банковский перевод</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Криптоперевод">Криптоперевод</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Язык</label>
                  <Select v-model="field.value.language">
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите язык" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rus">Русский</SelectItem>
                      <SelectItem value="Eng">Английский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Валюта</label>
                  <Select v-model="field.value.currency">
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите валюту" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUB">RUB</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="col-span-1 md:col-span-2">
                  <label class="block text-sm font-medium mb-1">Инструкция</label>
                  <Input v-model="field.value.instructions" placeholder="Введите инструкцию" class="w-full" />
                </div>
              </div>

              <Button class="w-full mt-3" variant="destructive" @click="remove(index)">Удалить способ</Button>
            </div>

            <Button type="button" variant="outline" @click="push({ currency: '', paymentMethod: '', language: '', instructions: '' })">
              ➕ Добавить способ оплаты
            </Button>
          </div>

          <!-- 🔹 Кнопка отправки -->
          <div class="text-right">
            <Button as-child type="submit" class="px-6 py-2" :disabled="fetchState.loading">
              <button type="submit" :disabled="fetchState.loading">
                  <span v-if="fetchState.loading">Сохранение...</span>
                  <span v-else>Сохранить</span>
                </button>
              </Button>
          </div>

          <!-- Статус запроса -->
          <p v-if="fetchState.success" class="text-green-600 text-center">✅ Успешно сохранено!</p>
          <p v-if="fetchState.error" class="text-red-600 text-center">❌ Ошибка при сохранении</p>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useForm, useFieldArray } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { FormField, FormMessage } from "~/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/composables/api";

const fetchState = ref({ loading: false, success: false, error: false });

const paymentSchema = computed(() =>
  toTypedSchema(
    z.object({
      details: z
        .array(
          z.object({
            currency: z.string(),
            paymentMethod: z.string(),
            language: z.string(),
            instructions: z.string(),
          })
        )
        .nonempty("Добавьте хотя бы один способ оплаты"),
      minPkoin: z.number().positive(),
      maxPkoin: z.number().positive(),
      margin: z.number().positive(),
      telegram: z.optional(z.string()),
      transferTime: z.string().min(1, "Время перевода обязательно"),
    })
  )
);

interface Props {
  mePayment: any
}

const props = withDefaults(defineProps<Props>(), {})

const form = useForm({
  keepValuesOnUnmount: true,
  validationSchema: paymentSchema,
  initialValues: props.mePayment ? {
    ...props.mePayment,
    details: props.mePayment.details.map((r: any) => (
    {...r, currency: r.currency.at()})
  )} : {
    details: [
      {
        currency: "",
        paymentMethod: "",
        language: "",
        instructions: "",
      },
    ],
    minPkoin: "",
    maxPkoin: "",
    margin: "",
    telegram: "",
    transferTime: "",
  },
});


const { fields, push, remove } = useFieldArray("details");
const isModalOpen = ref(false);

const submitPayment = form.handleSubmit(async (values) => {
  fetchState.value = { loading: true, success: false, error: false };

  try {
    await api.fetcher("/add-payment", { method: "POST", data: {...values, details: values.details.map(d => ({...d, currency: [d.currency]}))} });
    fetchState.value = { loading: false, success: true, error: false };
    setTimeout(() => (isModalOpen.value = false), 1000);
  } catch (error) {
    fetchState.value = { loading: false, success: false, error: true };
  }
});
</script>
