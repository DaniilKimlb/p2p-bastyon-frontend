<template>
  <div>
    <!-- Кнопка, открывающая диалог -->
    <Button @click="isModalOpen = true" class="mt-4">Настроить платеж</Button>

    <!-- Модальное окно -->
    <Dialog v-model:open="isModalOpen">
      <DialogContent class="sm:max-w-[425px] grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90dvh]">
        <DialogHeader>
          <DialogTitle>Настроить платеж</DialogTitle>
        </DialogHeader>

        <!-- Форма Vee-Validate -->
        <form @submit="submitPayment" class="space-y-4 overflow-y-auto" novalidate>
          <!-- Поле: Мин. PKOIN -->
          <FormField name="minPkoin" v-slot="{ componentField }">
            <div>
              <Input
                type="number"
                v-bind="componentField"
                placeholder="Мин. PKOIN"
              />
              <FormMessage />
            </div>
          </FormField>

          <!-- Поле: Макс. PKOIN -->
          <FormField name="maxPkoin" v-slot="{ componentField }">
            <div>
              <Input
                type="number"
                v-bind="componentField"
                placeholder="Макс. PKOIN"
              />
              <FormMessage />
            </div>
          </FormField>

          <!-- Поле: Маржа (%) -->
          <FormField name="margin" v-slot="{ componentField }">
            <div>
              <Input type="number" v-bind="componentField" placeholder="Маржа (%)" />
              <FormMessage />
            </div>
          </FormField>

          <!-- Поле: Телеграм -->
          <FormField name="telegram" v-slot="{ componentField }">
            <div>
              <Input v-bind="componentField" placeholder="Телеграм" />
              <FormMessage />
            </div>
          </FormField>

          <!-- Поле: Время перевода (мин) -->
          <FormField name="transferTime" v-slot="{ componentField }">
            <div>
              <Input v-bind="componentField" placeholder="Время перевода (мин)" />
              <FormMessage />
            </div>
          </FormField>

          <!-- Заголовок для способов оплаты -->
          <div class="text-lg font-semibold">Способы оплаты</div>

          <!-- Перебираем массив details -->
          <div
            v-for="(field, index) in fields"
            :key="field.key"
            class="border rounded p-3 mb-2"
          >
            <div class="flex flex-wrap gap-2">
              <!-- Метод платежа -->
              <Select v-model="field.value.paymentMethod">
                <SelectTrigger>
                  <SelectValue placeholder="Метод платежа" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Банковский перевод">Банковский перевод</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Криптоперевод">Криптоперевод</SelectItem>
                </SelectContent>
              </Select>

              <!-- Язык -->
              <Select v-model="field.value.language">
                <SelectTrigger>
                  <SelectValue placeholder="Язык" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rus">Русский</SelectItem>
                  <SelectItem value="Eng">Английский</SelectItem>
                </SelectContent>
              </Select>

              <!-- Инструкция -->
              <Input
                v-model="field.value.instructions"
                placeholder="Инструкция"
                class="flex-1"
              />

              <!-- Валюта -->
              <Select v-model="field.value.currency">
                <SelectTrigger>
                  <SelectValue placeholder="Валюта" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RUB">RUB</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>

              <!-- Кнопка для удаления способа -->
              <Button
                variant="destructive"
                class="w-full sm:w-auto"
                @click="remove(index)"
              >
                Удалить
              </Button>
            </div>
          </div>

          <!-- Кнопка: Добавить способ оплаты -->
          <Button
            type="button"
            variant="outline"
            @click="push({ currency: '', paymentMethod: '', language: '', instructions: '' })"
          >
            ➕ Добавить способ оплаты
          </Button>

          <!-- Низ диалогового окна -->
          <DialogFooter>
            <button type="submit">Сохранить</button>
          </DialogFooter>
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

// UI-компоненты (примерные импорты)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

// Схема валидации (можно использовать z.coerce.number(), если нужно автопреобразование строки в число)
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
      minPkoin: z.number().int().positive("Мин. PKOIN должен быть положительным числом"),
      maxPkoin: z.number().int().positive("Макс. PKOIN должен быть положительным числом"),
      margin: z.number().positive("Маржа должна быть положительным числом"),
      telegram: z.optional(z.string()),
      transferTime: z.string().min(1, "Время перевода обязательно"),
    })
  )
);

// Настраиваем форму и начальные значения
const form = useForm({
  validationSchema: paymentSchema,
  initialValues: {
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

// Настраиваем массив способов оплаты
const { fields, push, remove } = useFieldArray("details");

// Управление состоянием модального окна
const isModalOpen = ref(false);

// Обработка отправки формы
const submitPayment = form.handleSubmit(async (values) => {
  try {
    console.log("Отправка данных:", values);

    // Отправка на ваш API
    await api.fetcher("/add-payment", {
      method: "POST",
      data: values,
    });

    // Сброс формы и закрытие диалога
    form.resetForm();
    isModalOpen.value = false;
  } catch (error) {
    console.error("Ошибка при отправке формы:", error);
  }
});
</script>
