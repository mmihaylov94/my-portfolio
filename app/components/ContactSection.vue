<script setup lang="ts">
const form = ref({
  email: "",
  subject: "",
  message: "",
  reason: "",
});

const reasons = [
  { value: "", label: "Select a reason..." },
  { value: "project", label: "Project Inquiry" },
  { value: "collaboration", label: "Collaboration" },
  { value: "job", label: "Job Opportunity" },
  { value: "consultation", label: "Consultation" },
  { value: "other", label: "Other" },
];

const isSubmitting = ref(false);
const submitMessage = ref("");

async function handleSubmit() {
  if (
    !form.value.email ||
    !form.value.subject ||
    !form.value.message ||
    !form.value.reason
  ) {
    submitMessage.value = "Please fill in all fields.";
    return;
  }

  isSubmitting.value = true;
  submitMessage.value = "";

  // Here you would typically send the form data to your backend
  // For now, we'll just simulate a submission
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    submitMessage.value = "Thank you! Your message has been sent.";
    form.value = {
      email: "",
      subject: "",
      message: "",
      reason: "",
    };
  } catch (error) {
    submitMessage.value =
      "Sorry, there was an error sending your message. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="bg-primary-50 dark:bg-gray-900 pt-16 lg:pt-24">
    <div class="w-full px-4 sm:px-6 lg:px-16 xl:px-24 max-w-4xl mx-auto">
      <div class="space-y-8">
        <!-- Header -->
        <div class="text-center space-y-4">
          <h2
            class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100"
          >
            Get In Touch
          </h2>
          <p
            class="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Have a project in mind or want to collaborate? I'd love to hear from
            you. Send me a message and I'll respond as soon as possible.
          </p>
        </div>

        <!-- Contact Form -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-lg">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Email -->
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                placeholder="your.email@example.com"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <!-- Reason Dropdown -->
            <div>
              <label
                for="reason"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Reason for Contacting
              </label>
              <select
                id="reason"
                v-model="form.reason"
                required
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all text-sm"
              >
                <option
                  v-for="reason in reasons"
                  :key="reason.value"
                  :value="reason.value"
                >
                  {{ reason.label }}
                </option>
              </select>
            </div>

            <!-- Subject -->
            <div>
              <label
                for="subject"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Subject
              </label>
              <input
                id="subject"
                v-model="form.subject"
                type="text"
                required
                placeholder="What is this regarding?"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <!-- Message -->
            <div>
              <label
                for="message"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Message
              </label>
              <textarea
                id="message"
                v-model="form.message"
                required
                rows="5"
                placeholder="Tell me about your project or inquiry..."
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all resize-none text-sm"
              ></textarea>
            </div>

            <!-- Submit Message -->
            <div v-if="submitMessage" class="text-sm">
              <p
                :class="[
                  submitMessage.includes('Thank you')
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400',
                ]"
              >
                {{ submitMessage }}
              </p>
            </div>

            <!-- Submit Button -->
            <div class="pt-1">
              <AppButton
                type="submit"
                variant="full"
                size="md"
                :disabled="isSubmitting"
                class="w-full"
              >
                <span v-if="!isSubmitting">Send Message</span>
                <span v-else class="flex items-center gap-2">
                  <svg
                    class="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </span>
              </AppButton>
            </div>
          </form>
        </div>
      </div>
      <SectionDivider />
    </div>
  </section>
</template>
