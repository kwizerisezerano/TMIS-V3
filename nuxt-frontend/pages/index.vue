<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden" :class="{ 'dark': isDark }">
    <AppNavbar />

    <!-- ═══════════════════════════════════════════════════
         1. HERO
         • items-stretch  → both columns fill same height
         • max-w-7xl px-4 sm:px-6 lg:px-8 matches AppNavbar
    ════════════════════════════════════════════════════ -->
    <section class="relative pt-28 pb-20 overflow-hidden bg-white dark:bg-gray-950">

      <!-- Dot-grid texture — same horizontal padding as content -->
      <div class="pointer-events-none absolute inset-0"
        style="background-image:radial-gradient(circle,#05966920 1px,transparent 1px);
               background-size:28px 28px;" />

      <!-- Container width MATCHES AppNavbar exactly → logo and h1 share left edge -->
      <div class="relative mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row gap-12 items-stretch">

          <!-- ── LEFT ─────────────────────────────────── -->
          <div class="lg:w-1/2 flex flex-col gap-8">

            <div class="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-full
                        border border-emerald-200 bg-emerald-50
                        dark:bg-emerald-900/30 dark:border-emerald-800">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                Accepting new members · Limited to 20 spots
              </span>
            </div>

            <div class="space-y-4">
              <h1 class="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white
                         leading-[1.06] tracking-tight">
                Build wealth<br/>
                <span class="text-emerald-600 dark:text-emerald-400">together.</span>
              </h1>
              <p class="text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
                The Future is a member-driven cooperative founded in Kamonyi, Rwanda.
                Save 20,000 RWF monthly, access affordable loans, and grow alongside
                20 committed individuals.
              </p>
            </div>

            <div class="flex gap-8 py-6 border-y border-gray-100 dark:border-gray-800">
              <div v-for="(stat, i) in heroStats" :key="i" class="flex-1">
                <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {{ stat.value }}
                </div>
                <div class="text-xs text-gray-400 mt-1 uppercase tracking-widest">
                  {{ stat.label }}
                </div>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <UButton @click="navigateTo('/apply')" size="lg"
                class="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white
                       font-semibold rounded-xl transition-all
                       hover:shadow-lg hover:shadow-emerald-200/50
                       dark:hover:shadow-emerald-900/40">
                <span class="flex items-center gap-2">
                  Apply for Membership
                  <Icon name="i-heroicons-arrow-right" class="w-4 h-4" />
                </span>
              </UButton>
              <UButton @click="navigateTo('/login')" size="lg"
                class="px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold
                       rounded-xl border border-gray-200 transition-all
                       dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200
                       dark:hover:bg-gray-700">
                Member Login
              </UButton>
            </div>

            <!-- Testimonial — mt-auto keeps it pinned to the bottom of the column -->
            <blockquote class="mt-auto bg-gray-50 dark:bg-gray-900
                               border border-gray-100 dark:border-gray-800
                               rounded-2xl p-5">
              <p class="text-sm text-gray-600 dark:text-gray-300 italic
                        leading-relaxed mb-4">
                "The transparency and community support have been exceptional. I've built
                a safety net and accessed loans exactly when I needed them."
              </p>
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900
                            flex items-center justify-center
                            text-emerald-700 dark:text-emerald-300 font-bold text-xs
                            flex-shrink-0">
                  FN
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    Florien NDAGIJIMANA
                  </p>
                  <p class="text-xs text-gray-400">President · Founding Member</p>
                </div>
              </div>
            </blockquote>
          </div>

          <!-- ── RIGHT — flex-col + h-full makes it match left height exactly ── -->
          <div class="lg:w-1/2 flex flex-col">
            <div class="flex-1 flex flex-col rounded-3xl
                        bg-gradient-to-br from-emerald-50 to-teal-50
                        dark:from-emerald-950/50 dark:to-teal-950/50
                        border border-emerald-100 dark:border-emerald-900 p-8">

              <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400
                        uppercase tracking-[0.14em] mb-6">
                Your member journey
              </p>

              <!-- Steps: flex-1 distributes vertical space equally so cards fill height -->
              <div class="flex-1 flex flex-col gap-3">
                <div v-for="(step, i) in journey" :key="i"
                  class="flex items-center gap-4 px-4 py-3.5 rounded-2xl flex-1
                         transition-colors"
                  :class="i === 1
                    ? 'bg-emerald-600 shadow-md shadow-emerald-300/30 dark:shadow-emerald-900/50'
                    : 'bg-white/90 dark:bg-gray-900/70 border border-white/80 dark:border-gray-800'">

                  <!-- Inline SVG icon — no emojis -->
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                       :class="i === 1
                         ? 'bg-emerald-500'
                         : 'bg-emerald-100 dark:bg-emerald-900'">
                    <svg :viewBox="step.vb" class="w-5 h-5" fill="none"
                         :stroke="i === 1 ? '#ffffff' : '#059669'"
                         stroke-width="1.65" stroke-linecap="round"
                         stroke-linejoin="round">
                      <path v-for="(d, pi) in step.paths" :key="pi" :d="d" />
                    </svg>
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm"
                       :class="i === 1 ? 'text-white' : 'text-gray-900 dark:text-white'">
                      {{ step.title }}
                    </p>
                    <p class="text-xs mt-0.5"
                       :class="i === 1
                         ? 'text-emerald-100'
                         : 'text-gray-400 dark:text-gray-400'">
                      {{ step.desc }}
                    </p>
                  </div>

                  <span class="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                        :class="i === 1
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'">
                    {{ step.metric }}
                  </span>
                </div>
              </div>

              <p class="text-center text-xs text-gray-400 dark:text-gray-500 mt-6 pt-4
                        border-t border-emerald-100 dark:border-emerald-900/60">
                Founded 14 January 2024 · Runda, Kamonyi District, Rwanda
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         2. FEATURES
    ════════════════════════════════════════════════════ -->
    <section class="py-20 bg-gray-50 dark:bg-gray-900">
      <div class="mx-auto max-w-full px-4 sm:px-6 lg:px-8">

        <div class="text-center mb-14">
          <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400
                    uppercase tracking-[0.14em] mb-3">Platform benefits</p>
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Everything you need to succeed
          </h2>
          <p class="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            A complete platform combining modern technology with the power of
            collective savings.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="feature in features" :key="feature.title"
            class="group bg-white dark:bg-gray-800 rounded-2xl p-7
                   border border-gray-100 dark:border-gray-700
                   hover:border-emerald-200 dark:hover:border-emerald-700
                   hover:shadow-lg transition-all">
            <div class="w-11 h-11 rounded-xl bg-emerald-600 flex items-center
                        justify-center mb-5 group-hover:scale-105 transition-transform">
              <Icon :name="feature.icon" class="w-5 h-5 text-white" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              {{ feature.desc }}
            </p>
            <ul class="space-y-2.5">
              <li v-for="item in feature.items" :key="item"
                class="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                <Icon name="i-heroicons-check-circle"
                      class="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         3. MEMBERSHIP + CTA
    ════════════════════════════════════════════════════ -->
    <section id="pricing" class="py-20 bg-white dark:bg-gray-950">
      <div class="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row gap-8 items-stretch">

          <!-- Pricing card -->
          <div class="lg:w-2/5 flex flex-col bg-white dark:bg-gray-900 rounded-3xl
                      border border-gray-200 dark:border-gray-700 p-10">
            <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400
                      uppercase tracking-[0.14em] mb-4">Membership plan</p>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Simple. One plan.
            </h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-8">
              No tiers, no hidden fees. Everything included.
            </p>
            <div class="flex items-baseline gap-2 mb-8">
              <span class="text-5xl font-bold text-emerald-600 dark:text-emerald-400">
                20,000
              </span>
              <span class="text-gray-400 text-lg">RWF/month</span>
            </div>
            <ul class="space-y-3 flex-1">
              <li v-for="benefit in memberBenefits" :key="benefit"
                class="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Icon name="i-heroicons-check-circle"
                      class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                {{ benefit }}
              </li>
            </ul>
            <div class="space-y-3 mt-10">
              <UButton @click="navigateTo('/apply')" block size="lg"
                class="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white
                       font-semibold rounded-xl transition-all hover:shadow-md">
                <span class="flex items-center justify-center gap-2">
                  Apply Now
                  <Icon name="i-heroicons-arrow-right" class="w-4 h-4" />
                </span>
              </UButton>
              <UButton @click="navigateTo('/login')" block size="lg"
                class="py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold
                       rounded-xl border border-gray-200 transition-all
                       dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200
                       dark:hover:bg-gray-700">
                Member Login
              </UButton>
              <p class="text-center text-xs text-gray-400">
                Limited to 20 members · Subject to approval
              </p>
            </div>
          </div>

          <!-- CTA card -->
          <div class="flex-1 rounded-3xl bg-emerald-700 dark:bg-emerald-800 p-10
                      flex flex-col justify-between relative overflow-hidden">
            <div class="absolute -top-20 -right-20 w-72 h-72 rounded-full
                        bg-emerald-600/30 pointer-events-none" />
            <div class="absolute -bottom-12 -left-12 w-52 h-52 rounded-full
                        bg-emerald-600/25 pointer-events-none" />

            <div class="relative space-y-4">
              <p class="text-emerald-300 text-xs font-semibold
                        uppercase tracking-[0.14em]">Est. January 2024</p>
              <h2 class="text-3xl sm:text-4xl font-bold text-white leading-tight">
                Ready to build your<br/>financial future?
              </h2>
              <p class="text-emerald-100/80 text-lg leading-relaxed">
                Join an exclusive community where every member is committed to mutual
                growth, transparency, and lasting prosperity.
              </p>
            </div>

            <div class="relative mt-10 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-emerald-600/50 rounded-2xl p-4 text-center">
                  <div class="text-2xl font-bold text-white">6 months</div>
                  <div class="text-xs text-emerald-200 mt-1">Max loan repayment</div>
                </div>
                <div class="bg-emerald-600/50 rounded-2xl p-4 text-center">
                  <div class="text-2xl font-bold text-white">3 days</div>
                  <div class="text-xs text-emerald-200 mt-1">Loan decision time</div>
                </div>
              </div>
              <div class="bg-white/10 rounded-2xl p-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-emerald-500 flex items-center
                              justify-center text-white text-xs font-bold flex-shrink-0">
                    AH
                  </div>
                  <div>
                    <p class="text-white text-sm font-semibold">
                      Dr. Athanase HATEGEKIMANA
                    </p>
                    <p class="text-emerald-200 text-xs">
                      Vice-President · +250 788 738 036
                    </p>
                  </div>
                </div>
                <p class="text-emerald-100/80 text-sm mt-3 italic">
                  "With group accountability I've built a real safety net and grown
                  my business through accessible loans."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         4. CONSTITUTION — 3 cards per row, fits screen
    ════════════════════════════════════════════════════ -->
    <section id="constitution" class="py-20 bg-gray-50 dark:bg-gray-900">
      <div class="mx-auto max-w-full px-4 sm:px-6 lg:px-8">

        <div class="text-center mb-14">
          <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400
                    uppercase tracking-[0.14em] mb-3">Governance</p>
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Constitution of The Future
          </h2>
          <p class="mt-3 text-gray-500 dark:text-gray-400">
            Adopted by the General Assembly · 14 January 2024 · Runda, Southern Province
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="chapter in constitution" :key="chapter.number"
            class="flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden
                   border border-gray-100 dark:border-gray-700
                   hover:border-emerald-300 dark:hover:border-emerald-600
                   hover:shadow-md transition-all">

            <div class="h-[3px] bg-emerald-500 flex-shrink-0"></div>

            <div class="flex items-center gap-3 px-5 pt-5 pb-4
                        border-b border-gray-100 dark:border-gray-700">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/50
                          flex items-center justify-center flex-shrink-0">
                <Icon :name="chapter.icon"
                      class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div class="min-w-0">
                <span class="text-[10px] font-bold text-emerald-500 dark:text-emerald-400
                             uppercase tracking-[0.12em] block">
                  {{ chapter.number }}
                </span>
                <h3 class="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                  {{ chapter.title }}
                </h3>
              </div>
            </div>

            <ul class="flex-1 px-5 py-4 space-y-3">
              <li v-for="item in chapter.articles" :key="item.ref"
                class="flex items-start gap-2">
                <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400
                             bg-emerald-50 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded
                             mt-0.5 flex-shrink-0 whitespace-nowrap leading-tight">
                  {{ item.ref }}
                </span>
                <span class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {{ item.text }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Leadership banner -->
        <div class="mt-5 bg-emerald-700 dark:bg-emerald-800 rounded-2xl p-8">
          <p class="text-xs font-semibold text-emerald-300 uppercase tracking-[0.14em] mb-6">
            Elected leadership — 14 January 2024
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div v-for="group in leadership" :key="group.title">
              <h4 class="text-sm font-semibold text-emerald-200 mb-3">
                {{ group.title }}
              </h4>
              <div class="space-y-1.5">
                <p v-for="member in group.members" :key="member"
                   class="text-sm text-white">{{ member }}</p>
              </div>
            </div>
          </div>
          <p class="mt-6 text-xs text-emerald-300/60">Done at Runda, on 14/01/2024</p>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         5. ABOUT
    ════════════════════════════════════════════════════ -->
    <section id="about" class="py-20 bg-white dark:bg-gray-950">
      <div class="mx-auto max-w-full px-4 sm:px-6 lg:px-8">

        <div class="text-center mb-14">
          <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400
                    uppercase tracking-[0.14em] mb-3">Our story</p>
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            About The Future
          </h2>
          <p class="mt-3 text-gray-500 dark:text-gray-400">
            Building financial futures together since January 2024
          </p>
        </div>

        <div class="flex flex-col lg:flex-row gap-12 items-stretch">
          <div class="lg:w-1/2 flex flex-col space-y-8">
            <div class="space-y-3">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">Our Mission</h3>
              <p class="text-gray-500 dark:text-gray-400 leading-relaxed">
                To promote a savings culture and facilitate mutual financial assistance
                among our members through modern technology, while preserving traditional
                cooperative values.
              </p>
            </div>
            <div class="space-y-3">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                Constitutional Objectives
              </h3>
              <div class="space-y-3">
                <div v-for="(obj, i) in objectives" :key="i"
                  class="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl
                         border border-gray-100 dark:border-gray-800">
                  <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs
                              font-bold flex items-center justify-center flex-shrink-0">
                    {{ i + 1 }}
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {{ obj }}
                  </p>
                </div>
              </div>
            </div>
            <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl
                        border border-gray-100 dark:border-gray-800">
              <h3 class="text-base font-bold text-gray-900 dark:text-white mb-2">
                Headquarters
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Bimba Village, Gihara Cell, Runda Sector<br/>
                Kamonyi District, Southern Province, Rwanda
              </p>
            </div>

            <div class="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl p-7
                        border border-gray-100 dark:border-gray-800">
              <h3 class="text-base font-bold text-gray-900 dark:text-white mb-5">
                Late Payment Penalties
              </h3>
              <div class="divide-y divide-gray-100 dark:divide-gray-800">
                <div v-for="penalty in penalties" :key="penalty.label"
                  class="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {{ penalty.label }}
                  </span>
                  <span class="text-sm font-bold text-red-600 dark:text-red-400">
                    {{ penalty.value }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:w-1/2 flex flex-col space-y-6">
            <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-7
                        border border-gray-100 dark:border-gray-800">
              <h3 class="text-base font-bold text-gray-900 dark:text-white mb-5">
                Association Structure
              </h3>
              <div class="space-y-3">
                <div v-for="organ in organs" :key="organ.name"
                  class="flex items-start gap-3 p-4 bg-white dark:bg-gray-800
                         rounded-xl border border-gray-100 dark:border-gray-700">
                  <Icon :name="organ.icon"
                        class="w-5 h-5 text-emerald-600 dark:text-emerald-400
                               flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">
                      {{ organ.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {{ organ.desc }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl p-7
                        border border-gray-100 dark:border-gray-800">
              <h3 class="text-base font-bold text-gray-900 dark:text-white mb-5">
                Key Financial Terms
              </h3>
              <div class="divide-y divide-gray-100 dark:divide-gray-800">
                <div v-for="term in keyTerms" :key="term.label"
                  class="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {{ term.label }}
                  </span>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ term.value }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         6. FOOTER
    ════════════════════════════════════════════════════ -->
    <footer class="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white py-16
                   border-t border-gray-200 dark:border-gray-800">
      <div class="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div class="md:col-span-2 space-y-4">
            <div class="flex items-center gap-3">
              <img src="https://res.cloudinary.com/danzeqybu/image/upload/v1783173071/logo_yfob25.png" alt="The Future"
                   class="h-14 w-14 rounded-full object-cover" />
              <span class="text-xl font-bold text-gray-900 dark:text-white">The Future</span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
              A modern cooperative tontine combining traditional Rwandan values with
              digital innovation. Building financial futures, together.
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              Founded 14 January 2024 · Kamonyi, Rwanda
            </p>
          </div>
          <div>
            <h4 class="text-xs font-semibold text-gray-900 dark:text-white mb-5 uppercase tracking-widest">
              Navigation
            </h4>
            <ul class="space-y-3">
              <li v-for="link in footerLinks" :key="link.label">
                <a :href="link.href"
                   class="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {{ link.label }}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="text-xs font-semibold text-gray-900 dark:text-white mb-5 uppercase tracking-widest">
              Contact
            </h4>
            <ul class="space-y-4">
              <li v-for="contact in contacts" :key="contact.role">
                <span class="text-xs text-gray-400 dark:text-gray-500 block mb-0.5">{{ contact.role }}</span>
                <a :href="'tel:' + contact.tel"
                   class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                  {{ contact.display }}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div class="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row
                    justify-between items-center gap-4">
          <p class="text-xs text-gray-400 dark:text-gray-500">
            &copy; 2024 The Future Association. All rights reserved.
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-600">
            Runda Sector · Kamonyi District · Southern Province · Rwanda
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

definePageMeta({ layout: 'auth' })

// ── Hero stats ──────────────────────────────────────────
const heroStats = [
  { value: '20K',  label: 'RWF / month' },
  { value: '1.7%', label: 'Monthly interest' },
  { value: '2/3',  label: 'Loan of savings' },
]

// ── Journey steps — SVG path data, zero emojis ─────────
const journey = [
  {
    title:  'Apply for membership',
    desc:   'Submit your application — reviewed within 3 days',
    metric: 'Step 1',
    vb:     '0 0 24 24',
    paths:  [
      // Document with lines icon
      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    ],
  },
  {
    title:  'Contribute 20,000 RWF',
    desc:   'Save monthly via MTN Mobile Money or Airtel Money',
    metric: '/month',
    vb:     '0 0 24 24',
    paths:  [
      // Currency circle icon
      'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    ],
  },
  {
    title:  'Track on your dashboard',
    desc:   'View balance, history, and loan status in real-time',
    metric: 'Live',
    vb:     '0 0 24 24',
    paths:  [
      // Bar chart icon
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    ],
  },
  {
    title:  'Access affordable loans',
    desc:   'Borrow up to 2/3 of savings at 1.7% monthly interest',
    metric: '1.7%',
    vb:     '0 0 24 24',
    paths:  [
      // Scale / balance icon
      'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    ],
  },
]

// ── Features ────────────────────────────────────────────
const features = [
  {
    icon:  'i-heroicons-chart-bar',
    title: 'Smart Dashboard',
    desc:  'Track savings, loans, and payment history in real-time with a clean, intuitive interface.',
    items: [
      'Real-time balance & savings tracking',
      'Full payment history & receipts',
      'Loan status and repayment schedule',
    ],
  },
  {
    icon:  'i-heroicons-device-phone-mobile',
    title: 'Mobile Payments',
    desc:  "Pay contributions easily through Rwanda's most popular mobile money platforms.",
    items: [
      'MTN Mobile Money & Airtel Money',
      'Instant payment confirmation',
      'Automated monthly reminders',
    ],
  },
  {
    icon:  'i-heroicons-banknotes',
    title: 'Quick Loans',
    desc:  'Access loans up to 2/3 of your savings balance at a competitive 1.7% monthly rate.',
    items: [
      'Approval within 3 days',
      'Flexible repayment up to 6 months',
      'No hidden charges or fees',
    ],
  },
]

// ── Member benefits ─────────────────────────────────────
const memberBenefits = [
  'Full dashboard access & savings tracking',
  'Loans up to 2/3 of accumulated savings',
  '1.7% monthly interest rate on loans',
  'MTN & Airtel Mobile Money payments',
  'Participation in General Assembly',
  'Mutual support from 20 committed members',
]

// ── Constitution ────────────────────────────────────────
const constitution = [
  {
    number:   'Chapter I',
    title:    'Name, Headquarters & Objectives',
    icon:     'i-heroicons-building-office',
    articles: [
      { ref: 'Art. 1', text: 'Named The Future.' },
      { ref: 'Art. 2', text: 'Bimba Village, Gihara Cell, Runda Sector, Kamonyi District, Southern Province.' },
      { ref: 'Art. 3', text: "Promote savings, mutual financial assistance, and advance members' welfare." },
    ],
  },
  {
    number:   'Chapter II',
    title:    'Members & Membership',
    icon:     'i-heroicons-users',
    articles: [
      { ref: 'Art. 4', text: 'Founding permanent, incoming, and honorary member categories.' },
      { ref: 'Art. 5', text: 'Members commit to honest participation, attending assemblies, and monthly contributions.' },
      { ref: 'Art. 7', text: 'Membership strictly limited to twenty (20) persons.' },
    ],
  },
  {
    number:   'Chapter III',
    title:    'Organs of Governance',
    icon:     'i-heroicons-rectangle-group',
    articles: [
      { ref: 'Art. 9',  text: 'General Assembly (supreme), Executive Committee, and Supervisory Committee.' },
      { ref: 'Art. 10', text: 'General Assembly: all members. Meets at least once every four months.' },
      { ref: 'Art. 17', text: 'Executive Committee: 5 members elected for a 2-year renewable term.' },
    ],
  },
  {
    number:   'Chapter V',
    title:    'Savings, Loans & Interest',
    icon:     'i-heroicons-banknotes',
    articles: [
      { ref: 'Art. 26', text: 'Each member contributes 20,000 RWF per month.' },
      { ref: 'Art. 27', text: 'New members pay their share plus 10% of its current accumulated value.' },
      { ref: 'Art. 28', text: 'Loans: up to 2/3 of savings at 1.7%/month, max 6 months, approved in 3 days.' },
    ],
  },
  {
    number:   'Chapter VII',
    title:    'Penalties & Fines',
    icon:     'i-heroicons-exclamation-triangle',
    articles: [
      { ref: 'Art. 36a', text: 'Unexcused meeting absence: 5,000 RWF.' },
      { ref: 'Art. 36b', text: 'Late contribution (10th–17th): 1,000 RWF; after 17th: +200 RWF/day.' },
      { ref: 'Art. 36c', text: 'Late loan repayment: 10% of balance/month. Late arrival >15 min: 1,000 RWF.' },
    ],
  },
  {
    number:   'Chapter VIII',
    title:    'Effective Date & Amendments',
    icon:     'i-heroicons-calendar',
    articles: [
      { ref: 'Art. 37', text: 'Statutes effective from 14 January 2024.' },
      { ref: 'Art. 38', text: 'Amendments require a two-thirds majority at the General Assembly.' },
      { ref: 'Note',    text: 'Ratified by all founding members at Runda, 14/01/2024.' },
    ],
  },
]

// ── Leadership ──────────────────────────────────────────
const leadership = [
  {
    title:   'Executive Committee',
    members: [
      'President: Florien NDAGIJIMANA',
      'Vice-President: Dr. Athanase HATEGEKIMANA',
      'Secretary: NIYONGOMBWA Didier',
    ],
  },
  {
    title:   'Advisors',
    members: ['RUZIGANA Victor', 'HABIMANA Adolphe'],
  },
  {
    title:   'Supervisory Committee',
    members: [
      'President: KWIZERA Ivan',
      'Vice-President: DUSABIMANA Edmond',
      'Secretary: NIYIRORA Jean Damascene',
    ],
  },
]

// ── About ────────────────────────────────────────────────
const objectives = [
  'Promote a strong savings culture among all members of the association.',
  'Facilitate mutual financial assistance among members using their collective savings.',
  'Undertake activities and initiatives that foster the overall advancement of members.',
]

const organs = [
  {
    icon: 'i-heroicons-users',
    name: 'General Assembly',
    desc: 'Supreme authority. All members vote. Convenes every 4 months minimum.',
  },
  {
    icon: 'i-heroicons-briefcase',
    name: 'Executive Committee',
    desc: 'Day-to-day implementation. President, VP, Secretary, and 2 Advisors. 2-year term.',
  },
  {
    icon: 'i-heroicons-shield-check',
    name: 'Supervisory Committee',
    desc: 'Periodic auditing and financial oversight. 3 elected members.',
  },
]

const keyTerms = [
  { label: 'Monthly contribution',       value: '20,000 RWF' },
  { label: 'Maximum loan amount',        value: '2/3 of savings balance' },
  { label: 'Loan interest rate',         value: '1.7% per month' },
  { label: 'Loan repayment period',      value: 'Maximum 6 months' },
  { label: 'Loan decision timeline',     value: 'Within 3 days' },
  { label: 'New member premium',         value: '10% of current share value' },
  { label: 'Maximum members',            value: '20 persons' },
  { label: 'General Assembly frequency', value: 'Every 4 months' },
]

const penalties = [
  { label: 'Unexcused meeting absence', value: '5,000 RWF' },
  { label: 'Late payment (10th–17th)',  value: '1,000 RWF' },
  { label: 'Payment after 17th',        value: '+200 RWF/day' },
  { label: 'Late loan repayment',       value: '10% of balance/month' },
  { label: 'Late arrival (>15 min)',    value: '1,000 RWF' },
]

// ── Footer ───────────────────────────────────────────────
const footerLinks = [
  { label: 'Home',         href: '#' },
  { label: 'Membership',   href: '#pricing' },
  { label: 'Constitution', href: '#constitution' },
  { label: 'About',        href: '#about' },
]

const contacts = [
  { role: 'President',      tel: '+250788570890', display: '+250 788 570 890' },
  { role: 'Vice-President', tel: '+250788738036', display: '+250 788 738 036' },
  { role: 'Secretary',      tel: '+250788602741', display: '+250 788 602 741' },
]
</script>